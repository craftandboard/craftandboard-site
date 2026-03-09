import { prisma } from "../../lib/prisma.js";
import { ensureDefaultProfiles, getMaterialProfile } from "../settings/service.js";
import { calculateShelfManufacturingCost } from "./calculator.js";
import { calculateShelfPricing } from "../pricing/calculator.js";
import {
  getPackagingProfileById,
  getPricingPolicyById,
  getProductionAssumptionProfileById,
  getShelfProductById
} from "../pricing/repository.js";
import {
  clearCurrentOrderCostEstimates,
  clearCurrentShelfCostEstimates,
  createCostProfile as createCostProfileRecord,
  createCostScenario,
  createOrderCostEstimate,
  createShelfCostEstimate,
  getCostProfileById,
  getLatestOrderCostEstimate,
  getLatestShelfCostEstimate,
  getSalesOrderByIdForCosting,
  getShelfJobByIdForCosting,
  listActiveCostRates,
  listCostProfiles,
  updateCostProfile as updateCostProfileRecord,
  upsertCostRates as upsertCostRatesRecord
} from "./repository.js";
import type { CostRateKey, CostingEdgeBandPattern, CostScenarioSourceType } from "./contracts.js";

function mapProfile(profile: Awaited<ReturnType<typeof prisma.costProfile.findFirstOrThrow>>) {
  return {
    id: profile.id,
    name: profile.name,
    isDefault: profile.isDefault,
    currency: profile.currency,
    notes: profile.notes ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function mapRate(rate: Awaited<ReturnType<typeof prisma.costRate.findFirstOrThrow>>) {
  return {
    id: rate.id,
    key: rate.key,
    valueDecimal: Number(rate.valueDecimal),
    unit: rate.unit,
    notes: rate.notes ?? undefined,
    effectiveFrom: rate.effectiveFrom.toISOString(),
    effectiveTo: rate.effectiveTo?.toISOString()
  };
}

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function mapPersistedEstimate(estimate: {
  id: string;
  estimateStatus: string;
  warningsJson: unknown;
  inputSnapshotJson: unknown;
  assumptionSnapshotJson: unknown;
  resultJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: estimate.id,
    estimateStatus: estimate.estimateStatus,
    warnings: Array.isArray(estimate.warningsJson) ? estimate.warningsJson : [],
    inputSnapshot: estimate.inputSnapshotJson,
    assumptionSnapshot: estimate.assumptionSnapshotJson,
    result: estimate.resultJson,
    createdAt: estimate.createdAt.toISOString(),
    updatedAt: estimate.updatedAt.toISOString()
  };
}

function parseNormalizedCostInput(
  value: unknown,
  sourceLabel: string
): {
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number;
  quantity: number;
  materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  edgeBandPattern: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
  requiresPackaging: boolean;
} {
  if (!value || typeof value !== "object") {
    throw new Error(`${sourceLabel} is missing normalized cost input.`);
  }

  const input = value as Record<string, unknown>;
  const requiredString = (key: string) => {
    if (typeof input[key] !== "string" || input[key] === "") {
      throw new Error(`${sourceLabel} is missing required field ${key}.`);
    }
    return input[key] as string;
  };
  const requiredNumber = (key: string) => {
    if (typeof input[key] !== "number" || !Number.isFinite(input[key] as number)) {
      throw new Error(`${sourceLabel} is missing required field ${key}.`);
    }
    return input[key] as number;
  };

  return {
    shelfProductId: typeof input.shelfProductId === "string" ? input.shelfProductId : undefined,
    costProfileId: requiredString("costProfileId"),
    productionAssumptionProfileId: requiredString("productionAssumptionProfileId"),
    packagingProfileId: typeof input.packagingProfileId === "string" ? input.packagingProfileId : undefined,
    pricingPolicyId: requiredString("pricingPolicyId"),
    lengthIn: requiredNumber("lengthIn"),
    depthIn: requiredNumber("depthIn"),
    thicknessIn: typeof input.thicknessIn === "number" ? input.thicknessIn : undefined,
    quantity: requiredNumber("quantity"),
    materialType: requiredString("materialType") as any,
    edgeBandPattern: requiredString("edgeBandPattern") as any,
    requiresPackaging: Boolean(input.requiresPackaging)
  };
}

async function buildCanonicalShelfCostResult(input: {
  organizationId: string;
  shelfJobId: string;
  salesOrderId: string;
  salesOrderItemId: string;
  normalizedInput: {
    shelfProductId?: string;
    costProfileId: string;
    productionAssumptionProfileId: string;
    packagingProfileId?: string;
    pricingPolicyId: string;
    lengthIn: number;
    depthIn: number;
    thicknessIn?: number;
    quantity: number;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
    requiresPackaging: boolean;
  };
}) {
  const resolved = await resolveCostCalculationContext(
    {
      costProfileId: input.normalizedInput.costProfileId,
      materialType: input.normalizedInput.materialType
    },
    input.organizationId
  );

  const [productionProfile, pricingPolicy, shelfProduct, packagingProfile] = await Promise.all([
    getProductionAssumptionProfileById(
      input.normalizedInput.productionAssumptionProfileId,
      input.organizationId
    ),
    getPricingPolicyById(input.normalizedInput.pricingPolicyId, input.organizationId),
    input.normalizedInput.shelfProductId
      ? getShelfProductById(input.normalizedInput.shelfProductId, input.organizationId)
      : Promise.resolve(null),
    input.normalizedInput.packagingProfileId
      ? getPackagingProfileById(input.normalizedInput.packagingProfileId, input.organizationId)
      : Promise.resolve(null)
  ]);

  if (!productionProfile) {
    throw new Error("Production assumption profile not found.");
  }
  if (!pricingPolicy) {
    throw new Error("Pricing policy not found.");
  }
  if (input.normalizedInput.shelfProductId && !shelfProduct) {
    throw new Error("Shelf product not found.");
  }
  if (input.normalizedInput.requiresPackaging && !packagingProfile) {
    throw new Error("Packaging profile not found.");
  }

  const resolvedThicknessIn =
    input.normalizedInput.thicknessIn ??
    decimalToNumber((shelfProduct as { defaultThicknessIn?: { toNumber(): number } } | null)?.defaultThicknessIn);

  if (resolvedThicknessIn === null || resolvedThicknessIn === undefined) {
    throw new Error("Thickness is required for canonical shelf costing.");
  }

  const result = calculateShelfPricing({
    normalizedInput: {
      ...input.normalizedInput,
      thicknessIn: resolvedThicknessIn
    },
    product: shelfProduct
      ? {
          id: shelfProduct.id,
          name: shelfProduct.name,
          code: shelfProduct.code
        }
      : undefined,
    costProfile: resolved.profile,
    productionAssumptionProfile: {
      id: productionProfile.id,
      name: productionProfile.name,
      cncLoadMinutesPerRun: Number(productionProfile.cncLoadMinutesPerRun),
      cncUnloadMinutesPerRun: Number(productionProfile.cncUnloadMinutesPerRun),
      cncRunMinutesPerUnit: Number(productionProfile.cncRunMinutesPerUnit),
      edgebanderSetupMinutesPerRun: Number(productionProfile.edgebanderSetupMinutesPerRun),
      edgebanderRunMinutesPerLinearFt: Number(productionProfile.edgebanderRunMinutesPerLinearFt),
      handlingMinutesPerUnit: Number(productionProfile.handlingMinutesPerUnit),
      packagingMinutesPerUnit: Number(productionProfile.packagingMinutesPerUnit),
      qcMinutesPerUnit: productionProfile.qcMinutesPerUnit ? Number(productionProfile.qcMinutesPerUnit) : 0
    },
    packagingProfile: packagingProfile
      ? {
          id: packagingProfile.id,
          name: packagingProfile.name,
          boxCostCentsPerUnit: packagingProfile.boxCostCentsPerUnit,
          bubbleWrapCostCentsPerUnit: packagingProfile.bubbleWrapCostCentsPerUnit,
          shrinkWrapCostCentsPerUnit: packagingProfile.shrinkWrapCostCentsPerUnit,
          tapeCostCentsPerUnit: packagingProfile.tapeCostCentsPerUnit,
          labelCostCentsPerUnit: packagingProfile.labelCostCentsPerUnit,
          insertFlyerCostCentsPerUnit: packagingProfile.insertFlyerCostCentsPerUnit,
          otherPackagingCostCentsPerUnit: packagingProfile.otherPackagingCostCentsPerUnit
        }
      : undefined,
    pricingPolicy: {
      id: pricingPolicy.id,
      name: pricingPolicy.name,
      manufacturingMarkupPercent: Number(pricingPolicy.manufacturingMarkupPercent),
      minimumChargeCentsPerUnit: pricingPolicy.minimumChargeCentsPerUnit ?? undefined,
      minimumRunChargeCents: pricingPolicy.minimumRunChargeCents ?? undefined,
      roundingMode: pricingPolicy.roundingMode as any,
      roundToCents: pricingPolicy.roundToCents ?? undefined
    },
    materialProfile: resolved.materialProfile,
    baseRates: resolved.rates
  });

  return {
    shelfJobId: input.shelfJobId,
    salesOrderId: input.salesOrderId,
    salesOrderItemId: input.salesOrderItemId,
    quantity: result.normalizedInput.quantity,
    materialCostCents: result.costBreakdown.material.subtotalCents,
    edgeBandCostCents: result.costBreakdown.edgeBand.subtotalCents,
    consumablesCostCents: result.costBreakdown.glueConsumables.subtotalCents,
    machineCostCents: result.costBreakdown.machine.subtotalCents,
    laborCostCents: result.costBreakdown.labor.subtotalCents,
    packagingCostCents: result.costBreakdown.packaging.subtotalCents,
    shippingCostCents: result.costBreakdown.shippingAllowance.subtotalCents,
    overheadCostCents: result.costBreakdown.overheadAmountCents,
    growthReserveCostCents: result.costBreakdown.growthMarginAmountCents,
    totalEstimatedCostCents: result.costBreakdown.recommendedSellPriceCents,
    targetChargeCents: result.pricingBreakdown.finalRunChargeCents,
    estimateStatus: (result.warnings.length > 0 ? "PARTIAL" : "COMPLETE") as "COMPLETE" | "PARTIAL",
    warnings: result.warnings,
    costBreakdown: result.costBreakdown,
    pricingBreakdown: result.pricingBreakdown,
    geometry: result.geometry,
    assumptionsUsed: result.assumptionsUsed,
    profilesUsed: {
      costProfile: result.costProfile,
      productionAssumptionProfile: result.productionAssumptionProfile,
      packagingProfile: result.packagingProfile,
      pricingPolicy: result.pricingPolicy
    },
    calculatedAt: result.calculatedAt
  };
}

export function latestRatesByKey(
  rates: Array<Awaited<ReturnType<typeof prisma.costRate.findFirstOrThrow>>>
) {
  const map = new Map<string, { value: number; unit: string; effectiveFrom: string }>();
  for (const rate of rates) {
    if (!map.has(rate.key)) {
      map.set(rate.key, {
        value: Number(rate.valueDecimal),
        unit: rate.unit,
        effectiveFrom: rate.effectiveFrom.toISOString()
      });
    }
  }
  return map;
}

export async function ensureCostProfileOwnership(costProfileId: string, organizationId: string) {
  const profile = await getCostProfileById(costProfileId, organizationId);
  if (!profile) {
    throw new Error("Cost profile not found.");
  }
  return profile;
}

export async function getCostProfiles(organizationId: string) {
  await ensureDefaultProfiles();
  const profiles = await listCostProfiles(organizationId);
  return {
    ok: true as const,
    profiles: profiles.map(mapProfile)
  };
}

export async function createCostProfile(
  input: {
    name: string;
    isDefault?: boolean;
    currency: "USD";
    notes?: string;
  },
  organizationId: string
) {
  const profile = await createCostProfileRecord({
    organizationId,
    ...input
  });
  return {
    ok: true as const,
    profile: mapProfile(profile)
  };
}

export async function updateCostProfile(
  costProfileId: string,
  input: {
    name?: string;
    isDefault?: boolean;
    currency?: "USD";
    notes?: string;
  },
  organizationId: string
) {
  const profile = await updateCostProfileRecord(costProfileId, {
    organizationId,
    ...input
  });
  return {
    ok: true as const,
    profile: mapProfile(profile)
  };
}

export async function getCostProfileRates(costProfileId: string, organizationId: string) {
  await ensureDefaultProfiles();
  await ensureCostProfileOwnership(costProfileId, organizationId);
  const rates = await listActiveCostRates(costProfileId, organizationId, new Date());
  return {
    ok: true as const,
    rates: rates.map(mapRate)
  };
}

export async function upsertCostRates(
  costProfileId: string,
  input: {
    rates: Array<{
      key: CostRateKey;
      valueDecimal: number;
      unit: string;
      notes?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }>;
  },
  organizationId: string
) {
  const rates = await upsertCostRatesRecord(costProfileId, {
    organizationId,
    rates: input.rates
  });
  return {
    ok: true as const,
    rates: rates.map(mapRate)
  };
}

export async function calculateCost(
  input: {
    costProfileId: string;
    lengthIn: number;
    depthIn: number;
    thicknessIn?: number;
    quantity: number;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern: CostingEdgeBandPattern;
    requiresPackaging: boolean;
    shippingClass?: string;
  },
  organizationId: string
) {
  const profile = await ensureCostProfileOwnership(input.costProfileId, organizationId);
  const rates = await listActiveCostRates(input.costProfileId, organizationId, new Date());
  const materialProfile = await getMaterialProfile(input.materialType, organizationId).catch(() => null);

  return {
    ok: true as const,
    result: calculateShelfManufacturingCost({
      profile: {
        id: profile.id,
        name: profile.name,
        currency: profile.currency,
        isDefault: profile.isDefault
      },
      materialProfile: materialProfile
        ? {
            sheetWidthIn: Number(materialProfile.sheetWidthIn),
            sheetDepthIn: Number(materialProfile.sheetDepthIn)
          }
        : undefined,
      rates: latestRatesByKey(rates),
      ...input
    })
  };
}

export async function resolveCostCalculationContext(
  input: {
    costProfileId: string;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  },
  organizationId: string
) {
  const profile = await ensureCostProfileOwnership(input.costProfileId, organizationId);
  const rates = await listActiveCostRates(input.costProfileId, organizationId, new Date());
  const materialProfile = await getMaterialProfile(input.materialType, organizationId).catch(() => null);

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      currency: profile.currency,
      isDefault: profile.isDefault
    },
    materialProfile: materialProfile
      ? {
          sheetWidthIn: Number(materialProfile.sheetWidthIn),
          sheetDepthIn: Number(materialProfile.sheetDepthIn)
        }
      : undefined,
    rates: latestRatesByKey(rates)
  };
}

