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
  defaultPackingLaborRateCentsPerHour?: number | null;
  defaultPackingMinutes?: number | null;
  defaultMarketplaceFeePct?: number | null;
  defaultReturnReservePct?: number | null;
  defaultDamageReservePct?: number | null;
  defaultShippingBufferPct?: number | null;
  defaultShippingBufferCents?: number | null;
  defaultPackagingOverheadCents?: number | null;
  defaultRecommendedMinMarginPct?: number | null;
  defaultRecommendedTargetMarginPct?: number | null;
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
      defaultPackingLaborRateCentsPerHour: input.defaultPackingLaborRateCentsPerHour ?? undefined,
      defaultPackingMinutes: input.defaultPackingMinutes ?? undefined,
      defaultMarketplaceFeePct: input.defaultMarketplaceFeePct ?? undefined,
      defaultReturnReservePct: input.defaultReturnReservePct ?? undefined,
      defaultDamageReservePct: input.defaultDamageReservePct ?? undefined,
      defaultShippingBufferPct: input.defaultShippingBufferPct ?? undefined,
      defaultShippingBufferCents: input.defaultShippingBufferCents ?? undefined,
      defaultPackagingOverheadCents: input.defaultPackagingOverheadCents ?? undefined,
      defaultRecommendedMinMarginPct: input.defaultRecommendedMinMarginPct ?? undefined,
      defaultRecommendedTargetMarginPct: input.defaultRecommendedTargetMarginPct ?? undefined,
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
      },
      amazonFeePresets: {
        where: { status: "ACTIVE" },
        orderBy: [{ name: "asc" }, { id: "asc" }]
      },
      shippingZoneRules: {
        where: { status: "ACTIVE" },
        orderBy: [{ name: "asc" }, { id: "asc" }]
      },
      launchTemplates: {
        where: { status: "ACTIVE" },
        include: {
          defaultAmazonFeePreset: true,
          defaultShippingZoneRule: true,
          defaultPackagingRule: true,
          defaultShippingRule: true
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
      },
      launchGuardrailProfiles: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
      },
      marketplaceMappingTemplates: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
      },
      channelMappingPresets: {
        where: { status: "ACTIVE" },
        orderBy: [{ defaultForChannel: "desc" }, { priority: "desc" }, { updatedAt: "desc" }, { id: "desc" }]
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
  foamCostCents?: number | null;
  cornerProtectorCostCents?: number | null;
  packingMinutes?: number | null;
  packingLaborOverrideCents?: number | null;
  packagingOverheadCents?: number | null;
  otherPackagingCostCents?: number | null;
  sortOrder?: number | null;
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
      foamCostCents: input.foamCostCents ?? undefined,
      cornerProtectorCostCents: input.cornerProtectorCostCents ?? undefined,
      packingMinutes: input.packingMinutes ?? undefined,
      packingLaborOverrideCents: input.packingLaborOverrideCents ?? undefined,
      packagingOverheadCents: input.packagingOverheadCents ?? undefined,
      otherPackagingCostCents: input.otherPackagingCostCents ?? undefined,
      sortOrder: input.sortOrder ?? undefined,
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
  dimensionalDivisor?: number | null;
  dimensionalRateCents?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
  marketplaceHandlingCents?: number | null;
  sortOrder?: number | null;
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
      dimensionalDivisor: input.dimensionalDivisor ?? undefined,
      dimensionalRateCents: input.dimensionalRateCents ?? undefined,
      shippingBufferPct: input.shippingBufferPct ?? undefined,
      shippingBufferCents: input.shippingBufferCents ?? undefined,
      marketplaceHandlingCents: input.marketplaceHandlingCents ?? undefined,
      sortOrder: input.sortOrder ?? undefined,
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
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
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
  packingMinutes?: number | null;
  materialCostCents: number;
  edgeBandCostCents: number;
  laborCostCents: number;
  machineCostCents: number;
  packagingCostCents: number;
  packingLaborCostCents: number;
  shippingCostCents: number;
  shippingBufferCostCents: number;
  overheadCostCents: number;
  marketplaceFeeCostCents: number;
  referralFeeCostCents?: number | null;
  closingFeeCostCents?: number | null;
  fulfillmentFeeCostCents?: number | null;
  storageAllowanceCostCents?: number | null;
  advertisingAllowanceCostCents?: number | null;
  returnReserveCostCents: number;
  damageReserveCostCents: number;
  miscMarketplaceCostCents?: number | null;
  subtotalCostCents: number;
  breakEvenPriceCents?: number | null;
  recommendedMinSellPriceCents?: number | null;
  recommendedTargetSellPriceCents?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  recommendedInternalPriceCents?: number | null;
  recommendedSellPriceCents?: number | null;
  assumptionsSnapshot: unknown;
  packagingSnapshot?: unknown;
  shippingSnapshot?: unknown;
  pricingSnapshot?: unknown;
  amazonFeeSnapshot?: unknown;
  shippingZoneSnapshot?: unknown;
  resultSnapshot: unknown;
}) {
  return prismaClient.shelfCostCalculation.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      amazonFeePresetId: input.amazonFeePresetId ?? null,
      shippingZoneRuleId: input.shippingZoneRuleId ?? null,
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
      packingMinutes: input.packingMinutes ?? undefined,
      materialCostCents: input.materialCostCents,
      edgeBandCostCents: input.edgeBandCostCents,
      laborCostCents: input.laborCostCents,
      machineCostCents: input.machineCostCents,
      packagingCostCents: input.packagingCostCents,
      packingLaborCostCents: input.packingLaborCostCents,
      shippingCostCents: input.shippingCostCents,
      shippingBufferCostCents: input.shippingBufferCostCents,
      overheadCostCents: input.overheadCostCents,
      marketplaceFeeCostCents: input.marketplaceFeeCostCents,
      referralFeeCostCents: input.referralFeeCostCents ?? undefined,
      closingFeeCostCents: input.closingFeeCostCents ?? undefined,
      fulfillmentFeeCostCents: input.fulfillmentFeeCostCents ?? undefined,
      storageAllowanceCostCents: input.storageAllowanceCostCents ?? undefined,
      advertisingAllowanceCostCents: input.advertisingAllowanceCostCents ?? undefined,
      returnReserveCostCents: input.returnReserveCostCents,
      damageReserveCostCents: input.damageReserveCostCents,
      miscMarketplaceCostCents: input.miscMarketplaceCostCents ?? undefined,
      subtotalCostCents: input.subtotalCostCents,
      breakEvenPriceCents: input.breakEvenPriceCents ?? undefined,
      recommendedMinSellPriceCents: input.recommendedMinSellPriceCents ?? undefined,
      recommendedTargetSellPriceCents: input.recommendedTargetSellPriceCents ?? undefined,
      targetMarginPct: input.targetMarginPct ?? undefined,
      growthMarginPct: input.growthMarginPct ?? undefined,
      recommendedInternalPriceCents: input.recommendedInternalPriceCents ?? undefined,
      recommendedSellPriceCents: input.recommendedSellPriceCents ?? undefined,
      assumptionsSnapshot: normalizeMetadata(input.assumptionsSnapshot),
      packagingSnapshot: normalizeMetadata(input.packagingSnapshot),
      shippingSnapshot: normalizeMetadata(input.shippingSnapshot),
      pricingSnapshot: normalizeMetadata(input.pricingSnapshot),
      amazonFeeSnapshot: normalizeMetadata(input.amazonFeeSnapshot),
      shippingZoneSnapshot: normalizeMetadata(input.shippingZoneSnapshot),
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
      costProfile: true,
      amazonFeePreset: true,
      shippingZoneRule: true
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
      costProfile: true,
      amazonFeePreset: true,
      shippingZoneRule: true
    }
  });
}

