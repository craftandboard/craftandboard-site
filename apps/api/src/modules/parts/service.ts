import { ManufacturingJobStatus as PrismaManufacturingJobStatus, OrderStatus as PrismaOrderStatus, PartStatus as PrismaPartStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { scanCodeForPartId } from "./scanCode.js";
import { LOCAL_ORG_ID } from "../settings/service.js";

type ShopFloorPartStatus = "pending" | "cut" | "edgebanded" | "packed";

const PART_TRANSITIONS = {
  pending: ["cut"],
  cut: ["edgebanded", "packed"],
  edgebanded: ["packed"],
  packed: []
} as const satisfies Record<ShopFloorPartStatus, readonly Exclude<ShopFloorPartStatus, "pending">[]>;

function labelCodeFor(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

export function mapPartStatus(status: string): ShopFloorPartStatus {
  const normalized = String(status).toLowerCase();

  if (normalized === "cut") {
    return "cut";
  }

  if (normalized === "edgebanded") {
    return "edgebanded";
  }

  if (normalized === "packed") {
    return "packed";
  }

  return "pending";
}

export function getAvailableNextPartActions(status: ShopFloorPartStatus) {
  return [...PART_TRANSITIONS[status]];
}

async function loadPartForTransition(where: { id?: string }, organizationId = LOCAL_ORG_ID) {
  const part = where.id
    ? await prisma.part.findUnique({
        where: { id: where.id },
        include: {
          manufacturingJob: true
        }
      })
    : null;

  if (!part || (part.organizationId && part.organizationId !== organizationId)) {
    throw new Error("Part not found.");
  }

  return part;
}

async function loadPartByLabelCode(labelCode: string, organizationId = LOCAL_ORG_ID) {
  const parts = await prisma.part.findMany({
    where: {
      organizationId
    },
    include: {
      manufacturingJob: true
    },
    orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
  });

  const matches = parts.filter(
    (candidate) =>
      labelCodeFor(candidate.manufacturingJob?.labelCode ?? candidate.partCode, candidate.instanceNumber) ===
      labelCode
  );

  if (matches.length === 0) {
    throw new Error(`Part ${labelCode} not found.`);
  }

  if (matches.length > 1) {
    throw new Error(`Label code ${labelCode} matches multiple parts. Use part id for an unambiguous update.`);
  }

  const [part] = matches;

  return part;
}

async function loadPartByScanCode(scanCode: string, organizationId = LOCAL_ORG_ID) {
  const part = await prisma.part.findUnique({
    where: { scanCode },
    include: {
      manufacturingJob: true
    }
  });

  if (!part || (part.organizationId && part.organizationId !== organizationId)) {
    throw new Error(`Part scan code ${scanCode} was not found.`);
  }

  return part;
}

function buildPartTransitionView(part: Awaited<ReturnType<typeof loadPartForTransition>>) {
  const status = mapPartStatus(part.status);
  return {
    id: part.id,
    labelCode: labelCodeFor(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber),
    scanCode: part.scanCode ?? scanCodeForPartId(part.id),
    status,
    availableNextActions: getAvailableNextPartActions(status)
  };
}

function toPrismaPartStatus(nextStatus: Exclude<ShopFloorPartStatus, "pending">): PrismaPartStatus {
  switch (nextStatus) {
    case "cut":
      return "CUT";
    case "edgebanded":
      return "EDGEBANDED";
    case "packed":
      return "PACKED";
  }
}

function mapManufacturingJobStatus(status: string) {
  return String(status).toUpperCase() === "COMPLETE" ? "COMPLETE" : "DRAFT";
}

function mapOrderStatus(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "DRAFT":
    case "IMPORTED":
    case "READY_FOR_BATCH":
    case "RECEIVED":
    case "IN_PRODUCTION":
    case "READY_FOR_SHIPMENT":
    case "COMPLETE":
    case "HOLD":
    case "ERROR":
      return normalized;
    default:
      return "DRAFT";
  }
}

async function transitionLoadedPart(
  part: Awaited<ReturnType<typeof loadPartForTransition>>,
  nextStatus: Exclude<ShopFloorPartStatus, "pending">
) {
  const currentStatus = mapPartStatus(part.status);
  const allowed = getAvailableNextPartActions(currentStatus);

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Part ${labelCodeFor(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber)} cannot move from ${String(part.status)} to ${String(nextStatus).toUpperCase()}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.part.update({
      where: { id: part.id },
      data: {
        status: toPrismaPartStatus(nextStatus)
      },
      include: {
        manufacturingJob: true
      }
    });

    let jobStatus: "COMPLETE" | "DRAFT" | undefined;
    let orderStatus: "READY_FOR_SHIPMENT" | "DRAFT" | "IMPORTED" | "READY_FOR_BATCH" | "RECEIVED" | "IN_PRODUCTION" | "COMPLETE" | "HOLD" | "ERROR" | undefined;

    if (nextStatus === "packed" && updated.manufacturingJobId) {
      const openPartCount = await tx.part.count({
        where: {
          manufacturingJobId: updated.manufacturingJobId,
          status: {
            not: "PACKED"
          }
        }
      });

      if (openPartCount === 0) {
        const completedJob = await tx.manufacturingJob.update({
          where: { id: updated.manufacturingJobId },
          data: {
            status: PrismaManufacturingJobStatus.COMPLETE
          }
        });
        jobStatus = mapManufacturingJobStatus(completedJob.status);

        if (updated.orderId) {
          const incompleteJobs = await tx.manufacturingJob.count({
            where: {
              orderId: updated.orderId,
              status: {
                not: PrismaManufacturingJobStatus.COMPLETE
              }
            }
          });

          if (incompleteJobs === 0) {
            const completedOrder = await tx.order.update({
              where: { id: updated.orderId },
              data: {
                status: PrismaOrderStatus.READY_FOR_SHIPMENT
              }
            });
            orderStatus = mapOrderStatus(completedOrder.status);
          }
        }
      }
    }

    return {
      part: buildPartTransitionView(updated),
      jobStatus,
      orderStatus
    };
  });
}

export async function transitionPartStatusById(
  partId: string,
  nextStatus: Exclude<ShopFloorPartStatus, "pending">,
  organizationId = LOCAL_ORG_ID
) {
  const part = await loadPartForTransition({ id: partId }, organizationId);
  return transitionLoadedPart(part, nextStatus);
}

export async function transitionPartStatusByLabelCode(
  labelCode: string,
  nextStatus: Exclude<ShopFloorPartStatus, "pending">,
  organizationId = LOCAL_ORG_ID
) {
  const part = await loadPartByLabelCode(labelCode, organizationId);
  return transitionLoadedPart(part, nextStatus);
}

export async function transitionPartStatusByScanCode(
  scanCode: string,
  nextStatus: Exclude<ShopFloorPartStatus, "pending">,
  organizationId = LOCAL_ORG_ID
) {
  const part = await loadPartByScanCode(scanCode, organizationId);
  return transitionLoadedPart(part, nextStatus);
}

export type { ShopFloorPartStatus };
