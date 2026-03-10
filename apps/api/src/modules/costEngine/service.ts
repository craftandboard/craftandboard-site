import { calculateShelfCost, compareScenarioResults } from "./calculator.js";
import { resolveCostEngineAssumptions } from "./assumptions.js";
import {
  buildLaunchCandidateHandoff,
  buildScenarioRiskSummary,
  evaluateScenarioGuardrails
} from "./guardrails.js";
import { decimalToNumber } from "./normalization.js";
import {
  createAmazonFeePresetRecord,
  createCalculationComparisonSetRecord,
  createCalculationScenarioRecord,
  createComparisonSetScenarioRecord,
  createCostProfileRecord,
  createEdgeBandCostRuleRecord,
  createLaunchGuardrailProfileRecord,
  createLaunchTemplateRecord,
  createMaterialCostRuleRecord,
  createPackagingCostRuleRecord,
  createShelfCostCalculationRecord,
  createShippingCostRuleRecord,
  createShippingZoneRuleRecord,
  getAmazonFeePresetRecord,
  getCalculationComparisonSetRecord,
  getCostProfileRecord,
  getLaunchGuardrailProfileRecord,
  getLaunchTemplateRecord,
  getShelfCostCalculationRecord,
  getShippingZoneRuleRecord,
  listAmazonFeePresetsForOrganization,
  listCalculationComparisonSetsForOrganization,
  listCostProfilesForOrganization,
  listLaunchGuardrailProfilesForOrganization,
  listLaunchTemplatesForOrganization,
  listShelfCostCalculationsForOrganization,
  listShippingZoneRulesForOrganization,
  updateAmazonFeePresetRecord,
  updateCalculationComparisonSetRecord,
  updateCalculationScenarioRecord,
  updateCostProfileRecord,
  updateEdgeBandCostRuleRecord,
  updateLaunchGuardrailProfileRecord,
  updateLaunchTemplateRecord,
  updateMaterialCostRuleRecord,
  updatePackagingCostRuleRecord,
  updateShippingCostRuleRecord,
  updateShippingZoneRuleRecord
} from "./repository.js";
import { rankComparisonScenarios } from "./ranking.js";
import type { LaunchStrategy } from "./contracts.js";

type AnyRecord = Record<string, unknown>;
type GuardrailedScenario = {
  id: string;
  name: string;
  launchStrategy: LaunchStrategy | null;
  assumptionsSnapshot: Record<string, unknown>;
  result: ReturnType<typeof calculateShelfCost>;
  changedAssumptions: {
    packagingCode: string | null;
    shippingCode: string | null;
    amazonFeePresetId: string | null;
    shippingZoneRuleId: string | null;
    targetMarginPct: number | null;
    growthMarginPct: number | null;
    launchStrategy: LaunchStrategy | null;
  };
  rankingScore: number | null;
  rankingSummary: AnyRecord | null;
  isRecommendedLaunchScenario: boolean;
  deltas: AnyRecord;
  guardrailProfileId?: string | null;
  guardrailProfileName?: string | null;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  guardrailSnapshot?: AnyRecord | null;
  warningSnapshot?: AnyRecord[] | null;
  riskSummary?: string | null;
  handoffSnapshot?: AnyRecord | null;
  isLaunchApprovedCandidate?: boolean;
};

type GuardrailedComparison = {
  name: string | null;
  notes: string | null;
  baseSpec: AnyRecord;
  baselineScenarioId: string;
  ranking: {
    scenarios: Array<{
      scenarioId: string;
      rankingScore: number;
      rankingSummary: AnyRecord;
    }>;
    recommendation: {
      recommendedScenarioId: string;
      recommendedLaunchPriceCents: number;
      recommendedFloorPriceCents: number;
      recommendedSaferMarginPriceCents: number;
      bestLaunchScenarioLabel: string;
      safestMarginScenarioLabel: string;
      mostAggressiveScenarioLabel: string;
      recommendationSummary: string;
      tradeoffSummary: AnyRecord;
    } | null;
  };
  scenarios: GuardrailedScenario[];
};

function mapRuleDates<T extends { createdAt: Date; updatedAt: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapAmazonFeePreset(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    referralFeePct: decimalToNumber(record.referralFeePct) ?? 0,
    advertisingAllowancePct: decimalToNumber(record.advertisingAllowancePct),
    returnReservePct: decimalToNumber(record.returnReservePct),
    damageReservePct: decimalToNumber(record.damageReservePct),
    miscMarketplacePct: decimalToNumber(record.miscMarketplacePct)
  };
}

function mapShippingZoneRule(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    bufferPct: decimalToNumber(record.bufferPct)
  };
}

function mapLaunchTemplate(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId,
    defaultAmazonFeePresetId: record.defaultAmazonFeePresetId ?? null,
    defaultAmazonFeePresetName: record.defaultAmazonFeePreset?.name ?? null,
    defaultShippingZoneRuleId: record.defaultShippingZoneRuleId ?? null,
    defaultShippingZoneRuleName: record.defaultShippingZoneRule?.name ?? null,
    defaultPackagingRuleId: record.defaultPackagingRuleId ?? null,
    defaultPackagingRuleName: record.defaultPackagingRule?.packagingName ?? null,
    defaultShippingRuleId: record.defaultShippingRuleId ?? null,
    defaultShippingRuleName: record.defaultShippingRule?.shippingName ?? null,
    launchStrategy: record.launchStrategy,
    notes: record.notes ?? null,
    assumptionsSnapshot: record.assumptionsSnapshot ?? null
  };
}