export async function createAmazonFeePresetRecord(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  referralFeePct: number;
  closingFeeCents?: number | null;
  fulfillmentFeeCents?: number | null;
  storageAllowanceCents?: number | null;
  advertisingAllowancePct?: number | null;
  advertisingAllowanceCents?: number | null;
  returnReservePct?: number | null;
  returnReserveCents?: number | null;
  damageReservePct?: number | null;
  damageReserveCents?: number | null;
  miscMarketplacePct?: number | null;
  miscMarketplaceCents?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.amazonFeePreset.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId ?? undefined,
      name: input.name,
      status: input.status ?? "ACTIVE",
      referralFeePct: input.referralFeePct,
      closingFeeCents: input.closingFeeCents ?? undefined,
      fulfillmentFeeCents: input.fulfillmentFeeCents ?? undefined,
      storageAllowanceCents: input.storageAllowanceCents ?? undefined,
      advertisingAllowancePct: input.advertisingAllowancePct ?? undefined,
      advertisingAllowanceCents: input.advertisingAllowanceCents ?? undefined,
      returnReservePct: input.returnReservePct ?? undefined,
      returnReserveCents: input.returnReserveCents ?? undefined,
      damageReservePct: input.damageReservePct ?? undefined,
      damageReserveCents: input.damageReserveCents ?? undefined,
      miscMarketplacePct: input.miscMarketplacePct ?? undefined,
      miscMarketplaceCents: input.miscMarketplaceCents ?? undefined,
      notes: input.notes ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function listAmazonFeePresetsForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.amazonFeePreset.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { OR: [{ costProfileId: input.costProfileId }, { costProfileId: null }] } : {})
    },
    orderBy: [{ status: "asc" }, { name: "asc" }, { id: "asc" }]
  });
}

