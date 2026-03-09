import type { PrismaClient } from "@prisma/client";
import { SORTING_ELIGIBLE_PART_STATUSES } from "./selectors.js";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function syncContainerStatus(tx: TransactionClient, containerId: string) {
  const container = await tx.container.findUnique({
    where: { id: containerId },
    include: {
      currentParts: {
        select: {
          id: true,
          orderId: true,
          manufacturingJobId: true
        }
      }
    }
  });

  if (!container) {
    throw new Error("Container not found.");
  }

  if (container.status === "HOLD" || container.status === "CLOSED") {
    return container;
  }

  let nextStatus: "OPEN" | "SORTING" | "COMPLETE" = container.currentParts.length === 0 ? "OPEN" : "SORTING";

  if (container.currentParts.length > 0 && (container.manufacturingJobId || container.orderId)) {
    const scopedPartCount = await tx.part.count({
      where: {
        organizationId: container.organizationId,
        batchId: container.batchId,
        status: {
          in: [...SORTING_ELIGIBLE_PART_STATUSES]
        },
        ...(container.manufacturingJobId ? { manufacturingJobId: container.manufacturingJobId } : {}),
        ...(container.orderId ? { orderId: container.orderId } : {})
      }
    });

    if (scopedPartCount > 0 && container.currentParts.length >= scopedPartCount) {
      nextStatus = "COMPLETE";
    }
  }

  return tx.container.update({
    where: { id: containerId },
    data: {
      status: nextStatus
    }
  });
}
