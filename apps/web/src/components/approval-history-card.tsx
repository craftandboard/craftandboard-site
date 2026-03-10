"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ApprovalHistoryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.approvalHistorySnapshot ?? null) as
    | {
        latest?: { action?: string; reason?: string | null; createdAt?: string | null } | null;
        history?: Array<{ action?: string; reason?: string | null; createdAt?: string | null }>;
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Approval history appears here after a listing-prep package is built.
      </section>
    );
  }

  const history = snapshot?.history ?? [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Approval History</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {snapshot?.latest?.action ? "Latest approval event captured" : "No approval history yet"}
      </h3>
      <div className="mt-4 space-y-3">
        {(history.length ? history : [snapshot?.latest].filter(Boolean)).map((entry, index) => (
          <div key={`${entry?.createdAt ?? "approval"}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{index === 0 ? "Latest" : `History ${index + 1}`}</p>
            <p className="mt-2 font-semibold text-white">{entry?.action ?? "Approval event"}</p>
            <p className="mt-1 text-xs text-slate-400">{entry?.reason ?? "No extra reason captured."}</p>
            <p className="mt-1 text-xs text-slate-500">
              {entry?.createdAt ? new Date(entry.createdAt).toLocaleString() : "Timestamp unavailable"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
