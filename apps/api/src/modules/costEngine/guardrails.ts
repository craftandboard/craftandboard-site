import type { LaunchRiskLevel } from "./contracts.js";

type GuardrailProfile = {
  id: string;
  name: string;
  minimumMarginPct: number;
  minimumBufferAboveBreakEvenPct: number | null;
  maximumFeeBurdenPct: number | null;
  maximumShippingBurdenPct: number | null;
  maximumReserveBurdenPct: number | null;
  maximumAllowedTargetToFloorGapPct: number | null;
};

type ScenarioResult = {
  breakdown: {
    subtotalCostCents: number;
    breakEvenPriceCents: number;
    recommendedMinSellPriceCents: number;
    recommendedTargetSellPriceCents: number;
    marketplaceFeeCostCents: number;
    returnReserveCostCents: number;
    damageReserveCostCents: number;
  };
  shipping: {
    baseCostCents: number;
    weightCostCents?: number;
    volumeCostCents?: number;
    dimensionalCostCents?: number;
    shippingBufferCostCents: number;
  };
  amazonFees?: {
    closingFeeCostCents?: number;
    fulfillmentFeeCostCents?: number;
    storageAllowanceCostCents?: number;
    advertisingAllowanceCostCents?: number;
    miscMarketplaceCostCents?: number;
  } | null;
};

type ScenarioForGuardrails = {
  id: string;
  name: string;
  launchStrategy: string | null;
  assumptionsSnapshot: Record<string, unknown>;
  result: ScenarioResult;
};

function percentOf(amount: number, total: number) {
  if (total <= 0) return 0;
  return Number(((amount / total) * 100).toFixed(4));
}

function ratioDelta(high: number, low: number) {
  if (low <= 0) return high > 0 ? 100 : 0;
  return Number((((high - low) / low) * 100).toFixed(4));
}

function buildWarning(code: string, severity: LaunchRiskLevel, message: string, details: Record<string, unknown>) {
  return { code, severity, message, details };
}

