import { Socket } from "socket.io";
import MessageService from "../services/message";
import {
  messageMongoRepository,
  conversationMongoRepository,
} from "../repositories/mongodb";
import Redis from "../config/redis";
import FirebaseAdmin from "../config/firebaseAdmin";
import { conversationService } from "../services";

// Observer pattern imports
import { MessageSubject } from "./observers/observer";
import { SocketMessageObserver } from "./observers/SocketMessageObserver";
import { RedisPublishObserver } from "./observers/RedisPublishObserver";
import { PushNotificationObserver } from "./observers/PushNotificationObserver";
import { SocketMediator } from "./mediators/SocketMediator";

// (Bạn cần cài đặt getUserFCMToken thực tế cho hệ thống của bạn)
async function getUserFCMToken(userId: string): Promise<string | null> {
  // Ví dụ: Lấy từ MongoDB, bạn cần thêm collection để lưu token
  // const user = await userRepository.findById(userId);
  // return user?.fcmToken || null;
  return null; // Thay bằng logic thực tế
}

const messageService = new MessageService(
  messageMongoRepository,
  conversationMongoRepository
);
const firebaseApp = FirebaseAdmin.initialize();

export const setupConvEvents = (socket: Socket, mediator: SocketMediator) => {
  socket.on(
    "createMessage",
    async (
      data: { convId: string; content: string },
      callback?: (response: any) => void
    ) => {
      try {
        const userId = socket.handshake.auth.userId;
        const { convId, content } = data;
        if (!userId || !convId || !content) {
          const errorResponse = {
            status: "ERR",
            message: "Thiếu thông tin cần thiết (userId, convId, content)",
          };
          socket.emit("errorMessage", errorResponse);
          if (typeof callback === "function") callback(errorResponse);
          return;
        }

        // Tạo tin nhắn
        const response = await messageService.createMessage(
          convId,
          userId,
          content
        );
        if (typeof response === "string" || !response) {
          const errorResponse = {
            status: "ERR",
            message: "Lỗi khi gửi tin nhắn",
          };
          socket.emit("errorMessage", errorResponse);
          if (typeof callback === "function") callback(errorResponse);
          return;
        }

        // Lấy thông tin participant
        const conversation = await conversationMongoRepository.findById(convId);
        if (!conversation) {
          const errorResponse = {
            status: "ERR",
            message: "Cuộc trò chuyện không tồn tại",
          };
          socket.emit("errorMessage", errorResponse);
          if (typeof callback === "function") callback(errorResponse);
          return;
        }
        const participantIds = conversation.participants;

        // Observer pattern vẫn có thể dùng (hoặc dùng mediator trực tiếp)
        const redis = await Redis.getInstance();
        const redisPub = redis.getPubClient();
        const redisClient = redis.getClient();

        const subject = new MessageSubject();
        subject.addObserver(new SocketMessageObserver(socket));
        subject.addObserver(new RedisPublishObserver(redisPub, convId));
        subject.addObserver(new PushNotificationObserver(firebaseApp));
        await subject.notifyAll(response, {
          participantIds,
          redisClient,
          getUserFCMToken,
        });

        // Ngoài ra có thể dùng mediator để broadcast tới các participant
        for (const pid of participantIds) {
          if (pid !== userId) {
            // await mediator.emitMessage(pid, response);
          }
        }

        const successResponse = {
          status: "OK",
          message: "Gửi tin nhắn thành công",
          data: response,
        };
        if (typeof callback === "function") callback(successResponse);
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
        const errorResponse = {
          status: "ERR",
          message: "Lỗi khi gửi tin nhắn",
        };
        socket.emit("errorMessage", errorResponse);
        if (typeof callback === "function") callback(errorResponse);
      }
    }
  );
};

export const setupNotificationEvents = (
  socket: Socket,
  mediator: SocketMediator
) => {
  socket.on("sendNotification", async (data, callback) => {
    try {
      const { recipientId, type, content } = data;
      const senderId = socket.handshake.auth.userId;
      if (!recipientId || !type || !content) {
        const errorResponse = {
          status: "ERR",
          message: "Thiếu thông tin thông báo",
        };
        if (typeof callback === "function") callback(errorResponse);
        return;
      }
      // Gửi notification qua mediator
      await mediator.emitNotification(recipientId, {
        senderId,
        type,
        content,
        timestamp: Date.now(),
      });
      // (Push Notification cũng có thể dùng observer như trước)
      const successResponse = {
        status: "OK",
        message: "Thông báo đã được gửi",
      };
      if (typeof callback === "function") callback(successResponse);
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
      const errorResponse = { status: "ERR", message: "Lỗi khi gửi thông báo" };
      if (typeof callback === "function") callback(errorResponse);
    }
  });
};
