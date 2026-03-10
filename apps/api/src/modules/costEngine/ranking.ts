import type { LaunchStrategy } from "./contracts.js";

type ScenarioForRanking = {
  id: string;
  name: string;
  launchStrategy: LaunchStrategy | null;
  result: {
    breakdown: {
      breakEvenPriceCents: number;
      recommendedMinSellPriceCents: number;
      recommendedTargetSellPriceCents: number;
      marketplaceFeeCostCents: number;
      referralFeeCostCents?: number;
      advertisingAllowanceCostCents?: number;
      returnReserveCostCents: number;
      damageReserveCostCents: number;
      miscMarketplaceCostCents?: number;
    };
    pricing: {
      targetMarginPct: number | null;
      growthMarginPct: number | null;
    };
    shipping: {
      baseCostCents: number;
      weightCostCents?: number;
      volumeCostCents?: number;
      dimensionalCostCents?: number;
      shippingBufferCostCents: number;
    };
    amazonFees?: {
      presetName?: string | null;
      referralFeePct?: number | null;
      referralFeeCostCents?: number;
      closingFeeCostCents?: number;
      fulfillmentFeeCostCents?: number;
      storageAllowanceCostCents?: number;
      advertisingAllowancePct?: number | null;
      advertisingAllowanceCostCents?: number;
      returnReservePct?: number | null;
      returnReserveCostCents?: number;
      damageReservePct?: number | null;
      damageReserveCostCents?: number;
      miscMarketplacePct?: number | null;
      miscMarketplaceCostCents?: number;
    } | null;
  };
};

export type RankedScenario = {
  id: string;
  name: string;
  launchStrategy: LaunchStrategy | null;
  rankingScore: number;
  rankingSummary: {
    projectedMarginBufferCents: number;
    feeBurdenCents: number;
    shippingSensitivityCents: number;
    reserveBurdenCents: number;
    scoreBreakdown: {
      marginBufferScore: number;
      feeBurdenPenalty: number;
      shippingPenalty: number;
      reservePenalty: number;
      strategyAdjustment: number;
    };
    recommendationNote: string;
  };
  result: ScenarioForRanking["result"];
};

function getStrategyAdjustment(strategy: LaunchStrategy | null, minToTargetGap: number) {
  switch (strategy) {
    case "AGGRESSIVE":
      return minToTargetGap <= 1200 ? 8 : 4;
    case "SAFER_MARGIN":
      return minToTargetGap >= 1500 ? 12 : 7;
    case "BALANCED":
    default:
      return 6;
  }
}

export function rankComparisonScenarios(scenarios: ScenarioForRanking[]) {
  const ranked = scenarios.map((scenario) => {
    const target = scenario.result.breakdown.recommendedTargetSellPriceCents ?? 0;
    const minimum = scenario.result.breakdown.recommendedMinSellPriceCents ?? 0;
    const breakEven = scenario.result.breakdown.breakEvenPriceCents ?? 0;
    const marginBufferCents = Math.max(target - breakEven, 0);
    const minToTargetGap = Math.max(target - minimum, 0);
    const feeBurdenCents =
      scenario.result.breakdown.marketplaceFeeCostCents +
      (scenario.result.breakdown.referralFeeCostCents ?? 0) +
      (scenario.result.breakdown.advertisingAllowanceCostCents ?? 0) +
      (scenario.result.breakdown.miscMarketplaceCostCents ?? 0);
    const reserveBurdenCents =
      scenario.result.breakdown.returnReserveCostCents +
      scenario.result.breakdown.damageReserveCostCents;
    const shippingSensitivityCents =
      scenario.result.shipping.baseCostCents +
      (scenario.result.shipping.weightCostCents ?? 0) +
      (scenario.result.shipping.volumeCostCents ?? 0) +
      (scenario.result.shipping.dimensionalCostCents ?? 0) +
      scenario.result.shipping.shippingBufferCostCents;

    const marginBufferScore = Math.min(marginBufferCents / 100, 50);
    const feeBurdenPenalty = Math.min(feeBurdenCents / 100, 20);
    const shippingPenalty = Math.min(shippingSensitivityCents / 150, 15);
    const reservePenalty = Math.min(reserveBurdenCents / 100, 10);
    const strategyAdjustment = getStrategyAdjustment(scenario.launchStrategy, minToTargetGap);

    const rankingScore = Number(
      (
        50 +
        marginBufferScore -
        feeBurdenPenalty -
        shippingPenalty -
        reservePenalty +
        strategyAdjustment
      ).toFixed(4)
    );

    const recommendationNote =
      scenario.launchStrategy === "AGGRESSIVE"
        ? "Favors a tighter launch gap to stay more price-competitive."
        : scenario.launchStrategy === "SAFER_MARGIN"
          ? "Favors stronger margin protection before launch."
          : "Balances price competitiveness with margin protection.";

    return {
      id: scenario.id,
      name: scenario.name,
      launchStrategy: scenario.launchStrategy,
      rankingScore,
      rankingSummary: {
        projectedMarginBufferCents: marginBufferCents,
        feeBurdenCents,
        shippingSensitivityCents,
        reserveBurdenCents,
        scoreBreakdown: {
          marginBufferScore,
          feeBurdenPenalty,
          shippingPenalty,
          reservePenalty,
          strategyAdjustment
        },
        recommendationNote
      },
      result: scenario.result
    } satisfies RankedScenario;
  });

  ranked.sort((left, right) => right.rankingScore - left.rankingScore);

  const best = ranked[0] ?? null;
  const safestMargin = [...ranked].sort(
    (left, right) =>
      right.rankingSummary.projectedMarginBufferCents - left.rankingSummary.projectedMarginBufferCents
  )[0] ?? null;
  const mostAggressive = [...ranked].sort(
    (left, right) =>
      left.result.breakdown.recommendedTargetSellPriceCents -
      right.result.breakdown.recommendedTargetSellPriceCents
  )[0] ?? null;

  return {
    ranked,
    recommendation: best
      ? {
          recommendedScenarioId: best.id,
          recommendedLaunchPriceCents: best.result.breakdown.recommendedTargetSellPriceCents,
          recommendedFloorPriceCents: best.result.breakdown.recommendedMinSellPriceCents,
          recommendedSaferMarginPriceCents:
            safestMargin?.result.breakdown.recommendedTargetSellPriceCents ??
            best.result.breakdown.recommendedTargetSellPriceCents,
          bestLaunchScenarioLabel: best.name,
          safestMarginScenarioLabel: safestMargin?.name ?? best.name,
          mostAggressiveScenarioLabel: mostAggressive?.name ?? best.name,
          recommendationSummary:
            `${best.name} ranks highest because it keeps the strongest launch buffer after fees ` +
            `without pushing shipping and reserve burden too far.`,
          tradeoffSummary: {
            bestScenarioId: best.id,
            safestScenarioId: safestMargin?.id ?? best.id,
            mostAggressiveScenarioId: mostAggressive?.id ?? best.id
          }
        }
      : null
  };
}