export function evaluateScenarioGuardrails(input: {
  scenario: ScenarioForGuardrails;
  guardrailProfile: GuardrailProfile;
  comparisonContext?: {
    lowestTargetSellPriceCents: number;
    highestTargetSellPriceCents: number;
    recommendedScenarioId?: string | null;
  };
}) {
  const { scenario, guardrailProfile, comparisonContext } = input;
  const target = scenario.result.breakdown.recommendedTargetSellPriceCents;
  const floor = scenario.result.breakdown.recommendedMinSellPriceCents;
  const breakEven = scenario.result.breakdown.breakEvenPriceCents;
  const subtotal = Math.max(1, scenario.result.breakdown.subtotalCostCents);
  const totalShipping =
    scenario.result.shipping.baseCostCents +
    (scenario.result.shipping.weightCostCents ?? 0) +
    (scenario.result.shipping.volumeCostCents ?? 0) +
    (scenario.result.shipping.dimensionalCostCents ?? 0) +
    scenario.result.shipping.shippingBufferCostCents;
  const totalReserves =
    scenario.result.breakdown.returnReserveCostCents + scenario.result.breakdown.damageReserveCostCents;
  const totalFees =
    scenario.result.breakdown.marketplaceFeeCostCents +
    (scenario.result.amazonFees?.closingFeeCostCents ?? 0) +
    (scenario.result.amazonFees?.fulfillmentFeeCostCents ?? 0) +
    (scenario.result.amazonFees?.storageAllowanceCostCents ?? 0) +
    (scenario.result.amazonFees?.advertisingAllowanceCostCents ?? 0) +
    (scenario.result.amazonFees?.miscMarketplaceCostCents ?? 0);
  const realizedMarginPct = percentOf(target - breakEven, target);
  const bufferAboveBreakEvenPct = percentOf(target - breakEven, breakEven || target);
  const feeBurdenPct = percentOf(totalFees, target);
  const shippingBurdenPct = percentOf(totalShipping, target);
  const reserveBurdenPct = percentOf(totalReserves, target);
  const targetToFloorGapPct = percentOf(target - floor, floor || target);

  const warnings = [];

  if (realizedMarginPct < guardrailProfile.minimumMarginPct) {
    warnings.push(
      buildWarning(
        "LOW_MARGIN_BUFFER",
        "HIGH",
        "Projected margin sits below the minimum acceptable launch margin.",
        { realizedMarginPct, minimumMarginPct: guardrailProfile.minimumMarginPct }
      )
    );
  }

  if (
    guardrailProfile.minimumBufferAboveBreakEvenPct !== null &&
    bufferAboveBreakEvenPct < guardrailProfile.minimumBufferAboveBreakEvenPct
  ) {
    warnings.push(
      buildWarning(
        "NEAR_BREAK_EVEN",
        "HIGH",
        "Launch price is too close to break-even for a safe rollout.",
        {
          bufferAboveBreakEvenPct,
          minimumBufferAboveBreakEvenPct: guardrailProfile.minimumBufferAboveBreakEvenPct
        }
      )
    );
  }

  if (
    guardrailProfile.maximumFeeBurdenPct !== null &&
    feeBurdenPct > guardrailProfile.maximumFeeBurdenPct
  ) {
    warnings.push(
      buildWarning("HIGH_FEE_BURDEN", "MEDIUM", "Marketplace fees consume too much of the launch price.", {
        feeBurdenPct,
        maximumFeeBurdenPct: guardrailProfile.maximumFeeBurdenPct
      })
    );
  }

  if (
    guardrailProfile.maximumShippingBurdenPct !== null &&
    shippingBurdenPct > guardrailProfile.maximumShippingBurdenPct
  ) {
    warnings.push(
      buildWarning("HIGH_SHIPPING_BURDEN", "MEDIUM", "Shipping cost is too large relative to the launch price.", {
        shippingBurdenPct,
        maximumShippingBurdenPct: guardrailProfile.maximumShippingBurdenPct
      })
    );
  }

  if (
    guardrailProfile.maximumReserveBurdenPct !== null &&
    reserveBurdenPct > guardrailProfile.maximumReserveBurdenPct
  ) {
    warnings.push(
      buildWarning("HIGH_RESERVE_BURDEN", "MEDIUM", "Reserve load is too heavy for the current launch price.", {
        reserveBurdenPct,
        maximumReserveBurdenPct: guardrailProfile.maximumReserveBurdenPct
      })
    );
  }

  if (
    guardrailProfile.maximumAllowedTargetToFloorGapPct !== null &&
    targetToFloorGapPct > guardrailProfile.maximumAllowedTargetToFloorGapPct
  ) {
    warnings.push(
      buildWarning(
        "WIDE_TARGET_TO_FLOOR_GAP",
        "LOW",
        "Safer-margin pricing sits materially above the minimum price floor.",
        {
          targetToFloorGapPct,
          maximumAllowedTargetToFloorGapPct: guardrailProfile.maximumAllowedTargetToFloorGapPct
        }
      )
    );
  }

  if (comparisonContext) {
    const sensitivityPct = ratioDelta(
      comparisonContext.highestTargetSellPriceCents,
      comparisonContext.lowestTargetSellPriceCents
    );
    if (sensitivityPct >= 15) {
      warnings.push(
        buildWarning(
          "HIGH_SCENARIO_SENSITIVITY",
          comparisonContext.recommendedScenarioId === scenario.id ? "MEDIUM" : "LOW",
          "Target price moves materially across compared scenarios.",
          { sensitivityPct }
        )
      );
    }
  }

  const riskScore = Number(
    (
      Math.max(0, guardrailProfile.minimumMarginPct - realizedMarginPct) * 1.8 +
      Math.max(
        0,
        (guardrailProfile.minimumBufferAboveBreakEvenPct ?? 0) - bufferAboveBreakEvenPct
      ) *
        1.4 +
      Math.max(0, feeBurdenPct - (guardrailProfile.maximumFeeBurdenPct ?? 100)) * 1.2 +
      Math.max(0, shippingBurdenPct - (guardrailProfile.maximumShippingBurdenPct ?? 100)) +
      Math.max(0, reserveBurdenPct - (guardrailProfile.maximumReserveBurdenPct ?? 100)) +
      warnings.filter((warning) => warning.severity === "HIGH").length * 18 +
      warnings.filter((warning) => warning.severity === "MEDIUM").length * 9 +
      warnings.filter((warning) => warning.severity === "LOW").length * 4
    ).toFixed(4)
  );

  const riskLevel: LaunchRiskLevel =
    riskScore >= 35 || warnings.some((warning) => warning.severity === "HIGH")
      ? "HIGH"
      : riskScore >= 15 || warnings.some((warning) => warning.severity === "MEDIUM")
        ? "MEDIUM"
        : "LOW";

  const summary =
    riskLevel === "HIGH"
      ? "Launch candidate is acceptable only with caution because the margin buffer is fragile."
      : riskLevel === "MEDIUM"
        ? "Launch candidate can work, but fee, shipping, or reserve pressure should be watched closely."
        : "Launch candidate clears the configured guardrails with a safer operating buffer.";

  return {
    riskScore,
    riskLevel,
    warnings,
    summary,
    guardrailSnapshot: {
      guardrailProfileId: guardrailProfile.id,
      guardrailProfileName: guardrailProfile.name,
      realizedMarginPct,
      bufferAboveBreakEvenPct,
      feeBurdenPct,
      shippingBurdenPct,
      reserveBurdenPct,
      targetToFloorGapPct
    }
  };
}

