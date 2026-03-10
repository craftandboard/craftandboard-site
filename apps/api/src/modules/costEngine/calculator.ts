import type { ShelfCostEdgeBandPattern } from "./contracts.js";
import {
  clampCurrency,
  inchesToFeet,
  minutesToHours,
  percentToMultiplier,
  squareInchesToSquareFeet
} from "./normalization.js";

export interface CostEngineProfileDefaults {
  id: string;
  name: string;
  currency: string;
  defaultMaterialWastePct: number;
  defaultEdgeBandWastePct: number;
  defaultLaborRateCentsPerHour: number;
  defaultMachineRateCentsPerHour: number;
  defaultOverheadRateCentsPerHour: number;
  defaultPackagingAllowanceCents: number;
  defaultShippingAllowanceCents: number;
  defaultPackingLaborRateCentsPerHour: number;
  defaultPackingMinutes: number | null;
  defaultMarketplaceFeePct: number | null;
  defaultReturnReservePct: number | null;
  defaultDamageReservePct: number | null;
  defaultShippingBufferPct: number | null;
  defaultShippingBufferCents: number;
  defaultPackagingOverheadCents: number;
  defaultRecommendedMinMarginPct: number | null;
  defaultRecommendedTargetMarginPct: number | null;
  targetMarginPct: number | null;
  growthMarginPct: number | null;
}

export interface CostEngineMaterialRule {
  id: string;
  materialCode: string;
  materialName: string;
  thicknessLabel: string | null;
  sheetLengthIn: number;
  sheetWidthIn: number;
  sheetCostCents: number;
  usableYieldPct: number | null;
  wastePct: number | null;
}

export interface CostEngineEdgeBandRule {
  id: string;
  edgeBandCode: string;
  edgeBandName: string;
  costCentsPerLinearFoot: number;
  wastePct: number | null;
  setupAllowanceLinearFt: number | null;
}

export interface CostEnginePackagingRule {
  id: string;
  packagingCode: string;
  packagingName: string;
  boxCostCents: number | null;
  bubbleWrapCostCents: number | null;
  tapeCostCents: number | null;
  labelCostCents: number | null;
  insertFlyerCostCents: number | null;
  shrinkWrapCostCents: number | null;
  foamCostCents: number | null;
  cornerProtectorCostCents: number | null;
  packingMinutes: number | null;
  packingLaborOverrideCents: number | null;
  packagingOverheadCents: number | null;
  otherPackagingCostCents: number | null;
}

export interface CostEngineShippingRule {
  id: string;
  shippingCode: string;
  shippingName: string;
  baseCostCents: number;
  costPerPoundCents: number | null;
  costPerCubicInchCents: number | null;
  dimensionalDivisor: number | null;
  dimensionalRateCents: number | null;
  shippingBufferPct: number | null;
  shippingBufferCents: number | null;
  marketplaceHandlingCents: number | null;
  flatOverride: number | null;
}

export interface CostEngineAmazonFeePreset {
  id: string;
  name: string;
  referralFeePct: number;
  closingFeeCents: number | null;
  fulfillmentFeeCents: number | null;
  storageAllowanceCents: number | null;
  advertisingAllowancePct: number | null;
  advertisingAllowanceCents: number | null;
  returnReservePct: number | null;
  returnReserveCents: number | null;
  damageReservePct: number | null;
  damageReserveCents: number | null;
  miscMarketplacePct: number | null;
  miscMarketplaceCents: number | null;
}

export interface CostEngineShippingZoneRule {
  id: string;
  name: string;
  zoneCode: string;
  baseCostCents: number;
  weightAdderCents: number | null;
  dimensionalAdderCents: number | null;
  bufferPct: number | null;
  bufferCents: number | null;
  marketplaceHandlingCents: number | null;
}

export interface CostEngineCalculationInput {
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  weightLb?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: ShelfCostEdgeBandPattern;
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
}

export interface CostEngineResolvedAssumptions {
  profile: CostEngineProfileDefaults;
  materialRule: CostEngineMaterialRule;
  edgeBandRule?: CostEngineEdgeBandRule | null;
  packagingRule?: CostEnginePackagingRule | null;
  shippingRule?: CostEngineShippingRule | null;
  amazonFeePreset?: CostEngineAmazonFeePreset | null;
  shippingZoneRule?: CostEngineShippingZoneRule | null;
}

