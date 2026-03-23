import { config } from "dotenv";
import { z } from "zod";

config();

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/craftandboard";
process.env.PORT_API ??= process.env.PORT;
process.env.PORT_API ??= "4000";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.ENABLE_BACKGROUND_WORKER ??= "false";
process.env.CNC_WATCH_FOLDER_PATH ??= "";
process.env.AUTH_SESSION_SECRET ??= process.env.AUTH_SECRET;
process.env.AUTH_SESSION_SECRET ??= "craft-board-dev-session-secret";
process.env.ALLOW_DEV_AUTH_BYPASS ??= "false";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/craftandboard"),
  PORT_API: z.coerce.number().default(4000),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_MARKETING_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  ENABLE_BACKGROUND_WORKER: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  CNC_WATCH_FOLDER_PATH: z.string().default(""),
  AUTH_SESSION_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOW_DEV_AUTH_BYPASS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true")
});

export const env = envSchema.parse(process.env);