export async function getAmazonFeePresetRecord(input: {
  organizationId: string;
  presetId: string;
}) {
  return prismaClient.amazonFeePreset.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.presetId
    }
  });
}

export async function updateAmazonFeePresetRecord(input: {
  organizationId: string;
  presetId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.amazonFeePreset.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.presetId
    },
    data: input.data
  });
}

export async function createShippingZoneRuleRecord(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  zoneCode: string;
  status?: "ACTIVE" | "ARCHIVED";
  baseCostCents: number;
  weightAdderCents?: number | null;
  dimensionalAdderCents?: number | null;
  bufferPct?: number | null;
  bufferCents?: number | null;
  marketplaceHandlingCents?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.shippingZoneRule.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId ?? undefined,
      name: input.name,
      zoneCode: input.zoneCode,
      status: input.status ?? "ACTIVE",
      baseCostCents: input.baseCostCents,
      weightAdderCents: input.weightAdderCents ?? undefined,
      dimensionalAdderCents: input.dimensionalAdderCents ?? undefined,
      bufferPct: input.bufferPct ?? undefined,
      bufferCents: input.bufferCents ?? undefined,
      marketplaceHandlingCents: input.marketplaceHandlingCents ?? undefined,
      notes: input.notes ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function listShippingZoneRulesForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.shippingZoneRule.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { OR: [{ costProfileId: input.costProfileId }, { costProfileId: null }] } : {})
    },
    orderBy: [{ status: "asc" }, { name: "asc" }, { id: "asc" }]
  });
}

export async function getShippingZoneRuleRecord(input: {
  organizationId: string;
  zoneRuleId: string;
}) {
  return prismaClient.shippingZoneRule.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.zoneRuleId
    }
  });
}

export async function updateShippingZoneRuleRecord(input: {
  organizationId: string;
  zoneRuleId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.shippingZoneRule.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.zoneRuleId
    },
    data: input.data
  });
}

