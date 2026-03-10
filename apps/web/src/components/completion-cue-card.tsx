"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function cueTone(label: string) {
  if (label === "READY_NOW") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (label === "READY_WITH_OVERRIDE") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (label === "BLOCKED") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/5 text-slate-200";
}

export function CompletionCueCard({ listingPrepPackage }: { listingPrepPackage: ListingPrepPackageRecord | null }) {
  const snapshot = (listingPrepPackage?.completionCueSnapshot ?? null) as Record<string, unknown> | null;
  const lastChecks = Array.isArray(snapshot?.lastChecks) ? (snapshot.lastChecks as string[]) : [];
  const cueLabel = typeof snapshot?.cueLabel === "string" ? String(snapshot.cueLabel) : "NEEDS_REVIEW";

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Completion cues appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Completion Cue</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cueTone(cueLabel)}`}>
          {cueLabel.replaceAll("_", " ")}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">Use-now vs review-last guidance</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "Completion guidance will appear here after package refresh.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {([
          ["Ready now", Boolean(snapshot?.readyNowBoolean)],
          ["Ready with override", Boolean(snapshot?.readyWithOverrideBoolean)],
          ["Needs review", Boolean(snapshot?.needsReviewBoolean)],
          ["Blocked", Boolean(snapshot?.blockedBoolean)]
        ] as Array<[string, boolean]>).map(([label, active]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 font-semibold text-white">{active ? "Yes" : "No"}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last checks</p>
        {lastChecks.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {lastChecks.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No last-step checks recorded yet.</p>
        )}
      </div>
    </section>
  );
}
