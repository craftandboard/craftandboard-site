import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(4));
}

export async function listCostProfiles(organizationId: string) {
  return prisma.costProfile.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getCostProfileById(costProfileId: string, organizationId: string) {
  return prisma.costProfile.findFirst({
    where: {
      id: costProfileId,
      organizationId
    }
  });
}

export async function createCostProfile(
  input: {
    organizationId: string;
    name: string;
    isDefault?: boolean;
    currency: string;
    notes?: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.costProfile.updateMany({
        where: {
          organizationId: input.organizationId,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    return tx.costProfile.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        isDefault: input.isDefault ?? false,
        currency: input.currency,
        notes: input.notes?.trim() || null
      }
    });
  });
}

export async function updateCostProfile(
  costProfileId: string,
  input: {
    organizationId: string;
    name?: string;
    isDefault?: boolean;
    currency?: string;
    notes?: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.costProfile.findFirst({
      where: {
        id: costProfileId,
        organizationId: input.organizationId
      }
    });

    if (!existing) {
      throw new Error("Cost profile not found.");
    }

    if (input.isDefault) {
      await tx.costProfile.updateMany({
        where: {
          organizationId: input.organizationId,
          isDefault: true,
          id: { not: costProfileId }
        },
        data: { isDefault: false }
      });
    }

    return tx.costProfile.update({
      where: { id: costProfileId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {})
      }
    });
  });
}

export async function listActiveCostRates(costProfileId: string, organizationId: string, effectiveAt: Date) {
  return prisma.costRate.findMany({
    where: {
      organizationId,
      costProfileId,
      effectiveFrom: { lte: effectiveAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveAt } }]
    },
    orderBy: [{ key: "asc" }, { effectiveFrom: "desc" }]
  });
}

export async function upsertCostRates(
  costProfileId: string,
  input: {
    organizationId: string;
    rates: Array<{
      key: string;
      valueDecimal: number;
      unit: string;
      notes?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }>;
  }
) {
  const profile = await getCostProfileById(costProfileId, input.organizationId);

  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  const writes = input.rates.map((rate) => {
    const effectiveFrom = rate.effectiveFrom ? new Date(rate.effectiveFrom) : new Date("2026-01-01T00:00:00.000Z");

    return prisma.costRate.upsert({
      where: {
        costProfileId_key_effectiveFrom: {
          costProfileId,
          key: rate.key,
          effectiveFrom
        }
      },
      update: {
        valueDecimal: decimal(rate.valueDecimal),
        unit: rate.unit.trim(),
        notes: rate.notes?.trim() || null,
        effectiveTo: rate.effectiveTo ? new Date(rate.effectiveTo) : null
      },
      create: {
        organizationId: input.organizationId,
        costProfileId,
        key: rate.key,
        valueDecimal: decimal(rate.valueDecimal),
        unit: rate.unit.trim(),
        notes: rate.notes?.trim() || null,
        effectiveFrom,
        effectiveTo: rate.effectiveTo ? new Date(rate.effectiveTo) : null
      }
    });
  });

  return prisma.$transaction(writes);
}

