"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ChannelHandoffSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = (listingPrepPackage?.channelHandoffSummarySnapshot ?? null) as Record<string, unknown> | null;
  const promptBlock = (summary?.operatorPrompts ?? {}) as Record<string, unknown>;
  const prompts = Array.isArray(promptBlock.prompts) ? (promptBlock.prompts as string[]) : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Channel handoff notes appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Channel Handoff</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Thin Amazon-manual packaging guidance</h3>
      <p className="mt-2 text-sm text-slate-300">{String(summary?.summary ?? "Channel-specific grouping and prompts are shown here.")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel</p>
          <p className="mt-2 font-semibold text-white">{String(summary?.channelCode ?? "AMAZON_MANUAL")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preset</p>
          <p className="mt-2 font-semibold text-white">{String(summary?.presetLabel ?? listingPrepPackage.channelMappingPresetName ?? "No preset")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selection</p>
          <p className="mt-2 font-semibold text-white">{summary?.autoApplied ? "Auto-applied from launch context" : "Manually selected"}</p>
        </div>
      </div>
      {prompts.length ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {prompts.map((prompt) => (
            <li key={prompt} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">{prompt}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
