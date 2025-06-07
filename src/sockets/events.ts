import { Socket } from "socket.io";
import MessageService from "../services/message";
import {
  messageMongoRepository,
  conversationMongoRepository,
} from "../repositories/mongodb";
import Redis from "../config/redis";
import FirebaseAdmin from "../config/firebaseAdmin";
import { conversationService } from "../services";
import { Relationship } from "../models";

// Observer pattern imports
import { MessageSubject } from "./observers/observer";
import { SocketMessageObserver } from "./observers/SocketMessageObserver";
import { RedisPublishObserver } from "./observers/RedisPublishObserver";
import { PushNotificationObserver } from "./observers/PushNotificationObserver";
import { SocketMediator } from "./mediators/SocketMediator";
import relationship from "../controllers/relationship";

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

// Bạn có thể dùng database để lưu trạng thái match request nếu cần

export const setupMatchEvents = (socket: Socket, mediator: SocketMediator) => {
  // Khi người dùng gửi yêu cầu match tới ai đó
  socket.on(
    "sendMatchRequest",
    async (
      data: { targetUserId: string },
      callback?: (response: any) => void
    ) => {
      try {
        const senderId = socket.handshake.auth.userId;
        const { targetUserId } = data;
        if (!senderId || !targetUserId) {
          const errorResponse = {
            status: "ERR",
            message: "Thiếu thông tin người gửi hoặc người nhận",
          };
          if (typeof callback === "function") callback(errorResponse);
          return;
        }
        //  senderId: ObjectId | string; // ID của người gửi tương tác
        //   receiverId: ObjectId | string; // ID của người nhận tương tác
        //   type: "friend-request" | "crush" | "block"; // Loại tương tác, bắt buộc
        //   status: "pending" | "accepted" | "rejected" | "ignored" | "waiting"; // Trạng thái, bắt buộc
        // (Tùy chọn) Lưu match request vào DB ở đây nếu bạn muốn
        const res = await Relationship.create({
          senderId: senderId,
          receiverId: targetUserId,
          type: "crush",
          status: "pending",
        });
        // Gửi thông báo tới người nhận yêu cầu match
        await mediator.emitMatchRequest(targetUserId, {
          relationshipId: res._id,
          senderId,
          timestamp: Date.now(),
        });

        if (typeof callback === "function")
          callback({
            status: "OK",
            message: "Đã gửi yêu cầu match",
          });
      } catch (error) {
        console.error("Lỗi khi gửi yêu cầu match:", error);
        if (typeof callback === "function")
          callback({
            status: "ERR",
            message: "Lỗi khi gửi yêu cầu match",
          });
      }
    }
  );

  // Khi người nhận phản hồi lại yêu cầu match (accept hoặc reject)
  socket.on(
    "respondMatchRequest",
    async (
      data: {
        relationshipId: string;
        senderId: string;
        response: "accept" | "reject";
      },
      callback?: (response: any) => void
    ) => {
      try {
        const responderId = socket.handshake.auth.userId;
        const { relationshipId, senderId, response: matchResponse } = data;
        if (!relationshipId || !responderId || !senderId || !matchResponse) {
          const errorResponse = {
            status: "ERR",
            message: "Thiếu thông tin phản hồi",
          };
          if (typeof callback === "function") callback(errorResponse);
          return;
        }
        if (matchResponse === "accept") {
          await Relationship.findByIdAndUpdate(relationshipId, {
            status: "accepted",
          });
        }
        if (matchResponse === "reject") {
          await Relationship.findByIdAndDelete(relationshipId);
        }

        // (Tùy chọn) Cập nhật trạng thái match request trong DB ở đây

        // Gửi phản hồi về cho sender
        await mediator.emitMatchRequestResponse(senderId, {
          responderId,
          response: matchResponse,
          timestamp: Date.now(),
        });

        if (typeof callback === "function")
          callback({
            status: "OK",
            message: `Bạn đã ${
              matchResponse === "accept" ? "chấp nhận" : "từ chối"
            } yêu cầu match`,
          });
      } catch (error) {
        console.error("Lỗi khi phản hồi yêu cầu match:", error);
        if (typeof callback === "function")
          callback({
            status: "ERR",
            message: "Lỗi khi phản hồi yêu cầu match",
          });
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
        if (!userId || !convId || !partnerId) {
          const errorResponse = {
            status: "ERR",
            message: "Thiếu thông tin (userId, convId, partnerId)",
          };
          if (typeof callback === "function") callback(errorResponse);
          return;
        }

        // (Nếu muốn: Xử lý DB, cập nhật trạng thái, xóa conversation, v.v...)

        // Gửi tín hiệu cho partner (qua socket hoặc mediator)
        await mediator.emitExitSign(partnerId, {
          convId,
          userId,
          timestamp: Date.now(),
        });

        if (typeof callback === "function")
          callback({
            status: "OK",
            message: "Đã gửi tín hiệu rời khỏi cho partner",
          });
      } catch (error) {
        console.error("Lỗi khi gửi exitSign:", error);
        if (typeof callback === "function")
          callback({
            status: "ERR",
            message: "Lỗi khi gửi exitSign",
          });
      }
    }
  );
};
