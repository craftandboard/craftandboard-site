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
  otherPackagingCostCents: number | null;
}

export interface CostEngineShippingRule {
  id: string;
  shippingCode: string;
  shippingName: string;
  baseCostCents: number;
  costPerPoundCents: number | null;
  costPerCubicInchCents: number | null;
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
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
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
  profile: CostEngineProfileDefaults,
  rule?: CostEnginePackagingRule | null
) {
  const parts = [
    rule?.boxCostCents ?? 0,
    rule?.bubbleWrapCostCents ?? 0,
    rule?.tapeCostCents ?? 0,
    rule?.labelCostCents ?? 0,
    rule?.insertFlyerCostCents ?? 0,
    rule?.shrinkWrapCostCents ?? 0,
    rule?.otherPackagingCostCents ?? 0
  ];

  return clampCurrency(parts.reduce((sum, value) => sum + value, profile.defaultPackagingAllowanceCents));
}

function calculateShippingCost(
  input: CostEngineCalculationInput,
  profile: CostEngineProfileDefaults,
  rule?: CostEngineShippingRule | null
) {
  if (!rule) {
    return profile.defaultShippingAllowanceCents;
  }

  if (rule.flatOverride !== null && rule.flatOverride !== undefined) {
    return clampCurrency(rule.flatOverride);
  }

  const cubicInches =
    input.thicknessIn && input.thicknessIn > 0
      ? input.lengthIn * input.depthIn * input.thicknessIn * input.quantity
      : 0;
  const weightCost = input.weightLb ? input.weightLb * (rule.costPerPoundCents ?? 0) : 0;
  const volumeCost = cubicInches * (rule.costPerCubicInchCents ?? 0);

  return clampCurrency(profile.defaultShippingAllowanceCents + rule.baseCostCents + weightCost + volumeCost);
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
  const packagingCostCents = calculatePackagingCost(assumptions.profile, assumptions.packagingRule);
  const shippingCostCents = calculateShippingCost(input, assumptions.profile, assumptions.shippingRule);

  const subtotalCostCents =
    material.costCents +
    edgeBand.costCents +
    laborCostCents +
    machineCostCents +
    overheadCostCents +
    packagingCostCents +
    shippingCostCents;

  const targetMarginPct = input.targetMarginPct ?? assumptions.profile.targetMarginPct;
  const growthMarginPct = input.growthMarginPct ?? assumptions.profile.growthMarginPct;
  const targetMarginMultiplier =
    targetMarginPct && targetMarginPct > 0 && targetMarginPct < 100
      ? 1 / (1 - percentToMultiplier(targetMarginPct))
      : 1;
  const growthMarginMultiplier =
    growthMarginPct && growthMarginPct > 0 && growthMarginPct < 100
      ? 1 / (1 - percentToMultiplier(growthMarginPct))
      : 1;

  const recommendedInternalPriceCents = clampCurrency(subtotalCostCents * targetMarginMultiplier);
  const recommendedSellPriceCents = clampCurrency(
    recommendedInternalPriceCents * growthMarginMultiplier
  );

  return {
    currency: assumptions.profile.currency,
    quantity: input.quantity,
    breakdown: {
      materialCostCents: material.costCents,
      edgeBandCostCents: edgeBand.costCents,
      laborCostCents,
      machineCostCents,
      packagingCostCents,
      shippingCostCents,
      overheadCostCents,
      subtotalCostCents,
      recommendedInternalPriceCents,
      recommendedSellPriceCents
    },
    geometry: {
      requiredAreaSqFt: material.requiredAreaSqFt,
      sheetAreaSqFt: material.sheetAreaSqFt,
      sheetsRequired: material.sheetsRequired,
      edgeBandLinearFeet: edgeBand.linearFeet,
      effectiveEdgeBandLinearFeet: edgeBand.effectiveLinearFeet
    },
    pricing: {
      targetMarginPct,
      growthMarginPct
    }
  };
}
