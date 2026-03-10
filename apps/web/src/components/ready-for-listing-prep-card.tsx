"use client";

import type { ListingPrepPackageRecord } from "../lib/api";
import {
  getReadyForListingPrepLabel,
  getReadyForListingPrepTone
} from "../lib/cost-engine";

export function ReadyForListingPrepCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const readySummary = (listingPrepPackage?.readyForListingPrepSummary ?? null) as
    | {
        readyForListingPrepStatus?: string;
        summary?: string;
        blockingReasons?: string[];
        reviewReasons?: string[];
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Ready-for-listing-prep status appears here after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Ready for Listing Prep</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getReadyForListingPrepTone(readySummary?.readyForListingPrepStatus, listingPrepPackage.readyForListingPrep)}`}>
          {getReadyForListingPrepLabel(readySummary?.readyForListingPrepStatus, listingPrepPackage.readyForListingPrep)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {readySummary?.summary ?? "Refresh the package to calculate ready-for-listing-prep status."}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Blocking reasons</p>
          <p className="mt-2 font-semibold text-white">{(readySummary?.blockingReasons ?? []).length ? (readySummary?.blockingReasons ?? []).join(" | ") : "None"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Review reasons</p>
          <p className="mt-2 font-semibold text-white">{(readySummary?.reviewReasons ?? []).length ? (readySummary?.reviewReasons ?? []).join(" | ") : "None"}</p>
        </div>
      </div>
    </section>
  );
}
