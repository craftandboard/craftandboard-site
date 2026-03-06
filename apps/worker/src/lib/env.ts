import { config } from "dotenv";

config();

export const env = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379"
};
