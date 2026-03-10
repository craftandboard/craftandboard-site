"use client";

import type { CostComparisonResult } from "../lib/api";
import { formatMoney, getLaunchStrategyLabel } from "../lib/cost-engine";

export function LaunchRecommendationCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const recommendation = comparison?.ranking?.recommendation ?? null;

  if (!recommendation) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Compare scenarios to get a recommended launch candidate, floor price, and safer-margin price.
      </section>
    );
  }

  const winningScenario = comparison?.scenarios.find(
    (scenario) => scenario.id === recommendation.recommendedScenarioId
  );

  return (
    <section className="rounded-[1.75rem] border border-emerald-400/30 bg-emerald-400/10 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Launch Recommendation</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{recommendation.bestLaunchScenarioLabel}</h3>
      <p className="mt-2 text-sm text-emerald-50/90">{recommendation.recommendationSummary}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Launch price</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatMoney(recommendation.recommendedLaunchPriceCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Floor price</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatMoney(recommendation.recommendedFloorPriceCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Safer-margin price</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatMoney(recommendation.recommendedSaferMarginPriceCents)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-emerald-50/90">
        <div>Best launch: <span className="font-semibold text-white">{recommendation.bestLaunchScenarioLabel}</span></div>
        <div>Safest margin: <span className="font-semibold text-white">{recommendation.safestMarginScenarioLabel}</span></div>
        <div>Most aggressive: <span className="font-semibold text-white">{recommendation.mostAggressiveScenarioLabel}</span></div>
      </div>

      {winningScenario ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-emerald-50/90">
          Strategy: <span className="font-semibold text-white">{getLaunchStrategyLabel(winningScenario.launchStrategy)}</span>
        </div>
      ) : null}
    </section>
  );
}
