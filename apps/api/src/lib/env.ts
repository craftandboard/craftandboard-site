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
process.env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION ??= "false";
process.env.CRAFT_BOARD_ENABLE_LIVE_PAYMENTS ??= "false";
process.env.CRAFT_BOARD_DEFAULT_DEPOSIT_PERCENT ??= "50";
process.env.CRAFT_BOARD_ENABLE_LIVE_SHIPPING_QUOTES ??= "false";
process.env.SHIPPING_QUOTE_PROVIDER ??= "SIMULATED_PARCEL";
process.env.SHIPPING_QUOTE_API_BASE_URL ??= "";
process.env.SHIPPING_QUOTE_API_KEY ??= "";
process.env.CRAFT_BOARD_SHIPPING_QUOTE_TIMEOUT_MS ??= "4000";
process.env.CRAFT_BOARD_SHIPPING_FALLBACK_TO_ESTIMATE ??= "true";
process.env.CRAFT_BOARD_ENABLE_FREIGHT_REVIEW_ONLY ??= "true";
process.env.CRAFT_BOARD_ENABLE_LIVE_TAX_QUOTES ??= "false";
process.env.TAX_QUOTE_PROVIDER ??= "SIMULATED_TAX";
process.env.TAX_QUOTE_API_BASE_URL ??= "";
process.env.TAX_QUOTE_API_KEY ??= "";
process.env.CRAFT_BOARD_TAX_FALLBACK_TO_ESTIMATE ??= "true";
process.env.CRAFT_BOARD_TAX_NEXUS_STATES ??= "WA";
process.env.CRAFT_BOARD_TAX_TIMEOUT_MS ??= "4000";
process.env.CRAFT_BOARD_DEFAULT_TAX_MODE ??= "ESTIMATE_RULES";
process.env.FIELDMETRIQ_API_BASE_URL ??= "";
process.env.FIELDMETRIQ_API_TOKEN ??= "";
process.env.FIELDMETRIQ_ORDER_INTAKE_PATH ??= "/api/craft-board/storefront-orders";
process.env.FIELDMETRIQ_ORDER_STATUS_PATH_TEMPLATE ??= "/api/craft-board/storefront-orders/{reference}/status";
process.env.FIELDMETRIQ_CHANGE_REQUEST_PATH ??= "/api/craft-board/storefront-order-change-requests";
process.env.FIELDMETRIQ_ORDER_ISSUE_PATH ??= "/api/craft-board/storefront-order-issues";
process.env.CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS ??= "false";
process.env.TRANSACTIONAL_EMAIL_PROVIDER ??= "SIMULATED";
process.env.TRANSACTIONAL_EMAIL_API_BASE_URL ??= "";
process.env.TRANSACTIONAL_EMAIL_API_KEY ??= "";
process.env.TRANSACTIONAL_EMAIL_FROM_EMAIL ??= "orders@craftboard.test";
process.env.TRANSACTIONAL_EMAIL_FROM_NAME ??= "Craft & Board";
process.env.CRAFT_BOARD_REPLY_TO_EMAIL ??= "support@craftboard.test";
process.env.CRAFT_BOARD_APP_BASE_URL ??= "http://localhost:3000";
process.env.CRAFT_BOARD_ENABLE_STATUS_UPDATE_EMAILS ??= "true";
process.env.STRIPE_SECRET_KEY ??= "";
process.env.STRIPE_WEBHOOK_SECRET ??= "";
process.env.CRAFT_BOARD_PAYMENT_SUCCESS_BASE_URL ??= "http://localhost:3000";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/craftandboard"),
  PORT_API: z.coerce.number().default(4000),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  ENABLE_BACKGROUND_WORKER: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  CNC_WATCH_FOLDER_PATH: z.string().default(""),
  AUTH_SESSION_SECRET: z.string().min(16),
  ALLOW_DEV_AUTH_BYPASS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true"),
  CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  CRAFT_BOARD_ENABLE_LIVE_PAYMENTS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  CRAFT_BOARD_DEFAULT_DEPOSIT_PERCENT: z.coerce.number().min(1).max(100).default(50),
  CRAFT_BOARD_ENABLE_LIVE_SHIPPING_QUOTES: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  SHIPPING_QUOTE_PROVIDER: z
    .enum(["SIMULATED_PARCEL", "GENERIC_HTTP"])
    .default("SIMULATED_PARCEL"),
  SHIPPING_QUOTE_API_BASE_URL: z.string().default(""),
  SHIPPING_QUOTE_API_KEY: z.string().default(""),
  CRAFT_BOARD_SHIPPING_QUOTE_TIMEOUT_MS: z.coerce.number().int().min(250).max(15000).default(4000),
  CRAFT_BOARD_SHIPPING_FALLBACK_TO_ESTIMATE: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true"),
  CRAFT_BOARD_ENABLE_FREIGHT_REVIEW_ONLY: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true"),
  CRAFT_BOARD_ENABLE_LIVE_TAX_QUOTES: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  TAX_QUOTE_PROVIDER: z.enum(["SIMULATED_TAX", "GENERIC_HTTP"]).default("SIMULATED_TAX"),
  TAX_QUOTE_API_BASE_URL: z.string().default(""),
  TAX_QUOTE_API_KEY: z.string().default(""),
  CRAFT_BOARD_TAX_FALLBACK_TO_ESTIMATE: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true"),
  CRAFT_BOARD_TAX_NEXUS_STATES: z.string().default("WA"),
  CRAFT_BOARD_TAX_TIMEOUT_MS: z.coerce.number().int().min(250).max(15000).default(4000),
  CRAFT_BOARD_DEFAULT_TAX_MODE: z
    .enum(["ESTIMATE_RULES", "LIVE_PROVIDER", "NOT_APPLICABLE"])
    .default("ESTIMATE_RULES"),
  FIELDMETRIQ_API_BASE_URL: z.string().default(""),
  FIELDMETRIQ_API_TOKEN: z.string().default(""),
  FIELDMETRIQ_ORDER_INTAKE_PATH: z.string().default("/api/craft-board/storefront-orders"),
  FIELDMETRIQ_ORDER_STATUS_PATH_TEMPLATE: z
    .string()
    .default("/api/craft-board/storefront-orders/{reference}/status"),
  FIELDMETRIQ_CHANGE_REQUEST_PATH: z
    .string()
    .default("/api/craft-board/storefront-order-change-requests"),
  FIELDMETRIQ_ORDER_ISSUE_PATH: z
    .string()
    .default("/api/craft-board/storefront-order-issues"),
  CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
  TRANSACTIONAL_EMAIL_PROVIDER: z.enum(["SIMULATED", "GENERIC_HTTP"]).default("SIMULATED"),
  TRANSACTIONAL_EMAIL_API_BASE_URL: z.string().default(""),
  TRANSACTIONAL_EMAIL_API_KEY: z.string().default(""),
  TRANSACTIONAL_EMAIL_FROM_EMAIL: z.string().default("orders@craftboard.test"),
  TRANSACTIONAL_EMAIL_FROM_NAME: z.string().default("Craft & Board"),
  CRAFT_BOARD_REPLY_TO_EMAIL: z.string().default("support@craftboard.test"),
  CRAFT_BOARD_APP_BASE_URL: z.string().default("http://localhost:3000"),
  CRAFT_BOARD_ENABLE_STATUS_UPDATE_EMAILS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("true"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  CRAFT_BOARD_PAYMENT_SUCCESS_BASE_URL: z.string().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);
