import { calculateShelfCost } from "./calculator.js";
import { resolveCostEngineAssumptions } from "./assumptions.js";
import { decimalToNumber } from "./normalization.js";
import {
  createCostProfileRecord,
  createEdgeBandCostRuleRecord,
  createMaterialCostRuleRecord,
  createPackagingCostRuleRecord,
  createShelfCostCalculationRecord,
  createShippingCostRuleRecord,
  getCostProfileRecord,
  getShelfCostCalculationRecord,
  listCostProfilesForOrganization,
  listShelfCostCalculationsForOrganization,
  updateCostProfileRecord,
  updateEdgeBandCostRuleRecord,
  updateMaterialCostRuleRecord,
  updatePackagingCostRuleRecord,
  updateShippingCostRuleRecord
} from "./repository.js";

type AnyRecord = Record<string, unknown>;

function mapRuleDates<T extends { createdAt: Date; updatedAt: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapCostProfile(profile: any) {
  return {
    id: profile.id,
    orgId: profile.organizationId,
    name: profile.name,
    status: profile.status,
    isDefault: profile.isDefault,
    currency: profile.currency,
    defaultMaterialWastePct: decimalToNumber(profile.defaultMaterialWastePct) ?? 0,
    defaultEdgeBandWastePct: decimalToNumber(profile.defaultEdgeBandWastePct) ?? 0,
    defaultLaborRateCentsPerHour: profile.defaultLaborRateCentsPerHour,
    defaultMachineRateCentsPerHour: profile.defaultMachineRateCentsPerHour,
    defaultOverheadRateCentsPerHour: profile.defaultOverheadRateCentsPerHour,
    defaultPackagingAllowanceCents: profile.defaultPackagingAllowanceCents,
    defaultShippingAllowanceCents: profile.defaultShippingAllowanceCents,
    defaultPackingLaborRateCentsPerHour: profile.defaultPackingLaborRateCentsPerHour,
    defaultPackingMinutes: decimalToNumber(profile.defaultPackingMinutes),
    defaultMarketplaceFeePct: decimalToNumber(profile.defaultMarketplaceFeePct),
    defaultReturnReservePct: decimalToNumber(profile.defaultReturnReservePct),
    defaultDamageReservePct: decimalToNumber(profile.defaultDamageReservePct),
    defaultShippingBufferPct: decimalToNumber(profile.defaultShippingBufferPct),
    defaultShippingBufferCents: profile.defaultShippingBufferCents,
    defaultPackagingOverheadCents: profile.defaultPackagingOverheadCents,
    defaultRecommendedMinMarginPct: decimalToNumber(
      profile.defaultRecommendedMinMarginPct
    ),
    defaultRecommendedTargetMarginPct: decimalToNumber(
      profile.defaultRecommendedTargetMarginPct
    ),
    targetMarginPct: decimalToNumber(profile.targetMarginPct),
    growthMarginPct: decimalToNumber(profile.growthMarginPct),
    notes: profile.notes ?? null,
    metadata: profile.metadata ?? null,
    materialRules: (profile.materialCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      sheetLengthIn: decimalToNumber(rule.sheetLengthIn) ?? 0,
      sheetWidthIn: decimalToNumber(rule.sheetWidthIn) ?? 0,
      usableYieldPct: decimalToNumber(rule.usableYieldPct),
      wastePct: decimalToNumber(rule.wastePct)
    })),
    edgeBandRules: (profile.edgeBandCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      wastePct: decimalToNumber(rule.wastePct),
      setupAllowanceLinearFt: decimalToNumber(rule.setupAllowanceLinearFt)
    })),
    packagingRules: (profile.packagingCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      foamCostCents: rule.foamCostCents,
      cornerProtectorCostCents: rule.cornerProtectorCostCents,
      packingMinutes: decimalToNumber(rule.packingMinutes),
      packingLaborOverrideCents: rule.packingLaborOverrideCents,
      packagingOverheadCents: rule.packagingOverheadCents,
      sortOrder: rule.sortOrder
    })),
    shippingRules: (profile.shippingCostRules ?? []).map((rule: any) => ({
      ...mapRuleDates(rule),
      orgId: rule.organizationId,
      costProfileId: rule.costProfileId,
      dimensionalDivisor: decimalToNumber(rule.dimensionalDivisor),
      dimensionalRateCents: rule.dimensionalRateCents,
      shippingBufferPct: decimalToNumber(rule.shippingBufferPct),
      shippingBufferCents: rule.shippingBufferCents,
      marketplaceHandlingCents: rule.marketplaceHandlingCents,
      sortOrder: rule.sortOrder
    })),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function normalizeUpdateData(input: AnyRecord) {
  const data: AnyRecord = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
  return data;
}

