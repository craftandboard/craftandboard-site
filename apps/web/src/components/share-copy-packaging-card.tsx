"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ShareCopyPackagingCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = listingPrepPackage?.shareCopyPackagingSummary;
  if (!listingPrepPackage) return null;
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Share / Copy Packaging</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Copy or share with less friction</h3>
      <p className="mt-1 text-sm text-slate-300">
        {String(summary?.summary ?? "Share/copy packaging summary is not available yet.")}
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-xs text-slate-200">
        {JSON.stringify(summary, null, 2)}
      </pre>
    </section>
  );
}
