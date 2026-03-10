"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ShareReadySummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = listingPrepPackage?.shareReadySummarySnapshot as Record<string, unknown> | null;
  const shortShareText = typeof snapshot?.shortShareText === "string" ? snapshot.shortShareText : null;
  const whatToUseNowSummary =
    typeof snapshot?.whatToUseNowSummary === "string" ? snapshot.whatToUseNowSummary : null;
  const summary = typeof snapshot?.summary === "string" ? snapshot.summary : null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Share-Ready Summary</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Share this internally if needed</h3>
      <p className="mt-1 text-sm text-slate-300">
        Keep the internal handoff message concise so the active listing package is easy to pass between operators.
      </p>

      {listingPrepPackage && snapshot ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
            {whatToUseNowSummary ? <p className="font-medium text-white">{whatToUseNowSummary}</p> : null}
            {summary ? <p className="mt-2 text-slate-300">{summary}</p> : null}
          </div>
          {shortShareText ? (
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
              {shortShareText}
            </pre>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
          No share-ready summary yet. Refresh the listing-prep package to package the internal handoff text.
        </div>
      )}
    </section>
  );
}