function mapLaunchGuardrailProfile(record: any) {
  return {
    ...mapRuleDates(record),
    orgId: record.organizationId,
    costProfileId: record.costProfileId ?? null,
    minimumMarginPct: decimalToNumber(record.minimumMarginPct) ?? 0,
    minimumBufferAboveBreakEvenPct: decimalToNumber(record.minimumBufferAboveBreakEvenPct),
    maximumFeeBurdenPct: decimalToNumber(record.maximumFeeBurdenPct),
    maximumShippingBurdenPct: decimalToNumber(record.maximumShippingBurdenPct),
    maximumReserveBurdenPct: decimalToNumber(record.maximumReserveBurdenPct),
    maximumAllowedTargetToFloorGapPct: decimalToNumber(record.maximumAllowedTargetToFloorGapPct),
    notes: record.notes ?? null,
    metadata: record.metadata ?? null
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
    amazonFeePresets: (profile.amazonFeePresets ?? []).map(mapAmazonFeePreset),
    shippingZoneRules: (profile.shippingZoneRules ?? []).map(mapShippingZoneRule),
    launchTemplates: (profile.launchTemplates ?? []).map(mapLaunchTemplate),
    launchGuardrailProfiles: (profile.launchGuardrailProfiles ?? []).map(mapLaunchGuardrailProfile),
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
    amazonFeePresetId: record.amazonFeePresetId ?? null,
    amazonFeePresetName: record.amazonFeePreset?.name ?? null,
    shippingZoneRuleId: record.shippingZoneRuleId ?? null,
    shippingZoneRuleName: record.shippingZoneRule?.name ?? null,
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
    referralFeeCostCents: record.referralFeeCostCents ?? 0,
    closingFeeCostCents: record.closingFeeCostCents ?? 0,
    fulfillmentFeeCostCents: record.fulfillmentFeeCostCents ?? 0,
    storageAllowanceCostCents: record.storageAllowanceCostCents ?? 0,
    advertisingAllowanceCostCents: record.advertisingAllowanceCostCents ?? 0,
    returnReserveCostCents: record.returnReserveCostCents,
    damageReserveCostCents: record.damageReserveCostCents,
    miscMarketplaceCostCents: record.miscMarketplaceCostCents ?? 0,
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
    amazonFeeSnapshot: record.amazonFeeSnapshot,
    shippingZoneSnapshot: record.shippingZoneSnapshot,
    resultSnapshot: record.resultSnapshot,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapScenario(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    name: record.name,
    costProfileId: record.costProfileId,
    amazonFeePresetId: record.amazonFeePresetId ?? null,
    amazonFeePresetName: record.amazonFeePreset?.name ?? null,
    shippingZoneRuleId: record.shippingZoneRuleId ?? null,
    shippingZoneRuleName: record.shippingZoneRule?.name ?? null,
    packagingRuleId: record.packagingRuleId ?? null,
    packagingRuleName: record.packagingRule?.packagingName ?? null,
    shippingRuleId: record.shippingRuleId ?? null,
    shippingRuleName: record.shippingRule?.shippingName ?? null,
    shelfCostCalculationId: record.shelfCostCalculationId ?? null,
    launchStrategy: record.launchStrategy ?? null,
    guardrailProfileId: record.guardrailProfileId ?? null,
    guardrailProfileName: record.guardrailProfile?.name ?? null,
    rankingScore: decimalToNumber(record.rankingScore),
    rankingSummary: record.rankingSummary ?? null,
    riskScore: decimalToNumber(record.riskScore),
    riskLevel: record.riskLevel ?? null,
    guardrailSnapshot: record.guardrailSnapshot ?? null,
    warningSnapshot: record.warningSnapshot ?? null,
    handoffSnapshot: record.handoffSnapshot ?? null,
    isRecommendedLaunchScenario: Boolean(record.isRecommendedLaunchScenario),
    isLaunchApprovedCandidate: Boolean(record.isLaunchApprovedCandidate),
    assumptionsSnapshot: record.assumptionsSnapshot,
    resultSnapshot: record.resultSnapshot,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapComparisonSet(record: any) {
  return {
    id: record.id,
    orgId: record.organizationId,
    name: record.name,
    notes: record.notes ?? null,
    baseShelfSpecSnapshot: record.baseShelfSpecSnapshot,
    recommendedScenarioId: record.recommendedScenarioId ?? null,
    recommendedScenarioName: record.recommendedScenario?.name ?? null,
    selectedLaunchScenarioId: record.selectedLaunchScenarioId ?? null,
    selectedLaunchScenarioName: record.selectedLaunchScenario?.name ?? null,
    rankingSnapshot: record.rankingSnapshot ?? null,
    comparisonSummary: record.comparisonSummary ?? null,
    selectedLaunchSummary: record.selectedLaunchSummary ?? null,
    riskSummary: record.riskSummary ?? null,
    scenarios: (record.scenarios ?? []).map((entry: any) => ({
      id: entry.id,
      sortOrder: entry.sortOrder ?? null,
      createdAt: entry.createdAt.toISOString(),
      scenario: mapScenario(entry.calculationScenario)
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function getScenarioRiskSummaryText(snapshot: unknown) {
  const guardrailSnapshot = snapshot as Record<string, unknown> | null;
  if (guardrailSnapshot && typeof guardrailSnapshot.summary === "string") {
    return String(guardrailSnapshot.summary);
  }
  return null;
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

  return { ok: true, profile: mapCostProfile(hydrated) };
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

  return { ok: true, profile: mapCostProfile(profile) };
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
  return { ok: true, profile: mapCostProfile(updated) };
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

export async function createAmazonFeePreset(input: {
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
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }

  const preset = await createAmazonFeePresetRecord(input);
  const hydrated = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: preset.id
  });
  return { ok: true, preset: mapAmazonFeePreset(hydrated) };
}

export async function listAmazonFeePresets(input: { organizationId: string; costProfileId?: string }) {
  const presets = await listAmazonFeePresetsForOrganization(input);
  return { ok: true, presets: presets.map(mapAmazonFeePreset) };
}

export async function getAmazonFeePreset(input: { organizationId: string; presetId: string }) {
  const preset = await getAmazonFeePresetRecord(input);
  if (!preset) {
    throw new Error("Amazon fee preset not found.");
  }
  return { ok: true, preset: mapAmazonFeePreset(preset) };
}

export async function updateAmazonFeePreset(input: {
  organizationId: string;
  presetId: string;
} & AnyRecord) {
  const existing = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId
  });
  if (!existing) {
    throw new Error("Amazon fee preset not found.");
  }

  await updateAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, presetId: undefined })
  });

  const updated = await getAmazonFeePresetRecord({
    organizationId: input.organizationId,
    presetId: input.presetId
  });
  return { ok: true, preset: mapAmazonFeePreset(updated) };
}

export async function createShippingZoneRule(input: {
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
  const costProfileId = input.costProfileId ?? null;
  if (costProfileId) {
    const profile = await getCostProfileRecord({ organizationId: input.organizationId, costProfileId });
    if (!profile) {
      throw new Error("Cost profile not found.");
    }
  }

  const rule = await createShippingZoneRuleRecord(input);
  const hydrated = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: rule.id
  });
  return { ok: true, shippingZoneRule: mapShippingZoneRule(hydrated) };
}

