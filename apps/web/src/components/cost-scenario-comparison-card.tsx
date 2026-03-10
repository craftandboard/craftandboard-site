"use client";

import type { CostComparisonResult } from "../lib/api";
import { formatMoney, getLaunchStrategyLabel } from "../lib/cost-engine";

export function CostScenarioComparisonCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  if (!comparison) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Compare at least two scenarios to see Amazon fee sensitivity, zone impact, and target price deltas.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Scenario Comparison</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {comparison.name || "Unsaved comparison"}
      </h3>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {comparison.scenarios.map((scenario) => (
          <div key={scenario.id} className={`rounded-2xl border p-4 ${scenario.isRecommendedLaunchScenario ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-slate-950/25"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-white">{scenario.name}</p>
              {scenario.isRecommendedLaunchScenario ? (
                <span className="rounded-full bg-emerald-400 px-2 py-1 text-[11px] font-semibold text-slate-950">
                  Recommended
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-400">{getLaunchStrategyLabel(scenario.launchStrategy)}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Break-even</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatMoney(scenario.result.breakdown.breakEvenPriceCents)}
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatMoney(scenario.result.breakdown.subtotalCostCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Min sell</span>
                <span className="font-semibold">{formatMoney(scenario.result.breakdown.recommendedMinSellPriceCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Target sell</span>
                <span className="font-semibold">{formatMoney(scenario.result.breakdown.recommendedTargetSellPriceCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping delta</span>
                <span className="font-semibold">{formatMoney(scenario.result.breakdown.shippingCostCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Marketplace delta</span>
                <span className="font-semibold">{formatMoney(scenario.result.breakdown.marketplaceFeeCostCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ranking score</span>
                <span className="font-semibold">{scenario.rankingScore?.toFixed(1) ?? "0.0"}</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-300">
              <p>Compared to baseline:</p>
              <p className="mt-1">Subtotal {formatMoney(scenario.deltas.subtotalCostCents)}</p>
              <p>Break-even {formatMoney(scenario.deltas.breakEvenPriceCents)}</p>
              <p>Min sell {formatMoney(scenario.deltas.recommendedMinSellPriceCents)}</p>
              <p>Target sell {formatMoney(scenario.deltas.recommendedTargetSellPriceCents)}</p>
              {scenario.rankingSummary && "recommendationNote" in scenario.rankingSummary ? (
                <p className="mt-2 text-slate-400">{String(scenario.rankingSummary.recommendationNote)}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
