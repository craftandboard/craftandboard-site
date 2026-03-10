"use client";

import type { ListingPrepPackageRecord } from "../lib/api";
import { getFieldValidationLabel, getFieldValidationTone } from "../lib/cost-engine";

export function MarketplaceMappingValidationCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const validation = (listingPrepPackage?.validationSnapshot ?? null) as
    | {
        validationStatus?: string;
        missingFields?: string[];
        weakFields?: string[];
        readyFields?: string[];
        validationSummary?: string;
      }
    | null;

  if (!listingPrepPackage || !validation) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Marketplace field validation will appear here after a listing-prep package is built and validated.
      </section>
    );
  }

  const missingFields = validation.missingFields ?? [];
  const weakFields = validation.weakFields ?? [];
  const readyFields = validation.readyFields ?? [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Marketplace Field Validation</p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getFieldValidationTone(validation.validationStatus)}`}
        >
          {getFieldValidationLabel(validation.validationStatus)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {validation.validationSummary ?? "Field-level prep validation will explain whether the package is clean enough for internal listing handoff."}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-100">Missing fields</p>
          <p className="mt-2">{missingFields.length ? missingFields.join(", ") : "None"}</p>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Weak fields</p>
          <p className="mt-2">{weakFields.length ? weakFields.join(", ") : "None"}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Ready fields</p>
          <p className="mt-2">{readyFields.length ? readyFields.join(", ") : "None yet"}</p>
        </div>
      </div>
    </section>
  );
}