export async function listShippingZoneRules(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const rules = await listShippingZoneRulesForOrganization(input);
  return { ok: true, shippingZoneRules: rules.map(mapShippingZoneRule) };
}

export async function getShippingZoneRule(input: { organizationId: string; zoneRuleId: string }) {
  const rule = await getShippingZoneRuleRecord(input);
  if (!rule) {
    throw new Error("Shipping zone rule not found.");
  }
  return { ok: true, shippingZoneRule: mapShippingZoneRule(rule) };
}

export async function updateShippingZoneRule(input: {
  organizationId: string;
  zoneRuleId: string;
} & AnyRecord) {
  const existing = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId
  });
  if (!existing) {
    throw new Error("Shipping zone rule not found.");
  }

  await updateShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, zoneRuleId: undefined })
  });

  const updated = await getShippingZoneRuleRecord({
    organizationId: input.organizationId,
    zoneRuleId: input.zoneRuleId
  });
  return { ok: true, shippingZoneRule: mapShippingZoneRule(updated) };
}

export async function createLaunchTemplate(input: {
  organizationId: string;
  costProfileId: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  defaultAmazonFeePresetId?: string | null;
  defaultShippingZoneRuleId?: string | null;
  defaultPackagingRuleId?: string | null;
  defaultShippingRuleId?: string | null;
  launchStrategy: LaunchStrategy;
  notes?: string | null;
  assumptionsSnapshot?: unknown;
}) {
  const profile = await getCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });
  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  const template = await createLaunchTemplateRecord(input);
  const hydrated = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: template.id
  });
  return { ok: true, launchTemplate: mapLaunchTemplate(hydrated) };
}

export async function listLaunchTemplates(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const templates = await listLaunchTemplatesForOrganization(input);
  return { ok: true, launchTemplates: templates.map(mapLaunchTemplate) };
}

export async function getLaunchTemplate(input: {
  organizationId: string;
  templateId: string;
}) {
  const template = await getLaunchTemplateRecord(input);
  if (!template) {
    throw new Error("Launch template not found.");
  }

  return { ok: true, launchTemplate: mapLaunchTemplate(template) };
}

export async function updateLaunchTemplate(input: {
  organizationId: string;
  templateId: string;
} & AnyRecord) {
  const existing = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId
  });
  if (!existing) {
    throw new Error("Launch template not found.");
  }

  await updateLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId,
    data: normalizeUpdateData({ ...input, organizationId: undefined, templateId: undefined })
  });

  const updated = await getLaunchTemplateRecord({
    organizationId: input.organizationId,
    templateId: input.templateId
  });
  return { ok: true, launchTemplate: mapLaunchTemplate(updated) };
}

