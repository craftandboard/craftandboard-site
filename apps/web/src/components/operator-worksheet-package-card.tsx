"use client";

import type { ReactNode } from "react";
import type { ListingPrepPackageRecord } from "../lib/api";

function SectionCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

export function OperatorWorksheetPackageCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const worksheet = (listingPrepPackage?.operatorWorksheetSnapshot ?? null) as Record<string, unknown> | null;
  const header = (worksheet?.headerSummary ?? {}) as Record<string, unknown>;
  const pricing = (worksheet?.pricingBlock ?? {}) as Record<string, unknown>;
  const specs = (worksheet?.specBlock ?? {}) as Record<string, unknown>;
  const fulfillment = (worksheet?.fulfillmentBlock ?? {}) as Record<string, unknown>;
  const warningBlock = (worksheet?.warningOverrideBlock ?? {}) as Record<string, unknown>;
  const status = (worksheet?.approvalExportStatusSummary ?? {}) as Record<string, unknown>;
  const prompts = Array.isArray(worksheet?.manualEntryPrompts) ? (worksheet?.manualEntryPrompts as string[]) : [];

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Operator worksheet package appears after a listing-prep package is built.
      </section>
    );
  }

  if (!worksheet) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Operator worksheet package has not been generated yet. Refresh the package to build the grouped operator artifact.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Operator Worksheet</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
          {String(worksheet.operatorWorksheetVersion ?? listingPrepPackage.operatorWorksheetVersion ?? "operator-listing-v1")}
        </span>
        {header.currentApprovedArtifact ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Current approved artifact
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white">{String(header.packageName ?? listingPrepPackage.name)}</h3>
      <p className="mt-2 text-sm text-slate-300">
        Scan this grouped worksheet during manual Amazon listing prep instead of reading the raw package JSON.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <SectionCard title="Approval">
          <p>{String(status.approvalState ?? listingPrepPackage.approvalState)}</p>
        </SectionCard>
        <SectionCard title="Worksheet version">
          <p>{String(status.worksheetVersion ?? listingPrepPackage.worksheetVersion ?? "manual-listing-v1")}</p>
        </SectionCard>
        <SectionCard title="Export version">
          <p>{String(status.exportVersion ?? listingPrepPackage.exportVersion ?? "listing-prep-v1")}</p>
        </SectionCard>
        <SectionCard title="Approved at">
          <p>{status.approvedAt ? new Date(String(status.approvedAt)).toLocaleString() : "Not approved"}</p>
        </SectionCard>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Pricing">
          <p>Launch: {String(pricing.recommendedLaunchPrice ?? "Not set")}</p>
          <p>Minimum: {String(pricing.minimumPrice ?? "Not set")}</p>
          <p>Safer margin: {String(pricing.saferMarginPrice ?? "Not set")}</p>
        </SectionCard>
        <SectionCard title="Specs">
          <p>{String(specs.productLabel ?? "Unnamed product")}</p>
          <p>{String(specs.dimensionsSummary ?? "No dimensions")}</p>
          <p>{String(specs.materialSummary ?? "No material")}</p>
          <p>{String(specs.edgeBandSummary ?? "No edge band summary")}</p>
        </SectionCard>
        <SectionCard title="Packaging / Shipping">
          <p>{String(fulfillment.packagingSummary ?? "No packaging summary")}</p>
          <p>{String(fulfillment.shippingSummary ?? "No shipping summary")}</p>
          <p>Fee preset: {String(fulfillment.feePresetLabel ?? "None")}</p>
          <p>Zone: {String(fulfillment.shippingZoneLabel ?? "None")}</p>
        </SectionCard>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warnings and override notes</p>
        {Array.isArray(warningBlock.warnings) && warningBlock.warnings.length ? (
          <ul className="mt-2 space-y-2">
            {warningBlock.warnings.map((warning) => (
              <li key={JSON.stringify(warning)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                {typeof warning === "string" ? warning : JSON.stringify(warning)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No active warnings in the operator worksheet.</p>
        )}
        <p className="mt-3">{warningBlock.overrideSummary ? JSON.stringify(warningBlock.overrideSummary) : "No override summary attached."}</p>
      </div>
      {prompts.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Operator prompts</p>
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
