import { Profile, UserCondition } from "../../models";
import { runStableMatching } from "./matchingAlgorithm";
const matchingQueue: { userId: string; joinTime: Date }[] = []; // Hàng đợi lưu người dùng và thời gian tham gia// Lưu trữ người dùng đang tìm kiếm ghép đôi
// const activeUsers = new Map<
//   string,
//   {
//     userId: string;
//     lastActive: Date;
//     status: "searching" | "matched" | "offline";
//   }
// >();
let minUsers = 20; // Số lượng người tối thiểu ban đầu để chạy thuật toán
const maxWaitTime = 1 * 60 * 1000; // Thời gian chờ tối đa: 1 phút (tính bằng mili giây)
const processingBatches: Set<string>[] = []; // Theo dõi các lô đang xử lý

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
  if (!matchingQueue.some((entry) => entry.userId.toString() === userIdStr)) {
    matchingQueue.push({ userId: userIdStr, joinTime: new Date() });
  }

  return { success: true };
};
export const stopUserMatching = async (userId: string) => {
  const userIdStr = userId.toString();
  matchingQueue.splice(
    0,
    matchingQueue.length,
    ...matchingQueue.filter((entry) => entry.userId.toString() !== userIdStr)
  );

  // Xóa người dùng khỏi các lô đang xử lý (nếu có)
  for (const batch of processingBatches) {
    batch.delete(userIdStr);
  }
};

// Hàm xử lý một lô người dùng
const processBatch = async (batch: string[], io: any) => {
  try {
    const batchSet = new Set(batch);
    processingBatches.push(batchSet); // Thêm lô vào danh sách đang xử lý

    const matches = await runStableMatching(batch);
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

    // Xóa lô khỏi danh sách đang xử lý
    const index = processingBatches.indexOf(batchSet);
    if (index !== -1) {
      processingBatches.splice(index, 1);
    }

    // Trả về danh sách những người chưa được ghép
    return batch.filter((userId) => !matchedUsers.has(userId));
  } catch (error) {
    console.error(`Error processing batch: ${error}`);
    return batch; // Trả lại toàn bộ lô nếu có lỗi
  }
};

// Chạy thuật toán ghép đôi định kỳ
// Chạy thuật toán ghép đôi định kỳ
export const runMatchingProcess = async (io: any) => {
  console.log(
    `Running matching process. Queue length: ${matchingQueue.length}`
  );
  console.log("minUsers now:", minUsers);
  console.log(`Processing batches: ${processingBatches.length}`);
  if (matchingQueue.length === 0 || matchingQueue.length === 1) {
    return; // Không có người dùng nào để xử lý
  }

  const now = new Date();
  const oldestUser = matchingQueue[0];
  const timeWaited = oldestUser
    ? now.getTime() - oldestUser.joinTime.getTime()
    : 0;

  // Giảm số lượng tối thiểu nếu chờ quá lâu
  console.log(`Time waited: ${timeWaited}`);
  if (timeWaited >= maxWaitTime) {
    minUsers = Math.max(2, Math.floor(minUsers / 2)); // Giảm một nửa, tối thiểu là 2
    console.log(`Reduced minUsers to ${minUsers} due to long wait time`);
  }

  // Kiểm tra nếu đủ số lượng người để tạo lô
  if (matchingQueue.length >= minUsers) {
    // Lấy lô người dùng (minUsers người đầu tiên)
    const batch = matchingQueue.slice(0, minUsers).map((entry) => entry.userId);

    // Xóa lô khỏi hàng đợi
    matchingQueue.splice(0, minUsers);

    // Chạy thuật toán ghép đôi cho lô này
    const unmatchedUsers = await processBatch(batch, io);

    // Đưa những người chưa được ghép vào lại hàng đợi
    unmatchedUsers.forEach((userId) => {
      if (!matchingQueue.some((entry) => entry.userId === userId)) {
        matchingQueue.push({ userId, joinTime: new Date() });
      }
    });

    // Reset minUsers nếu hàng đợi trống
    if (matchingQueue.length === 0) {
      minUsers = 20;
      console.log(`Reset minUsers to ${minUsers}`);
    }
  } else {
    console.log(
      `Not enough users to process. Current queue: ${matchingQueue.length}, Required: ${minUsers}`
    );
  }
};

// Hàm lưu kết quả ghép đôi vào database
const createMatchRecord = async (userId1: string, userId2: string) => {
  console.log(`Match record created for ${userId1} and ${userId2}`);
};
