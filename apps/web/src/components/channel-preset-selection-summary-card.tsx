"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ChannelPresetSelectionSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = (listingPrepPackage?.channelPresetSelectionSummary ?? null) as
    | {
        presetLabel?: string | null;
        autoApplied?: boolean;
        selectionReason?: string | null;
        summary?: string | null;
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Channel preset selection details appear here after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Preset Selection</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {summary?.presetLabel ?? listingPrepPackage.channelMappingPresetName ?? "No channel preset applied"}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {summary?.summary ?? "Preset selection details will appear after a package applies a channel preset."}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selection mode</p>
          <p className="mt-2 font-semibold text-white">{summary?.autoApplied ? "Auto-applied from launch context" : "Manual selection"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Why this preset</p>
          <p className="mt-2 font-semibold text-white">{summary?.selectionReason ?? "No selection reason captured."}</p>
        </div>
      </div>
    </section>
  );
}
