"use client";

import type { ListingPrepPackageRecord } from "../lib/api";
import { getApprovalStateLabel, getApprovalStateTone } from "../lib/cost-engine";

export function CurrentApprovedArtifactCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const summary = (listingPrepPackage?.currentApprovedArtifactSummary ?? null) as Record<string, unknown> | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Current approved artifact status appears after a listing-prep package is built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Current Artifact</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getApprovalStateTone(listingPrepPackage.approvalState)}`}>
          {getApprovalStateLabel(listingPrepPackage.approvalState)}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${listingPrepPackage.currentApprovedArtifact ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}>
          {listingPrepPackage.currentApprovedArtifact ? "Use this artifact now" : "Historical / in progress"}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {String(summary?.summary ?? "This card tells Brandon and Hugo which package should be used for manual listing prep right now.")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Export</p>
          <p className="mt-2 font-semibold text-white">{String(summary?.exportContractVersion ?? listingPrepPackage.exportContractVersion ?? "manual-amazon-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worksheet</p>
          <p className="mt-2 font-semibold text-white">{String(summary?.operatorWorksheetVersion ?? listingPrepPackage.operatorWorksheetVersion ?? "operator-listing-v1")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approved at</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.approvedAt ? new Date(listingPrepPackage.approvedAt).toLocaleString() : "Not approved"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Override</p>
          <p className="mt-2 font-semibold text-white">{summary?.hasOverride ? "Approved with override" : "No override"}</p>
        </div>
      </div>
    </section>
  );
}
