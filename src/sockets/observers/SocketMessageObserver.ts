import { MessageObserver } from "./observer";
import { Socket } from "socket.io";

export class SocketMessageObserver implements MessageObserver {
  constructor(private socket: Socket) {}

  async notify(message: any, context: any) {
    const participantIds = context.participantIds as string[];
    const redisClient = context.redisClient;
    for (const participantId of participantIds) {
      const socketId = await redisClient.get(`socket:${participantId}`);
      if (socketId) {
        this.socket.to(socketId).emit("newMessage", message);
      }
    }
  }
}
