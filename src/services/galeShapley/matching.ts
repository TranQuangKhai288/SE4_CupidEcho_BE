import mongoose from "mongoose";
import { Profile, UserCondition } from "../../models";
import { runStableMatching } from "./matchingAlgorithm";
import Redis from "../../config/redis";
import { conversationService } from "../../services";
import { IConversation } from "../../interfaces/conversation.interface";
import Algorithm from "../../models/algorithm";
import { MatchHistory } from "../../models";

interface AlgorithmConfig {
  minUser: number;
  maxWaitTime: number;
  userTimeout: number;
}
const watchAlgorithmChanges = () => {
  const changeStream = Algorithm.watch();
  changeStream.on("change", async (change) => {
    console.log("Cấu hình algorithm thay đổi:", change);
    algorithmConfig = await getAlgorithmConfig();
    console.log("Đã cập nhật algorithmConfig:", algorithmConfig);
  });
};

const getAlgorithmConfig = async (): Promise<AlgorithmConfig> => {
  try {
    const config = await Algorithm.findOne({});
    if (!config) {
      console.warn(
        "Không tìm thấy cấu hình algorithm, sử dụng giá trị mặc định."
      );
      return {
        minUser: 20,
        maxWaitTime: 6000,
        userTimeout: 12000,
      };
    }
    return {
      minUser: config.minUser,
      maxWaitTime: config.maxWaitTime,
      userTimeout: config.userTimeout,
    };
  } catch (error) {
    console.error("Lỗi khi lấy cấu hình algorithm:", error);
    return {
      minUser: 10,
      maxWaitTime: 30000, //,ms
      userTimeout: 12000,
    };
  }
};

let algorithmConfig: AlgorithmConfig = {
  minUser: 0,
  maxWaitTime: 6000,
  userTimeout: 1000,
};

const initializeConfig = async () => {
  algorithmConfig = await getAlgorithmConfig();
  console.log("Đã tải cấu hình algorithm:", algorithmConfig);
};

initializeConfig()
  .then(() => {
    watchAlgorithmChanges();
  })
  .catch((error) => {
    console.error("Lỗi khi khởi tạo cấu hình:", error);
  });

export const matchingQueue = new Map<string, { joinTime: Date }>();
export const processingBatches: Set<string>[] = [];

const restoreQueue = async () => {
  const redis = await Redis.getInstance();
  const client = redis.getClient();
  const queueData = await client.get("matching_queue");
  if (queueData) {
    const entries = JSON.parse(queueData);
    for (const [userId, data] of Object.entries(entries)) {
      const typedData = data as { joinTime: string };
      matchingQueue.set(userId, { joinTime: new Date(typedData.joinTime) });
    }
  }
};
restoreQueue();

export const startUserMatching = async (userId: string) => {
  const [profile, condition] = await Promise.all([
    Profile.findOne({ userId }),
    UserCondition.findOne({ userId }),
  ]);

  if (!profile || !condition) {
    return {
      success: false,
      message:
        "Bạn cần hoàn thiện thông tin cá nhân và điều kiện ghép đôi trước",
    };
  }

  const userIdStr = userId.toString();
  if (!matchingQueue.has(userIdStr)) {
    const joinTime = new Date();
    matchingQueue.set(userIdStr, { joinTime });
    const redis = await Redis.getInstance();
    const client = redis.getClient();
    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );
  }

  return { success: true };
};

export const stopUserMatching = async (userId: string, io?: any) => {
  const userIdStr = userId.toString();
  if (matchingQueue.has(userIdStr)) {
    matchingQueue.delete(userIdStr);
    const redis = await Redis.getInstance();
    const client = redis.getClient();
    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );

    if (io) {
      io.to(userIdStr).emit("matching:timeout", {
        message: "Đã hết thời gian chờ, vui lòng thử lại.",
      });
    }
  }

  for (const batch of processingBatches) {
    batch.delete(userIdStr);
  }
};