export async function createLaunchGuardrailProfile(input: {
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
  const record = await createLaunchGuardrailProfileRecord(input);
  const hydrated = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: record.id
  });

  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(hydrated) };
}

export async function listLaunchGuardrailProfiles(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const records = await listLaunchGuardrailProfilesForOrganization(input);
  return { ok: true, launchGuardrailProfiles: records.map(mapLaunchGuardrailProfile) };
}

export async function getLaunchGuardrailProfile(input: {
  organizationId: string;
  guardrailProfileId: string;
}) {
  const record = await getLaunchGuardrailProfileRecord(input);
  if (!record) {
    throw new Error("Launch guardrail profile not found.");
  }

  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(record) };
}

export async function updateLaunchGuardrailProfile(input: {
  organizationId: string;
  guardrailProfileId: string;
} & AnyRecord) {
  const existing = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId
  });
  if (!existing) {
    throw new Error("Launch guardrail profile not found.");
  }

  await updateLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId,
    data: normalizeUpdateData({
      ...input,
      organizationId: undefined,
      guardrailProfileId: undefined
    })
  });

  const updated = await getLaunchGuardrailProfileRecord({
    organizationId: input.organizationId,
    guardrailProfileId: input.guardrailProfileId
  });
  return { ok: true, launchGuardrailProfile: mapLaunchGuardrailProfile(updated) };
}

function applyGuardrailsToComparison(params: {
  comparison: GuardrailedComparison;
  guardrailProfile: ReturnType<typeof mapLaunchGuardrailProfile>;
  selectedScenarioId?: string | null;
}) {
  const targetPrices = params.comparison.scenarios.map((scenario) => (
    scenario.result.breakdown.recommendedTargetSellPriceCents
  ));
  const comparisonContext = {
    lowestTargetSellPriceCents: Math.min(...targetPrices),
    highestTargetSellPriceCents: Math.max(...targetPrices),
    recommendedScenarioId: params.comparison.ranking?.recommendation?.recommendedScenarioId ?? null
  };

  const scenarios: GuardrailedScenario[] = params.comparison.scenarios.map((scenario: GuardrailedScenario) => {
    const evaluation = evaluateScenarioGuardrails({
      scenario: {
        id: scenario.id,
        name: scenario.name,
        launchStrategy: scenario.launchStrategy ?? null,
        assumptionsSnapshot: scenario.assumptionsSnapshot,
        result: scenario.result
      },
      guardrailProfile: params.guardrailProfile,
      comparisonContext
    });

    return {
      ...scenario,
      guardrailProfileId: params.guardrailProfile.id,
      guardrailProfileName: params.guardrailProfile.name,
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      guardrailSnapshot: evaluation.guardrailSnapshot,
      warningSnapshot: evaluation.warnings,
      riskSummary: evaluation.summary,
      handoffSnapshot: null,
      isLaunchApprovedCandidate:
        evaluation.riskLevel !== "HIGH" &&
        (params.selectedScenarioId ? params.selectedScenarioId === scenario.id : scenario.isRecommendedLaunchScenario)
    };
  });

  const selectedScenarioId =
    params.selectedScenarioId ??
    scenarios.find((scenario) => scenario.isLaunchApprovedCandidate)?.id ??
    params.comparison.ranking?.recommendation?.recommendedScenarioId ??
    null;

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const selectedHandoff = selectedScenario
    ? buildLaunchCandidateHandoff({
        scenario: {
          ...selectedScenario,
          costProfileId: String(params.comparison.baseSpec.costProfileId ?? ""),
          amazonFeePresetName: selectedScenario.result.amazonFees?.presetName ?? null,
          shippingZoneRuleName: selectedScenario.result.shipping.shippingZoneName ?? null,
          packagingRuleName: null,
          shippingRuleName: null
        },
        riskSummary: {
          riskScore: selectedScenario.riskScore ?? 0,
          riskLevel: selectedScenario.riskLevel ?? "LOW",
          warnings: (selectedScenario.warningSnapshot as any[]) ?? [],
          summary: selectedScenario.riskSummary ?? ""
        }
      })
    : null;

  const selectedScenarios: GuardrailedScenario[] = scenarios.map((scenario: GuardrailedScenario) =>
    scenario.id === selectedScenarioId
      ? { ...scenario, handoffSnapshot: selectedHandoff, isLaunchApprovedCandidate: true }
      : { ...scenario, isLaunchApprovedCandidate: false }
  );

  return {
    scenarios: selectedScenarios,
    selectedLaunchScenarioId: selectedScenarioId,
    selectedLaunchSummary: selectedHandoff,
    riskSummary: buildScenarioRiskSummary({
      scenarios: selectedScenarios.map((scenario: GuardrailedScenario) => ({
        id: scenario.id,
        name: scenario.name,
        riskScore: scenario.riskScore ?? null,
        riskLevel: scenario.riskLevel ?? null,
        warnings: ((scenario.warningSnapshot as any[]) ?? []).map((warning) => ({
          code: String(warning.code ?? ""),
          severity: warning.severity,
          message: String(warning.message ?? "")
        }))
      })),
      recommendedScenarioId: params.comparison.ranking?.recommendation?.recommendedScenarioId ?? null,
      selectedLaunchScenarioId: selectedScenarioId
    })
  };
}

