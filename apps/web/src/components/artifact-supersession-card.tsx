"use client";

import type { ListingPrepPackageRecord } from "../lib/api";
import { getArtifactSupersessionLabel, getArtifactSupersessionTone } from "../lib/cost-engine";

export function ArtifactSupersessionCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = listingPrepPackage?.artifactSupersessionSummarySnapshot as Record<string, unknown> | null;
  if (!listingPrepPackage) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Supersession</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getArtifactSupersessionTone(listingPrepPackage.artifactSupersessionStatus)}`}>
          {getArtifactSupersessionLabel(listingPrepPackage.artifactSupersessionStatus)}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">Current vs superseded state</h3>
      <p className="mt-1 text-sm text-slate-300">
        {String(summary?.explanation ?? "Supersession summary appears once the system evaluates whether a newer approved artifact replaced this completed package.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Replaced by</p>
          <p className="mt-2 font-semibold text-white">{String((summary?.replacementArtifact as Record<string, unknown> | null)?.name ?? listingPrepPackage.supersededByListingPrepPackageName ?? "No replacement")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Superseded at</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.supersededAt ? new Date(listingPrepPackage.supersededAt).toLocaleString() : "Not superseded"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Version</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.supersessionVersion ?? "supersession-v1"}</p>
        </div>
      </div>
    </section>
  );
}
