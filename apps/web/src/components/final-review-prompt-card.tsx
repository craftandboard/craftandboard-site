"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function PromptGroup({ title, prompts }: { title: string; prompts: string[] }) {
  if (!prompts.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {prompts.map((prompt) => (
          <li key={prompt} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            {prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FinalReviewPromptCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.finalReviewPromptSnapshot ?? null) as Record<string, unknown> | null;
  const critical = Array.isArray(snapshot?.criticalReviewPrompts)
    ? (snapshot?.criticalReviewPrompts as string[])
    : [];
  const warningSensitive = Array.isArray(snapshot?.warningSensitivePrompts)
    ? (snapshot?.warningSensitivePrompts as string[])
    : [];
  const completion = Array.isArray(snapshot?.completionReviewPrompts)
    ? (snapshot?.completionReviewPrompts as string[])
    : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Final-review prompts appear after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Final Review</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Last checks before manual Amazon entry</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "Final-review prompts will appear here after package refresh.")}
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <PromptGroup title="Critical checks" prompts={critical} />
        <PromptGroup title="Warning-sensitive checks" prompts={warningSensitive} />
        <PromptGroup title="Completion checks" prompts={completion} />
      </div>
    </section>
  );
}
