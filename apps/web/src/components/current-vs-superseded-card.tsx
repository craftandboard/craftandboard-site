"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function CurrentVsSupersededCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = listingPrepPackage?.artifactSupersessionSummarySnapshot as Record<string, unknown> | null;
  if (!listingPrepPackage) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Current vs Historical</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Is this completed artifact still the source of truth?</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current status</p>
          <p className="mt-2 font-semibold text-white">
            {listingPrepPackage.currentApprovedArtifact ? "Still current now" : "No longer current"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Historical summary</p>
          <p className="mt-2 font-semibold text-white">
            {String(summary?.retainedSummary ?? "Historical summary will appear when supersession is evaluated.")}
          </p>
        </div>
      </div>
    </section>
  );
}
