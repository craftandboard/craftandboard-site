"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

function renderList(title: string, items: string[]) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function LastStepChecklistCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = listingPrepPackage?.lastStepChecklistSnapshot as Record<string, unknown> | null;
  const lastChecks = Array.isArray(snapshot?.lastChecks) ? (snapshot?.lastChecks as string[]) : [];
  const blockingChecks = Array.isArray(snapshot?.blockingChecks)
    ? (snapshot?.blockingChecks as string[])
    : [];
  const reviewChecks = Array.isArray(snapshot?.reviewChecks) ? (snapshot?.reviewChecks as string[]) : [];
  const pricingCriticalChecks = Array.isArray(snapshot?.pricingCriticalChecks)
    ? (snapshot?.pricingCriticalChecks as string[])
    : [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Last-Step Checklist</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Verify these last</h3>
      <p className="mt-1 text-sm text-slate-300">
        Separate blocking checks from review checks so the final manual listing pass is easier to run.
      </p>

      {listingPrepPackage && snapshot ? (
        <div className="mt-5 space-y-4">
          {renderList("Last Checks", lastChecks)}
          {renderList("Blocking Checks", blockingChecks)}
          {renderList("Review Checks", reviewChecks)}
          {renderList("Pricing-Critical Checks", pricingCriticalChecks)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-4 text-sm text-slate-300">
          No last-step checklist yet. Refresh the listing-prep package first.
        </div>
      )}
    </section>
  );
}
