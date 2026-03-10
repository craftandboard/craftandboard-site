import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : value;
}

export async function createCostProfileRecord(input: {
  organizationId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  currency?: string;
  defaultMaterialWastePct?: number;
  defaultEdgeBandWastePct?: number;
  defaultLaborRateCentsPerHour?: number;
  defaultMachineRateCentsPerHour?: number;
  defaultOverheadRateCentsPerHour?: number | null;
  defaultPackagingAllowanceCents?: number | null;
  defaultShippingAllowanceCents?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.costProfile.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      status: input.status ?? "ACTIVE",
      currency: input.currency ?? "USD",
      defaultMaterialWastePct: input.defaultMaterialWastePct,
      defaultEdgeBandWastePct: input.defaultEdgeBandWastePct,
      defaultLaborRateCentsPerHour: input.defaultLaborRateCentsPerHour,
      defaultMachineRateCentsPerHour: input.defaultMachineRateCentsPerHour,
      defaultOverheadRateCentsPerHour: input.defaultOverheadRateCentsPerHour ?? undefined,
      defaultPackagingAllowanceCents: input.defaultPackagingAllowanceCents ?? undefined,
      defaultShippingAllowanceCents: input.defaultShippingAllowanceCents ?? undefined,
      targetMarginPct: input.targetMarginPct ?? undefined,
      growthMarginPct: input.growthMarginPct ?? undefined,
      notes: input.notes ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function listCostProfilesForOrganization(organizationId: string) {
  return prismaClient.costProfile.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }, { id: "desc" }]
  });
}

export async function getCostProfileRecord(input: {
  organizationId: string;
  costProfileId: string;
}) {
  return prismaClient.costProfile.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.costProfileId
    },
    include: {
      materialCostRules: {
        where: { active: true },
        orderBy: [{ materialName: "asc" }, { id: "asc" }]
      },
      edgeBandCostRules: {
        where: { active: true },
        orderBy: [{ edgeBandName: "asc" }, { id: "asc" }]
      },
      packagingCostRules: {
        where: { active: true },
        orderBy: [{ packagingName: "asc" }, { id: "asc" }]
      },
      shippingCostRules: {
        where: { active: true },
        orderBy: [{ shippingName: "asc" }, { id: "asc" }]
      }
    }
  });
}

export async function updateCostProfileRecord(input: {
  organizationId: string;
  costProfileId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.costProfile.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.costProfileId
    },
    data: input.data
  });
}

export async function createMaterialCostRuleRecord(input: {
  organizationId: string;
  costProfileId: string;
  materialCode: string;
  materialName: string;
  thicknessLabel?: string | null;
  sheetLengthIn: number;
  sheetWidthIn: number;
  sheetCostCents: number;
  usableYieldPct?: number | null;
  wastePct?: number | null;
  active?: boolean;
}) {
  return prismaClient.materialCostRule.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      materialCode: input.materialCode,
      materialName: input.materialName,
      thicknessLabel: input.thicknessLabel ?? null,
      sheetLengthIn: input.sheetLengthIn,
      sheetWidthIn: input.sheetWidthIn,
      sheetCostCents: input.sheetCostCents,
      usableYieldPct: input.usableYieldPct ?? undefined,
      wastePct: input.wastePct ?? undefined,
      active: input.active ?? true
    }
  });
}

export async function updateMaterialCostRuleRecord(input: {
  organizationId: string;
  materialRuleId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.materialCostRule.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.materialRuleId
    },
    data: input.data
  });
}

export async function createEdgeBandCostRuleRecord(input: {
  organizationId: string;
  costProfileId: string;
  edgeBandCode: string;
  edgeBandName: string;
  costCentsPerLinearFoot: number;
  wastePct?: number | null;
  setupAllowanceLinearFt?: number | null;
  active?: boolean;
}) {
  return prismaClient.edgeBandCostRule.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      edgeBandCode: input.edgeBandCode,
      edgeBandName: input.edgeBandName,
      costCentsPerLinearFoot: input.costCentsPerLinearFoot,
      wastePct: input.wastePct ?? undefined,
      setupAllowanceLinearFt: input.setupAllowanceLinearFt ?? undefined,
      active: input.active ?? true
    }
  });
}

export async function updateEdgeBandCostRuleRecord(input: {
  organizationId: string;
  edgeBandRuleId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.edgeBandCostRule.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.edgeBandRuleId
    },
    data: input.data
  });
}