export async function createCostScenarioSnapshot(
  input: {
    name?: string;
    sourceType: CostScenarioSourceType;
    sourceId?: string;
    input: {
      costProfileId: string;
      lengthIn: number;
      depthIn: number;
      thicknessIn?: number;
      quantity: number;
      materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
      edgeBandPattern: CostingEdgeBandPattern;
      requiresPackaging: boolean;
      shippingClass?: string;
    };
    createdByUserId?: string;
  },
  organizationId: string
) {
  const result = await calculateCost(input.input, organizationId);
  const scenario = await createCostScenario({
    organizationId,
    costProfileId: input.input.costProfileId,
    name: input.name,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    inputJson: input.input,
    resultJson: result.result,
    createdByUserId: input.createdByUserId
  });

  return {
    ok: true as const,
    scenario: {
      id: scenario.id,
      name: scenario.name ?? undefined,
      sourceType: scenario.sourceType,
      sourceId: scenario.sourceId ?? undefined,
      createdAt: scenario.createdAt.toISOString()
    },
    result: result.result
  };
}

export async function recomputeShelfJobCostEstimate(
  shelfJobId: string,
  organizationId: string,
  createdByUserId?: string
) {
  await ensureDefaultProfiles();
  const shelfJob = await getShelfJobByIdForCosting(shelfJobId, organizationId);
  if (!shelfJob) {
    throw new Error("Shelf job not found.");
  }

  const normalizedInput = parseNormalizedCostInput(
    shelfJob.normalizedSpecJson,
    `Shelf job ${shelfJob.id}`
  );

  const estimateResult = await buildCanonicalShelfCostResult({
    organizationId,
    shelfJobId: shelfJob.id,
    salesOrderId: shelfJob.salesOrderId,
    salesOrderItemId: shelfJob.salesOrderItemId,
    normalizedInput
  });

  await clearCurrentShelfCostEstimates(shelfJob.id, organizationId);

  const estimate = await createShelfCostEstimate({
    organizationId,
    shelfJobId: shelfJob.id,
    salesOrderId: shelfJob.salesOrderId,
    salesOrderItemId: shelfJob.salesOrderItemId,
    costProfileId: normalizedInput.costProfileId,
    productionAssumptionProfileId: normalizedInput.productionAssumptionProfileId,
    packagingProfileId: normalizedInput.packagingProfileId,
    pricingPolicyId: normalizedInput.pricingPolicyId,
    estimateStatus: estimateResult.estimateStatus,
    warningsJson: estimateResult.warnings,
    inputSnapshotJson: normalizedInput,
    assumptionSnapshotJson: {
      profilesUsed: estimateResult.profilesUsed,
      assumptionsUsed: estimateResult.assumptionsUsed
    },
    resultJson: estimateResult,
    createdByUserId
  });

  return {
    ok: true as const,
    estimate: mapPersistedEstimate(estimate)
  };
}