export function buildScenarioRiskSummary(input: {
  scenarios: Array<{
    id: string;
    name: string;
    riskScore: number | null;
    riskLevel: LaunchRiskLevel | null;
    warnings: Array<{ code: string; severity: LaunchRiskLevel; message: string }>;
  }>;
  recommendedScenarioId?: string | null;
  selectedLaunchScenarioId?: string | null;
}) {
  const levels = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const scenario of input.scenarios) {
    if (scenario.riskLevel) levels[scenario.riskLevel] += 1;
  }

  const recommended = input.scenarios.find((scenario) => scenario.id === input.recommendedScenarioId) ?? null;
  const selected = input.scenarios.find((scenario) => scenario.id === input.selectedLaunchScenarioId) ?? null;

  return {
    recommendedScenarioId: input.recommendedScenarioId ?? null,
    selectedLaunchScenarioId: input.selectedLaunchScenarioId ?? null,
    riskCounts: levels,
    highestRiskScenarioId:
      input.scenarios
        .slice()
        .sort((left, right) => (right.riskScore ?? 0) - (left.riskScore ?? 0))[0]?.id ?? null,
    summary:
      selected?.riskLevel === "HIGH"
        ? "Selected launch candidate is still risk-flagged and should be treated as fragile."
        : recommended?.riskLevel === "HIGH"
          ? "Ranked winner exists, but the top recommendation is still risk-flagged."
          : "Top launch candidates currently clear the configured guardrail thresholds."
  };
}

export function buildLaunchCandidateHandoff(input: {
  scenario: ScenarioForGuardrails & {
    costProfileId: string;
    amazonFeePresetId?: string | null;
    amazonFeePresetName?: string | null;
    shippingZoneRuleId?: string | null;
    shippingZoneRuleName?: string | null;
    packagingRuleId?: string | null;
    packagingRuleName?: string | null;
    shippingRuleId?: string | null;
    shippingRuleName?: string | null;
  };
  launchTemplateName?: string | null;
  riskSummary: {
    riskScore: number;
    riskLevel: LaunchRiskLevel;
    warnings: Array<{ code: string; severity: LaunchRiskLevel; message: string; details?: Record<string, unknown> }>;
    summary: string;
  };
}) {
  const assumptionNames = input.scenario.assumptionsSnapshot;
  return {
    scenarioId: input.scenario.id,
    scenarioName: input.scenario.name,
    launchTemplateName: input.launchTemplateName ?? null,
    costProfileId: input.scenario.costProfileId,
    launchStrategy: input.scenario.launchStrategy ?? null,
    amazonFeePresetId: input.scenario.amazonFeePresetId ?? null,
    amazonFeePresetName: input.scenario.amazonFeePresetName ?? null,
    shippingZoneRuleId: input.scenario.shippingZoneRuleId ?? null,
    shippingZoneRuleName: input.scenario.shippingZoneRuleName ?? null,
    packagingRuleId: input.scenario.packagingRuleId ?? null,
    packagingRuleName: input.scenario.packagingRuleName ?? null,
    shippingRuleId: input.scenario.shippingRuleId ?? null,
    shippingRuleName: input.scenario.shippingRuleName ?? null,
    shelfSpec: {
      name: String(assumptionNames.name ?? ""),
      sku: assumptionNames.sku ?? null,
      quantity: assumptionNames.quantity ?? null,
      lengthIn: assumptionNames.lengthIn ?? null,
      depthIn: assumptionNames.depthIn ?? null,
      thicknessIn: assumptionNames.thicknessIn ?? null,
      materialCode: assumptionNames.materialCode ?? null,
      edgeBandPattern: assumptionNames.edgeBandPattern ?? null
    },
    pricing: {
      breakEvenPriceCents: input.scenario.result.breakdown.breakEvenPriceCents,
      minimumSellPriceCents: input.scenario.result.breakdown.recommendedMinSellPriceCents,
      targetSellPriceCents: input.scenario.result.breakdown.recommendedTargetSellPriceCents,
      launchPriceCents: input.scenario.result.breakdown.recommendedTargetSellPriceCents
    },
    burdens: {
      marketplaceFeeCostCents: input.scenario.result.breakdown.marketplaceFeeCostCents,
      shippingCostCents:
        input.scenario.result.shipping.baseCostCents +
        (input.scenario.result.shipping.weightCostCents ?? 0) +
        (input.scenario.result.shipping.volumeCostCents ?? 0) +
        (input.scenario.result.shipping.dimensionalCostCents ?? 0) +
        input.scenario.result.shipping.shippingBufferCostCents,
      reserveCostCents:
        input.scenario.result.breakdown.returnReserveCostCents +
        input.scenario.result.breakdown.damageReserveCostCents
    },
    risk: input.riskSummary,
    assumptionsSnapshot: input.scenario.assumptionsSnapshot,
    resultSnapshot: input.scenario.result
  };
}
