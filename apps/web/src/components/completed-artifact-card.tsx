"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function CompletedArtifactCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = listingPrepPackage?.completedArtifactSummarySnapshot;
  if (!listingPrepPackage) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Completed Artifact</p>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white">
          {listingPrepPackage.entryCompletionState ?? "ENTRY_READY"}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">Completion state retained</h3>
      <p className="mt-1 text-sm text-slate-300">
        {String(summary?.summary ?? "Completed artifact state appears after entry confirmation.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed at</p>
          <p className="mt-2 font-semibold text-white">
            {listingPrepPackage.entryCompletedAt ? new Date(listingPrepPackage.entryCompletedAt).toLocaleString() : "Not completed"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Still current</p>
          <p className="mt-2 font-semibold text-white">{summary?.isStillCurrent ? "Yes" : "No"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Override aware</p>
          <p className="mt-2 font-semibold text-white">{summary?.wasCompletedWithOverride ? "Yes" : "No"}</p>
        </div>
      </div>
    </section>
  );
}