function getEdgeBandLinearFeet(input: CostEngineCalculationInput) {
  const quantity = input.quantity;
  const longEdgesFt = quantity * 2 * inchesToFeet(input.lengthIn);
  const shortEdgesFt = quantity * 2 * inchesToFeet(input.depthIn);

  switch (input.edgeBandPattern) {
    case "NONE":
      return 0;
    case "LONG_EDGES":
      return longEdgesFt;
    case "SHORT_EDGES":
      return shortEdgesFt;
    case "ALL_FOUR":
      return longEdgesFt + shortEdgesFt;
  }
}

function calculateMaterialCost(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  rule: CostEngineMaterialRule
) {
  const requiredAreaSqFt = squareInchesToSquareFeet(input.lengthIn * input.depthIn * input.quantity);
  const sheetAreaSqFt = squareInchesToSquareFeet(rule.sheetLengthIn * rule.sheetWidthIn);
  const yieldPct = percentToMultiplier(rule.usableYieldPct ?? 100);
  const wastePct = percentToMultiplier(rule.wastePct ?? profile.defaultMaterialWastePct);
  const effectiveSheetAreaSqFt = Math.max(0.0001, sheetAreaSqFt * yieldPct);
  const effectiveRequiredAreaSqFt = requiredAreaSqFt * (1 + wastePct);
  const sheetsRequired = effectiveRequiredAreaSqFt / effectiveSheetAreaSqFt;

  return {
    requiredAreaSqFt,
    sheetAreaSqFt,
    sheetsRequired,
    costCents: clampCurrency(sheetsRequired * rule.sheetCostCents)
  };
}

function calculateEdgeBandCost(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  rule?: CostEngineEdgeBandRule | null
) {
  const linearFeet = getEdgeBandLinearFeet(input);
  if (!rule || linearFeet <= 0) {
    return {
      linearFeet,
      effectiveLinearFeet: 0,
      costCents: 0
    };
  }

  const wastePct = percentToMultiplier(rule.wastePct ?? profile.defaultEdgeBandWastePct);
  const setupAllowance = rule.setupAllowanceLinearFt ?? 0;
  const effectiveLinearFeet = linearFeet * (1 + wastePct) + setupAllowance;

  return {
    linearFeet,
    effectiveLinearFeet,
    costCents: clampCurrency(effectiveLinearFeet * rule.costCentsPerLinearFoot)
  };
}

function calculatePackagingCost(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  rule?: CostEnginePackagingRule | null
) {
  const componentCostCents = [
    rule?.boxCostCents ?? 0,
    rule?.bubbleWrapCostCents ?? 0,
    rule?.tapeCostCents ?? 0,
    rule?.labelCostCents ?? 0,
    rule?.insertFlyerCostCents ?? 0,
    rule?.shrinkWrapCostCents ?? 0,
    rule?.foamCostCents ?? 0,
    rule?.cornerProtectorCostCents ?? 0,
    rule?.otherPackagingCostCents ?? 0
  ];

  const basePackagingCostCents = clampCurrency(
    componentCostCents.reduce((sum, value) => sum + value, profile.defaultPackagingAllowanceCents)
  );
  const packingMinutes = input.packingMinutes ?? rule?.packingMinutes ?? profile.defaultPackingMinutes ?? 0;
  const packingLaborCostCents =
    rule?.packingLaborOverrideCents ??
    clampCurrency(minutesToHours(packingMinutes) * profile.defaultPackingLaborRateCentsPerHour);
  const packagingOverheadCents =
    (rule?.packagingOverheadCents ?? 0) + profile.defaultPackagingOverheadCents;

  return {
    componentCostCents: basePackagingCostCents,
    packingMinutes,
    packingLaborCostCents,
    packagingOverheadCents,
    costCents: basePackagingCostCents + packingLaborCostCents + packagingOverheadCents
  };
}

