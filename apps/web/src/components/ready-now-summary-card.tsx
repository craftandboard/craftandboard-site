"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ReadyNowSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = listingPrepPackage?.readyNowSummarySnapshot as Record<string, unknown> | null;
  const stateLabel = String(snapshot?.stateLabel ?? "NEEDS_REVIEW");
  const why = typeof snapshot?.why === "string" ? snapshot.why : null;
  const next = typeof snapshot?.whatToDoNext === "string" ? snapshot.whatToDoNext : null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Ready-Now Summary</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Can you use this now?</h3>
      <p className="mt-1 text-sm text-slate-300">
        Keep the final execution state obvious before manual Amazon entry starts.
      </p>

      {listingPrepPackage && snapshot ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
            {stateLabel}
          </span>
          {why ? <p className="mt-3 text-white">{why}</p> : null}
          {next ? <p className="mt-2 text-slate-300">{next}</p> : null}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
          No ready-now summary yet. Refresh the package to calculate the final use-now state.
        </div>
      )}
    </section>
  );
}
