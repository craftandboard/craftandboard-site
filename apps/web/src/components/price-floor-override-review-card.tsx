"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function PriceFloorOverrideReviewCard({
  listingPrepPackage,
  onSubmit,
  busy
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
  onSubmit: (formData: FormData) => void;
  busy?: boolean;
}) {
  const override = (listingPrepPackage?.overrideSnapshot ?? null) as
    | {
        overrideRequested?: boolean;
        overrideApproved?: boolean;
        overrideReason?: string | null;
        summary?: string;
        blockingWarningCodes?: string[];
      }
    | null;

  if (!listingPrepPackage) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
        Price-floor override review appears here when a listing-prep package has blocking launch-price warnings.
      </section>
    );
  }

  const blockingCodes = override?.blockingWarningCodes ?? [];

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Price-Floor Override Review</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {override?.overrideApproved
          ? "Ready with override"
          : override?.overrideRequested
            ? "Override requested"
            : "No approved override"}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {override?.summary ??
          "If blocking price-floor warnings remain, add a clear override reason before treating the package as ready for internal handoff."}
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Blocking warning codes</p>
        <p className="mt-2">{blockingCodes.length ? blockingCodes.join(", ") : "No blocking price-floor warnings"}</p>
      </div>

      <form action={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-300">
          Override reason
          <textarea
            name="reason"
            defaultValue={override?.overrideReason ?? ""}
            rows={3}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"
            placeholder="Explain why this launch candidate should still move forward despite the floor warning."
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="approve"
            value="true"
            defaultChecked={Boolean(override?.overrideApproved)}
            className="rounded border-white/20 bg-slate-950/35"
          />
          Approve this override for internal listing-prep handoff
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Save override review
        </button>
      </form>
    </section>
  );
}
