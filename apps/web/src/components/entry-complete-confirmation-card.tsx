"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function EntryCompleteConfirmationCard({
  listingPrepPackage,
  onSubmit,
  busy
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
  onSubmit: (formData: FormData) => void;
  busy?: boolean;
}) {
  const cue = (listingPrepPackage?.entryCompleteCueSnapshot ?? null) as
    | {
        summary?: string | null;
        entryCompletionStatus?: string | null;
      }
    | null;

  if (!listingPrepPackage) return null;

  const disabled =
    busy ||
    !listingPrepPackage.currentApprovedArtifact ||
    listingPrepPackage.approvalState === "BLOCKED" ||
    listingPrepPackage.entryCompletionConfirmed;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">End-Of-Entry Confirmation</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Mark manual entry complete</h3>
      <p className="mt-2 text-sm text-slate-300">
        {listingPrepPackage.entryCompletionConfirmed
          ? "This package already has a retained completion confirmation."
          : String(
              cue?.summary ??
                "When the operator has finished manual Amazon entry from this package, confirm completion here so closeout state is retained."
            )}
      </p>
      <form action={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-300">
          Completion note
          <textarea
            name="note"
            rows={3}
            defaultValue={listingPrepPackage.entryCompletionNote ?? ""}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-white"
            placeholder="Optional note about what was entered, anything unusual, or what should be remembered at closeout."
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>State: {listingPrepPackage.entryCompletionState ?? listingPrepPackage.entryCompletionStatus ?? "ENTRY_READY"}</span>
          <span>{listingPrepPackage.currentApprovedArtifact ? "Current artifact" : "Historical artifact"}</span>
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {listingPrepPackage.entryCompletionConfirmed ? "Entry already confirmed" : "Confirm entry complete"}
        </button>
      </form>
    </section>
  );
}