type CostCalculationViewInput = {
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
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
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
};

export async function calculateShelfCostView(input: CostCalculationViewInput) {
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
      amazonFeePresetId: input.amazonFeePresetId ?? null,
      shippingZoneRuleId: input.shippingZoneRuleId ?? null,
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
      shippingRule: assumptions.shippingRule,
      amazonFeePreset: assumptions.amazonFeePreset,
      shippingZoneRule: assumptions.shippingZoneRule
    },
    result
  };
}

export async function saveShelfCostCalculation(input: CostCalculationViewInput) {
  const payload = await calculateShelfCostView(input);
  const record = await createShelfCostCalculationRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId,
    amazonFeePresetId: input.amazonFeePresetId ?? null,
    shippingZoneRuleId: input.shippingZoneRuleId ?? null,
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
    referralFeeCostCents: payload.calculation.referralFeeCostCents,
    closingFeeCostCents: payload.calculation.closingFeeCostCents,
    fulfillmentFeeCostCents: payload.calculation.fulfillmentFeeCostCents,
    storageAllowanceCostCents: payload.calculation.storageAllowanceCostCents,
    advertisingAllowanceCostCents: payload.calculation.advertisingAllowanceCostCents,
    returnReserveCostCents: payload.calculation.returnReserveCostCents,
    damageReserveCostCents: payload.calculation.damageReserveCostCents,
    miscMarketplaceCostCents: payload.calculation.miscMarketplaceCostCents,
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
    amazonFeeSnapshot: payload.result.amazonFees,
    shippingZoneSnapshot: payload.result.shippingZone,
    resultSnapshot: payload.result
  });

  const hydrated = await getShelfCostCalculationRecord({
    organizationId: input.organizationId,
    calculationId: record.id
  });

  return { ok: true, calculation: mapCalculation(hydrated) };
}

export async function listShelfCostCalculations(input: {
  organizationId: string;
  costProfileId?: string;
}) {
  const calculations = await listShelfCostCalculationsForOrganization(input);
  return { ok: true, calculations: calculations.map(mapCalculation) };
}

export async function getShelfCostCalculation(input: {
  organizationId: string;
  calculationId: string;
}) {
  const calculation = await getShelfCostCalculationRecord(input);
  if (!calculation) {
    throw new Error("Shelf cost calculation not found.");
  }

  return { ok: true, calculation: mapCalculation(calculation) };
}

type ScenarioInput = {
  name: string;
  launchStrategy?: LaunchStrategy | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  packagingCode?: string | null;
  shippingCode?: string | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
};