function calculateShippingCost(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  rule?: CostEngineShippingRule | null,
  zoneRule?: CostEngineShippingZoneRule | null
) {
  if (!rule) {
    const zoneBaseCostCents = zoneRule?.baseCostCents ?? 0;
    const zoneWeightCostCents = clampCurrency((input.weightLb ?? 0) * (zoneRule?.weightAdderCents ?? 0));
    const cubicInches =
      input.thicknessIn && input.thicknessIn > 0
        ? input.lengthIn * input.depthIn * input.thicknessIn * input.quantity
        : 0;
    const dimensionalWeightLb = cubicInches > 0 ? cubicInches / 139 : 0;
    const zoneDimensionalCostCents = clampCurrency(
      dimensionalWeightLb * (zoneRule?.dimensionalAdderCents ?? 0)
    );
    const zoneHandlingCents = zoneRule?.marketplaceHandlingCents ?? 0;
    const rawBase =
      profile.defaultShippingAllowanceCents +
      zoneBaseCostCents +
      zoneWeightCostCents +
      zoneDimensionalCostCents +
      zoneHandlingCents;
    const zoneBufferPct = zoneRule?.bufferPct ?? profile.defaultShippingBufferPct ?? 0;
    const zoneBufferCents = zoneRule?.bufferCents ?? profile.defaultShippingBufferCents;
    const bufferCostCents =
      clampCurrency(rawBase * percentToMultiplier(zoneBufferPct)) + (zoneBufferCents ?? 0);
    return {
      baseCostCents: profile.defaultShippingAllowanceCents,
      zoneBaseCostCents,
      weightCostCents: zoneWeightCostCents,
      volumeCostCents: 0,
      dimensionalCostCents: zoneDimensionalCostCents,
      marketplaceHandlingCents: zoneHandlingCents,
      bufferCostCents,
      costCents: rawBase + bufferCostCents
    };
  }

  if (rule.flatOverride !== null && rule.flatOverride !== undefined) {
    const ruleHandlingCents = rule.marketplaceHandlingCents ?? 0;
    const zoneBaseCostCents = zoneRule?.baseCostCents ?? 0;
    const zoneWeightCostCents = clampCurrency((input.weightLb ?? 0) * (zoneRule?.weightAdderCents ?? 0));
    const cubicInches =
      input.thicknessIn && input.thicknessIn > 0
        ? input.lengthIn * input.depthIn * input.thicknessIn * input.quantity
        : 0;
    const dimensionalWeightLb = cubicInches > 0 ? cubicInches / 139 : 0;
    const zoneDimensionalCostCents = clampCurrency(
      dimensionalWeightLb * (zoneRule?.dimensionalAdderCents ?? 0)
    );
    const zoneHandlingCents = zoneRule?.marketplaceHandlingCents ?? 0;
    const combinedBase =
      rule.flatOverride +
      zoneBaseCostCents +
      zoneWeightCostCents +
      zoneDimensionalCostCents +
      ruleHandlingCents +
      zoneHandlingCents;
    const bufferPct =
      input.shippingBufferPct ??
      zoneRule?.bufferPct ??
      rule.shippingBufferPct ??
      profile.defaultShippingBufferPct ??
      0;
    const bufferCents =
      input.shippingBufferCents ??
      zoneRule?.bufferCents ??
      rule.shippingBufferCents ??
      profile.defaultShippingBufferCents;
    const bufferCostCents = clampCurrency(combinedBase * percentToMultiplier(bufferPct)) + (bufferCents ?? 0);
    return {
      baseCostCents: rule.flatOverride,
      zoneBaseCostCents,
      weightCostCents: zoneWeightCostCents,
      volumeCostCents: 0,
      dimensionalCostCents: zoneDimensionalCostCents,
      marketplaceHandlingCents: ruleHandlingCents + zoneHandlingCents,
      bufferCostCents,
      costCents: clampCurrency(combinedBase + bufferCostCents)
    };
  }

  const cubicInches =
    input.thicknessIn && input.thicknessIn > 0
      ? input.lengthIn * input.depthIn * input.thicknessIn * input.quantity
      : 0;
  const weightCostCents = clampCurrency((input.weightLb ?? 0) * (rule.costPerPoundCents ?? 0));
  const volumeCostCents = clampCurrency(cubicInches * (rule.costPerCubicInchCents ?? 0));
  const dimensionalWeightLb =
    rule.dimensionalDivisor && rule.dimensionalDivisor > 0 ? cubicInches / rule.dimensionalDivisor : 0;
  const dimensionalCostCents = clampCurrency(dimensionalWeightLb * (rule.dimensionalRateCents ?? 0));
  const ruleMarketplaceHandlingCents = rule.marketplaceHandlingCents ?? 0;
  const zoneBaseCostCents = zoneRule?.baseCostCents ?? 0;
  const zoneWeightCostCents = clampCurrency((input.weightLb ?? 0) * (zoneRule?.weightAdderCents ?? 0));
  const zoneDimensionalCostCents = clampCurrency(
    dimensionalWeightLb * (zoneRule?.dimensionalAdderCents ?? 0)
  );
  const zoneMarketplaceHandlingCents = zoneRule?.marketplaceHandlingCents ?? 0;
  const bufferPct =
    input.shippingBufferPct ??
    zoneRule?.bufferPct ??
    rule.shippingBufferPct ??
    profile.defaultShippingBufferPct ??
    0;
  const bufferCents =
    input.shippingBufferCents ??
    zoneRule?.bufferCents ??
    rule.shippingBufferCents ??
    profile.defaultShippingBufferCents;
  const baseBeforeBuffer =
    profile.defaultShippingAllowanceCents +
    rule.baseCostCents +
    zoneBaseCostCents +
    weightCostCents +
    zoneWeightCostCents +
    volumeCostCents +
    dimensionalCostCents +
    zoneDimensionalCostCents +
    ruleMarketplaceHandlingCents +
    zoneMarketplaceHandlingCents;
  const bufferCostCents = clampCurrency(baseBeforeBuffer * percentToMultiplier(bufferPct)) + (bufferCents ?? 0);

  return {
    baseCostCents: profile.defaultShippingAllowanceCents + rule.baseCostCents + zoneBaseCostCents,
    zoneBaseCostCents,
    weightCostCents: weightCostCents + zoneWeightCostCents,
    volumeCostCents,
    dimensionalCostCents: dimensionalCostCents + zoneDimensionalCostCents,
    marketplaceHandlingCents: ruleMarketplaceHandlingCents + zoneMarketplaceHandlingCents,
    bufferCostCents,
    costCents: clampCurrency(baseBeforeBuffer + bufferCostCents)
  };
}

