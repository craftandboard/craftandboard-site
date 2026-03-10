"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function LastChangeSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.lastChangeSummarySnapshot ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Last-change context appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Last Change</p>
      <h3 className="mt-2 text-xl font-semibold text-white">What changed last</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "No last-change summary has been generated yet.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval action</p>
          <p className="mt-2 font-semibold text-white">{String(snapshot?.lastApprovalAction ?? "Unknown")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preset change</p>
          <p className="mt-2">{String(snapshot?.lastPresetChange ?? "No preset change recorded")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Override summary</p>
          <p className="mt-2">{String(snapshot?.lastOverrideSummary ?? "No override change recorded")}</p>
        </div>
      </div>
    </section>
  );
}