export async function compareShelfCostScenarios(input: {
  organizationId: string;
  name?: string | null;
  notes?: string | null;
  baseSpec: CostCalculationViewInput;
  scenarios: ScenarioInput[];
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}): Promise<{ ok: true; comparison: GuardrailedComparison & AnyRecord }> {
  if (!input.scenarios.length) {
    throw new Error("At least one scenario is required.");
  }

  const scenarioResults = [];
  for (const [index, scenario] of input.scenarios.entries()) {
    const mergedInput = {
      ...input.baseSpec,
      organizationId: input.organizationId,
      name: input.baseSpec.name ?? `Scenario ${index + 1}`,
      launchStrategy: scenario.launchStrategy ?? null,
      amazonFeePresetId:
        scenario.amazonFeePresetId !== undefined ? scenario.amazonFeePresetId : input.baseSpec.amazonFeePresetId,
      shippingZoneRuleId:
        scenario.shippingZoneRuleId !== undefined ? scenario.shippingZoneRuleId : input.baseSpec.shippingZoneRuleId,
      packagingCode:
        scenario.packagingCode !== undefined ? scenario.packagingCode : input.baseSpec.packagingCode,
      shippingCode:
        scenario.shippingCode !== undefined ? scenario.shippingCode : input.baseSpec.shippingCode,
      targetMarginPct:
        scenario.targetMarginPct !== undefined ? scenario.targetMarginPct : input.baseSpec.targetMarginPct,
      growthMarginPct:
        scenario.growthMarginPct !== undefined ? scenario.growthMarginPct : input.baseSpec.growthMarginPct,
      marketplaceFeePct:
        scenario.marketplaceFeePct !== undefined ? scenario.marketplaceFeePct : input.baseSpec.marketplaceFeePct,
      returnReservePct:
        scenario.returnReservePct !== undefined ? scenario.returnReservePct : input.baseSpec.returnReservePct,
      damageReservePct:
        scenario.damageReservePct !== undefined ? scenario.damageReservePct : input.baseSpec.damageReservePct,
      shippingBufferPct:
        scenario.shippingBufferPct !== undefined ? scenario.shippingBufferPct : input.baseSpec.shippingBufferPct,
      shippingBufferCents:
        scenario.shippingBufferCents !== undefined
          ? scenario.shippingBufferCents
          : input.baseSpec.shippingBufferCents
    };

    const payload = await calculateShelfCostView(mergedInput);
    const assumptionsSnapshot = payload.assumptions as Record<string, unknown>;
    scenarioResults.push({
      id: `scenario-${index + 1}`,
      name: scenario.name,
      calculation: payload.calculation,
      assumptionsSnapshot,
      result: payload.result,
      launchStrategy: mergedInput.launchStrategy ?? null,
      changedAssumptions: {
        packagingCode: mergedInput.packagingCode ?? null,
        shippingCode: mergedInput.shippingCode ?? null,
        amazonFeePresetId: mergedInput.amazonFeePresetId ?? null,
        shippingZoneRuleId: mergedInput.shippingZoneRuleId ?? null,
        targetMarginPct: mergedInput.targetMarginPct ?? null,
        growthMarginPct: mergedInput.growthMarginPct ?? null,
        launchStrategy: mergedInput.launchStrategy ?? null
      }
    });
  }

  const deltaComparison = compareScenarioResults(
    scenarioResults.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      result: scenario.result,
      assumptionsSnapshot: scenario.assumptionsSnapshot
    }))
  );
  const ranking = rankComparisonScenarios(
    scenarioResults.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      launchStrategy: scenario.launchStrategy,
      result: scenario.result
    }))
  );

  const comparison: GuardrailedComparison = {
    name: input.name ?? null,
    notes: input.notes ?? null,
    baseSpec: input.baseSpec,
    baselineScenarioId: deltaComparison.baselineScenarioId,
    ranking: {
      scenarios: ranking.ranked.map((entry) => ({
        scenarioId: entry.id,
        rankingScore: entry.rankingScore,
        rankingSummary: entry.rankingSummary
      })),
      recommendation: ranking.recommendation
    },
    scenarios: scenarioResults.map((scenario) => {
      const deltaEntry = deltaComparison.scenarios.find((entry) => entry.id === scenario.id);
      const rankingEntry = ranking.ranked.find((entry) => entry.id === scenario.id);
      return {
        ...scenario,
        rankingScore: rankingEntry?.rankingScore ?? null,
        rankingSummary: rankingEntry?.rankingSummary ?? null,
        isRecommendedLaunchScenario:
          ranking.recommendation?.recommendedScenarioId === scenario.id,
        deltas: deltaEntry?.deltas ?? {
          subtotalCostCents: 0,
          breakEvenPriceCents: 0,
          recommendedMinSellPriceCents: 0,
          recommendedTargetSellPriceCents: 0
        }
      };
    })
  };

  let guardrailProfile = null;
  let riskSummary = null;
  let selectedLaunchSummary = null;
  let selectedLaunchScenarioId = null;

  if (input.guardrailProfileId) {
    const record = await getLaunchGuardrailProfileRecord({
      organizationId: input.organizationId,
      guardrailProfileId: input.guardrailProfileId
    });
    if (!record) {
      throw new Error("Launch guardrail profile not found.");
    }

    guardrailProfile = mapLaunchGuardrailProfile(record);
    const evaluated: ReturnType<typeof applyGuardrailsToComparison> = applyGuardrailsToComparison({
      comparison,
      guardrailProfile,
      selectedScenarioId: input.selectedScenarioId ?? null
    });
    comparison.scenarios = evaluated.scenarios as typeof comparison.scenarios;
    riskSummary = evaluated.riskSummary;
    selectedLaunchSummary = evaluated.selectedLaunchSummary;
    selectedLaunchScenarioId = evaluated.selectedLaunchScenarioId;
  }

  return {
    ok: true,
    comparison: {
      ...comparison,
      guardrailProfile,
      selectedLaunchScenarioId,
      selectedLaunchSummary,
      riskSummary
    }
  };
}

