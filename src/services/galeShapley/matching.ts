// matching.ts - Updated version
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
      maxWaitTime: 30000,
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

// Biến quản lý trạng thái matching process
let isMatchingRunning = false;
let matchingProcessTimer: NodeJS.Timeout | null = null;
let waitingStartTime: Date | null = null;
let minUserReductionTimer: NodeJS.Timeout | null = null;
let globalIo: any = null;

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

// Khởi tạo matching process system
export const initializeMatchingSystem = (io: any) => {
  globalIo = io;
  console.log("Matching system initialized");

  // Bắt đầu matching process cycle
  startMatchingProcessCycle();
};

const startMatchingProcessCycle = () => {
  if (matchingProcessTimer) {
    clearInterval(matchingProcessTimer);
  }

  matchingProcessTimer = setInterval(async () => {
    if (!isMatchingRunning && globalIo) {
      await runMatchingProcess(globalIo);
    }
  }, 2000); // Check mỗi 2 giây
};

const resetWaitingState = () => {
  waitingStartTime = null;
  if (minUserReductionTimer) {
    clearTimeout(minUserReductionTimer);
    minUserReductionTimer = null;
  }
};

const startMinUserReductionTimer = (io: any) => {
  if (minUserReductionTimer) {
    clearTimeout(minUserReductionTimer);
  }

  minUserReductionTimer = setTimeout(async () => {
    if (
      matchingQueue.size >= 2 &&
      matchingQueue.size < algorithmConfig.minUser
    ) {
      // Giảm minUser xuống một nửa, tối thiểu là 2
      const oldMinUser = algorithmConfig.minUser;
      algorithmConfig.minUser = Math.max(
        2,
        Math.floor(algorithmConfig.minUser / 2)
      );

      console.log(
        `Giảm minUser từ ${oldMinUser} xuống ${algorithmConfig.minUser} do thời gian chờ lâu`
      );

      // Kiểm tra xem có đủ điều kiện để matching không
      if (matchingQueue.size >= algorithmConfig.minUser) {
        console.log("Sau khi giảm minUser, đã đủ điều kiện để matching");
        // Không cần gọi runMatchingProcess ở đây, để cycle tự động xử lý
      } else {
        // Tiếp tục đặt timer cho lần giảm tiếp theo
        startMinUserReductionTimer(io);
      }
    }
  }, algorithmConfig.maxWaitTime);
};

export const runMatchingProcess = async (io: any) => {
  // Ngăn chặn multiple execution
  if (isMatchingRunning) {
    return;
  }

  isMatchingRunning = true;

  try {
    // Điều kiện 1: Không chạy matching khi < 2 users
    if (matchingQueue.size < 2) {
      resetWaitingState();
      return;
    }

    const now = new Date();

    // Xử lý timeout cho các user
    // const usersToTimeout = [];
    // for (const [userId, { joinTime }] of matchingQueue) {
    //   if (now.getTime() - joinTime.getTime() > algorithmConfig.userTimeout) {
    //     usersToTimeout.push(userId);
    //   }
    // }

    // // Xóa các user timeout
    // for (const userId of usersToTimeout) {
    //   await stopUserMatching(userId, io);
    // }

    // Kiểm tra lại sau khi đã xóa các user timeout
    if (matchingQueue.size < 2) {
      resetWaitingState();
      return;
    }

    // Điều kiện 2: Không chạy matching khi < minUser
    if (matchingQueue.size < algorithmConfig.minUser) {
      // Bắt đầu đếm thời gian chờ nếu chưa bắt đầu
      if (!waitingStartTime) {
        waitingStartTime = new Date();
        console.log(
          `Bắt đầu đếm thời gian chờ. Queue size: ${matchingQueue.size}, minUser: ${algorithmConfig.minUser}`
        );
        startMinUserReductionTimer(io);
      }
      return;
    }

    // Đủ điều kiện để matching
    console.log(
      `Đủ minUser (${algorithmConfig.minUser}), tiến hành ghép đôi với ${matchingQueue.size} users`
    );

    // Reset trạng thái chờ khi bắt đầu matching
    resetWaitingState();

    // Thực hiện matching
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

    // Thêm lại các user không được match
    unmatchedUsers.forEach((userId) => {
      if (!matchingQueue.has(userId)) {
        matchingQueue.set(userId, { joinTime: new Date() });
      }
    });

    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );

    // Reset minUser về giá trị ban đầu nếu queue rỗng
    if (matchingQueue.size === 0) {
      const originalConfig = await getAlgorithmConfig();
      algorithmConfig.minUser = originalConfig.minUser;
      console.log(`Đặt lại minUser về ${algorithmConfig.minUser}`);
    }
  } catch (error) {
    console.error("Error in runMatchingProcess:", error);
  } finally {
    isMatchingRunning = false;
  }
};

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

    console.log(
      `User ${userIdStr} joined matching queue. Queue size: ${matchingQueue.size}`
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

    console.log(
      `User ${userIdStr} left matching queue. Queue size: ${matchingQueue.size}`
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

    console.log(`Processing batch with ${batch.length} users`);
    const matches = await runStableMatching(batch);
    console.log(`Generated ${matches.size} matches from algorithm`);

    const matchedUsers = new Set<string>();

    for (const [userId1, userId2] of matches.entries()) {
      const [idA, idB] = [userId1, userId2].sort();

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

    const index = processingBatches.indexOf(batchSet);
    if (index !== -1) {
      processingBatches.splice(index, 1);
    }

    const unmatchedUsers = batch.filter((userId) => !matchedUsers.has(userId));
    console.log(
      `Batch processed: ${matchedUsers.size} matched, ${unmatchedUsers.length} unmatched`
    );

    return unmatchedUsers;
  } catch (error) {
    console.error(`Lỗi khi xử lý lô: ${error}`);
    io.to(batch).emit("matching:error", {
      message: "Đã xảy ra lỗi khi ghép đôi, vui lòng thử lại sau.",
    });
    return batch;
  }
};

const createMatchRecord = async (userId1: string, userId2: string) => {
  const participants = [userId1, userId2];
  const conversationData: Partial<IConversation> = { participants };
  const accessConv = await conversationService.accessConversation(
    conversationData
  );
  const conversationId =
    typeof accessConv === "string" ? accessConv : accessConv._id;

  await MatchHistory.create({
    userId1,
    userId2,
    conversationId,
    timestamp: new Date(),
  });

  return { conversationId };
};

// Cleanup function
export const stopMatchingSystem = () => {
  if (matchingProcessTimer) {
    clearInterval(matchingProcessTimer);
    matchingProcessTimer = null;
  }

  if (minUserReductionTimer) {
    clearTimeout(minUserReductionTimer);
    minUserReductionTimer = null;
  }

  resetWaitingState();
  console.log("Matching system stopped");
};
