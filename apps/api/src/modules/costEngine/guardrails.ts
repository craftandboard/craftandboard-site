import type { LaunchRiskLevel, ListingReadinessStatus } from "./contracts.js";

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

function buildReadinessWarning(
  code: string,
  severity: "BLOCKING" | "WARNING",
  message: string,
  details: Record<string, unknown>
) {
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

export function buildStrongerPriceFloorAlerts(input: {
  scenario: ScenarioForGuardrails & {
    guardrailSnapshot?: Record<string, unknown> | null;
    riskLevel?: LaunchRiskLevel | null;
  };
  selectedLaunchPriceCents?: number | null;
}) {
  const launchPrice =
    input.selectedLaunchPriceCents ??
    input.scenario.result.breakdown.recommendedTargetSellPriceCents;
  const minimumSellPrice = input.scenario.result.breakdown.recommendedMinSellPriceCents;
  const breakEvenPrice = input.scenario.result.breakdown.breakEvenPriceCents;
  const saferMarginPrice = input.scenario.result.breakdown.recommendedTargetSellPriceCents;
  const totalFees =
    input.scenario.result.breakdown.marketplaceFeeCostCents +
    (input.scenario.result.amazonFees?.closingFeeCostCents ?? 0) +
    (input.scenario.result.amazonFees?.fulfillmentFeeCostCents ?? 0) +
    (input.scenario.result.amazonFees?.storageAllowanceCostCents ?? 0) +
    (input.scenario.result.amazonFees?.advertisingAllowanceCostCents ?? 0) +
    (input.scenario.result.amazonFees?.miscMarketplaceCostCents ?? 0);
  const totalShipping =
    input.scenario.result.shipping.baseCostCents +
    (input.scenario.result.shipping.weightCostCents ?? 0) +
    (input.scenario.result.shipping.volumeCostCents ?? 0) +
    (input.scenario.result.shipping.dimensionalCostCents ?? 0) +
    input.scenario.result.shipping.shippingBufferCostCents;
  const reserveCost =
    input.scenario.result.breakdown.returnReserveCostCents +
    input.scenario.result.breakdown.damageReserveCostCents;

  const warnings = [];
  const launchToMinBufferPct = percentOf(launchPrice - minimumSellPrice, launchPrice || 1);
  const minToBreakEvenPct = percentOf(minimumSellPrice - breakEvenPrice, minimumSellPrice || 1);
  const saferGapPct = percentOf(saferMarginPrice - launchPrice, launchPrice || 1);
  const feeBurdenPct = percentOf(totalFees, launchPrice || 1);
  const shippingBurdenPct = percentOf(totalShipping, launchPrice || 1);
  const reserveBurdenPct = percentOf(reserveCost, launchPrice || 1);

  if (launchPrice < minimumSellPrice) {
    warnings.push(
      buildReadinessWarning(
        "LAUNCH_BELOW_MINIMUM_SELL",
        "BLOCKING",
        "Launch price is below the current minimum sell price.",
        { launchPriceCents: launchPrice, minimumSellPriceCents: minimumSellPrice }
      )
    );
  }

  if (minimumSellPrice <= breakEvenPrice) {
    warnings.push(
      buildReadinessWarning(
        "MINIMUM_NEAR_BREAK_EVEN",
        "BLOCKING",
        "Minimum sell price leaves almost no room above break-even.",
        { minimumSellPriceCents: minimumSellPrice, breakEvenPriceCents: breakEvenPrice }
      )
    );
  }

  if (launchToMinBufferPct < 5) {
    warnings.push(
      buildReadinessWarning(
        "LOW_BUFFER_ABOVE_MINIMUM",
        "BLOCKING",
        "Launch price is too close to the minimum sell price for listing safety.",
        { launchToMinBufferPct, launchPriceCents: launchPrice, minimumSellPriceCents: minimumSellPrice }
      )
    );
  }

  if (minToBreakEvenPct < 4) {
    warnings.push(
      buildReadinessWarning(
        "LOW_BUFFER_ABOVE_BREAK_EVEN",
        "BLOCKING",
        "Minimum sell price is too close to break-even.",
        { minToBreakEvenPct, minimumSellPriceCents: minimumSellPrice, breakEvenPriceCents: breakEvenPrice }
      )
    );
  }

  if (saferGapPct > 18) {
    warnings.push(
      buildReadinessWarning(
        "SAFER_MARGIN_GAP_HIGH",
        "WARNING",
        "Safer-margin price sits materially above the recommended launch price.",
        { saferGapPct, saferMarginPriceCents: saferMarginPrice, launchPriceCents: launchPrice }
      )
    );
  }

  if (feeBurdenPct > 32) {
    warnings.push(
      buildReadinessWarning(
        "HIGH_FEE_LOAD",
        "WARNING",
        "Marketplace fee load leaves too little room for pricing mistakes.",
        { feeBurdenPct }
      )
    );
  }

  if (shippingBurdenPct > 24) {
    warnings.push(
      buildReadinessWarning(
        "HIGH_SHIPPING_LOAD",
        "WARNING",
        "Shipping burden makes this launch candidate fragile.",
        { shippingBurdenPct }
      )
    );
  }

  if (reserveBurdenPct > 8) {
    warnings.push(
      buildReadinessWarning(
        "HIGH_RESERVE_LOAD",
        "WARNING",
        "Reserve burden is high relative to the proposed launch price.",
        { reserveBurdenPct }
      )
    );
  }

  if (input.scenario.riskLevel === "HIGH") {
    warnings.push(
      buildReadinessWarning(
        "HIGH_RISK_SCENARIO",
        "BLOCKING",
        "Scenario still carries high launch risk despite ranking.",
        { riskLevel: input.scenario.riskLevel }
      )
    );
  }

  return {
    warnings,
    summary:
      warnings.length === 0
        ? "Selected launch candidate clears the stronger listing-readiness checks."
        : warnings.some((warning) => warning.severity === "BLOCKING")
          ? "Selected launch candidate still has blocking listing-readiness concerns."
          : "Selected launch candidate can move forward, but the pricing floor and burden warnings should be reviewed."
  };
}

export function buildMarketplaceFieldPrep(input: {
  scenario: ScenarioForGuardrails & {
    amazonFeePresetName?: string | null;
    shippingZoneRuleName?: string | null;
    packagingRuleName?: string | null;
    shippingRuleName?: string | null;
  };
}) {
  const assumptions = input.scenario.assumptionsSnapshot;
  const dimensions = `${String(assumptions.lengthIn ?? "?")} x ${String(assumptions.depthIn ?? "?")} x ${String(
    assumptions.thicknessIn ?? "?"
  )} in`;
  return {
    productLabel: String(assumptions.name ?? input.scenario.name ?? "Shelf launch candidate"),
    sku: assumptions.sku ?? null,
    dimensionSummary: dimensions,
    materialSummary: String(assumptions.materialCode ?? "Unknown material"),
    edgeBandSummary: String(assumptions.edgeBandPattern ?? "No edge band pattern"),
    packagingSummary: input.scenario.packagingRuleName ?? "Default packaging rule",
    shippingSummary: input.scenario.shippingRuleName ?? "Default shipping rule",
    feePresetLabel: input.scenario.amazonFeePresetName ?? "Default Amazon fee preset",
    shippingZoneLabel: input.scenario.shippingZoneRuleName ?? "Base shipping zone",
    launchStrategyLabel: input.scenario.launchStrategy ?? "BALANCED",
    pricingSummary: {
      breakEvenPriceCents: input.scenario.result.breakdown.breakEvenPriceCents,
      minimumSellPriceCents: input.scenario.result.breakdown.recommendedMinSellPriceCents,
      saferMarginPriceCents: input.scenario.result.breakdown.recommendedTargetSellPriceCents,
      recommendedLaunchPriceCents: input.scenario.result.breakdown.recommendedTargetSellPriceCents
    },
    launchNotes: [],
    warningNotes: [],
    completenessFlags: {
      hasProductLabel: Boolean(assumptions.name ?? input.scenario.name),
      hasSku: Boolean(assumptions.sku),
      hasDimensions: Boolean(assumptions.lengthIn && assumptions.depthIn),
      hasMaterial: Boolean(assumptions.materialCode),
      hasPackaging: Boolean(input.scenario.packagingRuleName),
      hasShipping: Boolean(input.scenario.shippingRuleName),
      hasFeePreset: Boolean(input.scenario.amazonFeePresetName),
      hasShippingZone: Boolean(input.scenario.shippingZoneRuleName)
    }
  };
}

export function evaluateListingReadiness(input: {
  scenario: ScenarioForGuardrails & {
    amazonFeePresetName?: string | null;
    shippingZoneRuleName?: string | null;
    packagingRuleName?: string | null;
    shippingRuleName?: string | null;
    costProfileId?: string | null;
    riskLevel?: LaunchRiskLevel | null;
  };
  selectedLaunchPriceCents?: number | null;
}) {
  const strongerAlerts = buildStrongerPriceFloorAlerts(input);
  const marketplaceFields = buildMarketplaceFieldPrep({ scenario: input.scenario });
  const missingFieldFlags = Object.entries(marketplaceFields.completenessFlags)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const blockingWarnings = strongerAlerts.warnings.filter((warning) => warning.severity === "BLOCKING");
  const listingReadinessStatus: ListingReadinessStatus =
    blockingWarnings.length > 0
      ? "BLOCKED"
      : missingFieldFlags.length > 0 || input.scenario.riskLevel === "MEDIUM"
        ? "NEEDS_REVIEW"
        : "READY";

  return {
    listingReadinessStatus,
    launchReadyBoolean: listingReadinessStatus === "READY",
    strongerAlerts,
    marketplaceFields,
    listingReadinessSummary:
      listingReadinessStatus === "READY"
        ? "Launch candidate is packaged cleanly enough to move into listing preparation."
        : listingReadinessStatus === "BLOCKED"
          ? "Launch candidate still needs pricing or risk fixes before listing handoff."
          : "Launch candidate is close, but some fields or warnings still need review.",
    missingFieldFlags,
    warningList: strongerAlerts.warnings
  };
}

export function buildLaunchCandidatePackage(input: {
  scenario: ScenarioForGuardrails & {
    costProfileId?: string | null;
    amazonFeePresetName?: string | null;
    shippingZoneRuleName?: string | null;
    packagingRuleName?: string | null;
    shippingRuleName?: string | null;
  };
  listingReadiness: ReturnType<typeof evaluateListingReadiness>;
  launchTemplateName?: string | null;
  handoffSummary?: Record<string, unknown> | null;
}) {
  return {
    scenarioId: input.scenario.id,
    scenarioName: input.scenario.name,
    costProfileId: input.scenario.costProfileId ?? null,
    launchTemplateName: input.launchTemplateName ?? null,
    listingReadinessStatus: input.listingReadiness.listingReadinessStatus,
    launchReadyBoolean: input.listingReadiness.launchReadyBoolean,
    marketplaceFieldSnapshot: input.listingReadiness.marketplaceFields,
    warningSnapshot: input.listingReadiness.warningList,
    readinessSnapshot: {
      summary: input.listingReadiness.listingReadinessSummary,
      missingFieldFlags: input.listingReadiness.missingFieldFlags
    },
    assumptionsSnapshot: input.scenario.assumptionsSnapshot,
    resultSnapshot: input.scenario.result,
    handoffSummary: input.handoffSummary ?? null
  };
}
