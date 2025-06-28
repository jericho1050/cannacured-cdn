import { createClient } from "redis";
import { env } from "../env";

export const redisClient = createClient({
  url: env.REDIS_URL,
});

export function connectRedis(): Promise<typeof redisClient> {
  return new Promise((resolve, reject) => {
    redisClient.connect();

    redisClient.on("connect", async () => {
      resolve(redisClient);
    });
    redisClient.on("error", (err) => {
      reject(err);
    });
  });
}
