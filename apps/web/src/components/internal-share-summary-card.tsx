"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function InternalShareSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.internalShareSummarySnapshot ?? null) as Record<string, unknown> | null;
  const sections = Array.isArray(snapshot?.shareBlockSections)
    ? (snapshot?.shareBlockSections as Array<Record<string, unknown>>)
    : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Internal share summary appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Internal Share</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Concise package handoff summary</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "Internal share summary will appear here after package refresh.")}
      </p>
      <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-sm text-violet-50">
        {String(snapshot?.shortShareText ?? listingPrepPackage.shortShareTextSnapshot?.text ?? "No short share text available yet.")}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {sections.length ? sections.map((section, index) => (
          <div key={`${String(section.key ?? "section")}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{String(section.label ?? `Section ${index + 1}`)}</p>
            <p className="mt-3 text-sm text-slate-200">{String(section.value ?? "No value")}</p>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-slate-300 md:col-span-3">
            No share sections have been generated yet.
          </div>
        )}
      </div>
    </section>
  );
}
