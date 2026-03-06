import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/craftandboard"),
  PORT_API: z.coerce.number().default(4000),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379")
});

export const env = envSchema.parse(process.env);