function mapCalculation(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    costProfileId: record.costProfileId,
    costProfileName: record.costProfile?.name ?? null,
    name: record.name ?? null,
    sku: record.sku ?? null,
    quantity: record.quantity,
    lengthIn: decimalToNumber(record.lengthIn) ?? 0,
    depthIn: decimalToNumber(record.depthIn) ?? 0,
    thicknessIn: decimalToNumber(record.thicknessIn),
    materialCode: record.materialCode,
    edgeBandCode: record.edgeBandCode ?? null,
    edgeBandPattern: record.edgeBandPattern,
    packagingCode: record.packagingCode ?? null,
    shippingCode: record.shippingCode ?? null,
    laborMinutes: decimalToNumber(record.laborMinutes) ?? 0,
    machineMinutes: decimalToNumber(record.machineMinutes) ?? 0,
    overheadMinutes: decimalToNumber(record.overheadMinutes),
    packingMinutes: decimalToNumber(record.packingMinutes),
    materialCostCents: record.materialCostCents,
    edgeBandCostCents: record.edgeBandCostCents,
    laborCostCents: record.laborCostCents,
    machineCostCents: record.machineCostCents,
    packagingCostCents: record.packagingCostCents,
    packingLaborCostCents: record.packingLaborCostCents,
    shippingCostCents: record.shippingCostCents,
    shippingBufferCostCents: record.shippingBufferCostCents,
    overheadCostCents: record.overheadCostCents,
    marketplaceFeeCostCents: record.marketplaceFeeCostCents,
    returnReserveCostCents: record.returnReserveCostCents,
    damageReserveCostCents: record.damageReserveCostCents,
    subtotalCostCents: record.subtotalCostCents,
    breakEvenPriceCents: record.breakEvenPriceCents,
    recommendedMinSellPriceCents: record.recommendedMinSellPriceCents,
    recommendedTargetSellPriceCents: record.recommendedTargetSellPriceCents,
    targetMarginPct: decimalToNumber(record.targetMarginPct),
    growthMarginPct: decimalToNumber(record.growthMarginPct),
    recommendedInternalPriceCents: record.recommendedInternalPriceCents,
    recommendedSellPriceCents: record.recommendedSellPriceCents,
    assumptionsSnapshot: record.assumptionsSnapshot,
    packagingSnapshot: record.packagingSnapshot,
    shippingSnapshot: record.shippingSnapshot,
    pricingSnapshot: record.pricingSnapshot,
    resultSnapshot: record.resultSnapshot,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function createCostProfile(input: {
  organizationId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  currency?: "USD";
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
  const profile = await createCostProfileRecord(input);
  const hydrated = await getCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: profile.id
  });

  return {
    ok: true,
    profile: mapCostProfile(hydrated)
  };
}

export async function listCostProfiles(input: { organizationId: string }) {
  const profiles = await listCostProfilesForOrganization(input.organizationId);
  return {
    ok: true,
    profiles: profiles.map((profile: any) => ({
      id: profile.id,
      orgId: profile.organizationId,
      name: profile.name,
      status: profile.status,
      isDefault: profile.isDefault,
      currency: profile.currency,
      targetMarginPct: decimalToNumber(profile.targetMarginPct),
      growthMarginPct: decimalToNumber(profile.growthMarginPct),
      updatedAt: profile.updatedAt.toISOString()
    }))
  };
}

export async function getCostProfile(input: { organizationId: string; costProfileId: string }) {
  const profile = await getCostProfileRecord(input);
  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  return {
    ok: true,
    profile: mapCostProfile(profile)
  };
}

export async function updateCostProfile(input: {
  organizationId: string;
  costProfileId: string;
} & AnyRecord) {
  const existing = await getCostProfileRecord(input);
  if (!existing) {
    throw new Error("Cost profile not found.");
  }

  await updateCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, costProfileId: undefined })
  });

  const updated = await getCostProfileRecord(input);
  return {
    ok: true,
    profile: mapCostProfile(updated)
  };
}

export async function createMaterialCostRule(input: {
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
  await createMaterialCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateMaterialCostRule(input: {
  organizationId: string;
  materialRuleId: string;
} & AnyRecord) {
  await updateMaterialCostRuleRecord({
    organizationId: input.organizationId,
    materialRuleId: input.materialRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, materialRuleId: undefined })
  });
  return { ok: true };
}

export async function createEdgeBandCostRule(input: {
  organizationId: string;
  costProfileId: string;
  edgeBandCode: string;
  edgeBandName: string;
  costCentsPerLinearFoot: number;
  wastePct?: number | null;
  setupAllowanceLinearFt?: number | null;
  active?: boolean;
}) {
  await createEdgeBandCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateEdgeBandCostRule(input: {
  organizationId: string;
  edgeBandRuleId: string;
} & AnyRecord) {
  await updateEdgeBandCostRuleRecord({
    organizationId: input.organizationId,
    edgeBandRuleId: input.edgeBandRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, edgeBandRuleId: undefined })
  });
  return { ok: true };
}

export async function createPackagingCostRule(input: {
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
  await createPackagingCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updatePackagingCostRule(input: {
  organizationId: string;
  packagingRuleId: string;
} & AnyRecord) {
  await updatePackagingCostRuleRecord({
    organizationId: input.organizationId,
    packagingRuleId: input.packagingRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, packagingRuleId: undefined })
  });
  return { ok: true };
}

