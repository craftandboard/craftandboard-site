"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function renderList(title: string, items: string[]) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-2 text-white">{items.length ? items.join(" | ") : "None"}</div>
    </div>
  );
}

export function OperatorFieldChecklistCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const checklist = (listingPrepPackage?.operatorChecklistSnapshot ?? null) as Record<string, unknown> | null;
  const requiredComplete = Array.isArray(checklist?.requiredCompleteFields)
    ? (checklist?.requiredCompleteFields as string[])
    : [];
  const requiredMissing = Array.isArray(checklist?.requiredMissingFields)
    ? (checklist?.requiredMissingFields as string[])
    : [];
  const optionalIncomplete = Array.isArray(checklist?.optionalIncompleteFields)
    ? (checklist?.optionalIncompleteFields as string[])
    : [];
  const prompts = Array.isArray(checklist?.manualReviewPrompts) ? (checklist?.manualReviewPrompts as string[]) : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Operator checklist appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Operator Checklist</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Quick scan of required and weak listing fields</h3>
      <p className="mt-2 text-sm text-slate-300">{String(checklist?.readinessSummary ?? "Checklist summary appears here after refresh.")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderList("Required complete", requiredComplete)}
        {renderList("Required missing", requiredMissing)}
        {renderList("Optional incomplete", optionalIncomplete)}
      </div>
      {prompts.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Manual review prompts</p>
          <div className="mt-2 space-y-2">
            {prompts.map((prompt) => (
              <p key={prompt}>{prompt}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
