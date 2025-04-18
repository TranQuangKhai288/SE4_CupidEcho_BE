import { Socket } from "socket.io";
import MessageService from "../services/message";
import {
  messageMongoRepository,
  conversationMongoRepository,
} from "../repositories/mongodb";
import Redis from "../config/redis";
import FirebaseAdmin from "../config/firebaseAdmin";
import { conversationService } from "../services";

const messageService = new MessageService(
  messageMongoRepository,
  conversationMongoRepository
);
const firebaseApp = FirebaseAdmin.initialize();

export const setupConvEvents = (socket: Socket) => {
  // Bỏ sự kiện joinConversation vì server tự quản lý

  socket.on(
    "createMessage",
    async (
      data: { convId: string; content: string },
      callback?: (response: any) => void
    ) => {
      try {
        const userId = socket.handshake.auth.userId;
        const { convId, content } = data;
        console.log(data, "data");
        console.log(userId, "userId");

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
        console.log(response, "response");

        if (typeof response === "string" || !response) {
          const errorResponse = {
            status: "ERR",
            message: "Lỗi khi gửi tin nhắn",
          };
          socket.emit("errorMessage", errorResponse);
          if (typeof callback === "function") callback(errorResponse);
          return;
        }

        // Lấy instance Redis
        const redis = await Redis.getInstance();
        const redisPub = redis.getPubClient();
        const redisClient = redis.getClient();

        // Publish tin nhắn tới channel
        await redisPub.publish(convId, JSON.stringify(response));

        // Gửi Push Notification cho người offline
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
        for (const participantId of participantIds) {
          const socketId = await redisClient.get(`socket:${participantId}`);
          if (socketId) {
            console.log(
              `Người dùng ${participantId} đang online (socketId: ${socketId})`
            );
            socket.to(socketId).emit("newMessage", response);
            console.log("Gửi tin nhắn real-time...");
          } else {
            console.log(`Người dùng ${participantId} đang offline`);
            console.log("Gửi Push Notification...");
            if (firebaseApp) {
              const token = await getUserFCMToken(participantId);
              if (token) {
                await firebaseApp.messaging().send({
                  token,
                  notification: {
                    title: "Tin nhắn mới",
                    body: `${content.substring(0, 50)}...`,
                  },
                  data: { convId },
                });
                console.log(
                  `Đã gửi Push Notification tới ${participantId} với token ${token}`
                );
              } else {
                console.log(`Không tìm thấy FCM token cho ${participantId}`);
              }
            }
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

  socket.on(
    "exitSign",
    async (
      data: { convId: string; partnerId: string },
      callback?: (response: any) => void
    ) => {
      try {
        const userId = socket.handshake.auth.userId;
        const { convId, partnerId } = data;

        if (!userId || !convId) {
          const errorResponse = {
            status: "ERR",
            message: "Thiếu thông tin cần thiết (userId, convId)",
          };
          socket.emit("errorMessage", errorResponse);
          if (typeof callback === "function") callback(errorResponse);
          return;
        }

        // Xóa doan chat
        const response = await conversationService.deleteConversation(
          convId,
          userId
        );
        console.log(response, "response deleteConversation");
        if (typeof response === "string" || !response) {
          // const errorResponse = {
          //   status: "ERR",
          //   message: "Lỗi khi thoát cuộc trò chuyện",
          // };
          // socket.emit("errorMessage", errorResponse);
          // if (typeof callback === "function") callback(errorResponse);
          return;
        }
        // lấy socketId của người dùng
        const redis = await Redis.getInstance();
        const redisClient = redis.getClient();
        const socketId = await redisClient.get(`socket:${partnerId}`);
        console.log();
        if (socketId) {
          socket.to(socketId).emit("exitSignal", convId);
        } else {
          console.error("Socket ID is null, cannot emit 'exitSign'");
        }
        const successResponse = {
          status: "OK",
          message: "Đã thoát khỏi cuộc trò chuyện",
          data: response,
        };
        if (typeof callback === "function") callback(successResponse);
      } catch (error) {
        console.error("Lỗi khi thoát cuộc trò chuyện:", error);
        const errorResponse = {
          status: "ERR",
          message: "Lỗi khi thoát cuộc trò chuyện",
        };
        socket.emit("errorMessage", errorResponse);
        if (typeof callback === "function") callback(errorResponse);
      }
    }
  );
};

export const setupNotificationEvents = (socket: Socket) => {
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

      // Lấy instance Redis
      const redis = await Redis.getInstance();
      const redisClient = redis.getClient();

      // Gửi thông báo real-time nếu người nhận online
      const recipientSocketId = await redisClient.get(`socket:${recipientId}`);
      if (recipientSocketId) {
        console.log(
          `Người dùng ${recipientId} đang offline, gửi thông báo real-time`
        );
        socket.to(recipientSocketId).emit("newNotification", {
          senderId,
          type,
          content,
          timestamp: Date.now(),
        });
      } else if (firebaseApp) {
        // Gửi Push Notification nếu offline
        console.log(`Người dùng ${recipientId} đang offline`);
        console.log("Gửi Push Notification...");
        const token = await getUserFCMToken(recipientId);
        if (token) {
          await firebaseApp.messaging().send({
            token,
            notification: {
              title: "Thông báo mới",
              body: content.substring(0, 50),
            },
            data: { type },
          });
        }
      }

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

// Hàm lấy FCM token (cần triển khai)
async function getUserFCMToken(userId: string): Promise<string | null> {
  // Ví dụ: Lấy từ MongoDB, bạn cần thêm collection để lưu token
  // const user = await userRepository.findById(userId);
  // return user?.fcmToken || null;
  return null; // Thay bằng logic thực tế
}
