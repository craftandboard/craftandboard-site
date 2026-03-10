"use client";

import type { CostComparisonResult } from "../lib/api";
import {
  formatMoney,
  getLaunchStrategyLabel,
  getListingReadinessLabel,
  getListingReadinessTone,
  getRankingLabel,
  getRiskLevelLabel,
  getRiskLevelTone
} from "../lib/cost-engine";

export function ScenarioRankingTable({
  comparison,
  onSelectScenario
}: {
  comparison: CostComparisonResult | null;
  onSelectScenario?: (scenarioId: string) => void;
}) {
  if (!comparison?.scenarios.length) {
    return null;
  }

  const ranked = [...comparison.scenarios].sort(
    (left, right) => (right.rankingScore ?? 0) - (left.rankingScore ?? 0)
  );

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Scenario Ranking</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Best to worst launch candidates</h3>
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
          <thead className="bg-slate-950/40 text-xs uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Scenario</th>
              <th className="px-4 py-3 text-left">Strategy</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-left">Risk</th>
              <th className="px-4 py-3 text-left">Readiness</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Floor</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {ranked.map((scenario, index) => (
              <tr key={scenario.id} className={scenario.isRecommendedLaunchScenario ? "bg-emerald-400/10" : "bg-slate-950/15"}>
                <td className="px-4 py-3">{getRankingLabel(index)}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{scenario.name}</div>
                  {scenario.rankingSummary && "recommendationNote" in scenario.rankingSummary ? (
                    <div className="text-xs text-slate-400">
                      {String(scenario.rankingSummary.recommendationNote)}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{getLaunchStrategyLabel(scenario.launchStrategy)}</td>
                <td className="px-4 py-3 text-right font-semibold text-white">
                  {scenario.rankingScore?.toFixed(1) ?? "0.0"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskLevelTone(scenario.riskLevel)}`}>
                    {getRiskLevelLabel(scenario.riskLevel)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getListingReadinessTone(scenario.listingReadinessStatus)}`}>
                    {getListingReadinessLabel(scenario.listingReadinessStatus)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(scenario.result.breakdown.recommendedTargetSellPriceCents)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(scenario.result.breakdown.recommendedMinSellPriceCents)}
                </td>
                <td className="px-4 py-3 text-right">
                  {onSelectScenario ? (
                    <button
                      type="button"
                      onClick={() => onSelectScenario(scenario.id)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white"
                    >
                      {scenario.isLaunchApprovedCandidate ? "Selected" : "Select"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
