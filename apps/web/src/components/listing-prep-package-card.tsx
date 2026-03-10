"use client";

import type { CostComparisonResult, ListingPrepPackageRecord } from "../lib/api";
import {
  getApprovalStateLabel,
  getApprovalStateTone,
  getListingPrepPackageStatusLabel,
  getListingPrepPackageStatusTone,
  getListingReadinessLabel,
  getListingReadinessTone
} from "../lib/cost-engine";

export function ListingPrepPackageCard({
  comparison,
  listingPrepPackage
}: {
  comparison: CostComparisonResult | null;
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  if (!comparison?.selectedLaunchScenarioId) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Select a launch scenario first. The stable listing-prep package appears here after you build it from the chosen candidate.
      </section>
    );
  }

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        No listing-prep package exists yet for this comparison set. Build one after reviewing ranking and listing readiness.
      </section>
    );
  }

  const listingPrepSummary = (comparison?.listingPrepSummarySnapshot ?? {}) as Record<string, unknown>;
  const readySummary = (listingPrepPackage.readyForListingPrepSummary ?? {}) as Record<string, unknown>;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Listing-Prep Package</p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getListingPrepPackageStatusTone(listingPrepPackage.status)}`}
        >
          {getListingPrepPackageStatusLabel(listingPrepPackage.status)}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getApprovalStateTone(listingPrepPackage.approvalState)}`}
        >
          {getApprovalStateLabel(listingPrepPackage.approvalState)}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getListingReadinessTone(listingPrepPackage.listingReadinessStatus)}`}
        >
          {getListingReadinessLabel(listingPrepPackage.listingReadinessStatus)}
        </span>
        {listingPrepPackage.currentApprovedArtifact ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Current approved artifact
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-xl font-semibold text-white">{listingPrepPackage.name}</h3>
      <p className="mt-2 text-sm text-slate-300">
        Stable internal handoff package for future listing work. This record keeps the selected scenario, validation state,
        warnings, override review, and export snapshot together.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scenario</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.scenarioName ?? "Unknown scenario"}</p>
          <p className="mt-1 text-xs text-slate-400">{listingPrepPackage.comparisonSetName ?? "Current comparison set"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Summary</p>
          <p className="mt-2 font-semibold text-white">
            {String(listingPrepSummary.packageReadinessLabel ?? getListingPrepPackageStatusLabel(listingPrepPackage.status))}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {String(listingPrepSummary.validationSummary ?? "Validation summary will appear after marketplace field review.")}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mapping template</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.marketplaceMappingTemplateName ?? "No template applied"}</p>
          <p className="mt-1 text-xs text-slate-400">Export {listingPrepPackage.exportVersion ?? "listing-prep-v1"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel preset</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.channelMappingPresetName ?? "No channel preset"}</p>
          <p className="mt-1 text-xs text-slate-400">Contract {listingPrepPackage.exportContractVersion ?? "manual-amazon-v1"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Worksheet</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.worksheetVersion ?? "manual-listing-v1"}</p>
          <p className="mt-1 text-xs text-slate-400">
            {listingPrepPackage.autoAppliedChannelPreset ? "Preset auto-applied from launch context" : "Preset chosen manually or not applied"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ready for listing prep</p>
          <p className="mt-2 font-semibold text-white">{listingPrepPackage.readyForListingPrep ? "Yes" : "Not yet"}</p>
          <p className="mt-1 text-xs text-slate-400">{String(readySummary.summary ?? "Run refresh and validation to finalize package readiness.")}</p>
        </div>
      </div>
    </section>
  );
}
