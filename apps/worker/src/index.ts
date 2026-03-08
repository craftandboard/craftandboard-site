import { QueueEvents, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./lib/env.js";
import { processArtifactGenerationJob } from "./jobs/artifactGeneration.js";
import { describeJob } from "./jobs/noop.js";
import { queueNames } from "./queues/index.js";

async function main() {
  console.log("[worker] Starting Craft & Board worker");
  console.log("[worker] Registered queues:", queueNames.join(", "));
  console.log("[worker] Placeholder handlers:", queueNames.map(describeJob));

  const redisUrl = new URL(env.redisUrl);
  const connection = {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname && redisUrl.pathname !== "/" ? Number(redisUrl.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null
  };
  const pingConnection = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: () => null
  });

  pingConnection.on("error", (error: Error) => {
    console.warn("[worker] Redis unavailable, running in foundation no-op mode.", error.message);
  });

  try {
    await pingConnection.ping();
    console.log("[worker] Redis connection established");

    const artifactWorker = new Worker(
      "artifact-generation",
      async (job) => processArtifactGenerationJob(job.data),
      {
        connection,
        concurrency: 2
      }
    );

    artifactWorker.on("completed", (job) => {
      console.log(`[worker] Completed ${job.name} ${job.id}`);
    });

    artifactWorker.on("failed", (job, error) => {
      console.error(`[worker] Failed ${job?.name} ${job?.id}`, error);
    });

    const queueEvents = new QueueEvents("artifact-generation", { connection });
    queueEvents.on("waiting", ({ jobId }) => {
      console.log(`[worker] Queued artifact job ${jobId}`);
    });

    console.log("[worker] Artifact generation worker online");
    return new Promise<void>(() => {});
  } catch (error) {
    console.warn("[worker] Redis ping failed, continuing without active processors.");
    pingConnection.disconnect();
  }
}

main().catch((error) => {
  console.error("[worker] Fatal startup error", error);
  process.exitCode = 1;
});
