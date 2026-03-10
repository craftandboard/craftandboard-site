"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function WorksheetExportSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const structured = (listingPrepPackage?.structuredWorksheetExportSnapshot ?? null) as Record<string, unknown> | null;
  const plainText = (listingPrepPackage?.plainTextWorksheetSnapshot ?? null) as Record<string, unknown> | null;
  const ergonomics = (listingPrepPackage?.worksheetErgonomicsSummary ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Worksheet export summaries appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Worksheet Export</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Plain-text and structured handoff views</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Copy groups</p>
          <p className="mt-2 font-semibold text-white">{String(ergonomics?.copyGroupCount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prompts</p>
          <p className="mt-2 font-semibold text-white">{String(ergonomics?.promptCount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Missing critical fields</p>
          <p className="mt-2 font-semibold text-white">{String(ergonomics?.missingCriticalFieldCount ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ready to use</p>
          <p className="mt-2 font-semibold text-white">{ergonomics?.readyToUseBoolean ? "Yes" : "Needs review"}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">
        {String(ergonomics?.summary ?? "Worksheet ergonomics summary will appear here after refresh.")}
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plain-text worksheet</p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
            {String(plainText?.text ?? "Plain-text worksheet has not been generated yet.")}
          </pre>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Structured export summary</p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
            {JSON.stringify(structured, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
