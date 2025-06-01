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
        maxWaitTime: 5000,
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
  minUser: 10,
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
      // Sắp xếp để đảm bảo idA < idB về mặt từ vựng
      const [idA, idB] = [userId1, userId2].sort();

      // Kiểm tra xem 2 user đã được ghép chưa
      if (!matchedUsers.has(idA) && !matchedUsers.has(idB)) {
        matchedUsers.add(idA);
        matchedUsers.add(idB);

        const { conversationId } = await createMatchRecord(idA, idB);
        console.log(
          `Ghép đôi thành công: ${idA} và ${idB}, Conversation ID: ${conversationId}`
        );

        const redis = await Redis.getInstance();
        const client = redis.getClient();
        const socketIdA = await client.get(`socket:${idA}`);
        const socketIdB = await client.get(`socket:${idB}`);

        console.log("socketIdA", socketIdA);
        console.log("socketIdB", socketIdB);

        // Gửi sự kiện cho cả hai người dùng
        if (socketIdA) {
          io.to(socketIdA).emit("matching:matched", {
            partnerId: idB,
            timestamp: new Date(),
            conversationId,
          });
        }

        if (socketIdB) {
          io.to(socketIdB).emit("matching:matched", {
            partnerId: idA,
            timestamp: new Date(),
            conversationId,
          });
        }
      }
    }

    // Xoá batch khỏi danh sách đang xử lý
    const index = processingBatches.indexOf(batchSet);
    if (index !== -1) {
      processingBatches.splice(index, 1);
    }

    // Trả về danh sách user chưa được ghép
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
  if (matchingQueue.size < 2) {
    return;
  }
  const timeWaited = 0;

  const now = new Date();
  for (const [userId, { joinTime }] of matchingQueue) {
    if (now.getTime() - joinTime.getTime() > algorithmConfig.userTimeout) {
      await stopUserMatching(userId, io);
    }
  }

  if (matchingQueue.size < algorithmConfig.minUser) {
    if (timeWaited >= algorithmConfig.maxWaitTime) {
      algorithmConfig.minUser = Math.max(
        2,
        Math.floor(algorithmConfig.minUser / 2)
      );
      console.log(
        `Giảm minUser xuống ${algorithmConfig.minUser} do thời gian chờ lâu`
      );
    }
    return;
  }
  console.log(" Đủ minUser, tiến hành ghép đôi");
  // Đủ minUser, tiến hành ghép đôi
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
