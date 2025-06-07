import { Server, Socket } from "socket.io";
import Redis from "../../config/redis";
import { conversationMongoRepository } from "../../repositories/mongodb";

// Quản lý tập trung các socket, redis, signaling, broadcast
export class SocketMediator {
  private io: Server;
  private redisClient: any;
  private redisSub: any;
  private userSocketMap: Map<string, string> = new Map();

  constructor(io: Server, redisClient: any, redisSub: any) {
    this.io = io;
    this.redisClient = redisClient;
    this.redisSub = redisSub;
  }

  async registerUserSocket(userId: string, socket: Socket) {
    this.userSocketMap.set(userId, socket.id);
    await this.redisClient.set(`socket:${userId}`, socket.id);
  }

  async unregisterUserSocket(userId: string) {
    this.userSocketMap.delete(userId);
    await this.redisClient.del(`socket:${userId}`);
  }

  getSocketId(userId: string): string | undefined {
    return this.userSocketMap.get(userId);
  }

  async subscribeUserConversations(
    userId: string,
    socket: Socket
  ): Promise<string[]> {
    const result = await conversationMongoRepository.findAllByUser(
      userId,
      1,
      10000
    );
    const convIds = (result.conversations as { _id: string }[]).map((conv) =>
      conv._id.toString()
    );
    // Có thể subscribe ở đây nếu muốn dùng Redis pub/sub cho push message realtime
    // for (const convId of convIds) {
    //   await this.redisSub.subscribe(convId, (message: string) => {
    //     socket.emit("newMessage", JSON.parse(message));
    //   });
    // }
    return convIds;
  }

  async unsubscribeUserConversations(convIds: string[]) {
    for (const convId of convIds) {
      await this.redisSub.unsubscribe(convId);
    }
  }

  async emitSignal(toUserId: string, data: any) {
    const targetSocketId = await this.redisClient.get(`socket:${toUserId}`);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit("webrtc:signal", data);
    }
  }

  async emitNotification(toUserId: string, data: any) {
    const targetSocketId = await this.redisClient.get(`socket:${toUserId}`);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit("newNotification", data);
    }
  }
  async emitMatchRequest(userId: string, payload: any) {
    // emit tới socket của userId, ví dụ:
    const targetSocketId = await this.redisClient.get(`socket:${userId}`);

    this.io.to(targetSocketId).emit("receiveMatchRequest", payload);
  }

  async emitMatchRequestResponse(userId: string, payload: any) {
    const targetSocketId = await this.redisClient.get(`socket:${userId}`);

    this.io.to(targetSocketId).emit("matchRequestResponse", payload);
  }

  async emitExitSign(userId: string, payload: any) {
    const targetSocketId = await this.redisClient.get(`socket:${userId}`);

    // Giả sử bạn map userId => socketId ở đâu đó, VD: this.userSockets[userId]

    if (targetSocketId && this.io) {
      this.io.to(targetSocketId).emit("exitSignal", payload);
    }
  }
  // Có thể mở rộng các hành động khác (emit message, broadcast, push notification, ...)
}
