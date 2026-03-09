import { calculateShelfManufacturingCost } from "../costing/calculator.js";

function toRateMap(baseRates: Map<string, { value: number; unit: string; effectiveFrom: string }>) {
  return new Map(baseRates);
}

function roundCharge(value: number, mode: "NONE" | "NEAREST" | "UP", roundToCents?: number | null) {
  const increment = roundToCents && roundToCents > 0 ? roundToCents : 1;
  if (mode === "NONE") {
    return value;
  }
  if (mode === "NEAREST") {
    return Math.round(value / increment) * increment;
  }
  return Math.ceil(value / increment) * increment;
}

export function calculateShelfPricing(input: {
  normalizedInput: {
    shelfProductId?: string;
    costProfileId: string;
    productionAssumptionProfileId: string;
    packagingProfileId?: string;
    pricingPolicyId: string;
    lengthIn: number;
    depthIn: number;
    thicknessIn: number;
    quantity: number;
    materialType: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
    requiresPackaging: boolean;
  };
  product?: {
    id: string;
    name: string;
    code: string;
  };
  costProfile: {
    id: string;
    name: string;
    currency: string;
    isDefault: boolean;
  };
  productionAssumptionProfile: {
    id: string;
    name: string;
    cncLoadMinutesPerRun: number;
    cncUnloadMinutesPerRun: number;
    cncRunMinutesPerUnit: number;
    edgebanderSetupMinutesPerRun: number;
    edgebanderRunMinutesPerLinearFt: number;
    handlingMinutesPerUnit: number;
    packagingMinutesPerUnit: number;
    qcMinutesPerUnit: number;
  };
  packagingProfile?: {
    id: string;
    name: string;
    boxCostCentsPerUnit: number;
    bubbleWrapCostCentsPerUnit: number;
    shrinkWrapCostCentsPerUnit: number;
    tapeCostCentsPerUnit: number;
    labelCostCentsPerUnit: number;
    insertFlyerCostCentsPerUnit: number;
    otherPackagingCostCentsPerUnit: number;
  };
  pricingPolicy: {
    id: string;
    name: string;
    manufacturingMarkupPercent: number;
    minimumChargeCentsPerUnit?: number;
    minimumRunChargeCents?: number;
    roundingMode: "NONE" | "NEAREST" | "UP";
    roundToCents?: number;
  };
  materialProfile?: {
    sheetWidthIn?: number;
    sheetDepthIn?: number;
  };
  baseRates: Map<string, { value: number; unit: string; effectiveFrom: string }>;
}) {
  const rates = toRateMap(input.baseRates);
  const productionSetupMinutes =
    input.productionAssumptionProfile.cncLoadMinutesPerRun +
    input.productionAssumptionProfile.cncUnloadMinutesPerRun;

  rates.set("setup_minutes_per_run", {
    value: productionSetupMinutes,
    unit: "minutes",
    effectiveFrom: "derived"
  });
  rates.set("cnc_minutes_per_sqft", {
    value: input.productionAssumptionProfile.cncRunMinutesPerUnit / ((input.normalizedInput.lengthIn * input.normalizedInput.depthIn) / 144),
    unit: "minutes_per_sqft",
    effectiveFrom: "derived"
  });
  rates.set("edgebander_minutes_per_linear_ft", {
    value: input.productionAssumptionProfile.edgebanderRunMinutesPerLinearFt,
    unit: "minutes_per_linear_ft",
    effectiveFrom: "derived"
  });
  rates.set("handling_minutes_per_unit", {
    value: input.productionAssumptionProfile.handlingMinutesPerUnit + input.productionAssumptionProfile.qcMinutesPerUnit,
    unit: "minutes_per_unit",
    effectiveFrom: "derived"
  });
  rates.set("packaging_minutes_per_unit", {
    value: input.normalizedInput.requiresPackaging ? input.productionAssumptionProfile.packagingMinutesPerUnit : 0,
    unit: "minutes_per_unit",
    effectiveFrom: "derived"
  });

  if (input.normalizedInput.requiresPackaging) {
    if (!input.packagingProfile) {
      throw new Error("Packaging profile is required when requiresPackaging is true.");
    }
    const packagingCostPerUnit =
      input.packagingProfile.boxCostCentsPerUnit +
      input.packagingProfile.bubbleWrapCostCentsPerUnit +
      input.packagingProfile.shrinkWrapCostCentsPerUnit +
      input.packagingProfile.tapeCostCentsPerUnit +
      input.packagingProfile.labelCostCentsPerUnit +
      input.packagingProfile.insertFlyerCostCentsPerUnit +
      input.packagingProfile.otherPackagingCostCentsPerUnit;

    rates.set("packaging_cost_per_unit", {
      value: packagingCostPerUnit / 100,
      unit: "usd_per_unit",
      effectiveFrom: "derived"
    });
  }

  const costResult = calculateShelfManufacturingCost({
    profile: input.costProfile,
    materialProfile: input.materialProfile,
    rates,
    costProfileId: input.normalizedInput.costProfileId,
    materialType: input.normalizedInput.materialType,
    lengthIn: input.normalizedInput.lengthIn,
    depthIn: input.normalizedInput.depthIn,
    thicknessIn: input.normalizedInput.thicknessIn,
    quantity: input.normalizedInput.quantity,
    edgeBandPattern: input.normalizedInput.edgeBandPattern,
    requiresPackaging: input.normalizedInput.requiresPackaging
  });

  const baseRunCharge = costResult.breakdown.recommendedManufacturingChargeCents;
  const policyMarkupAmountCents = Math.round(
    costResult.breakdown.recommendedManufacturingChargeCents * (input.pricingPolicy.manufacturingMarkupPercent / 100)
  );

  let finalRunChargeCents = baseRunCharge + policyMarkupAmountCents;
  let minimumAdjustmentAmountCents = 0;
  const minimumUnitChargeCents = input.pricingPolicy.minimumChargeCentsPerUnit
    ? input.pricingPolicy.minimumChargeCentsPerUnit * input.normalizedInput.quantity
    : 0;
  const minimumRunChargeCents = input.pricingPolicy.minimumRunChargeCents ?? 0;
  const minimumFloor = Math.max(minimumUnitChargeCents, minimumRunChargeCents);

  if (finalRunChargeCents < minimumFloor) {
    minimumAdjustmentAmountCents = minimumFloor - finalRunChargeCents;
    finalRunChargeCents = minimumFloor;
  }

  const roundedFinalRunChargeCents = roundCharge(
    finalRunChargeCents,
    input.pricingPolicy.roundingMode,
    input.pricingPolicy.roundToCents
  );
  minimumAdjustmentAmountCents += roundedFinalRunChargeCents - finalRunChargeCents;
  finalRunChargeCents = roundedFinalRunChargeCents;

  return {
    product: input.product,
    normalizedInput: input.normalizedInput,
    costProfile: input.costProfile,
    productionAssumptionProfile: {
      id: input.productionAssumptionProfile.id,
      name: input.productionAssumptionProfile.name
    },
    packagingProfile: input.packagingProfile
      ? {
          id: input.packagingProfile.id,
          name: input.packagingProfile.name
        }
      : undefined,
    pricingPolicy: {
      id: input.pricingPolicy.id,
      name: input.pricingPolicy.name,
      roundingMode: input.pricingPolicy.roundingMode,
      roundToCents: input.pricingPolicy.roundToCents
    },
    geometry: costResult.geometry,
    costBreakdown: costResult.breakdown,
    pricingBreakdown: {
      directSubtotalCents: costResult.breakdown.directSubtotalCents,
      overheadAmountCents: costResult.breakdown.overheadAmountCents,
      growthMarginAmountCents: costResult.breakdown.growthMarginAmountCents,
      manufacturingChargeCents: costResult.breakdown.recommendedManufacturingChargeCents,
      policyMarkupAmountCents,
      minimumAdjustmentAmountCents,
      finalRunChargeCents,
      unitFinalChargeCents: Math.round(finalRunChargeCents / input.normalizedInput.quantity)
    },
    quantityAnalysis: {
      quantity: input.normalizedInput.quantity,
      setupCostAllocationCents: Math.round(costResult.breakdown.machine.subtotalCents / input.normalizedInput.quantity),
      unitCostCents: Math.round(costResult.breakdown.recommendedManufacturingChargeCents / input.normalizedInput.quantity),
      unitChargeCents: Math.round(finalRunChargeCents / input.normalizedInput.quantity)
    },
    assumptionsUsed: costResult.assumptionsUsed,
    warnings: costResult.warnings,
    calculatedAt: costResult.calculatedAt
  };
}
