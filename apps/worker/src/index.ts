import { Redis } from "ioredis";
import { env } from "./lib/env.js";
import { describeJob } from "./jobs/noop.js";
import { queueNames } from "./queues/index.js";

async function main() {
  console.log("[worker] Starting Craft & Board worker");
  console.log("[worker] Registered queues:", queueNames.join(", "));
  console.log("[worker] Placeholder handlers:", queueNames.map(describeJob));

  const connection = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1
  });

  connection.on("error", (error: Error) => {
    console.warn("[worker] Redis unavailable, running in foundation no-op mode.", error.message);
  });

  try {
    await connection.ping();
    console.log("[worker] Redis connection established");
  } catch (error) {
    console.warn("[worker] Redis ping failed, continuing without active processors.");
  } finally {
    connection.disconnect();
  }
}

main().catch((error) => {
  console.error("[worker] Fatal startup error", error);
  process.exitCode = 1;
});
