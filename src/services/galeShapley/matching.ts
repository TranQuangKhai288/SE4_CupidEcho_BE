import { Profile, UserCondition } from "../../models";
import { runStableMatching } from "./matchingAlgorithm";
import Redis from "../../config/redis"; // Giả sử đây là đường dẫn đến file Redis của bạn

// Hàng đợi lưu người dùng và thời gian tham gia
const matchingQueue = new Map<string, { joinTime: Date }>();
const processingBatches: Set<string>[] = [];
let minUsers = 20; // Số lượng người tối thiểu ban đầu
const maxWaitTime = 0.1 * 60 * 1000; // Thời gian chờ tối đa: 1 phút
const userTimeout = 2 * 60 * 1000; // Timeout cá nhân: 2 phút

// Khôi phục hàng đợi từ Redis khi khởi động
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
    // Lưu vào Redis
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

    // Thông báo người dùng nếu bị xóa do timeout
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

// Hàm xử lý một lô người dùng
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

        io.to(userId1).emit("matching:matched", {
          partnerId: userId2,
          timestamp: new Date(),
        });
        io.to(userId2).emit("matching:matched", {
          partnerId: userId1,
          timestamp: new Date(),
        });

        await createMatchRecord(userId1, userId2);
      }
    }

    const index = processingBatches.indexOf(batchSet);
    if (index !== -1) {
      processingBatches.splice(index, 1);
    }

    return batch.filter((userId) => !matchedUsers.has(userId));
  } catch (error) {
    console.error(`Error processing batch: ${error}`);
    io.to(batch).emit("matching:error", {
      message: "Đã xảy ra lỗi khi ghép đôi, vui lòng thử lại sau.",
    });
    return batch;
  }
};

// Chạy thuật toán ghép đôi định kỳ
export const runMatchingProcess = async (io: any) => {
  console.log(`Running matching process. Queue size: ${matchingQueue.size}`);

  if (matchingQueue.size < 2) {
    return;
  }

  const now = new Date();
  // Kiểm tra timeout cá nhân
  for (const [userId, { joinTime }] of matchingQueue) {
    if (now.getTime() - joinTime.getTime() > userTimeout) {
      await stopUserMatching(userId, io);
    }
  }

  const oldestUser = matchingQueue.values().next().value;
  const timeWaited = oldestUser
    ? now.getTime() - oldestUser.joinTime.getTime()
    : 0;

  if (timeWaited >= maxWaitTime) {
    minUsers = Math.max(2, Math.floor(minUsers / 2));
    console.log(`Reduced minUsers to ${minUsers} due to long wait time`);
  }

  if (matchingQueue.size >= minUsers) {
    // Lấy lô người dùng (minUsers người đầu tiên)
    const batch = Array.from(matchingQueue.keys()).slice(0, minUsers);
    for (const userId of batch) {
      // Xóa lô khỏi hàng đợi
      matchingQueue.delete(userId);
    }
    const redis = await Redis.getInstance();
    const client = redis.getClient();
    await client.set(
      "matching_queue",
      JSON.stringify(Object.fromEntries(matchingQueue))
    );
    // Chạy thuật toán ghép đôi cho lô này

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
      minUsers = 20;
      console.log(`Reset minUsers to ${minUsers}`);
    }
  }
};

// Hàm lưu kết quả ghép đôi
const createMatchRecord = async (userId1: string, userId2: string) => {
  console.log(`Match record created for ${userId1} and ${userId2}`);
};