export async function saveComparisonSet(input: {
  organizationId: string;
  name: string;
  notes?: string | null;
  baseSpec: CostCalculationViewInput;
  scenarios: ScenarioInput[];
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}) {
  const comparison = await compareShelfCostScenarios(input);
  const scenarioRecords = [];

  for (const [index, scenario] of comparison.comparison.scenarios.entries()) {
    const scenarioRecord = await createCalculationScenarioRecord({
      organizationId: input.organizationId,
      name: scenario.name,
      costProfileId: input.baseSpec.costProfileId,
      amazonFeePresetId: scenario.changedAssumptions.amazonFeePresetId,
      shippingZoneRuleId: scenario.changedAssumptions.shippingZoneRuleId,
      packagingRuleId: null,
      shippingRuleId: null,
      shelfCostCalculationId: null,
      launchStrategy: scenario.launchStrategy ?? null,
      rankingScore: scenario.rankingScore ?? null,
      rankingSummary: scenario.rankingSummary ?? null,
      guardrailProfileId: scenario.guardrailProfileId ?? null,
      riskScore: scenario.riskScore ?? null,
      riskLevel: scenario.riskLevel ?? null,
      guardrailSnapshot: scenario.guardrailSnapshot ?? null,
      warningSnapshot: scenario.warningSnapshot ?? null,
      handoffSnapshot: scenario.handoffSnapshot ?? null,
      isRecommendedLaunchScenario: Boolean(scenario.isRecommendedLaunchScenario),
      isLaunchApprovedCandidate: Boolean(scenario.isLaunchApprovedCandidate),
      assumptionsSnapshot: scenario.assumptionsSnapshot,
      resultSnapshot: scenario.result
    });
    scenarioRecords.push(scenarioRecord);
  }

  const recommendedScenarioRecord = scenarioRecords.find((scenario) => scenario.isRecommendedLaunchScenario);
  const selectedLaunchScenarioRecord = scenarioRecords.find((scenario) => scenario.isLaunchApprovedCandidate);
  const set = await createCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    name: input.name,
    notes: input.notes ?? null,
    baseShelfSpecSnapshot: comparison.comparison.baseSpec,
    recommendedScenarioId: recommendedScenarioRecord?.id ?? null,
    selectedLaunchScenarioId: selectedLaunchScenarioRecord?.id ?? null,
    rankingSnapshot: comparison.comparison.ranking,
    comparisonSummary: comparison.comparison.ranking?.recommendation ?? null,
    selectedLaunchSummary: comparison.comparison.selectedLaunchSummary ?? null,
    riskSummary: comparison.comparison.riskSummary ?? null
  });

  for (const [index, scenarioRecord] of scenarioRecords.entries()) {
    await createComparisonSetScenarioRecord({
      organizationId: input.organizationId,
      comparisonSetId: set.id,
      calculationScenarioId: scenarioRecord.id,
      sortOrder: index
    });
  }

  const hydrated = await getCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: set.id
  });
  return { ok: true, comparisonSet: mapComparisonSet(hydrated) };
}

