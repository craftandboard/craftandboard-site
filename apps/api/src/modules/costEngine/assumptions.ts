import { decimalToNumber } from "./normalization.js";
import { getCostProfileRecord } from "./repository.js";

export async function resolveCostEngineAssumptions(input: {
  organizationId: string;
  costProfileId: string;
  materialCode: string;
  edgeBandCode?: string | null;
  packagingCode?: string | null;
  shippingCode?: string | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
}) {
  const profile = await getCostProfileRecord({
    organizationId: input.organizationId,
    costProfileId: input.costProfileId
  });

  if (!profile) {
    throw new Error("Cost profile not found.");
  }

  const materialRule = profile.materialCostRules.find((rule: any) => rule.materialCode === input.materialCode);
  if (!materialRule) {
    throw new Error("Material cost rule not found for the selected profile.");
  }

  const edgeBandRule =
    input.edgeBandPattern === "NONE"
      ? null
      : profile.edgeBandCostRules.find((rule: any) => rule.edgeBandCode === input.edgeBandCode);

  if (input.edgeBandPattern !== "NONE" && !edgeBandRule) {
    throw new Error("Edge band rule is required for the selected edge band pattern.");
  }

  const packagingRule = input.packagingCode
    ? profile.packagingCostRules.find((rule: any) => rule.packagingCode === input.packagingCode)
    : null;

  const shippingRule = input.shippingCode
    ? profile.shippingCostRules.find((rule: any) => rule.shippingCode === input.shippingCode)
    : null;
  const amazonFeePreset = input.amazonFeePresetId
    ? profile.amazonFeePresets.find((preset: any) => preset.id === input.amazonFeePresetId)
    : null;
  const shippingZoneRule = input.shippingZoneRuleId
    ? profile.shippingZoneRules.find((rule: any) => rule.id === input.shippingZoneRuleId)
    : null;

  if (input.amazonFeePresetId && !amazonFeePreset) {
    throw new Error("Amazon fee preset not found for the selected profile.");
  }

  if (input.shippingZoneRuleId && !shippingZoneRule) {
    throw new Error("Shipping zone rule not found for the selected profile.");
  }

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      currency: profile.currency,
      defaultMaterialWastePct: decimalToNumber(profile.defaultMaterialWastePct) ?? 0,
      defaultEdgeBandWastePct: decimalToNumber(profile.defaultEdgeBandWastePct) ?? 0,
      defaultLaborRateCentsPerHour: profile.defaultLaborRateCentsPerHour,
      defaultMachineRateCentsPerHour: profile.defaultMachineRateCentsPerHour,
      defaultOverheadRateCentsPerHour: profile.defaultOverheadRateCentsPerHour ?? 0,
      defaultPackagingAllowanceCents: profile.defaultPackagingAllowanceCents ?? 0,
      defaultShippingAllowanceCents: profile.defaultShippingAllowanceCents ?? 0,
      defaultPackingLaborRateCentsPerHour: profile.defaultPackingLaborRateCentsPerHour ?? 0,
      defaultPackingMinutes: decimalToNumber(profile.defaultPackingMinutes),
      defaultMarketplaceFeePct: decimalToNumber(profile.defaultMarketplaceFeePct),
      defaultReturnReservePct: decimalToNumber(profile.defaultReturnReservePct),
      defaultDamageReservePct: decimalToNumber(profile.defaultDamageReservePct),
      defaultShippingBufferPct: decimalToNumber(profile.defaultShippingBufferPct),
      defaultShippingBufferCents: profile.defaultShippingBufferCents ?? 0,
      defaultPackagingOverheadCents: profile.defaultPackagingOverheadCents ?? 0,
      defaultRecommendedMinMarginPct: decimalToNumber(profile.defaultRecommendedMinMarginPct),
      defaultRecommendedTargetMarginPct: decimalToNumber(profile.defaultRecommendedTargetMarginPct),
      targetMarginPct: decimalToNumber(profile.targetMarginPct),
      growthMarginPct: decimalToNumber(profile.growthMarginPct)
    },
    materialRule: {
      id: materialRule.id,
      materialCode: materialRule.materialCode,
      materialName: materialRule.materialName,
      thicknessLabel: materialRule.thicknessLabel ?? null,
      sheetLengthIn: decimalToNumber(materialRule.sheetLengthIn) ?? 0,
      sheetWidthIn: decimalToNumber(materialRule.sheetWidthIn) ?? 0,
      sheetCostCents: materialRule.sheetCostCents,
      usableYieldPct: decimalToNumber(materialRule.usableYieldPct),
      wastePct: decimalToNumber(materialRule.wastePct)
    },
    edgeBandRule: edgeBandRule
      ? {
          id: edgeBandRule.id,
          edgeBandCode: edgeBandRule.edgeBandCode,
          edgeBandName: edgeBandRule.edgeBandName,
          costCentsPerLinearFoot: edgeBandRule.costCentsPerLinearFoot,
          wastePct: decimalToNumber(edgeBandRule.wastePct),
          setupAllowanceLinearFt: decimalToNumber(edgeBandRule.setupAllowanceLinearFt)
        }
      : null,
    packagingRule: packagingRule
      ? {
          id: packagingRule.id,
          packagingCode: packagingRule.packagingCode,
          packagingName: packagingRule.packagingName,
          boxCostCents: packagingRule.boxCostCents,
          bubbleWrapCostCents: packagingRule.bubbleWrapCostCents,
          tapeCostCents: packagingRule.tapeCostCents,
          labelCostCents: packagingRule.labelCostCents,
          insertFlyerCostCents: packagingRule.insertFlyerCostCents,
          shrinkWrapCostCents: packagingRule.shrinkWrapCostCents,
          foamCostCents: packagingRule.foamCostCents,
          cornerProtectorCostCents: packagingRule.cornerProtectorCostCents,
          packingMinutes: decimalToNumber(packagingRule.packingMinutes),
          packingLaborOverrideCents: packagingRule.packingLaborOverrideCents,
          packagingOverheadCents: packagingRule.packagingOverheadCents,
          otherPackagingCostCents: packagingRule.otherPackagingCostCents
        }
      : null,
    shippingRule: shippingRule
      ? {
          id: shippingRule.id,
          shippingCode: shippingRule.shippingCode,
          shippingName: shippingRule.shippingName,
          baseCostCents: shippingRule.baseCostCents,
          costPerPoundCents: shippingRule.costPerPoundCents,
          costPerCubicInchCents: shippingRule.costPerCubicInchCents,
          dimensionalDivisor: decimalToNumber(shippingRule.dimensionalDivisor),
          dimensionalRateCents: shippingRule.dimensionalRateCents,
          shippingBufferPct: decimalToNumber(shippingRule.shippingBufferPct),
          shippingBufferCents: shippingRule.shippingBufferCents,
          marketplaceHandlingCents: shippingRule.marketplaceHandlingCents,
          flatOverride: shippingRule.flatOverride
        }
      : null,
    amazonFeePreset: amazonFeePreset
      ? {
          id: amazonFeePreset.id,
          name: amazonFeePreset.name,
          referralFeePct: decimalToNumber(amazonFeePreset.referralFeePct) ?? 0,
          closingFeeCents: amazonFeePreset.closingFeeCents,
          fulfillmentFeeCents: amazonFeePreset.fulfillmentFeeCents,
          storageAllowanceCents: amazonFeePreset.storageAllowanceCents,
          advertisingAllowancePct: decimalToNumber(amazonFeePreset.advertisingAllowancePct),
          advertisingAllowanceCents: amazonFeePreset.advertisingAllowanceCents,
          returnReservePct: decimalToNumber(amazonFeePreset.returnReservePct),
          returnReserveCents: amazonFeePreset.returnReserveCents,
          damageReservePct: decimalToNumber(amazonFeePreset.damageReservePct),
          damageReserveCents: amazonFeePreset.damageReserveCents,
          miscMarketplacePct: decimalToNumber(amazonFeePreset.miscMarketplacePct),
          miscMarketplaceCents: amazonFeePreset.miscMarketplaceCents
        }
      : null,
    shippingZoneRule: shippingZoneRule
      ? {
          id: shippingZoneRule.id,
          name: shippingZoneRule.name,
          zoneCode: shippingZoneRule.zoneCode,
          baseCostCents: shippingZoneRule.baseCostCents,
          weightAdderCents: shippingZoneRule.weightAdderCents,
          dimensionalAdderCents: shippingZoneRule.dimensionalAdderCents,
          bufferPct: decimalToNumber(shippingZoneRule.bufferPct),
          bufferCents: shippingZoneRule.bufferCents,
          marketplaceHandlingCents: shippingZoneRule.marketplaceHandlingCents
        }
      : null
  };
}
