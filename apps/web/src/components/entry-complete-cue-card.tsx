"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function EntryCompleteCueCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const cue = listingPrepPackage?.entryCompleteCueSnapshot;
  if (!listingPrepPackage) return null;
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Entry Complete Cue</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">Entry status</h3>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-cyan-100">
          {String(listingPrepPackage.entryCompletionStatus ?? cue?.entryCompletionStatus ?? "UNKNOWN")}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{String(cue?.summary ?? "Entry cue not available.")}</p>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-xs text-slate-200">
        {JSON.stringify(cue, null, 2)}
      </pre>
    </section>
  );
}