export async function createCostScenario(input: {
  organizationId: string;
  costProfileId: string;
  name?: string;
  sourceType: "MANUAL" | "CONFIGURATOR" | "ORDER" | "BATCH" | "FORECAST";
  sourceId?: string;
  inputJson: unknown;
  resultJson: unknown;
  createdByUserId?: string;
}) {
  return prisma.costScenario.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      name: input.name?.trim() || null,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      inputJson: input.inputJson as Prisma.InputJsonValue,
      resultJson: input.resultJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

export async function getShelfJobByIdForCosting(shelfJobId: string, organizationId: string) {
  return prisma.shelfJob.findFirst({
    where: { id: shelfJobId, organizationId },
    include: {
      salesOrder: true,
      salesOrderItem: {
        include: {
          shelfProduct: true,
          packagingProfile: true
        }
      },
      shelfProduct: true,
      packagingProfile: true,
      costProfile: true,
      productionAssumptionProfile: true,
      pricingPolicy: true
    }
  });
}

export async function getSalesOrderByIdForCosting(salesOrderId: string, organizationId: string) {
  return prisma.salesOrder.findFirst({
    where: { id: salesOrderId, organizationId },
    include: {
      items: {
        include: {
          shelfProduct: true,
          packagingProfile: true
        },
        orderBy: { createdAt: "asc" }
      },
      shelfJobs: {
        include: {
          salesOrderItem: {
            include: {
              shelfProduct: true,
              packagingProfile: true
            }
          },
          shelfProduct: true,
          packagingProfile: true,
          costProfile: true,
          productionAssumptionProfile: true,
          pricingPolicy: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function clearCurrentShelfCostEstimates(shelfJobId: string, organizationId: string) {
  await prisma.shelfCostEstimate.updateMany({
    where: {
      organizationId,
      shelfJobId,
      isCurrent: true
    },
    data: { isCurrent: false }
  });
}

export async function createShelfCostEstimate(input: {
  organizationId: string;
  shelfJobId: string;
  salesOrderId: string;
  salesOrderItemId: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  estimateStatus: "COMPLETE" | "PARTIAL" | "ERROR";
  warningsJson?: unknown;
  inputSnapshotJson: unknown;
  assumptionSnapshotJson: unknown;
  resultJson: unknown;
  createdByUserId?: string;
}) {
  return prisma.shelfCostEstimate.create({
    data: {
      organizationId: input.organizationId,
      shelfJobId: input.shelfJobId,
      salesOrderId: input.salesOrderId,
      salesOrderItemId: input.salesOrderItemId,
      costProfileId: input.costProfileId,
      productionAssumptionProfileId: input.productionAssumptionProfileId,
      packagingProfileId: input.packagingProfileId ?? null,
      pricingPolicyId: input.pricingPolicyId,
      estimateStatus: input.estimateStatus,
      warningsJson: (input.warningsJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      inputSnapshotJson: input.inputSnapshotJson as Prisma.InputJsonValue,
      assumptionSnapshotJson: input.assumptionSnapshotJson as Prisma.InputJsonValue,
      resultJson: input.resultJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

export async function getLatestShelfCostEstimate(shelfJobId: string, organizationId: string) {
  return prisma.shelfCostEstimate.findFirst({
    where: {
      organizationId,
      shelfJobId,
      isCurrent: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function clearCurrentOrderCostEstimates(salesOrderId: string, organizationId: string) {
  await prisma.orderCostEstimate.updateMany({
    where: {
      organizationId,
      salesOrderId,
      isCurrent: true
    },
    data: { isCurrent: false }
  });
}

export async function createOrderCostEstimate(input: {
  organizationId: string;
  salesOrderId: string;
  costProfileId: string;
  productionAssumptionProfileId?: string;
  packagingProfileId?: string;
  pricingPolicyId?: string;
  estimateStatus: "COMPLETE" | "PARTIAL" | "ERROR";
  warningsJson?: unknown;
  inputSnapshotJson: unknown;
  assumptionSnapshotJson: unknown;
  resultJson: unknown;
  createdByUserId?: string;
}) {
  return prisma.orderCostEstimate.create({
    data: {
      organizationId: input.organizationId,
      salesOrderId: input.salesOrderId,
      costProfileId: input.costProfileId,
      productionAssumptionProfileId: input.productionAssumptionProfileId ?? null,
      packagingProfileId: input.packagingProfileId ?? null,
      pricingPolicyId: input.pricingPolicyId ?? null,
      estimateStatus: input.estimateStatus,
      warningsJson: (input.warningsJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      inputSnapshotJson: input.inputSnapshotJson as Prisma.InputJsonValue,
      assumptionSnapshotJson: input.assumptionSnapshotJson as Prisma.InputJsonValue,
      resultJson: input.resultJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

export async function getLatestOrderCostEstimate(salesOrderId: string, organizationId: string) {
  return prisma.orderCostEstimate.findFirst({
    where: {
      organizationId,
      salesOrderId,
      isCurrent: true
    },
    orderBy: { createdAt: "desc" }
  });
}
