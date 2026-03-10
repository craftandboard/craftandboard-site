"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function OverrideHistoryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const history = (listingPrepPackage?.overrideHistorySnapshot ?? null) as
    | {
        activeOverride?: { summary?: string | null; overrideReason?: string | null; approvedAt?: string | null } | null;
        latestOverride?: { summary?: string | null; overrideReason?: string | null; approvedAt?: string | null } | null;
        history?: Array<{ summary?: string | null; overrideReason?: string | null; approvedAt?: string | null }>;
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Override history appears here after a listing-prep package records floor-price review decisions.
      </section>
    );
  }

  const entries = history?.history ?? [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Override History</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{history?.activeOverride ? "Active override on record" : "No active override"}</h3>
      <p className="mt-2 text-sm text-slate-300">
        Keep the latest override easy to review without losing prior floor-price review context.
      </p>
      <div className="mt-4 space-y-3">
        {(entries.length ? entries : [history?.latestOverride].filter(Boolean)).map((entry, index) => (
          <div key={`${entry?.approvedAt ?? "override"}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{index === 0 ? "Latest override" : `History ${index + 1}`}</p>
            <p className="mt-2 font-semibold text-white">{entry?.summary ?? "Override history entry"}</p>
            <p className="mt-1 text-xs text-slate-400">{entry?.overrideReason ?? "No explicit reason captured."}</p>
            <p className="mt-1 text-xs text-slate-500">{entry?.approvedAt ? new Date(entry.approvedAt).toLocaleString() : "Approval timestamp unavailable"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
