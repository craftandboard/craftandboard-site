"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ManualAmazonExportCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const exportSnapshot = (listingPrepPackage?.manualAmazonExportSnapshot ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Manual Amazon export appears here after a listing-prep package has been built.
      </section>
    );
  }

  if (!exportSnapshot) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Manual Amazon export contract has not been generated yet. Refresh or approve the package to populate the export block.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Manual Amazon Export</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Approved listing entry contract</h3>
      <p className="mt-2 text-sm text-slate-300">
        Use this stable internal contract as the manual Amazon listing handoff artifact. It preserves the approved package, launch prices, warnings, and channel formatting choices.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contract version</p>
          <p className="mt-2 font-semibold text-white">{String(exportSnapshot.exportContractVersion ?? listingPrepPackage.exportContractVersion ?? "manual-amazon-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel preset</p>
          <p className="mt-2 font-semibold text-white">{String(exportSnapshot.channelPresetLabel ?? listingPrepPackage.channelMappingPresetName ?? "No preset")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.approvalState}</p>
        </div>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-200">
        {JSON.stringify(exportSnapshot, null, 2)}
      </pre>
    </section>
  );
}