function solvePriceWithVariableRate(baseCents: number, variableRatePct: number) {
  if (variableRatePct <= 0) {
    return baseCents;
  }
  const multiplier = 1 - percentToMultiplier(variableRatePct);
  if (multiplier <= 0) {
    throw new Error("Combined fee and margin percentages must remain below 100%.");
  }
  return clampCurrency(baseCents / multiplier);
}

function calculateRecommendedSellPrices(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  subtotalCostCents: number,
  feePreset?: CostEngineAmazonFeePreset | null
) {
  const marketplaceFeePct =
    input.marketplaceFeePct ?? feePreset?.referralFeePct ?? profile.defaultMarketplaceFeePct ?? 0;
  const advertisingAllowancePct = feePreset?.advertisingAllowancePct ?? 0;
  const miscMarketplacePct = feePreset?.miscMarketplacePct ?? 0;
  const returnReservePct =
    input.returnReservePct ?? feePreset?.returnReservePct ?? profile.defaultReturnReservePct ?? 0;
  const damageReservePct =
    input.damageReservePct ?? feePreset?.damageReservePct ?? profile.defaultDamageReservePct ?? 0;
  const targetMarginPct = input.targetMarginPct ?? profile.targetMarginPct;
  const growthMarginPct = input.growthMarginPct ?? profile.growthMarginPct;
  const minMarginPct = profile.defaultRecommendedMinMarginPct ?? targetMarginPct ?? 0;
  const targetSellMarginPct = profile.defaultRecommendedTargetMarginPct ?? growthMarginPct ?? targetMarginPct ?? 0;

  const fixedFeesCents =
    (feePreset?.closingFeeCents ?? 0) +
    (feePreset?.fulfillmentFeeCents ?? 0) +
    (feePreset?.storageAllowanceCents ?? 0) +
    (feePreset?.advertisingAllowanceCents ?? 0) +
    (feePreset?.returnReserveCents ?? 0) +
    (feePreset?.damageReserveCents ?? 0) +
    (feePreset?.miscMarketplaceCents ?? 0);

  const variablePct =
    marketplaceFeePct +
    advertisingAllowancePct +
    returnReservePct +
    damageReservePct +
    miscMarketplacePct;

  const breakEvenPriceCents = solvePriceWithVariableRate(subtotalCostCents + fixedFeesCents, variablePct);
  const referralFeeCostCents = clampCurrency(
    breakEvenPriceCents * percentToMultiplier(marketplaceFeePct)
  );
  const advertisingAllowanceCostCents =
    clampCurrency(breakEvenPriceCents * percentToMultiplier(advertisingAllowancePct)) +
    (feePreset?.advertisingAllowanceCents ?? 0);
  const returnReserveCostCents =
    clampCurrency(breakEvenPriceCents * percentToMultiplier(returnReservePct)) +
    (feePreset?.returnReserveCents ?? 0);
  const damageReserveCostCents =
    clampCurrency(breakEvenPriceCents * percentToMultiplier(damageReservePct)) +
    (feePreset?.damageReserveCents ?? 0);
  const miscMarketplaceCostCents =
    clampCurrency(breakEvenPriceCents * percentToMultiplier(miscMarketplacePct)) +
    (feePreset?.miscMarketplaceCents ?? 0);
  const marketplaceFeeCostCents =
    referralFeeCostCents +
    (feePreset?.closingFeeCents ?? 0) +
    (feePreset?.fulfillmentFeeCents ?? 0) +
    (feePreset?.storageAllowanceCents ?? 0) +
    advertisingAllowanceCostCents +
    miscMarketplaceCostCents;

  const recommendedInternalPriceCents =
    targetMarginPct && targetMarginPct > 0 && targetMarginPct < 100
      ? clampCurrency(subtotalCostCents / (1 - percentToMultiplier(targetMarginPct)))
      : subtotalCostCents;
  const recommendedMinSellPriceCents = solvePriceWithVariableRate(
    subtotalCostCents + fixedFeesCents,
    variablePct + Math.max(0, minMarginPct)
  );
  const recommendedTargetSellPriceCents = solvePriceWithVariableRate(
    subtotalCostCents + fixedFeesCents,
    variablePct + Math.max(0, targetSellMarginPct)
  );
  const recommendedSellPriceCents = Math.max(recommendedMinSellPriceCents, recommendedTargetSellPriceCents);

  return {
    marketplaceFeePct,
    referralFeePct: marketplaceFeePct,
    advertisingAllowancePct,
    returnReservePct,
    damageReservePct,
    miscMarketplacePct,
    growthMarginPct,
    targetMarginPct,
    marketplaceFeeCostCents,
    referralFeeCostCents,
    closingFeeCostCents: feePreset?.closingFeeCents ?? 0,
    fulfillmentFeeCostCents: feePreset?.fulfillmentFeeCents ?? 0,
    storageAllowanceCostCents: feePreset?.storageAllowanceCents ?? 0,
    advertisingAllowanceCostCents,
    returnReserveCostCents,
    damageReserveCostCents,
    miscMarketplaceCostCents,
    breakEvenPriceCents,
    recommendedInternalPriceCents,
    recommendedMinSellPriceCents,
    recommendedTargetSellPriceCents,
    recommendedSellPriceCents
  };
}

