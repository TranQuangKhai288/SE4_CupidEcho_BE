import { Server, Socket } from "socket.io";
import Redis from "../config/redis";
import {
  setupConvEvents,
  setupMatchEvents,
  setupNotificationEvents,
} from "./events";
import { SocketMediator } from "./mediators/SocketMediator";

export const setupSocketEvents = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    try {
      console.log("Người dùng đã kết nối:", socket.id);
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        console.log("Thiếu userId, không thể đăng ký");
        return;
      }

      // Redis instance
      const redis = await Redis.getInstance();
      const redisClient = redis.getClient();
      const redisSub = redis.getSubClient();

      // Mediator instance (có thể chuyển thành singleton/global nếu cần)
      const mediator = new SocketMediator(io, redisClient, redisSub);

      // Đăng ký user-socket
      await mediator.registerUserSocket(userId, socket);

      // Subscribe vào các hội thoại của user (lưu lại convIds để unsubscribe khi disconnect)
      const convIds = await mediator.subscribeUserConversations(userId, socket);

      // Truyền mediator vào các event handler
      setupConvEvents(socket, mediator);
      setupNotificationEvents(socket, mediator);
      setupMatchEvents(socket, mediator);
      socket.on("webrtc:signal", async (signal) => {
        const { to } = signal;
        if (to) {
          await mediator.emitSignal(to, { ...signal, from: socket.id });
        }
      });

      socket.on("disconnect", async () => {
        console.log("Người dùng đã ngắt kết nối:", socket.id);
        await mediator.unregisterUserSocket(userId);
        await mediator.unsubscribeUserConversations(convIds);
      });
    } catch (error) {
      console.error("Lỗi khi thiết lập sự kiện Socket.IO:", error);
    }
  });
};

// import { Server, Socket } from "socket.io";
// import Redis from "../config/redis";
// import { setupConvEvents, setupNotificationEvents } from "./events";
// import { conversationService } from "../services";
// import {
//   messageMongoRepository,
//   conversationMongoRepository,
// } from "../repositories/mongodb";

// export const setupSocketEvents = (io: Server) => {
//   try {
//     io.on("connection", async (socket: Socket) => {
//       console.log("Người dùng đã kết nối:", socket.id);
//       const userId = socket.handshake.auth.userId;

//       if (!userId) {
//         console.log("Thiếu userId, không thể đăng ký");
//         return;
//       }

//       // Lấy instance Redis
//       const redis = await Redis.getInstance();
//       const redisClient = redis.getClient();
//       const redisSub = redis.getSubClient();

//       // Lưu ánh xạ userId <-> socketId
//       await redisClient.set(`socket:${userId}`, socket.id);

//       // Subscribe vào các channel hội thoại của người dùng
//       const result = await conversationMongoRepository.findAllByUser(
//         userId,
//         1,
//         10000 // Lấy tất cả cuộc trò chuyện
//       );
//       // for (const conv of result.conversations as { _id: string }[]) {
//       //   const convId = conv._id.toString();
//       //   await redisSub.subscribe(convId, (message) => {
//       //     socket.emit("newMessage", JSON.parse(message));
//       //   });
//       // }

//       // Thiết lập các sự kiện
//       setupConvEvents(socket);
//       setupNotificationEvents(socket);
//       socket.on("webrtc:signal", async (signal) => {
//         const { to } = signal;

//         if (to) {
//           const targetSocketId = await redisClient.get(`socket:${to}`);
//           io.to(targetSocketId || "").emit("webrtc:signal", {
//             ...signal,
//             from: socket.id,
//           });
//         }
//       });

//       socket.on("disconnect", async () => {
//         console.log("Người dùng đã ngắt kết nối:", socket.id);
//         await redisClient.del(`socket:${userId}`);
//         for (const conv of result.conversations as { _id: string }[]) {
//           await redisSub.unsubscribe(conv._id.toString());
//         }
//       });
//     });
//   } catch (error) {
//     console.error("Lỗi khi thiết lập sự kiện Socket.IO:", error);
//   }
// };
