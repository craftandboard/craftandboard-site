"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ManualListingWorksheetCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const worksheet = (listingPrepPackage?.manualListingWorksheetSnapshot ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Manual listing worksheet appears here after a listing-prep package is built.
      </section>
    );
  }

  if (!worksheet) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Manual listing worksheet has not been generated yet. Refresh or approve the package to populate it.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Manual Listing Worksheet</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Operational worksheet for manual Amazon entry</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worksheet version</p>
          <p className="mt-2 font-semibold text-white">{String(worksheet.worksheetVersion ?? listingPrepPackage.worksheetVersion ?? "manual-listing-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Product label</p>
          <p className="mt-2 font-semibold text-white">{String(worksheet.productLabel ?? "Unnamed package")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel preset</p>
          <p className="mt-2 font-semibold text-white">{String(worksheet.channelPresetLabel ?? "No preset")}</p>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
        {JSON.stringify(worksheet, null, 2)}
      </pre>
    </section>
  );
}