const processBatch = async (batch: string[], io: any) => {
  try {
    const batchSet = new Set(batch);
    processingBatches.push(batchSet);

    const matches = await runStableMatching(batch);
    console.log(matches, "matches from algorithm");
    const matchedUsers = new Set<string>();

    for (const [userId1, userId2] of matches.entries()) {
      if (userId1 < userId2) {
        matchedUsers.add(userId1);
        matchedUsers.add(userId2);
        const { conversationId } = await createMatchRecord(userId1, userId2);
        console.log(
          `Ghép đôi thành công: ${userId1} và ${userId2}, Conversation ID: ${conversationId}`
        );
        const redis = await Redis.getInstance();
        const client = redis.getClient();
        const socketId1 = await client.get(`socket:${userId1}`);
        const socketId2 = await client.get(`socket:${userId2}`);
        console.log("socketId1", socketId1);
        console.log("socketId2", socketId2);
        io.to(socketId1).emit("matching:matched", {
          partnerId: userId2,
          timestamp: new Date(),
          conversationId: conversationId,
        });
        io.to(socketId2).emit("matching:matched", {
          partnerId: userId1,
          timestamp: new Date(),
          conversationId: conversationId,
        });
      }
    }

    const index = processingBatches.indexOf(batchSet);
    if (index !== -1) {
      processingBatches.splice(index, 1);
    }

    return batch.filter((userId) => !matchedUsers.has(userId));
  } catch (error) {
    console.error(`Lỗi khi xử lý lô: ${error}`);
    io.to(batch).emit("matching:error", {
      message: "Đã xảy ra lỗi khi ghép đôi, vui lòng thử lại sau.",
    });
    return batch;
  }
};

export const runMatchingProcess = async (io: any) => {
  // console.log("Algorithm Config:", algorithmConfig);
  if (matchingQueue.size < 2) {
    return;
  }
  console.log("Running matching process, Queue size:", matchingQueue.size);
  console.log("Chạy quá trình ghép đôi...");

  const now = new Date();
  for (const [userId, { joinTime }] of matchingQueue) {
    if (now.getTime() - joinTime.getTime() > algorithmConfig.userTimeout) {
      await stopUserMatching(userId, io);
    }
  }

  const oldestUser = matchingQueue.values().next().value;
  const timeWaited = oldestUser
    ? now.getTime() - oldestUser.joinTime.getTime()
    : 0;

  if (timeWaited >= algorithmConfig.maxWaitTime) {
    algorithmConfig.minUser = Math.max(
      2,
      Math.floor(algorithmConfig.minUser / 2)
    );
    console.log(
      `Giảm minUser xuống ${algorithmConfig.minUser} do thời gian chờ lâu`
    );
  }

  if (matchingQueue.size >= algorithmConfig.minUser) {
    const batch = Array.from(matchingQueue.keys()).slice(
      0,
      algorithmConfig.minUser
    );
    for (const userId of batch) {
      matchingQueue.delete(userId);
    }
    const redis = await Redis.getInstance();
    const client = redis.getClient();
    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );

    const unmatchedUsers = await processBatch(batch, io);

    unmatchedUsers.forEach((userId) => {
      if (!matchingQueue.has(userId)) {
        matchingQueue.set(userId, { joinTime: new Date() });
      }
    });
    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );

    if (matchingQueue.size === 0) {
      algorithmConfig.minUser = (await getAlgorithmConfig()).minUser;
      console.log(`Đặt lại minUser về ${algorithmConfig.minUser}`);
    }
  }
};

const createMatchRecord = async (userId1: string, userId2: string) => {
  // console.log(`Tạo bản ghi ghép đôi cho ${userId1} và ${userId2}`);
  const participants = [userId1, userId2];
  const conversationData: Partial<IConversation> = { participants };
  const accessConv = await conversationService.accessConversation(
    conversationData
  );
  const conversationId =
    typeof accessConv === "string" ? accessConv : accessConv._id;

  // Lưu vào MatchHistory
  await MatchHistory.create({
    userId1,
    userId2,
    conversationId,
    timestamp: new Date(),
  });

  return { conversationId };
};
