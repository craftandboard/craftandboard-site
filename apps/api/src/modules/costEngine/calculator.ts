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
  rule?: CostEngineShippingRule | null
) {
  if (!rule) {
    const bufferCostCents = clampCurrency(
      profile.defaultShippingAllowanceCents *
        percentToMultiplier(profile.defaultShippingBufferPct ?? 0)
    ) + profile.defaultShippingBufferCents;
    return {
      baseCostCents: profile.defaultShippingAllowanceCents,
      weightCostCents: 0,
      volumeCostCents: 0,
      dimensionalCostCents: 0,
      marketplaceHandlingCents: 0,
      bufferCostCents,
      costCents: profile.defaultShippingAllowanceCents + bufferCostCents
    };
  }

  if (rule.flatOverride !== null && rule.flatOverride !== undefined) {
    const bufferPct = input.shippingBufferPct ?? rule.shippingBufferPct ?? profile.defaultShippingBufferPct ?? 0;
    const bufferCents = input.shippingBufferCents ?? rule.shippingBufferCents ?? profile.defaultShippingBufferCents;
    const bufferCostCents = clampCurrency(rule.flatOverride * percentToMultiplier(bufferPct)) + (bufferCents ?? 0);
    const marketplaceHandlingCents = rule.marketplaceHandlingCents ?? 0;
    return {
      baseCostCents: rule.flatOverride,
      weightCostCents: 0,
      volumeCostCents: 0,
      dimensionalCostCents: 0,
      marketplaceHandlingCents,
      bufferCostCents,
      costCents: clampCurrency(rule.flatOverride + marketplaceHandlingCents + bufferCostCents)
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
  const marketplaceHandlingCents = rule.marketplaceHandlingCents ?? 0;
  const bufferPct = input.shippingBufferPct ?? rule.shippingBufferPct ?? profile.defaultShippingBufferPct ?? 0;
  const bufferCents = input.shippingBufferCents ?? rule.shippingBufferCents ?? profile.defaultShippingBufferCents;
  const baseBeforeBuffer =
    profile.defaultShippingAllowanceCents +
    rule.baseCostCents +
    weightCostCents +
    volumeCostCents +
    dimensionalCostCents +
    marketplaceHandlingCents;
  const bufferCostCents = clampCurrency(baseBeforeBuffer * percentToMultiplier(bufferPct)) + (bufferCents ?? 0);

  return {
    baseCostCents: profile.defaultShippingAllowanceCents + rule.baseCostCents,
    weightCostCents,
    volumeCostCents,
    dimensionalCostCents,
    marketplaceHandlingCents,
    bufferCostCents,
    costCents: clampCurrency(baseBeforeBuffer + bufferCostCents)
  };
}

function calculateRecommendedSellPrices(input: CostEngineCalculationInput, profile: CostEngineProfileDefaults, subtotalCostCents: number) {
  const marketplaceFeePct = input.marketplaceFeePct ?? profile.defaultMarketplaceFeePct ?? 0;
  const returnReservePct = input.returnReservePct ?? profile.defaultReturnReservePct ?? 0;
  const damageReservePct = input.damageReservePct ?? profile.defaultDamageReservePct ?? 0;
  const targetMarginPct = input.targetMarginPct ?? profile.targetMarginPct;
  const growthMarginPct = input.growthMarginPct ?? profile.growthMarginPct;
  const minMarginPct = profile.defaultRecommendedMinMarginPct ?? targetMarginPct ?? 0;
  const targetSellMarginPct = profile.defaultRecommendedTargetMarginPct ?? growthMarginPct ?? targetMarginPct ?? 0;

  const marketplaceFeeCostCents = clampCurrency(subtotalCostCents * percentToMultiplier(marketplaceFeePct));
  const returnReserveCostCents = clampCurrency(subtotalCostCents * percentToMultiplier(returnReservePct));
  const damageReserveCostCents = clampCurrency(subtotalCostCents * percentToMultiplier(damageReservePct));
  const breakEvenPriceCents =
    subtotalCostCents + marketplaceFeeCostCents + returnReserveCostCents + damageReserveCostCents;

  const recommendedInternalPriceCents =
    targetMarginPct && targetMarginPct > 0 && targetMarginPct < 100
      ? clampCurrency(subtotalCostCents / (1 - percentToMultiplier(targetMarginPct)))
      : subtotalCostCents;
  const recommendedMinSellPriceCents =
    minMarginPct > 0 && minMarginPct < 100
      ? clampCurrency(breakEvenPriceCents / (1 - percentToMultiplier(minMarginPct)))
      : breakEvenPriceCents;
  const recommendedTargetSellPriceCents =
    targetSellMarginPct > 0 && targetSellMarginPct < 100
      ? clampCurrency(breakEvenPriceCents / (1 - percentToMultiplier(targetSellMarginPct)))
      : breakEvenPriceCents;
  const recommendedSellPriceCents = Math.max(recommendedMinSellPriceCents, recommendedTargetSellPriceCents);

  return {
    marketplaceFeePct,
    returnReservePct,
    damageReservePct,
    growthMarginPct,
    targetMarginPct,
    marketplaceFeeCostCents,
    returnReserveCostCents,
    damageReserveCostCents,
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
  const shipping = calculateShippingCost(input, assumptions.profile, assumptions.shippingRule);

  const subtotalCostCents =
    material.costCents +
    edgeBand.costCents +
    laborCostCents +
    machineCostCents +
    overheadCostCents +
    packaging.costCents +
    shipping.costCents;
  const pricing = calculateRecommendedSellPrices(input, assumptions.profile, subtotalCostCents);

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
      returnReserveCostCents: pricing.returnReserveCostCents,
      damageReserveCostCents: pricing.damageReserveCostCents,
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
      shippingBufferCostCents: shipping.bufferCostCents
    },
    pricing: {
      targetMarginPct: pricing.targetMarginPct,
      growthMarginPct: pricing.growthMarginPct,
      marketplaceFeePct: pricing.marketplaceFeePct,
      returnReservePct: pricing.returnReservePct,
      damageReservePct: pricing.damageReservePct,
      breakEvenPriceCents: pricing.breakEvenPriceCents,
      recommendedMinSellPriceCents: pricing.recommendedMinSellPriceCents,
      recommendedTargetSellPriceCents: pricing.recommendedTargetSellPriceCents
    }
  };
}
