import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  // sensible defaults for development; override via REDIS_* env vars if needed
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
});

redis.on("connect", () => {
  console.info("Redis connected");
});

redis.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

export default redis;
