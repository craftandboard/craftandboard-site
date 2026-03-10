"use client";

import type { CostComparisonResult } from "../lib/api";
import { getRiskLevelLabel, getRiskLevelTone } from "../lib/cost-engine";
import { PriceGuardrailWarningList } from "./price-guardrail-warning-list";

export function LaunchRiskSummaryCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const selectedScenario = comparison?.selectedLaunchScenarioId
    ? comparison.scenarios.find((scenario) => scenario.id === comparison.selectedLaunchScenarioId) ?? null
    : null;
  const riskSummary = (comparison?.riskSummary ?? null) as
    | {
        riskCounts?: { LOW?: number; MEDIUM?: number; HIGH?: number };
        summary?: string;
      }
    | null;

  if (!comparison || !selectedScenario) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Apply a guardrail profile to see risk scoring, fragile-launch warnings, and selected candidate safety.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Launch Risk</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold text-white">{selectedScenario.name}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskLevelTone(selectedScenario.riskLevel)}`}>
          {getRiskLevelLabel(selectedScenario.riskLevel)}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-200">
          Risk score {selectedScenario.riskScore?.toFixed(1) ?? "0.0"}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {selectedScenario.riskSummary ??
          (typeof riskSummary?.summary === "string" ? riskSummary.summary : "Risk summary not available yet.")}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Low / Medium / High</p>
          <p className="mt-2 font-semibold text-white">
            {Number(riskSummary?.riskCounts?.LOW ?? 0)} / {Number(riskSummary?.riskCounts?.MEDIUM ?? 0)} / {Number(riskSummary?.riskCounts?.HIGH ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recommended scenario</p>
          <p className="mt-2 font-semibold text-white">
            {comparison.ranking?.recommendation?.bestLaunchScenarioLabel ?? "Not ranked"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected launch</p>
          <p className="mt-2 font-semibold text-white">{selectedScenario.name}</p>
        </div>
      </div>

      <div className="mt-5">
        <PriceGuardrailWarningList warnings={selectedScenario.warningSnapshot} />
      </div>
    </section>
  );
}
