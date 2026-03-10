"use client";

import type { CostComparisonResult } from "../lib/api";

export function LaunchExportSummaryCard({
  comparison
}: {
  comparison: CostComparisonResult | null;
}) {
  const exportSnapshot = comparison?.selectedLaunchExportSnapshot ?? null;
  const exportMetadata = (exportSnapshot?.["exportMetadata"] ?? null) as Record<string, unknown> | null;
  const readySummary = (comparison?.selectedListingPrepReadySnapshot ?? null) as Record<string, unknown> | null;

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
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Export version</p>
          <p className="mt-2 font-semibold text-white">{String(exportMetadata?.exportVersion ?? comparison?.selectedListingPrepExportVersion ?? "listing-prep-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mapping template</p>
          <p className="mt-2 font-semibold text-white">{String(exportSnapshot?.["mappingTemplateLabel"] ?? "No template")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ready summary</p>
          <p className="mt-2 font-semibold text-white">{String(readySummary?.readyForListingPrepStatus ?? "Not evaluated")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel preset</p>
          <p className="mt-2 font-semibold text-white">{String(exportSnapshot?.["channelPresetLabel"] ?? "No channel preset")}</p>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
        {JSON.stringify(exportSnapshot, null, 2)}
      </pre>
    </section>
  );
}
