"use client";

import type { ListingPrepPackageRecord } from "../lib/api";
import { getApprovalStateLabel, getApprovalStateTone } from "../lib/cost-engine";

export function ListingPrepApprovalCard({
  listingPrepPackage,
  onApprove,
  busy
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
  onApprove: () => void;
  busy?: boolean;
}) {
  const approvalSummary = (listingPrepPackage?.approvalSummarySnapshot ?? null) as
    | {
        approvalSummary?: string | null;
        approvalWarnings?: string[];
        approvalBlockingReasons?: string[];
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Package approval appears here after a listing-prep package has been built.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Approval State</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getApprovalStateTone(listingPrepPackage.approvalState)}`}>
          {getApprovalStateLabel(listingPrepPackage.approvalState)}
        </span>
        {listingPrepPackage.currentApprovedArtifact ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Current approved artifact
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {approvalSummary?.approvalSummary ?? "Approval state will update after validation, override review, and manual export checks complete."}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Blocking reasons</p>
          <p className="mt-2 font-semibold text-white">
            {(approvalSummary?.approvalBlockingReasons ?? []).length
              ? (approvalSummary?.approvalBlockingReasons ?? []).join(" | ")
              : "None"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval warnings</p>
          <p className="mt-2 font-semibold text-white">
            {(approvalSummary?.approvalWarnings ?? []).length
              ? (approvalSummary?.approvalWarnings ?? []).join(" | ")
              : "No extra approval warnings"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>Approved at: {listingPrepPackage.approvedAt ? new Date(listingPrepPackage.approvedAt).toLocaleString() : "Not approved yet"}</span>
        <span>Contract: {listingPrepPackage.exportContractVersion ?? "manual-amazon-v1"}</span>
      </div>
      <button
        type="button"
        onClick={onApprove}
        disabled={busy || listingPrepPackage.approvalState === "BLOCKED"}
        className="mt-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Approve manual Amazon package
      </button>
    </section>
  );
}