export function calculateShelfCost(
  input: CostEngineCalculationInput,
  assumptions: CostEngineResolvedAssumptions
) {
  const material = calculateMaterialCost(input, assumptions.profile, assumptions.materialRule);
  const edgeBand = calculateEdgeBandCost(input, assumptions.profile, assumptions.edgeBandRule);
  const laborCostCents = clampCurrency(
    minutesToHours(input.laborMinutes) * assumptions.profile.defaultLaborRateCentsPerHour
  );
  const machineCostCents = clampCurrency(
    minutesToHours(input.machineMinutes) * assumptions.profile.defaultMachineRateCentsPerHour
  );
  const overheadMinutes = input.overheadMinutes ?? input.laborMinutes + input.machineMinutes;
  const overheadCostCents = clampCurrency(
    minutesToHours(overheadMinutes) * assumptions.profile.defaultOverheadRateCentsPerHour
  );
  const packaging = calculatePackagingCost(input, assumptions.profile, assumptions.packagingRule);
  const shipping = calculateShippingCost(
    input,
    assumptions.profile,
    assumptions.shippingRule,
    assumptions.shippingZoneRule
  );

  const subtotalCostCents =
    material.costCents +
    edgeBand.costCents +
    laborCostCents +
    machineCostCents +
    overheadCostCents +
    packaging.costCents +
    shipping.costCents;
  const pricing = calculateRecommendedSellPrices(
    input,
    assumptions.profile,
    subtotalCostCents,
    assumptions.amazonFeePreset
  );

  return {
    currency: assumptions.profile.currency,
    quantity: input.quantity,
    breakdown: {
      materialCostCents: material.costCents,
      edgeBandCostCents: edgeBand.costCents,
      laborCostCents,
      machineCostCents,
      packagingCostCents: packaging.costCents,
      packingLaborCostCents: packaging.packingLaborCostCents,
      packagingComponentCostCents: packaging.componentCostCents,
      packagingOverheadCostCents: packaging.packagingOverheadCents,
      shippingCostCents: shipping.costCents,
      shippingBufferCostCents: shipping.bufferCostCents,
      overheadCostCents,
      marketplaceFeeCostCents: pricing.marketplaceFeeCostCents,
      referralFeeCostCents: pricing.referralFeeCostCents,
      closingFeeCostCents: pricing.closingFeeCostCents,
      fulfillmentFeeCostCents: pricing.fulfillmentFeeCostCents,
      storageAllowanceCostCents: pricing.storageAllowanceCostCents,
      advertisingAllowanceCostCents: pricing.advertisingAllowanceCostCents,
      returnReserveCostCents: pricing.returnReserveCostCents,
      damageReserveCostCents: pricing.damageReserveCostCents,
      miscMarketplaceCostCents: pricing.miscMarketplaceCostCents,
      subtotalCostCents,
      breakEvenPriceCents: pricing.breakEvenPriceCents,
      recommendedInternalPriceCents: pricing.recommendedInternalPriceCents,
      recommendedMinSellPriceCents: pricing.recommendedMinSellPriceCents,
      recommendedTargetSellPriceCents: pricing.recommendedTargetSellPriceCents,
      recommendedSellPriceCents: pricing.recommendedSellPriceCents
    },
    geometry: {
      requiredAreaSqFt: material.requiredAreaSqFt,
      sheetAreaSqFt: material.sheetAreaSqFt,
      sheetsRequired: material.sheetsRequired,
      edgeBandLinearFeet: edgeBand.linearFeet,
      effectiveEdgeBandLinearFeet: edgeBand.effectiveLinearFeet
    },
    packaging: {
      packingMinutes: packaging.packingMinutes,
      componentCostCents: packaging.componentCostCents,
      packingLaborCostCents: packaging.packingLaborCostCents,
      packagingOverheadCents: packaging.packagingOverheadCents
    },
    shipping: {
      baseCostCents: shipping.baseCostCents,
      weightCostCents: shipping.weightCostCents,
      volumeCostCents: shipping.volumeCostCents,
      dimensionalCostCents: shipping.dimensionalCostCents,
      marketplaceHandlingCents: shipping.marketplaceHandlingCents,
      shippingBufferPct:
        input.shippingBufferPct ??
        assumptions.shippingZoneRule?.bufferPct ??
        assumptions.shippingRule?.shippingBufferPct ??
        assumptions.profile.defaultShippingBufferPct ??
        0,
      shippingBufferCents:
        input.shippingBufferCents ??
        assumptions.shippingZoneRule?.bufferCents ??
        assumptions.shippingRule?.shippingBufferCents ??
        assumptions.profile.defaultShippingBufferCents,
      shippingBufferCostCents: shipping.bufferCostCents,
      shippingZoneName: assumptions.shippingZoneRule?.name ?? null,
      shippingZoneCode: assumptions.shippingZoneRule?.zoneCode ?? null
    },
    pricing: {
      targetMarginPct: pricing.targetMarginPct,
      growthMarginPct: pricing.growthMarginPct,
      marketplaceFeePct: pricing.marketplaceFeePct,
      referralFeePct: pricing.referralFeePct,
      advertisingAllowancePct: pricing.advertisingAllowancePct,
      returnReservePct: pricing.returnReservePct,
      damageReservePct: pricing.damageReservePct,
      miscMarketplacePct: pricing.miscMarketplacePct,
      closingFeeCostCents: pricing.closingFeeCostCents,
      fulfillmentFeeCostCents: pricing.fulfillmentFeeCostCents,
      storageAllowanceCostCents: pricing.storageAllowanceCostCents,
      advertisingAllowanceCostCents: pricing.advertisingAllowanceCostCents,
      miscMarketplaceCostCents: pricing.miscMarketplaceCostCents,
      breakEvenPriceCents: pricing.breakEvenPriceCents,
      recommendedMinSellPriceCents: pricing.recommendedMinSellPriceCents,
      recommendedTargetSellPriceCents: pricing.recommendedTargetSellPriceCents
    },
    amazonFees: {
      presetName: assumptions.amazonFeePreset?.name ?? null,
      referralFeePct: pricing.referralFeePct,
      referralFeeCostCents: pricing.referralFeeCostCents,
      closingFeeCostCents: pricing.closingFeeCostCents,
      fulfillmentFeeCostCents: pricing.fulfillmentFeeCostCents,
      storageAllowanceCostCents: pricing.storageAllowanceCostCents,
      advertisingAllowancePct: pricing.advertisingAllowancePct,
      advertisingAllowanceCostCents: pricing.advertisingAllowanceCostCents,
      returnReservePct: pricing.returnReservePct,
      returnReserveCostCents: pricing.returnReserveCostCents,
      damageReservePct: pricing.damageReservePct,
      damageReserveCostCents: pricing.damageReserveCostCents,
      miscMarketplacePct: pricing.miscMarketplacePct,
      miscMarketplaceCostCents: pricing.miscMarketplaceCostCents
    },
    shippingZone: {
      id: assumptions.shippingZoneRule?.id ?? null,
      name: assumptions.shippingZoneRule?.name ?? null,
      zoneCode: assumptions.shippingZoneRule?.zoneCode ?? null,
      baseCostCents: shipping.zoneBaseCostCents,
      weightAdderCostCents: assumptions.shippingZoneRule ? shipping.weightCostCents : 0,
      dimensionalAdderCostCents: assumptions.shippingZoneRule ? shipping.dimensionalCostCents : 0,
      bufferCostCents: shipping.bufferCostCents,
      marketplaceHandlingCents:
        assumptions.shippingZoneRule?.marketplaceHandlingCents ?? 0
    }
  };
}

export function compareScenarioResults(
  scenarios: Array<{
    id: string;
    name: string;
    result: ReturnType<typeof calculateShelfCost>;
    assumptionsSnapshot: Record<string, unknown>;
  }>
) {
  if (scenarios.length === 0) {
    throw new Error("At least one scenario is required.");
  }

  const baseline = scenarios[0];
  return {
    baselineScenarioId: baseline.id,
    scenarios: scenarios.map((scenario) => ({
      ...scenario,
      deltas: {
        subtotalCostCents:
          scenario.result.breakdown.subtotalCostCents - baseline.result.breakdown.subtotalCostCents,
        breakEvenPriceCents:
          (scenario.result.breakdown.breakEvenPriceCents ?? 0) -
          (baseline.result.breakdown.breakEvenPriceCents ?? 0),
        recommendedMinSellPriceCents:
          (scenario.result.breakdown.recommendedMinSellPriceCents ?? 0) -
          (baseline.result.breakdown.recommendedMinSellPriceCents ?? 0),
        recommendedTargetSellPriceCents:
          (scenario.result.breakdown.recommendedTargetSellPriceCents ?? 0) -
          (baseline.result.breakdown.recommendedTargetSellPriceCents ?? 0)
      }
    }))
  };
}
