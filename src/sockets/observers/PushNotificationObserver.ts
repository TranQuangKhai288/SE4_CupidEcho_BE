import { MessageObserver } from "./observer";

export class PushNotificationObserver implements MessageObserver {
  constructor(private firebaseApp: any) {}

  async notify(message: any, context: any) {
    const participantIds = context.participantIds as string[];
    for (const participantId of participantIds) {
      const socketId = await context.redisClient.get(`socket:${participantId}`);
      if (!socketId) {
        const token = await context.getUserFCMToken(participantId);
        if (token) {
          await this.firebaseApp.messaging().send({
            token,
            notification: {
              title: "Tin nhắn mới",
              body: `${message.content.substring(0, 50)}...`,
            },
            data: { convId: message.convId },
          });
        }
      }
    }
  }
}
