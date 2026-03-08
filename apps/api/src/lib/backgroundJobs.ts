import type { ArtifactJobStatus, ArtifactJobType } from "@craft-and-board/shared";
import { Queue } from "bullmq";
import { env } from "./env.js";

export const ARTIFACT_QUEUE_NAME = "artifact-generation";
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: redisUrl.port ? Number(redisUrl.port) : 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: redisUrl.pathname && redisUrl.pathname !== "/" ? Number(redisUrl.pathname.slice(1)) : 0,
  maxRetriesPerRequest: null as null,
  retryStrategy: () => null
};

export interface ArtifactJobPayload {
  type: ArtifactJobType;
  organizationId: string;
  batchId?: string;
  orderId?: string;
  format?: "csv" | "mosaic" | "json";
}

export const artifactQueue = new Queue<ArtifactJobPayload>(ARTIFACT_QUEUE_NAME, {
  connection
});

export function encodePublicJobId(jobId: string) {
  return `${ARTIFACT_QUEUE_NAME}:${jobId}`;
}

export function decodePublicJobId(publicJobId: string) {
  const [queueName, ...rest] = publicJobId.split(":");
  if (queueName !== ARTIFACT_QUEUE_NAME || rest.length === 0) {
    throw new Error("Job not found.");
  }

  return {
    queueName,
    jobId: rest.join(":")
  };
}

export async function enqueueArtifactJob(payload: ArtifactJobPayload) {
  const job = await artifactQueue.add(payload.type, payload, {
    attempts: 3,
    removeOnComplete: false,
    removeOnFail: false
  });

  return {
    jobId: encodePublicJobId(String(job.id)),
    status: "queued" as const
  };
}

function mapJobStatus(status: string): ArtifactJobStatus {
  if (status === "waiting" || status === "delayed" || status === "prioritized") {
    return "queued";
  }
  if (status === "active") {
    return "active";
  }
  if (status === "completed") {
    return "completed";
  }
  if (status === "failed") {
    return "failed";
  }
  return "unknown";
}

export async function getBackgroundJobStatus(publicJobId: string) {
  const { jobId } = decodePublicJobId(publicJobId);
  const job = await artifactQueue.getJob(jobId);

  if (!job) {
    throw new Error("Job not found.");
  }

  const state = await job.getState();
  const result = job.returnvalue as
    | {
        artifact?: {
          uri: string;
        };
        delivery?: {
          path: string;
        };
      }
    | undefined;

  return {
    id: publicJobId,
    type: job.name as ArtifactJobType,
    status: mapJobStatus(state),
    artifactUri: result?.artifact?.uri,
    deliveryPath: result?.delivery?.path
  };
}