export async function createCalculationScenarioRecord(input: {
  organizationId: string;
  name: string;
  costProfileId: string;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  packagingRuleId?: string | null;
  shippingRuleId?: string | null;
  shelfCostCalculationId?: string | null;
  launchStrategy?: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN" | null;
  rankingScore?: number | null;
  rankingSummary?: unknown;
  guardrailProfileId?: string | null;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  listingReadinessStatus?: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  guardrailSnapshot?: unknown;
  warningSnapshot?: unknown;
  handoffSnapshot?: unknown;
  listingReadinessSnapshot?: unknown;
  marketplaceFieldSnapshot?: unknown;
  strongerAlertSnapshot?: unknown;
  exportSnapshot?: unknown;
  isRecommendedLaunchScenario?: boolean;
  isLaunchApprovedCandidate?: boolean;
  listingPrepPackageId?: string | null;
  priceFloorOverrideRequested?: boolean;
  priceFloorOverrideApproved?: boolean;
  priceFloorOverrideSnapshot?: unknown;
  latestOverrideSummarySnapshot?: unknown;
  latestApprovalSummarySnapshot?: unknown;
  assumptionsSnapshot: unknown;
  resultSnapshot: unknown;
}) {
  return prismaClient.calculationScenario.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      costProfileId: input.costProfileId,
      amazonFeePresetId: input.amazonFeePresetId ?? undefined,
      shippingZoneRuleId: input.shippingZoneRuleId ?? undefined,
      packagingRuleId: input.packagingRuleId ?? undefined,
      shippingRuleId: input.shippingRuleId ?? undefined,
      shelfCostCalculationId: input.shelfCostCalculationId ?? undefined,
      launchStrategy: input.launchStrategy ?? undefined,
      rankingScore: input.rankingScore ?? undefined,
      rankingSummary: normalizeMetadata(input.rankingSummary),
      guardrailProfileId: input.guardrailProfileId ?? undefined,
      riskScore: input.riskScore ?? undefined,
      riskLevel: input.riskLevel ?? undefined,
      listingReadinessStatus: input.listingReadinessStatus ?? undefined,
      guardrailSnapshot: normalizeMetadata(input.guardrailSnapshot),
      warningSnapshot: normalizeMetadata(input.warningSnapshot),
      handoffSnapshot: normalizeMetadata(input.handoffSnapshot),
      listingReadinessSnapshot: normalizeMetadata(input.listingReadinessSnapshot),
      marketplaceFieldSnapshot: normalizeMetadata(input.marketplaceFieldSnapshot),
      strongerAlertSnapshot: normalizeMetadata(input.strongerAlertSnapshot),
      exportSnapshot: normalizeMetadata(input.exportSnapshot),
      isRecommendedLaunchScenario: input.isRecommendedLaunchScenario ?? false,
      isLaunchApprovedCandidate: input.isLaunchApprovedCandidate ?? false,
      listingPrepPackageId: input.listingPrepPackageId ?? undefined,
      priceFloorOverrideRequested: input.priceFloorOverrideRequested ?? false,
      priceFloorOverrideApproved: input.priceFloorOverrideApproved ?? false,
      priceFloorOverrideSnapshot: normalizeMetadata(input.priceFloorOverrideSnapshot),
      latestOverrideSummarySnapshot: normalizeMetadata(input.latestOverrideSummarySnapshot),
      latestApprovalSummarySnapshot: normalizeMetadata(input.latestApprovalSummarySnapshot),
      assumptionsSnapshot: normalizeMetadata(input.assumptionsSnapshot),
      resultSnapshot: normalizeMetadata(input.resultSnapshot)
    }
  });
}

export async function createCalculationComparisonSetRecord(input: {
  organizationId: string;
  name: string;
  baseShelfSpecSnapshot: unknown;
  notes?: string | null;
  recommendedScenarioId?: string | null;
  selectedLaunchScenarioId?: string | null;
  rankingSnapshot?: unknown;
  comparisonSummary?: unknown;
  selectedLaunchSummary?: unknown;
  riskSummary?: unknown;
  selectedLaunchExportSnapshot?: unknown;
  selectedLaunchReadinessStatus?: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  selectedLaunchWarningSnapshot?: unknown;
  selectedListingPrepPackageId?: string | null;
  listingPrepSummarySnapshot?: unknown;
  selectedListingPrepReadySnapshot?: unknown;
  selectedListingPrepExportVersion?: string | null;
  selectedListingPrepApprovalSnapshot?: unknown;
  selectedListingPrepExportContractVersion?: string | null;
}) {
  return prismaClient.calculationComparisonSet.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      baseShelfSpecSnapshot: normalizeMetadata(input.baseShelfSpecSnapshot),
      notes: input.notes ?? null,
      recommendedScenarioId: input.recommendedScenarioId ?? undefined,
      selectedLaunchScenarioId: input.selectedLaunchScenarioId ?? undefined,
      rankingSnapshot: normalizeMetadata(input.rankingSnapshot),
      comparisonSummary: normalizeMetadata(input.comparisonSummary),
      selectedLaunchSummary: normalizeMetadata(input.selectedLaunchSummary),
      riskSummary: normalizeMetadata(input.riskSummary),
      selectedLaunchExportSnapshot: normalizeMetadata(input.selectedLaunchExportSnapshot),
      selectedLaunchReadinessStatus: input.selectedLaunchReadinessStatus ?? undefined,
      selectedLaunchWarningSnapshot: normalizeMetadata(input.selectedLaunchWarningSnapshot),
      selectedListingPrepPackageId: input.selectedListingPrepPackageId ?? undefined,
      listingPrepSummarySnapshot: normalizeMetadata(input.listingPrepSummarySnapshot),
      selectedListingPrepReadySnapshot: normalizeMetadata(input.selectedListingPrepReadySnapshot),
      selectedListingPrepExportVersion: input.selectedListingPrepExportVersion ?? undefined,
      selectedListingPrepApprovalSnapshot: normalizeMetadata(input.selectedListingPrepApprovalSnapshot),
      selectedListingPrepExportContractVersion: input.selectedListingPrepExportContractVersion ?? undefined
    }
  });
}

