"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function QuickCopySummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.quickCopySummarySnapshot ?? null) as Record<string, unknown> | null;
  const copyFirstFields = Array.isArray(snapshot?.copyFirstFields)
    ? (snapshot?.copyFirstFields as string[])
    : [];
  const priorityCopyBlocks = Array.isArray(snapshot?.priorityCopyBlocks)
    ? (snapshot?.priorityCopyBlocks as Array<Record<string, unknown>>)
    : [];
  const shortSummary =
    typeof listingPrepPackage?.shortPlainTextSummarySnapshot?.["summary"] === "string"
      ? String(listingPrepPackage.shortPlainTextSummarySnapshot.summary)
      : null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Quick-copy guidance appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Quick Copy</p>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-200">
          {listingPrepPackage.quickCopyVersion ?? "quick-copy-v1"}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">Copy these first</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.quickCopySummary ?? "Priority copy guidance will appear here after package refresh.")}
      </p>
      {shortSummary ? (
        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
          {shortSummary}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Copy first fields</p>
          {copyFirstFields.length ? (
            <ol className="mt-3 space-y-2 text-sm text-slate-200">
              {copyFirstFields.map((field, index) => (
                <li key={field} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="mr-2 text-slate-400">{index + 1}.</span>
                  {field}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-300">No priority fields recorded yet.</p>
          )}
        </div>
        <div className="space-y-3">
          {priorityCopyBlocks.length ? (
            priorityCopyBlocks.map((block, index) => (
              <div key={`${String(block.label ?? "block")}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {String(block.label ?? `Copy block ${index + 1}`)}
                </p>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
                  {JSON.stringify(block.value ?? null, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-slate-300">
              Priority copy blocks have not been generated yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