export async function createShippingCostRule(input: {
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
  await createShippingCostRuleRecord(input);
  return getCostProfile({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
}

export async function updateShippingCostRule(input: {
  organizationId: string;
  shippingRuleId: string;
} & AnyRecord) {
  await updateShippingCostRuleRecord({
    organizationId: input.organizationId,
    shippingRuleId: input.shippingRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, shippingRuleId: undefined })
  });
  return { ok: true };
}

export async function calculateShelfCostView(input: {
  organizationId: string;
  costProfileId: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  weightLb?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode?: string | null;
  shippingCode?: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes?: number | null;
  packingMinutes?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
}) {
  const assumptions = await resolveCostEngineAssumptions(input);
  const result = calculateShelfCost(input, assumptions);

  return {
    ok: true,
    calculation: {
      name: input.name ?? null,
      sku: input.sku ?? null,
      quantity: input.quantity,
      lengthIn: input.lengthIn,
      depthIn: input.depthIn,
      thicknessIn: input.thicknessIn ?? null,
      materialCode: input.materialCode,
      edgeBandCode: input.edgeBandCode ?? null,
      edgeBandPattern: input.edgeBandPattern,
      packagingCode: input.packagingCode ?? null,
      shippingCode: input.shippingCode ?? null,
      laborMinutes: input.laborMinutes,
      machineMinutes: input.machineMinutes,
      overheadMinutes: input.overheadMinutes ?? null,
      packingMinutes: input.packingMinutes ?? null,
      ...result.breakdown
    },
    assumptions: {
      profile: assumptions.profile,
      materialRule: assumptions.materialRule,
      edgeBandRule: assumptions.edgeBandRule,
      packagingRule: assumptions.packagingRule,
      shippingRule: assumptions.shippingRule
    },
    result
  };
}

export async function saveShelfCostCalculation(input: {
  organizationId: string;
  costProfileId: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  weightLb?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode?: string | null;
  shippingCode?: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes?: number | null;
  packingMinutes?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
}) {
  const payload = await calculateShelfCostView(input);
  const record = await createShelfCostCalculationRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId,
    name: input.name,
    sku: input.sku,
    quantity: input.quantity,
    lengthIn: input.lengthIn,
    depthIn: input.depthIn,
    thicknessIn: input.thicknessIn,
    materialCode: input.materialCode,
    edgeBandCode: input.edgeBandCode,
    edgeBandPattern: input.edgeBandPattern,
    packagingCode: input.packagingCode,
    shippingCode: input.shippingCode,
    laborMinutes: input.laborMinutes,
    machineMinutes: input.machineMinutes,
    overheadMinutes: input.overheadMinutes,
    packingMinutes: payload.calculation.packingMinutes,
    materialCostCents: payload.calculation.materialCostCents,
    edgeBandCostCents: payload.calculation.edgeBandCostCents,
    laborCostCents: payload.calculation.laborCostCents,
    machineCostCents: payload.calculation.machineCostCents,
    packagingCostCents: payload.calculation.packagingCostCents,
    packingLaborCostCents: payload.calculation.packingLaborCostCents,
    shippingCostCents: payload.calculation.shippingCostCents,
    shippingBufferCostCents: payload.calculation.shippingBufferCostCents,
    overheadCostCents: payload.calculation.overheadCostCents,
    marketplaceFeeCostCents: payload.calculation.marketplaceFeeCostCents,
    returnReserveCostCents: payload.calculation.returnReserveCostCents,
    damageReserveCostCents: payload.calculation.damageReserveCostCents,
    subtotalCostCents: payload.calculation.subtotalCostCents,
    breakEvenPriceCents: payload.calculation.breakEvenPriceCents,
    recommendedMinSellPriceCents: payload.calculation.recommendedMinSellPriceCents,
    recommendedTargetSellPriceCents: payload.calculation.recommendedTargetSellPriceCents,
    targetMarginPct: payload.result.pricing.targetMarginPct,
    growthMarginPct: payload.result.pricing.growthMarginPct,
    recommendedInternalPriceCents: payload.calculation.recommendedInternalPriceCents,
    recommendedSellPriceCents: payload.calculation.recommendedSellPriceCents,
    assumptionsSnapshot: payload.assumptions,
    packagingSnapshot: payload.result.packaging,
    shippingSnapshot: payload.result.shipping,
    pricingSnapshot: payload.result.pricing,
    resultSnapshot: payload.result
  });

  const hydrated = await getShelfCostCalculationRecord({
    organizationId: input.organizationId,
    calculationId: record.id
  });

  return {
    ok: true,
    calculation: mapCalculation(hydrated)
  };
}

export async function listShelfCostCalculations(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const calculations = await listShelfCostCalculationsForOrganization(input);
  return {
    ok: true,
    calculations: calculations.map(mapCalculation)
  };
}

export async function getShelfCostCalculation(input: {
  organizationId: string;
  calculationId: string;
}) {
  const calculation = await getShelfCostCalculationRecord(input);
  if (!calculation) {
    throw new Error("Shelf cost calculation not found.");
  }

  return {
    ok: true,
    calculation: mapCalculation(calculation)
  };
}
