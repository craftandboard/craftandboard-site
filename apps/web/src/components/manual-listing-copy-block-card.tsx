"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function renderValue(value: unknown) {
  if (value === null || value === undefined) return "Not set";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function ManualListingCopyBlockCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.copyExportSnapshot ?? null) as Record<string, unknown> | null;
  const groups = (snapshot?.groups ?? {}) as Record<string, { label?: string; value?: unknown }>;
  const ordering =
    ((snapshot?.groupOrdering as Record<string, unknown> | undefined)?.groups as string[] | undefined) ??
    Object.keys(groups);

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Copy-friendly worksheet sections appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Copy Blocks</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Grouped values for manual Amazon entry</h3>
      <p className="mt-2 text-sm text-slate-300">
        Quick summary: {String(snapshot?.quickCopySummary ?? "Copy groups will appear here once the worksheet export is generated.")}
      </p>
      <div className="mt-4 space-y-4">
        {ordering.map((groupKey) => {
          const group = groups[groupKey];
          if (!group) return null;
          return (
            <div key={groupKey} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {String(group.label ?? groupKey)}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
                {renderValue(group.value)}
              </pre>
            </div>
          );
        })}
      </div>
    </section>
  );
}
