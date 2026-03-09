import type { MaterialCode } from "@craft-and-board/shared";
import type { CostingEdgeBandPattern } from "./contracts.js";

type CostProfileView = {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
};

type RateMap = Map<string, { value: number; unit: string; effectiveFrom: string }>;

type MaterialProfileView = {
  sheetWidthIn?: number;
  sheetDepthIn?: number;
};

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function fromRate(rates: RateMap, key: string) {
  const rate = rates.get(key);
  if (!rate) {
    throw new Error(`Missing required cost rate: ${key}.`);
  }
  return rate;
}

function optionalRate(rates: RateMap, key: string) {
  return rates.get(key);
}

function edgeBandLinearIn(lengthIn: number, depthIn: number, edgeBandPattern: CostingEdgeBandPattern) {
  switch (edgeBandPattern) {
    case "NONE":
      return 0;
    case "ONE_LONG_EDGE":
      return lengthIn;
    case "TWO_LONG_EDGES":
      return lengthIn * 2;
    case "TWO_SHORT_EDGES":
      return depthIn * 2;
    case "ALL_FOUR":
      return (lengthIn * 2) + (depthIn * 2);
  }
}

export function calculateShelfManufacturingCost(input: {
  profile: CostProfileView;
  materialProfile?: MaterialProfileView;
  materialType: MaterialCode;
  costProfileId: string;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number;
  quantity: number;
  edgeBandPattern: CostingEdgeBandPattern;
  requiresPackaging: boolean;
  shippingClass?: string;
  rates: RateMap;
}) {
  const warnings: string[] = [];
  const assumptionsUsed = Array.from(input.rates.entries()).map(([key, value]) => ({
    key,
    value: value.value,
    unit: value.unit,
    effectiveFrom: value.effectiveFrom
  }));

  const areaSqInPerUnit = input.lengthIn * input.depthIn;
  const areaSqFtPerUnit = areaSqInPerUnit / 144;
  const perimeterInPerUnit = (input.lengthIn * 2) + (input.depthIn * 2);
  const edgeBandLinearInPerUnit = edgeBandLinearIn(input.lengthIn, input.depthIn, input.edgeBandPattern);
  const edgeBandLinearFtPerUnit = edgeBandLinearInPerUnit / 12;
  const totalAreaSqFt = areaSqFtPerUnit * input.quantity;
  const totalEdgeBandLinearFt = edgeBandLinearFtPerUnit * input.quantity;

  const wastePercent = fromRate(input.rates, "waste_percent").value / 100;
  const effectiveAreaSqFt = totalAreaSqFt * (1 + wastePercent);

  let materialSubtotalCents = 0;
  const sqftRate = optionalRate(input.rates, "sheet_material_cost_per_sqft");
  const perSheetRate = optionalRate(input.rates, "sheet_material_cost_per_sheet");
  if (sqftRate) {
    materialSubtotalCents = toCents(effectiveAreaSqFt * sqftRate.value);
  } else if (perSheetRate) {
    if (!input.materialProfile?.sheetWidthIn || !input.materialProfile?.sheetDepthIn) {
      throw new Error("Missing material sheet dimensions for sheet-based material costing.");
    }
    const sheetAreaSqFt = (input.materialProfile.sheetWidthIn * input.materialProfile.sheetDepthIn) / 144;
    const sheetCostPerSqFt = perSheetRate.value / sheetAreaSqFt;
    materialSubtotalCents = toCents(effectiveAreaSqFt * sheetCostPerSqFt);
  } else {
    throw new Error("Missing required cost rate: sheet_material_cost_per_sqft or sheet_material_cost_per_sheet.");
  }

  const edgeBandRate = fromRate(input.rates, "edge_band_cost_per_linear_ft").value;
  const glueRate = fromRate(input.rates, "glue_cost_per_linear_ft").value;
  const cncMachineCostPerMin = fromRate(input.rates, "cnc_machine_cost_per_min").value;
  const edgebanderCostPerMin = fromRate(input.rates, "edgebander_cost_per_min").value;
  const laborCostPerMin = fromRate(input.rates, "labor_cost_per_min").value;
  const setupMinutesPerRun = fromRate(input.rates, "setup_minutes_per_run").value;
  const handlingMinutesPerUnit = fromRate(input.rates, "handling_minutes_per_unit").value;
  const cncMinutesPerSqft = fromRate(input.rates, "cnc_minutes_per_sqft").value;
  const edgebanderMinutesPerLinearFt = fromRate(input.rates, "edgebander_minutes_per_linear_ft").value;
  const overheadPercent = fromRate(input.rates, "overhead_percent").value / 100;
  const growthMarginPercent = fromRate(input.rates, "growth_margin_percent").value / 100;

  const edgeBandSubtotalCents = toCents(totalEdgeBandLinearFt * edgeBandRate);
  const glueSubtotalCents = toCents(totalEdgeBandLinearFt * glueRate);

  const cncRunMinutes = totalAreaSqFt * cncMinutesPerSqft;
  const edgebanderRunMinutes = totalEdgeBandLinearFt * edgebanderMinutesPerLinearFt;
  const machineSubtotalCents = toCents(
    ((setupMinutesPerRun + cncRunMinutes) * cncMachineCostPerMin) +
    (edgebanderRunMinutes * edgebanderCostPerMin)
  );

  const packagingMinutesPerUnit = input.requiresPackaging
    ? (optionalRate(input.rates, "packaging_minutes_per_unit")?.value ?? 0)
    : 0;
  const laborMinutes = (handlingMinutesPerUnit + packagingMinutesPerUnit) * input.quantity;
  const laborSubtotalCents = toCents(laborMinutes * laborCostPerMin);

  let packagingSubtotalCents = 0;
  if (input.requiresPackaging) {
    packagingSubtotalCents = toCents(
      (optionalRate(input.rates, "packaging_cost_per_unit")?.value ?? 0) * input.quantity +
      (optionalRate(input.rates, "packaging_cost_per_order")?.value ?? 0)
    );
    if (!input.rates.has("packaging_cost_per_unit") && !input.rates.has("packaging_cost_per_order")) {
      throw new Error("Missing required cost rate: packaging_cost_per_unit or packaging_cost_per_order.");
    }
  }

  const shippingPerUnit = optionalRate(input.rates, "shipping_allowance_per_unit")?.value ?? 0;
  const shippingPerOrder = optionalRate(input.rates, "shipping_allowance_per_order")?.value ?? 0;
  if (!input.rates.has("shipping_allowance_per_unit") && !input.rates.has("shipping_allowance_per_order")) {
    throw new Error("Missing required cost rate: shipping_allowance_per_unit or shipping_allowance_per_order.");
  }
  const shippingAllowanceCents = toCents((shippingPerUnit * input.quantity) + shippingPerOrder);

  const directSubtotalCents =
    materialSubtotalCents +
    edgeBandSubtotalCents +
    glueSubtotalCents +
    machineSubtotalCents +
    laborSubtotalCents +
    packagingSubtotalCents +
    shippingAllowanceCents;

  const overheadAmountCents = Math.round(directSubtotalCents * overheadPercent);
  const recommendedManufacturingChargeCents = directSubtotalCents + overheadAmountCents;
  const growthMarginAmountCents = Math.round(recommendedManufacturingChargeCents * growthMarginPercent);
  const recommendedSellPriceCents = recommendedManufacturingChargeCents + growthMarginAmountCents;

  if (input.edgeBandPattern !== "NONE" && totalEdgeBandLinearFt === 0) {
    warnings.push("Edge band pattern produced zero linear footage.");
  }

  return {
    profile: {
      id: input.profile.id,
      name: input.profile.name,
      currency: input.profile.currency,
      isDefault: input.profile.isDefault
    },
    input: {
      costProfileId: input.costProfileId,
      lengthIn: input.lengthIn,
      depthIn: input.depthIn,
      thicknessIn: input.thicknessIn ?? 0.75,
      quantity: input.quantity,
      materialType: input.materialType,
      edgeBandPattern: input.edgeBandPattern,
      requiresPackaging: input.requiresPackaging,
      shippingClass: input.shippingClass
    },
    geometry: {
      squareInchesPerUnit: areaSqInPerUnit,
      squareFeetPerUnit: Number(areaSqFtPerUnit.toFixed(4)),
      totalSquareFeet: Number(totalAreaSqFt.toFixed(4)),
      perimeterInchesPerUnit: perimeterInPerUnit,
      edgeBandLinearFeetPerUnit: Number(edgeBandLinearFtPerUnit.toFixed(4)),
      totalEdgeBandLinearFeet: Number(totalEdgeBandLinearFt.toFixed(4))
    },
    breakdown: {
      material: { subtotalCents: materialSubtotalCents },
      edgeBand: { subtotalCents: edgeBandSubtotalCents },
      glueConsumables: { subtotalCents: glueSubtotalCents },
      machine: {
        subtotalCents: machineSubtotalCents,
        setupMinutes: Number(setupMinutesPerRun.toFixed(3)),
        cncRunMinutes: Number(cncRunMinutes.toFixed(3)),
        edgebanderRunMinutes: Number(edgebanderRunMinutes.toFixed(3))
      },
      labor: {
        subtotalCents: laborSubtotalCents,
        totalMinutes: Number(laborMinutes.toFixed(3))
      },
      packaging: { subtotalCents: packagingSubtotalCents },
      shippingAllowance: { subtotalCents: shippingAllowanceCents },
      directSubtotalCents,
      overheadAmountCents,
      growthMarginAmountCents,
      recommendedManufacturingChargeCents,
      recommendedSellPriceCents,
      unitManufacturingChargeCents: Math.round(recommendedManufacturingChargeCents / input.quantity),
      unitSellPriceCents: Math.round(recommendedSellPriceCents / input.quantity)
    },
    assumptionsUsed,
    warnings,
    calculatedAt: new Date().toISOString()
  };
}
