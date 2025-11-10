import type { RedisClientType } from "redis";

import { createClient } from "redis";

import logger from "./logger";
import env from "./validate-env";

// eslint-disable-next-line import/no-mutable-exports
let redisClient: RedisClientType;
const MAX_RETRIES = 5;

function initRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > MAX_RETRIES) {
            logger.error("❌ Max retries reached: Redis connection failed.", {
              attempt: retries + 1,
              maxRetries: MAX_RETRIES,
            });
            return false;
          }
          const delay = Math.min(retries * 500, 5000);
          logger.warn("🔁 Retrying Redis connection...", {
            delayMs: delay,
            attempt: retries + 1,
          });
          return delay;
        },
      },
    });

    redisClient.on("connect", () => {
      logger.info("✅ Redis connected successfully");
    });

    redisClient.on("error", (err: Error) => {
      logger.error("⛔ Redis error:", { error: err.message });
    });

    redisClient.connect().catch((err) => {
      logger.error("🚨 Failed to connect to Redis:", { error: err.message });
    });
  }

  return redisClient;
}

export { initRedisClient, redisClient };
