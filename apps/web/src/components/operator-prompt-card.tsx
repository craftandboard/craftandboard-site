"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function renderPromptList(title: string, prompts: string[]) {
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

export function OperatorPromptCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.operatorPromptSnapshot ?? null) as Record<string, unknown> | null;
  const criticalPrompts = Array.isArray(snapshot?.criticalPrompts) ? (snapshot?.criticalPrompts as string[]) : [];
  const reviewPrompts = Array.isArray(snapshot?.reviewPrompts) ? (snapshot?.reviewPrompts as string[]) : [];
  const completionPrompts = Array.isArray(snapshot?.completionPrompts)
    ? (snapshot?.completionPrompts as string[])
    : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Operator prompts appear once a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Operator Prompts</p>
      <h3 className="mt-2 text-xl font-semibold text-white">What to check before and during manual listing entry</h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "Prompt guidance is generated from approval state, warnings, overrides, and checklist gaps.")}
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {renderPromptList("Critical", criticalPrompts)}
        {renderPromptList("Review", reviewPrompts)}
        {renderPromptList("Completion", completionPrompts)}
      </div>
    </section>
  );
}
