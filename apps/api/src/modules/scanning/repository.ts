import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function findManufacturingPartById(partId: string, organizationId: string) {
  return prisma.manufacturingPart.findFirst({
    where: { id: partId, organizationId },
    include: {
      manufacturingPacket: true,
      batch: true,
      shelfJob: true,
      salesOrder: true,
      salesOrderItem: { include: { shelfProduct: true } }
    }
  });
}

export async function findManufacturingPartByPartNumber(partNumber: string, organizationId: string) {
  return prisma.manufacturingPart.findFirst({
    where: { partNumber, organizationId },
    include: {
      manufacturingPacket: true,
      batch: true,
      shelfJob: true,
      salesOrder: true,
      salesOrderItem: { include: { shelfProduct: true } }
    }
  });
}

export async function findManufacturingBatchByBatchNumber(batchNumber: string, organizationId: string) {
  return prisma.manufacturingBatch.findFirst({
    where: { batchNumber, organizationId },
    include: {
      parts: {
        orderBy: [{ createdAt: "asc" }, { unitIndex: "asc" }]
      }
    }
  });
}

export async function updateManufacturingPartStatus(input: {
  partId: string;
  organizationId: string;
  nextStatus: string;
  statusReason?: string | null;
}) {
  return prisma.manufacturingPart.update({
    where: { id: input.partId },
    data: {
      status: input.nextStatus as any,
      statusReason: input.statusReason ?? null
    },
    include: {
      manufacturingPacket: true,
      batch: true,
      shelfJob: true,
      salesOrder: true,
      salesOrderItem: { include: { shelfProduct: true } }
    }
  });
}

export async function createScanEvent(input: {
  organizationId: string;
  entityType?: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  entityId?: string;
  scanValue: string;
  stationType: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  actionType: "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  previousStatus?: string;
  nextStatus?: string;
  result: "ACCEPTED" | "REJECTED" | "NOOP";
  resultReason?: string | null;
  metadataJson?: Record<string, unknown>;
  scannedByUserId?: string;
  manufacturingPartId?: string;
  manufacturingBatchId?: string;
}) {
  return prisma.scanEvent.create({
    data: {
      organizationId: input.organizationId,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      scanValue: input.scanValue,
      code: input.scanValue,
      stationType: input.stationType,
      actionType: input.actionType,
      previousStatus: input.previousStatus ?? null,
      nextStatus: input.nextStatus ?? null,
      result: input.result,
      resultReason: input.resultReason ?? null,
      metadataJson: input.metadataJson ? (input.metadataJson as Prisma.InputJsonValue) : undefined,
      scannedByUserId: input.scannedByUserId ?? null,
      manufacturingPartId: input.manufacturingPartId ?? null,
      manufacturingBatchId: input.manufacturingBatchId ?? null
    },
    include: {
      manufacturingPart: {
        include: {
          batch: true,
          manufacturingPacket: true
        }
      },
      manufacturingBatch: true,
      scannedByUser: true
    }
  });
}

export async function listScanEvents(input: {
  organizationId: string;
  result?: "ACCEPTED" | "REJECTED" | "NOOP";
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType?: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
}) {
  return prisma.scanEvent.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.result ? { result: input.result } : {}),
      ...(input.stationType ? { stationType: input.stationType } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {})
    },
    include: {
      manufacturingPart: {
        include: {
          batch: true,
          manufacturingPacket: true
        }
      },
      manufacturingBatch: true,
      scannedByUser: true
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getScanEventById(id: string, organizationId: string) {
  return prisma.scanEvent.findFirst({
    where: { id, organizationId },
    include: {
      manufacturingPart: {
        include: {
          batch: true,
          manufacturingPacket: true
        }
      },
      manufacturingBatch: true,
      scannedByUser: true
    }
  });
}

export async function listWorkflowStationRules(organizationId: string) {
  return prisma.workflowStationRule.findMany({
    where: { organizationId },
    orderBy: [{ stationType: "asc" }, { fromStatus: "asc" }, { actionType: "asc" }]
  });
}

export async function createWorkflowStationRule(input: {
  organizationId: string;
  stationType: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  fromStatus: string;
  actionType: "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  toStatus: string;
  isActive?: boolean;
  notes?: string;
}) {
  return prisma.workflowStationRule.create({
    data: {
      organizationId: input.organizationId,
      stationType: input.stationType,
      entityType: input.entityType,
      fromStatus: input.fromStatus,
      actionType: input.actionType,
      toStatus: input.toStatus,
      isActive: input.isActive ?? true,
      notes: input.notes?.trim() || null
    }
  });
}

export async function updateWorkflowStationRule(input: {
  id: string;
  organizationId: string;
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType?: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  fromStatus?: string;
  actionType?: "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  toStatus?: string;
  isActive?: boolean;
  notes?: string;
}) {
  const existing = await prisma.workflowStationRule.findFirst({
    where: { id: input.id, organizationId: input.organizationId }
  });

  if (!existing) {
    throw new Error("Workflow station rule not found.");
  }

  return prisma.workflowStationRule.update({
    where: { id: existing.id },
    data: {
      stationType: input.stationType,
      entityType: input.entityType,
      fromStatus: input.fromStatus,
      actionType: input.actionType,
      toStatus: input.toStatus,
      isActive: input.isActive,
      notes: input.notes === undefined ? undefined : input.notes.trim() || null
    }
  });
}
