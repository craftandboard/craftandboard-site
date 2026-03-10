"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function FinalRunbookCard({ listingPrepPackage }: { listingPrepPackage: ListingPrepPackageRecord | null }) {
  const snapshot = (listingPrepPackage?.finalRunbookSnapshot ?? null) as Record<string, unknown> | null;
  const sections = (snapshot?.sections ?? {}) as Record<string, unknown>;
  const order = Array.isArray(snapshot?.runbookSectionOrder) ? (snapshot.runbookSectionOrder as string[]) : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Final runbook details appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Final Runbook</p>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-200">
          {listingPrepPackage.runbookVersion ?? "manual-runbook-v1"}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">Final manual-listing runbook</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.runbookSummary ?? "Runbook summary will appear here after package refresh.")}
      </p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section order</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {order.length ? order.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {item}
            </span>
          )) : <span className="text-sm text-slate-300">No section order recorded yet.</span>}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {Object.entries(sections).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{key}</p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
              {JSON.stringify(value ?? null, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
