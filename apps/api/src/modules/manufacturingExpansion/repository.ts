import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

export async function getManufacturingPacketForExpansion(id: string, organizationId: string) {
  return prisma.manufacturingPacket.findFirst({
    where: { id, organizationId },
    include: {
      shelfJobs: {
        include: {
          salesOrder: true,
          salesOrderItem: {
            include: {
              shelfProduct: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      },
      parts: true,
      expansionRun: true
    }
  });
}

export async function createManufacturingParts(input: {
  organizationId: string;
  parts: Array<{
    id: string;
    manufacturingPacketId: string;
    shelfJobId: string;
    salesOrderId: string;
    salesOrderItemId: string;
    partNumber: string;
    serialNumber?: string;
    unitIndex: number;
    quantity?: number;
    partType: "SHELF";
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    thicknessIn: number;
    lengthIn: number;
    depthIn: number;
    edgeBandPattern: "ALL_FOUR";
    requiresPackaging: boolean;
    labelDataJson: Record<string, unknown>;
    sortGroup?: string;
  }>;
}) {
  return prisma.$transaction(
    input.parts.map((part) =>
      prisma.manufacturingPart.create({
        data: {
          id: part.id,
          organizationId: input.organizationId,
          manufacturingPacketId: part.manufacturingPacketId,
          shelfJobId: part.shelfJobId,
          salesOrderId: part.salesOrderId,
          salesOrderItemId: part.salesOrderItemId,
          partNumber: part.partNumber,
          serialNumber: part.serialNumber ?? null,
          unitIndex: part.unitIndex,
          quantity: part.quantity ?? 1,
          partType: part.partType,
          materialType: part.materialType,
          thicknessIn: decimal(part.thicknessIn),
          lengthIn: decimal(part.lengthIn),
          depthIn: decimal(part.depthIn),
          edgeBandPattern: part.edgeBandPattern,
          requiresPackaging: part.requiresPackaging,
          labelDataJson: part.labelDataJson as Prisma.InputJsonValue,
          sortGroup: part.sortGroup ?? null
        }
      })
    )
  );
}

export async function createPacketExpansionRun(input: {
  organizationId: string;
  manufacturingPacketId: string;
  sourceJobCount: number;
  createdPartCount: number;
  resultJson: Record<string, unknown>;
  createdByUserId?: string;
}) {
  return prisma.packetExpansionRun.create({
    data: {
      organizationId: input.organizationId,
      manufacturingPacketId: input.manufacturingPacketId,
      sourceJobCount: input.sourceJobCount,
      createdPartCount: input.createdPartCount,
      resultJson: input.resultJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

export async function listManufacturingParts(input: {
  organizationId: string;
  packetId?: string;
  batchId?: string;
  status?: string;
}) {
  return prisma.manufacturingPart.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.packetId ? { manufacturingPacketId: input.packetId } : {}),
      ...(input.batchId ? { batchId: input.batchId } : {}),
      ...(input.status ? { status: input.status as any } : {})
    },
    include: {
      manufacturingPacket: true,
      shelfJob: true,
      salesOrder: true,
      salesOrderItem: true,
      batch: true
    },
    orderBy: [{ createdAt: "asc" }, { unitIndex: "asc" }]
  });
}

export async function getManufacturingPartById(id: string, organizationId: string) {
  return prisma.manufacturingPart.findFirst({
    where: { id, organizationId },
    include: {
      manufacturingPacket: true,
      shelfJob: true,
      salesOrder: true,
      salesOrderItem: true,
      batch: true
    }
  });
}

export async function createManufacturingBatch(input: {
  organizationId: string;
  batchNumber: string;
  batchType: "CUT" | "EDGEBAND" | "PACKAGING";
  materialType?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  thicknessIn?: number;
  notes?: string;
}) {
  return prisma.manufacturingBatch.create({
    data: {
      organizationId: input.organizationId,
      batchNumber: input.batchNumber,
      batchType: input.batchType,
      materialType: input.materialType ?? null,
      thicknessIn: input.thicknessIn !== undefined ? decimal(input.thicknessIn) : null,
      notes: input.notes?.trim() || null
    }
  });
}

export async function getManufacturingBatchById(id: string, organizationId: string) {
  return prisma.manufacturingBatch.findFirst({
    where: { id, organizationId },
    include: {
      parts: {
        include: {
          salesOrder: true,
          salesOrderItem: true
        },
        orderBy: [{ createdAt: "asc" }, { unitIndex: "asc" }]
      },
      batchParts: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function listManufacturingBatches(organizationId: string) {
  return prisma.manufacturingBatch.findMany({
    where: { organizationId },
    include: {
      parts: true
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getReadyManufacturingPartsByIds(partIds: string[], organizationId: string) {
  return prisma.manufacturingPart.findMany({
    where: {
      organizationId,
      id: { in: partIds }
    },
    orderBy: [{ createdAt: "asc" }, { unitIndex: "asc" }]
  });
}

export async function addPartsToManufacturingBatch(input: {
  organizationId: string;
  batchId: string;
  parts: Array<{ id: string; sequence: number }>;
}) {
  return prisma.$transaction(async (tx) => {
    await Promise.all(
      input.parts.map((part) =>
        tx.manufacturingBatchPart.create({
          data: {
            organizationId: input.organizationId,
            batchId: input.batchId,
            manufacturingPartId: part.id,
            sequence: part.sequence
          }
        })
      )
    );

    await tx.manufacturingPart.updateMany({
      where: {
        organizationId: input.organizationId,
        id: { in: input.parts.map((part) => part.id) }
      },
      data: {
        batchId: input.batchId,
        status: "BATCHED"
      }
    });

    return tx.manufacturingBatch.findFirst({
      where: { id: input.batchId, organizationId: input.organizationId },
      include: { parts: true, batchParts: true }
    });
  });
}

export async function listLabelTemplateVersions(organizationId: string) {
  return prisma.labelTemplateVersion.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }, { version: "desc" }]
  });
}

export async function createLabelTemplateVersion(input: {
  organizationId: string;
  name: string;
  code: string;
  version: number;
  isDefault?: boolean;
  templateJson: Record<string, unknown>;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.labelTemplateVersion.updateMany({
        where: { organizationId: input.organizationId, isDefault: true },
        data: { isDefault: false }
      });
    }
    return tx.labelTemplateVersion.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        code: input.code.trim(),
        version: input.version,
        isDefault: input.isDefault ?? false,
        templateJson: input.templateJson as Prisma.InputJsonValue
      }
    });
  });
}

export async function updateLabelTemplateVersion(id: string, input: {
  organizationId: string;
  name?: string;
  isDefault?: boolean;
  templateJson?: Record<string, unknown>;
}) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.labelTemplateVersion.updateMany({
        where: {
          organizationId: input.organizationId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
    return tx.labelTemplateVersion.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.templateJson !== undefined ? { templateJson: input.templateJson as Prisma.InputJsonValue } : {})
      }
    });
  });
}
