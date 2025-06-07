import { MessageObserver } from "./observer";

export class RedisPublishObserver implements MessageObserver {
  constructor(private redisPub: any, private convId: string) {}

  async notify(message: any) {
    await this.redisPub.publish(this.convId, JSON.stringify(message));
  }
}
