"use client";

import type { CostComparisonResult } from "../lib/api";
import {
  getListingReadinessLabel,
  getListingReadinessTone
} from "../lib/cost-engine";
import { PriceGuardrailWarningList } from "./price-guardrail-warning-list";

export function LaunchReadinessCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const readinessStatus = comparison?.selectedLaunchReadinessStatus ?? null;
  const warningSnapshot = comparison?.selectedLaunchWarningSnapshot ?? null;
  const exportSnapshot = (comparison?.selectedLaunchExportSnapshot ?? null) as
    | {
        readinessSnapshot?: { summary?: string; missingFieldFlags?: string[] };
        launchReadyBoolean?: boolean;
      }
    | null;

  if (!comparison?.selectedLaunchScenarioId) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Select a launch scenario, then run listing readiness to see whether the candidate is truly ready for listing prep.
      </section>
    );
  }

  const missingFieldFlags = exportSnapshot?.readinessSnapshot?.missingFieldFlags ?? [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Listing Readiness</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getListingReadinessTone(readinessStatus)}`}>
          {getListingReadinessLabel(readinessStatus)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {exportSnapshot?.readinessSnapshot?.summary ??
          "Run listing readiness to convert the selected launch candidate into a listing-prep package."}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Launch-ready</p>
          <p className="mt-2 font-semibold text-white">
            {exportSnapshot?.launchReadyBoolean ? "Yes" : "Not yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Missing prep fields</p>
          <p className="mt-2 font-semibold text-white">
            {missingFieldFlags.length === 0 ? "None" : missingFieldFlags.join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PriceGuardrailWarningList
          warnings={Array.isArray(warningSnapshot) ? warningSnapshot : undefined}
          emptyMessage="No blocking or review warnings were produced by the stronger listing-readiness checks."
        />
      </div>
    </section>
  );
}
