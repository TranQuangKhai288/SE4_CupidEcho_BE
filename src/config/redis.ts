import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

class Redis {
  private static instance: Redis | null = null;
  private client: RedisClientType;
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  private constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    // Client chính cho lưu trữ key-value
    this.client = createClient({ url: redisUrl });
    // Client riêng cho publish
    this.pubClient = createClient({ url: redisUrl });
    // Client riêng cho subscribe
    this.subClient = createClient({ url: redisUrl });

    [this.client, this.pubClient, this.subClient].forEach((client) => {
      client.on("error", (err) => console.error("Redis Client Error:", err));
    });
  }

  public static async getInstance(): Promise<Redis> {
    if (!Redis.instance) {
      Redis.instance = new Redis();
      await Promise.all([
        Redis.instance.client.connect(),
        Redis.instance.pubClient.connect(),
        Redis.instance.subClient.connect(),
      ])
        .then(() => {
          console.log("Connected to Redis successfully!");
        })
        .catch((err) => {
          console.error("Failed to connect to Redis:", err);
          throw err;
        });
    }
    return Redis.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public getPubClient(): RedisClientType {
    return this.pubClient;
  }

  public getSubClient(): RedisClientType {
    return this.subClient;
  }

  public async disconnect(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.pubClient.quit(),
      this.subClient.quit(),
    ]);
    console.log("Disconnected from Redis");
  }
}

export default Redis;
