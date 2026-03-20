"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function PostCompletionReviewCard({
  listingPrepPackage,
  onSubmit,
  busy
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
  onSubmit: (formData: FormData) => void;
  busy?: boolean;
}) {
  const summary = listingPrepPackage?.postCompletionReviewSnapshot as Record<string, unknown> | null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Post-Completion Review</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Retain a lightweight end-of-flow review</h3>
      <p className="mt-1 text-sm text-slate-300">
        {String(summary?.summary ?? "Capture a short review note after manual entry is complete so the final artifact context stays clear.")}
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <label className="block text-sm text-slate-300">
          Review note
          <textarea
            name="reviewNote"
            defaultValue={typeof listingPrepPackage?.postCompletionReviewNote === "string" ? listingPrepPackage.postCompletionReviewNote : ""}
            className="mt-1 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-white"
            placeholder="What still mattered at closeout, what changed, or what should be remembered later."
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>Reviewed at: {listingPrepPackage?.postCompletionReviewAt ? new Date(listingPrepPackage.postCompletionReviewAt).toLocaleString() : "Not reviewed"}</span>
        </div>
        <button
          type="submit"
          disabled={!listingPrepPackage || busy || !listingPrepPackage.entryCompletionConfirmed}
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Save post-completion review
        </button>
      </form>
    </section>
  );
}