export async function rankComparisonSet(input: {
  organizationId: string;
  comparisonSetId: string;
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  const ranking = rankComparisonScenarios(
    (comparisonSet.scenarios ?? []).map((entry: any) => ({
      id: entry.calculationScenario.id,
      name: entry.calculationScenario.name,
      launchStrategy: entry.calculationScenario.launchStrategy ?? null,
      result: entry.calculationScenario.resultSnapshot
    }))
  );

  const recommendedScenarioId = ranking.recommendation?.recommendedScenarioId ?? null;
  let selectedLaunchScenarioId: string | null = input.selectedScenarioId ?? null;
  let selectedLaunchSummary: AnyRecord | null = null;
  let riskSummary: AnyRecord | null = null;
  let guardrailProfile = null;

  if (input.guardrailProfileId) {
    const record = await getLaunchGuardrailProfileRecord({
      organizationId: input.organizationId,
      guardrailProfileId: input.guardrailProfileId
    });
    if (!record) {
      throw new Error("Launch guardrail profile not found.");
    }
    guardrailProfile = mapLaunchGuardrailProfile(record);
  }

  for (const entry of comparisonSet.scenarios ?? []) {
    const scenario = entry.calculationScenario;
    const rankingEntry = ranking.ranked.find((item) => item.id === scenario.id);
    const guardrailEvaluation = guardrailProfile
      ? evaluateScenarioGuardrails({
          scenario: {
            id: scenario.id,
            name: scenario.name,
            launchStrategy: scenario.launchStrategy ?? null,
            assumptionsSnapshot: scenario.assumptionsSnapshot,
            result: scenario.resultSnapshot
          },
          guardrailProfile,
          comparisonContext: {
            lowestTargetSellPriceCents: Math.min(
              ...ranking.ranked.map((item) => item.result.breakdown.recommendedTargetSellPriceCents)
            ),
            highestTargetSellPriceCents: Math.max(
              ...ranking.ranked.map((item) => item.result.breakdown.recommendedTargetSellPriceCents)
            ),
            recommendedScenarioId
          }
        })
      : null;

    await updateCalculationScenarioRecord({
      organizationId: input.organizationId,
      scenarioId: scenario.id,
      data: normalizeUpdateData({
        rankingScore: rankingEntry?.rankingScore ?? null,
        rankingSummary: rankingEntry?.rankingSummary ?? null,
        isRecommendedLaunchScenario: scenario.id === recommendedScenarioId,
        guardrailProfileId: guardrailProfile?.id ?? null,
        riskScore: guardrailEvaluation?.riskScore ?? null,
        riskLevel: guardrailEvaluation?.riskLevel ?? null,
        guardrailSnapshot: guardrailEvaluation?.guardrailSnapshot ?? null,
        warningSnapshot: guardrailEvaluation?.warnings ?? null,
        isLaunchApprovedCandidate: false
      })
    });
  }

  if (!selectedLaunchScenarioId) {
    const safestRankedScenario = ranking.ranked.find((item) => item.id === recommendedScenarioId) ?? ranking.ranked[0];
    selectedLaunchScenarioId = safestRankedScenario?.id ?? null;
  }

  const refreshedAfterScenarioUpdate = await getCalculationComparisonSetRecord(input);
  const selectedScenarioRecord =
    (refreshedAfterScenarioUpdate?.scenarios ?? []).find(
      (entry: any) => entry.calculationScenario.id === selectedLaunchScenarioId
    )?.calculationScenario ?? null;

  if (selectedScenarioRecord) {
    const warnings = Array.isArray(selectedScenarioRecord.warningSnapshot)
      ? selectedScenarioRecord.warningSnapshot
      : [];
    selectedLaunchSummary = buildLaunchCandidateHandoff({
      scenario: {
        ...mapScenario(selectedScenarioRecord),
        result: selectedScenarioRecord.resultSnapshot
      } as any,
      riskSummary: {
        riskScore: decimalToNumber(selectedScenarioRecord.riskScore) ?? 0,
        riskLevel: selectedScenarioRecord.riskLevel ?? "LOW",
        warnings,
        summary:
          selectedScenarioRecord.riskLevel === "HIGH"
            ? "Selected launch candidate is still guardrail-risky."
            : "Selected launch candidate clears the current guardrail profile."
      }
    });
    await updateCalculationScenarioRecord({
      organizationId: input.organizationId,
      scenarioId: selectedScenarioRecord.id,
      data: {
        isLaunchApprovedCandidate: true,
        handoffSnapshot: selectedLaunchSummary
      }
    });
  }

  if (refreshedAfterScenarioUpdate) {
    riskSummary = buildScenarioRiskSummary({
      scenarios: (refreshedAfterScenarioUpdate.scenarios ?? []).map((entry: any) => ({
        id: entry.calculationScenario.id,
        name: entry.calculationScenario.name,
        riskScore: decimalToNumber(entry.calculationScenario.riskScore),
        riskLevel: entry.calculationScenario.riskLevel ?? null,
        warnings: Array.isArray(entry.calculationScenario.warningSnapshot)
          ? entry.calculationScenario.warningSnapshot
          : []
      })),
      recommendedScenarioId,
      selectedLaunchScenarioId
    });
  }

  await updateCalculationComparisonSetRecord({
    organizationId: input.organizationId,
    comparisonSetId: input.comparisonSetId,
    data: {
      recommendedScenarioId: recommendedScenarioId ?? undefined,
      selectedLaunchScenarioId: selectedLaunchScenarioId ?? undefined,
      rankingSnapshot: ranking,
      comparisonSummary: ranking.recommendation ?? undefined,
      selectedLaunchSummary: selectedLaunchSummary ?? undefined,
      riskSummary: riskSummary ?? undefined
    }
  });

  const hydrated = await getCalculationComparisonSetRecord(input);
  return { ok: true, comparisonSet: mapComparisonSet(hydrated) };
}

export async function getComparisonSetRecommendation(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const comparisonSet = await getCalculationComparisonSetRecord(input);
  if (!comparisonSet) {
    throw new Error("Cost comparison set not found.");
  }

  return {
    ok: true,
    recommendation: {
      ...(comparisonSet.comparisonSummary ??
        comparisonSet.rankingSnapshot?.recommendation ??
        {}),
      selectedLaunchScenarioId: comparisonSet.selectedLaunchScenarioId ?? null,
      selectedLaunchSummary: comparisonSet.selectedLaunchSummary ?? null,
      riskSummary: comparisonSet.riskSummary ?? null
    }
  };
}

export async function listComparisonSets(input: { organizationId: string }) {
  const sets = await listCalculationComparisonSetsForOrganization(input.organizationId);
  return {
    ok: true,
    comparisonSets: sets.map((record: any) => ({
      id: record.id,
      orgId: record.organizationId,
      name: record.name,
      notes: record.notes ?? null,
      scenarioCount: record.scenarios.length,
      recommendedScenarioId: record.recommendedScenarioId ?? null,
      recommendedScenarioName: record.recommendedScenario?.name ?? null,
      selectedLaunchScenarioId: record.selectedLaunchScenarioId ?? null,
      selectedLaunchScenarioName: record.selectedLaunchScenario?.name ?? null,
      comparisonSummary: record.comparisonSummary ?? null,
      riskSummary: record.riskSummary ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }))
  };
}

export async function getComparisonSet(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const set = await getCalculationComparisonSetRecord(input);
  if (!set) {
    throw new Error("Cost comparison set not found.");
  }

  return { ok: true, comparisonSet: mapComparisonSet(set) };
}

export async function evaluateComparisonSetGuardrails(input: {
  organizationId: string;
  comparisonSetId: string;
  guardrailProfileId: string;
  selectedScenarioId?: string | null;
}) {
  return rankComparisonSet(input);
}

export async function selectLaunchScenario(input: {
  organizationId: string;
  comparisonSetId: string;
  scenarioId: string;
  guardrailProfileId?: string | null;
}) {
  return rankComparisonSet({
    organizationId: input.organizationId,
    comparisonSetId: input.comparisonSetId,
    selectedScenarioId: input.scenarioId,
    guardrailProfileId: input.guardrailProfileId ?? null
  });
}

export async function getComparisonSetHandoffSummary(input: {
  organizationId: string;
  comparisonSetId: string;
}) {
  const set = await getCalculationComparisonSetRecord(input);
  if (!set) {
    throw new Error("Cost comparison set not found.");
  }

  return {
    ok: true,
    handoffSummary: set.selectedLaunchSummary ?? null,
    selectedLaunchScenarioId: set.selectedLaunchScenarioId ?? null,
    riskSummary: set.riskSummary ?? null
  };
}