export async function getShelfJobCostEstimate(
  shelfJobId: string,
  organizationId: string
) {
  const estimate = await getLatestShelfCostEstimate(shelfJobId, organizationId);
  if (!estimate) {
    throw new Error("Shelf job cost estimate not found.");
  }

  return {
    ok: true as const,
    estimate: mapPersistedEstimate(estimate)
  };
}

export async function recomputeSalesOrderCostEstimate(
  salesOrderId: string,
  organizationId: string,
  createdByUserId?: string
) {
  await ensureDefaultProfiles();
  const salesOrder = await getSalesOrderByIdForCosting(salesOrderId, organizationId);
  if (!salesOrder) {
    throw new Error("Sales order not found.");
  }

  type CanonicalShelfCostResult = Awaited<ReturnType<typeof buildCanonicalShelfCostResult>>;
  const lineResults: CanonicalShelfCostResult[] = [];
  const warnings: string[] = [];
  const assumptionSnapshots: Array<unknown> = [];
  let estimateStatus: "COMPLETE" | "PARTIAL" | "ERROR" = "COMPLETE";

  for (const shelfJob of salesOrder.shelfJobs) {
    try {
      const normalizedInput = parseNormalizedCostInput(
        shelfJob.normalizedSpecJson,
        `Shelf job ${shelfJob.id}`
      );
      const line = await buildCanonicalShelfCostResult({
        organizationId,
        shelfJobId: shelfJob.id,
        salesOrderId: shelfJob.salesOrderId,
        salesOrderItemId: shelfJob.salesOrderItemId,
        normalizedInput
      });
      lineResults.push(line);
      assumptionSnapshots.push({
        shelfJobId: shelfJob.id,
        profilesUsed: line.profilesUsed,
        assumptionsUsed: line.assumptionsUsed
      });
      warnings.push(...line.warnings.map((warning) => `ShelfJob ${shelfJob.id}: ${warning}`));
      if (line.estimateStatus === "PARTIAL") {
        estimateStatus = "PARTIAL";
      }
    } catch (error) {
      estimateStatus = lineResults.length > 0 ? "PARTIAL" : "ERROR";
      warnings.push(
        error instanceof Error ? `ShelfJob ${shelfJob.id}: ${error.message}` : `ShelfJob ${shelfJob.id}: unknown costing error`
      );
    }
  }

  if (lineResults.length === 0) {
    throw new Error("Sales order has no costable shelf jobs.");
  }

  const totals = lineResults.reduce<{
    materialCostCents: number;
    edgeBandCostCents: number;
    consumablesCostCents: number;
    machineCostCents: number;
    laborCostCents: number;
    packagingCostCents: number;
    shippingCostCents: number;
    overheadCostCents: number;
    growthReserveCostCents: number;
    totalEstimatedCostCents: number;
    targetChargeCents: number;
  }>(
    (acc, line) => {
      acc.materialCostCents += line.materialCostCents;
      acc.edgeBandCostCents += line.edgeBandCostCents;
      acc.consumablesCostCents += line.consumablesCostCents;
      acc.machineCostCents += line.machineCostCents;
      acc.laborCostCents += line.laborCostCents;
      acc.packagingCostCents += line.packagingCostCents;
      acc.shippingCostCents += line.shippingCostCents;
      acc.overheadCostCents += line.overheadCostCents;
      acc.growthReserveCostCents += line.growthReserveCostCents;
      acc.totalEstimatedCostCents += line.totalEstimatedCostCents;
      acc.targetChargeCents += line.targetChargeCents;
      return acc;
    },
    {
      materialCostCents: 0,
      edgeBandCostCents: 0,
      consumablesCostCents: 0,
      machineCostCents: 0,
      laborCostCents: 0,
      packagingCostCents: 0,
      shippingCostCents: 0,
      overheadCostCents: 0,
      growthReserveCostCents: 0,
      totalEstimatedCostCents: 0,
      targetChargeCents: 0
    }
  );

  const representativeInput = parseNormalizedCostInput(
    salesOrder.shelfJobs[0]?.normalizedSpecJson,
    `Sales order ${salesOrder.id}`
  );

  await clearCurrentOrderCostEstimates(salesOrder.id, organizationId);
  const estimate = await createOrderCostEstimate({
    organizationId,
    salesOrderId: salesOrder.id,
    costProfileId: representativeInput.costProfileId,
    productionAssumptionProfileId: representativeInput.productionAssumptionProfileId,
    packagingProfileId: representativeInput.packagingProfileId,
    pricingPolicyId: representativeInput.pricingPolicyId,
    estimateStatus,
    warningsJson: warnings,
    inputSnapshotJson: {
      salesOrderId: salesOrder.id,
      lineCount: lineResults.length,
      shelfJobIds: salesOrder.shelfJobs.map((job) => job.id)
    },
    assumptionSnapshotJson: {
      lineAssumptions: assumptionSnapshots
    },
    resultJson: {
      salesOrderId: salesOrder.id,
      lineTotals: lineResults,
      totalEstimatedOrderCostCents: totals.totalEstimatedCostCents,
      totalTargetChargeCents: totals.targetChargeCents,
      totals
    },
    createdByUserId
  });

  return {
    ok: true as const,
    estimate: mapPersistedEstimate(estimate)
  };
}

export async function getSalesOrderCostEstimate(
  salesOrderId: string,
  organizationId: string
) {
  const estimate = await getLatestOrderCostEstimate(salesOrderId, organizationId);
  if (!estimate) {
    throw new Error("Sales order cost estimate not found.");
  }

  return {
    ok: true as const,
    estimate: mapPersistedEstimate(estimate)
  };
}
