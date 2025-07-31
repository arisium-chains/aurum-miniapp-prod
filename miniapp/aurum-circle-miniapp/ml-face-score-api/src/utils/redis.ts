import { createClient, RedisClientType } from "redis";

export function createRedisClient(): RedisClientType {
  const client: RedisClientType = createClient({
    url: process.env.REDIS_URL || "redis://redis:6379",
  });

  client.on("error", (err: Error) => {
    console.error("Redis Client Error:", err);
  });

  client.on("connect", () => {
    console.log("Connected to Redis");
  });

  return client;
}
