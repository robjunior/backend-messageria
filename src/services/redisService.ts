import Redis from "ioredis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisInstance = new Redis(redisUrl);

    redisInstance.on("connect", () => {
      console.log("Connected to Redis");
    });

    redisInstance.on("error", (err: Error) => {
      console.error("Redis connection error:", err);
    });
  }
  return redisInstance;
}
