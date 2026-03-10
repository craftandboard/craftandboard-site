"use client";

import type { CostComparisonResult } from "../lib/api";

export function LaunchExportSummaryCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const exportSnapshot = comparison?.selectedLaunchExportSnapshot ?? null;

  if (!exportSnapshot) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Export-ready launch summary will appear here once the selected launch candidate passes through listing readiness.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Export Summary</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Launch-candidate package snapshot</h3>
      <p className="mt-2 text-sm text-slate-300">
        This is the internal handoff artifact for the next listing-focused phase. It packages the selected scenario,
        marketplace-prep fields, warnings, and the assumptions snapshot in one stable record.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
        {JSON.stringify(exportSnapshot, null, 2)}
      </pre>
    </section>
  );
}
