import { Server, Socket } from "socket.io";
import Redis from "../config/redis";
import { setupConvEvents, setupNotificationEvents } from "./events";
import { conversationService } from "../services";
import {
  messageMongoRepository,
  conversationMongoRepository,
} from "../repositories/mongodb";

export const setupSocketEvents = (io: Server) => {
  try {
    io.on("connection", async (socket: Socket) => {
      console.log("Người dùng đã kết nối:", socket.id);
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        console.log("Thiếu userId, không thể đăng ký");
        return;
      }

      // Lấy instance Redis
      const redis = await Redis.getInstance();
      const redisClient = redis.getClient();
      const redisSub = redis.getSubClient();

      // Lưu ánh xạ userId <-> socketId
      await redisClient.set(`socket:${userId}`, socket.id);

      // Subscribe vào các channel hội thoại của người dùng
      const result = await conversationMongoRepository.findAllByUser(
        userId,
        1,
        10000 // Lấy tất cả cuộc trò chuyện
      );
      // for (const conv of result.conversations as { _id: string }[]) {
      //   const convId = conv._id.toString();
      //   await redisSub.subscribe(convId, (message) => {
      //     socket.emit("newMessage", JSON.parse(message));
      //   });
      // }

      // Thiết lập các sự kiện
      setupConvEvents(socket);
      setupNotificationEvents(socket);

      socket.on("disconnect", async () => {
        console.log("Người dùng đã ngắt kết nối:", socket.id);
        await redisClient.del(`socket:${userId}`);
        for (const conv of result.conversations as { _id: string }[]) {
          await redisSub.unsubscribe(conv._id.toString());
        }
      });
    });
  } catch (error) {
    console.error("Lỗi khi thiết lập sự kiện Socket.IO:", error);
  }
};
