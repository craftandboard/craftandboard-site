"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function ArtifactHandoffSummaryCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const snapshot = (listingPrepPackage?.artifactHandoffSummarySnapshot ?? null) as Record<string, unknown> | null;
  const artifactIdentity = (snapshot?.artifactIdentity ?? null) as Record<string, unknown> | null;
  const versionSummary = (snapshot?.artifactVersionSummary ?? null) as Record<string, unknown> | null;
  const statusSummary = (snapshot?.artifactStatusSummary ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Artifact handoff summary appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Artifact Handoff</p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            snapshot?.artifactUseNowBoolean
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 bg-black/20 text-slate-300"
          }`}
        >
          {snapshot?.artifactUseNowBoolean ? "Use this package now" : "Historical package"}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {String(artifactIdentity?.name ?? listingPrepPackage.name)}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {String(snapshot?.summary ?? "This summary clarifies whether this is the package Brandon and Hugo should use right now.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval</p>
          <p className="mt-2 font-semibold text-white">{String(statusSummary?.approvalState ?? listingPrepPackage.approvalState)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick-copy</p>
          <p className="mt-2 font-semibold text-white">{String(versionSummary?.quickCopyVersion ?? listingPrepPackage.quickCopyVersion ?? "quick-copy-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worksheet</p>
          <p className="mt-2 font-semibold text-white">{String(versionSummary?.worksheetVersion ?? listingPrepPackage.worksheetVersion ?? "manual-listing-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Export</p>
          <p className="mt-2 font-semibold text-white">{String(versionSummary?.exportVersion ?? listingPrepPackage.exportVersion ?? "listing-prep-v1")}</p>
        </div>
      </div>
    </section>
  );
}