export async function updateCalculationScenarioRecord(input: {
  organizationId: string;
  scenarioId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.calculationScenario.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.scenarioId
    },
    data: input.data
  });
}

export async function updateCalculationComparisonSetRecord(input: {
  organizationId: string;
  comparisonSetId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.calculationComparisonSet.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.comparisonSetId
    },
    data: input.data
  });
}

export async function createComparisonSetScenarioRecord(input: {
  organizationId: string;
  comparisonSetId: string;
  calculationScenarioId: string;
  sortOrder?: number | null;
}) {
  return prismaClient.comparisonSetScenario.create({
    data: {
      organizationId: input.organizationId,
      comparisonSetId: input.comparisonSetId,
      calculationScenarioId: input.calculationScenarioId,
      sortOrder: input.sortOrder ?? undefined
    }
  });
}

export async function listCalculationComparisonSetsForOrganization(organizationId: string) {
  return prismaClient.calculationComparisonSet.findMany({
    where: { organizationId },
    include: {
      scenarios: {
        include: {
          calculationScenario: {
            include: {
              amazonFeePreset: true,
              shippingZoneRule: true,
              guardrailProfile: true,
              packagingRule: true,
              shippingRule: true,
              linkedListingPrepPackage: {
                include: {
                  marketplaceMappingTemplate: true,
                  channelMappingPreset: true
                }
              }
            }
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      },
      recommendedScenario: true,
      selectedLaunchScenario: true,
      selectedListingPrepPackage: {
        include: {
          marketplaceMappingTemplate: true,
          channelMappingPreset: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function getCalculationComparisonSetRecord(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  return prismaClient.calculationComparisonSet.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.comparisonSetId
    },
    include: {
      scenarios: {
        include: {
          calculationScenario: {
            include: {
              amazonFeePreset: true,
              shippingZoneRule: true,
              guardrailProfile: true,
              packagingRule: true,
              shippingRule: true,
              linkedListingPrepPackage: {
                include: {
                  marketplaceMappingTemplate: true,
                  channelMappingPreset: true
                }
              }
            }
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      },
      recommendedScenario: true,
      selectedLaunchScenario: true,
      selectedListingPrepPackage: {
        include: {
          marketplaceMappingTemplate: true,
          channelMappingPreset: true
        }
      }
    }
  });
}

export async function createListingPrepPackageRecord(input: {
  organizationId: string;
  comparisonSetId?: string | null;
  calculationScenarioId: string;
  name: string;
  status?: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "BLOCKED" | "ARCHIVED";
  listingReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED";
  exportSnapshot: unknown;
  marketplaceFieldSnapshot: unknown;
  validationSnapshot: unknown;
  warningSnapshot?: unknown;
  overrideSnapshot?: unknown;
  marketplaceMappingTemplateId?: string | null;
  channelMappingPresetId?: string | null;
  approvalState?: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
  approvalSummarySnapshot?: unknown;
  exportVersion?: string | null;
  exportContractVersion?: string | null;
  exportShapeSnapshot?: unknown;
  overrideHistorySnapshot?: unknown;
  readyForListingPrep?: boolean;
  readyForListingPrepSummary?: unknown;
  manualAmazonExportSnapshot?: unknown;
  approvalHistorySnapshot?: unknown;
  autoAppliedChannelPreset?: boolean;
  channelPresetSelectionSummary?: unknown;
  manualListingWorksheetSnapshot?: unknown;
  worksheetVersion?: string | null;
  worksheetSummarySnapshot?: unknown;
  currentApprovedArtifact?: boolean;
  notes?: string | null;
  approvedAt?: Date | null;
  approvedByMembershipId?: string | null;
}) {
  return prismaClient.listingPrepPackage.create({
    data: {
      organizationId: input.organizationId,
      comparisonSetId: input.comparisonSetId ?? undefined,
      calculationScenarioId: input.calculationScenarioId,
      name: input.name,
      status: input.status ?? "DRAFT",
      listingReadinessStatus: input.listingReadinessStatus,
      exportSnapshot: normalizeMetadata(input.exportSnapshot),
      marketplaceFieldSnapshot: normalizeMetadata(input.marketplaceFieldSnapshot),
      validationSnapshot: normalizeMetadata(input.validationSnapshot),
      warningSnapshot: normalizeMetadata(input.warningSnapshot),
      overrideSnapshot: normalizeMetadata(input.overrideSnapshot),
      marketplaceMappingTemplateId: input.marketplaceMappingTemplateId ?? undefined,
      channelMappingPresetId: input.channelMappingPresetId ?? undefined,
      approvalState: input.approvalState ?? "DRAFT",
      approvalSummarySnapshot: normalizeMetadata(input.approvalSummarySnapshot),
      exportVersion: input.exportVersion ?? undefined,
      exportContractVersion: input.exportContractVersion ?? undefined,
      exportShapeSnapshot: normalizeMetadata(input.exportShapeSnapshot),
      overrideHistorySnapshot: normalizeMetadata(input.overrideHistorySnapshot),
      readyForListingPrep: input.readyForListingPrep ?? false,
      readyForListingPrepSummary: normalizeMetadata(input.readyForListingPrepSummary),
      manualAmazonExportSnapshot: normalizeMetadata(input.manualAmazonExportSnapshot),
      approvalHistorySnapshot: normalizeMetadata(input.approvalHistorySnapshot),
      autoAppliedChannelPreset: input.autoAppliedChannelPreset ?? false,
      channelPresetSelectionSummary: normalizeMetadata(input.channelPresetSelectionSummary),
      manualListingWorksheetSnapshot: normalizeMetadata(input.manualListingWorksheetSnapshot),
      worksheetVersion: input.worksheetVersion ?? undefined,
      worksheetSummarySnapshot: normalizeMetadata(input.worksheetSummarySnapshot),
      currentApprovedArtifact: input.currentApprovedArtifact ?? false,
      notes: input.notes ?? null,
      approvedAt: input.approvedAt ?? null,
      approvedByMembershipId: input.approvedByMembershipId ?? null
    }
  });
}

export async function updateListingPrepPackageRecord(input: {
  organizationId: string;
  listingPrepPackageId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.listingPrepPackage.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.listingPrepPackageId
    },
    data: input.data
  });
}

export async function clearCurrentApprovedArtifactsForScope(input: {
  organizationId: string;
  comparisonSetId?: string | null;
  calculationScenarioId?: string | null;
  exceptListingPrepPackageId?: string | null;
}) {
  const scopeFilters = [];
  if (input.comparisonSetId) {
    scopeFilters.push({ comparisonSetId: input.comparisonSetId });
  }
  if (input.calculationScenarioId) {
    scopeFilters.push({ calculationScenarioId: input.calculationScenarioId });
  }

  return prismaClient.listingPrepPackage.updateMany({
    where: {
      organizationId: input.organizationId,
      currentApprovedArtifact: true,
      ...(scopeFilters.length ? { OR: scopeFilters } : {}),
      ...(input.exceptListingPrepPackageId
        ? { id: { not: input.exceptListingPrepPackageId } }
        : {})
    },
    data: {
      currentApprovedArtifact: false
    }
  });
}

export async function listListingPrepPackagesForOrganization(input: {
  organizationId: string;
  status?: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
}) {
  return prismaClient.listingPrepPackage.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.status ? { status: input.status } : {})
    },
    include: {
      calculationScenario: true,
      comparisonSet: true,
      marketplaceMappingTemplate: true,
      channelMappingPreset: true
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  });
}

export async function getListingPrepPackageRecord(input: {
  organizationId: string;
  listingPrepPackageId: string;
}) {
  return prismaClient.listingPrepPackage.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.listingPrepPackageId
    },
    include: {
      calculationScenario: {
        include: {
          amazonFeePreset: true,
          shippingZoneRule: true,
          packagingRule: true,
          shippingRule: true,
          guardrailProfile: true
        }
      },
      comparisonSet: true,
      marketplaceMappingTemplate: true,
      channelMappingPreset: true
    }
  });
}

