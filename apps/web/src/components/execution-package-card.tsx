"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ExecutionPackageCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = listingPrepPackage?.executionPackageSnapshot as Record<string, unknown> | null;
  const header = (snapshot?.header ?? null) as Record<string, unknown> | null;
  const summary = typeof snapshot?.executionPackageSummary === "string" ? snapshot.executionPackageSummary : null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Execution Package</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Use-now listing execution package</h3>
      <p className="mt-1 text-sm text-slate-300">
        Keep the copy-first, share-ready, and last-step package in one place for the active artifact.
      </p>

      {listingPrepPackage && snapshot ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100">
                {listingPrepPackage.executionPackageVersion ?? "execution-package-v1"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
                {String(header?.approvalState ?? listingPrepPackage.approvalState)}
              </span>
            </div>
            <p className="mt-3 font-medium text-white">{String(header?.packageName ?? listingPrepPackage.name)}</p>
            {summary ? <p className="mt-2 text-slate-300">{summary}</p> : null}
          </div>

          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
          Build or refresh a listing-prep package to generate the execution package summary.
        </div>
      )}
    </section>
  );
}