export async function createPackagingCostRuleRecord(input: {
  organizationId: string;
  costProfileId: string;
  packagingCode: string;
  packagingName: string;
  boxCostCents?: number | null;
  bubbleWrapCostCents?: number | null;
  tapeCostCents?: number | null;
  labelCostCents?: number | null;
  insertFlyerCostCents?: number | null;
  shrinkWrapCostCents?: number | null;
  otherPackagingCostCents?: number | null;
  active?: boolean;
}) {
  return prismaClient.packagingCostRule.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      packagingCode: input.packagingCode,
      packagingName: input.packagingName,
      boxCostCents: input.boxCostCents ?? undefined,
      bubbleWrapCostCents: input.bubbleWrapCostCents ?? undefined,
      tapeCostCents: input.tapeCostCents ?? undefined,
      labelCostCents: input.labelCostCents ?? undefined,
      insertFlyerCostCents: input.insertFlyerCostCents ?? undefined,
      shrinkWrapCostCents: input.shrinkWrapCostCents ?? undefined,
      otherPackagingCostCents: input.otherPackagingCostCents ?? undefined,
      active: input.active ?? true
    }
  });
}

export async function updatePackagingCostRuleRecord(input: {
  organizationId: string;
  packagingRuleId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.packagingCostRule.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.packagingRuleId
    },
    data: input.data
  });
}

export async function createShippingCostRuleRecord(input: {
  organizationId: string;
  costProfileId: string;
  shippingCode: string;
  shippingName: string;
  baseCostCents: number;
  costPerPoundCents?: number | null;
  costPerCubicInchCents?: number | null;
  flatOverride?: number | null;
  active?: boolean;
}) {
  return prismaClient.shippingCostRule.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      shippingCode: input.shippingCode,
      shippingName: input.shippingName,
      baseCostCents: input.baseCostCents,
      costPerPoundCents: input.costPerPoundCents ?? undefined,
      costPerCubicInchCents: input.costPerCubicInchCents ?? undefined,
      flatOverride: input.flatOverride ?? undefined,
      active: input.active ?? true
    }
  });
}

export async function updateShippingCostRuleRecord(input: {
  organizationId: string;
  shippingRuleId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.shippingCostRule.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.shippingRuleId
    },
    data: input.data
  });
}

export async function createShelfCostCalculationRecord(input: {
  organizationId: string;
  costProfileId: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: string;
  packagingCode?: string | null;
  shippingCode?: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes?: number | null;
  materialCostCents: number;
  edgeBandCostCents: number;
  laborCostCents: number;
  machineCostCents: number;
  packagingCostCents: number;
  shippingCostCents: number;
  overheadCostCents: number;
  subtotalCostCents: number;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  recommendedInternalPriceCents?: number | null;
  recommendedSellPriceCents?: number | null;
  assumptionsSnapshot: unknown;
  resultSnapshot: unknown;
}) {
  return prismaClient.shelfCostCalculation.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      name: input.name ?? null,
      sku: input.sku ?? null,
      quantity: input.quantity,
      lengthIn: input.lengthIn,
      depthIn: input.depthIn,
      thicknessIn: input.thicknessIn ?? undefined,
      materialCode: input.materialCode,
      edgeBandCode: input.edgeBandCode ?? null,
      edgeBandPattern: input.edgeBandPattern,
      packagingCode: input.packagingCode ?? null,
      shippingCode: input.shippingCode ?? null,
      laborMinutes: input.laborMinutes,
      machineMinutes: input.machineMinutes,
      overheadMinutes: input.overheadMinutes ?? undefined,
      materialCostCents: input.materialCostCents,
      edgeBandCostCents: input.edgeBandCostCents,
      laborCostCents: input.laborCostCents,
      machineCostCents: input.machineCostCents,
      packagingCostCents: input.packagingCostCents,
      shippingCostCents: input.shippingCostCents,
      overheadCostCents: input.overheadCostCents,
      subtotalCostCents: input.subtotalCostCents,
      targetMarginPct: input.targetMarginPct ?? undefined,
      growthMarginPct: input.growthMarginPct ?? undefined,
      recommendedInternalPriceCents: input.recommendedInternalPriceCents ?? undefined,
      recommendedSellPriceCents: input.recommendedSellPriceCents ?? undefined,
      assumptionsSnapshot: normalizeMetadata(input.assumptionsSnapshot),
      resultSnapshot: normalizeMetadata(input.resultSnapshot)
    }
  });
}

export async function listShelfCostCalculationsForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.shelfCostCalculation.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { costProfileId: input.costProfileId } : {})
    },
    include: {
      costProfile: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function getShelfCostCalculationRecord(input: {
  organizationId: string;
  calculationId: string;
}) {
  return prismaClient.shelfCostCalculation.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.calculationId
    },
    include: {
      costProfile: true
    }
  });
}