export async function createMarketplaceMappingTemplateRecord(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  productLabelFormat?: string | null;
  skuFormat?: string | null;
  includeWarningNotes?: boolean;
  includeOverrideNotes?: boolean;
  dimensionsFormat?: string | null;
  materialFormat?: string | null;
  packagingFormat?: string | null;
  pricingFormat?: string | null;
  notes?: string | null;
  templateSnapshot?: unknown;
}) {
  return prismaClient.marketplaceMappingTemplate.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId ?? undefined,
      name: input.name,
      status: input.status ?? "ACTIVE",
      productLabelFormat: input.productLabelFormat ?? null,
      skuFormat: input.skuFormat ?? null,
      includeWarningNotes: input.includeWarningNotes ?? true,
      includeOverrideNotes: input.includeOverrideNotes ?? true,
      dimensionsFormat: input.dimensionsFormat ?? null,
      materialFormat: input.materialFormat ?? null,
      packagingFormat: input.packagingFormat ?? null,
      pricingFormat: input.pricingFormat ?? null,
      notes: input.notes ?? null,
      templateSnapshot: normalizeMetadata(input.templateSnapshot)
    }
  });
}

export async function createChannelMappingPresetRecord(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  channelCode?: "AMAZON_MANUAL";
  status?: "ACTIVE" | "ARCHIVED";
  productLabelFormat?: string | null;
  skuFormat?: string | null;
  includeWarningNotes?: boolean;
  includeOverrideNotes?: boolean;
  dimensionsFormat?: string | null;
  materialFormat?: string | null;
  packagingFormat?: string | null;
  pricingFormat?: string | null;
  fieldOrderingSnapshot?: unknown;
  defaultForChannel?: boolean;
  defaultLaunchStrategies?: unknown;
  launchContextSnapshot?: unknown;
  priority?: number | null;
  autoApplyEnabled?: boolean;
  notes?: string | null;
  presetSnapshot?: unknown;
}) {
  return prismaClient.channelMappingPreset.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId ?? undefined,
      name: input.name,
      channelCode: input.channelCode ?? "AMAZON_MANUAL",
      status: input.status ?? "ACTIVE",
      productLabelFormat: input.productLabelFormat ?? null,
      skuFormat: input.skuFormat ?? null,
      includeWarningNotes: input.includeWarningNotes ?? true,
      includeOverrideNotes: input.includeOverrideNotes ?? true,
      dimensionsFormat: input.dimensionsFormat ?? null,
      materialFormat: input.materialFormat ?? null,
      packagingFormat: input.packagingFormat ?? null,
      pricingFormat: input.pricingFormat ?? null,
      fieldOrderingSnapshot: normalizeMetadata(input.fieldOrderingSnapshot),
      defaultForChannel: input.defaultForChannel ?? false,
      defaultLaunchStrategies: normalizeMetadata(input.defaultLaunchStrategies),
      launchContextSnapshot: normalizeMetadata(input.launchContextSnapshot),
      priority: input.priority ?? undefined,
      autoApplyEnabled: input.autoApplyEnabled ?? false,
      notes: input.notes ?? null,
      presetSnapshot: normalizeMetadata(input.presetSnapshot)
    }
  });
}

export async function listMarketplaceMappingTemplatesForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.marketplaceMappingTemplate.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { OR: [{ costProfileId: input.costProfileId }, { costProfileId: null }] } : {})
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
  });
}

export async function listChannelMappingPresetsForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.channelMappingPreset.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { OR: [{ costProfileId: input.costProfileId }, { costProfileId: null }] } : {})
    },
    orderBy: [{ status: "asc" }, { channelCode: "asc" }, { defaultForChannel: "desc" }, { priority: "desc" }, { name: "asc" }, { id: "asc" }]
  });
}

export async function getMarketplaceMappingTemplateRecord(input: {
  organizationId: string;
  mappingTemplateId: string;
}) {
  return prismaClient.marketplaceMappingTemplate.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.mappingTemplateId
    }
  });
}

export async function getChannelMappingPresetRecord(input: {
  organizationId: string;
  channelMappingPresetId: string;
}) {
  return prismaClient.channelMappingPreset.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.channelMappingPresetId
    }
  });
}

export async function updateMarketplaceMappingTemplateRecord(input: {
  organizationId: string;
  mappingTemplateId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.marketplaceMappingTemplate.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.mappingTemplateId
    },
    data: input.data
  });
}

export async function updateChannelMappingPresetRecord(input: {
  organizationId: string;
  channelMappingPresetId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.channelMappingPreset.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.channelMappingPresetId
    },
    data: input.data
  });
}

export async function createLaunchTemplateRecord(input: {
  organizationId: string;
  costProfileId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  defaultAmazonFeePresetId?: string | null;
  defaultShippingZoneRuleId?: string | null;
  defaultPackagingRuleId?: string | null;
  defaultShippingRuleId?: string | null;
  launchStrategy: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN";
  notes?: string | null;
  assumptionsSnapshot?: unknown;
}) {
  return prismaClient.launchTemplate.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId,
      name: input.name,
      status: input.status ?? "ACTIVE",
      defaultAmazonFeePresetId: input.defaultAmazonFeePresetId ?? undefined,
      defaultShippingZoneRuleId: input.defaultShippingZoneRuleId ?? undefined,
      defaultPackagingRuleId: input.defaultPackagingRuleId ?? undefined,
      defaultShippingRuleId: input.defaultShippingRuleId ?? undefined,
      launchStrategy: input.launchStrategy,
      notes: input.notes ?? null,
      assumptionsSnapshot: normalizeMetadata(input.assumptionsSnapshot)
    }
  });
}

export async function listLaunchTemplatesForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.launchTemplate.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { costProfileId: input.costProfileId } : {})
    },
    include: {
      defaultAmazonFeePreset: true,
      defaultShippingZoneRule: true,
      defaultPackagingRule: true,
      defaultShippingRule: true
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
  });
}

export async function getLaunchTemplateRecord(input: {
  organizationId: string;
  templateId: string;
}) {
  return prismaClient.launchTemplate.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.templateId
    },
    include: {
      defaultAmazonFeePreset: true,
      defaultShippingZoneRule: true,
      defaultPackagingRule: true,
      defaultShippingRule: true
    }
  });
}

export async function updateLaunchTemplateRecord(input: {
  organizationId: string;
  templateId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.launchTemplate.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.templateId
    },
    data: input.data
  });
}

export async function createLaunchGuardrailProfileRecord(input: {
  organizationId: string;
  costProfileId?: string | null;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  minimumMarginPct: number;
  minimumBufferAboveBreakEvenPct?: number | null;
  maximumFeeBurdenPct?: number | null;
  maximumShippingBurdenPct?: number | null;
  maximumReserveBurdenPct?: number | null;
  maximumAllowedTargetToFloorGapPct?: number | null;
  notes?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.launchGuardrailProfile.create({
    data: {
      organizationId: input.organizationId,
      costProfileId: input.costProfileId ?? undefined,
      name: input.name,
      status: input.status ?? "ACTIVE",
      minimumMarginPct: input.minimumMarginPct,
      minimumBufferAboveBreakEvenPct: input.minimumBufferAboveBreakEvenPct ?? undefined,
      maximumFeeBurdenPct: input.maximumFeeBurdenPct ?? undefined,
      maximumShippingBurdenPct: input.maximumShippingBurdenPct ?? undefined,
      maximumReserveBurdenPct: input.maximumReserveBurdenPct ?? undefined,
      maximumAllowedTargetToFloorGapPct: input.maximumAllowedTargetToFloorGapPct ?? undefined,
      notes: input.notes ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function listLaunchGuardrailProfilesForOrganization(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  return prismaClient.launchGuardrailProfile.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.costProfileId ? { costProfileId: input.costProfileId } : {})
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
  });
}

export async function getLaunchGuardrailProfileRecord(input: {
  organizationId: string;
  guardrailProfileId: string;
}) {
  return prismaClient.launchGuardrailProfile.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.guardrailProfileId
    }
  });
}

export async function updateLaunchGuardrailProfileRecord(input: {
  organizationId: string;
  guardrailProfileId: string;
  data: Record<string, unknown>;
}) {
  return prismaClient.launchGuardrailProfile.updateMany({
    where: {
      organizationId: input.organizationId,
      id: input.guardrailProfileId
    },
    data: input.data
  });
}
