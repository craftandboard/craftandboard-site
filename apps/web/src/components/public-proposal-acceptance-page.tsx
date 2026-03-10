"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getPublicAcceptanceConfirmation,
  getPublicAcceptanceInstructions,
  getPublicAcceptancePresentationState,
  getPublicAcceptanceReadyState,
  getPublicProposalReview,
  submitPublicProposalAcceptance,
  trackPublicAcceptancePresentationViewed,
  type PublicProposalSnapshot
} from "../lib/api";
import { formatCurrency, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function PublicProposalAcceptancePage({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{
    reviewAllowed: boolean;
    intakeStatus: string;
    blockedReasons: string[];
    nextActions: string[];
    proposal: PublicProposalSnapshot | null;
  } | null>(null);
  const [presentation, setPresentation] = useState<{
    state: string;
    reviewAllowed: boolean;
    blockedReasons: string[];
    nextActions: string[];
    reviewCompleted: boolean;
    submissionCompleted: boolean;
    confirmationCompleted: boolean;
  } | null>(null);
  const [instructions, setInstructions] = useState<Array<{ key: string; label: string; detail: string }>>([]);
  const [confirmation, setConfirmation] = useState<{
    state: string;
    submissionCompleted: boolean;
    confirmationSummary: {
      headline: string;
      detail: string;
      submittedAt: string | null;
      confirmedAt: string | null;
    } | null;
    nextActions: string[];
    blockedReasons: string[];
  } | null>(null);
  const [form, setForm] = useState({
    signerName: "",
    signerEmail: "",
    note: ""
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [reviewPayload, presentationPayload, instructionsPayload, confirmationPayload] =
          await Promise.all([
            getPublicProposalReview(token),
            getPublicAcceptancePresentationState(token),
            getPublicAcceptanceInstructions(token),
            getPublicAcceptanceConfirmation(token)
          ]);

        if (cancelled) {
          return;
        }

        setReview(reviewPayload.review);
        setPresentation(presentationPayload.presentation);
        setInstructions(instructionsPayload.instructions.instructions);
        setConfirmation(confirmationPayload.confirmation);
        await trackPublicAcceptancePresentationViewed(token);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "This acceptance link is not available.");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function load() {
    setError(null);
    try {
      const [reviewPayload, presentationPayload, instructionsPayload, confirmationPayload] =
        await Promise.all([
          getPublicProposalReview(token),
          getPublicAcceptancePresentationState(token),
          getPublicAcceptanceInstructions(token),
          getPublicAcceptanceConfirmation(token)
        ]);

      setReview(reviewPayload.review);
      setPresentation(presentationPayload.presentation);
      setInstructions(instructionsPayload.instructions.instructions);
      setConfirmation(confirmationPayload.confirmation);
      await trackPublicAcceptancePresentationViewed(token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This acceptance link is not available.");
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          await submitPublicProposalAcceptance({
            token,
            confirmed: true,
            signerName: form.signerName,
            signerEmail: form.signerEmail || null,
            note: form.note || null
          });
          const [readyPayload, confirmationPayload] = await Promise.all([
            getPublicAcceptanceReadyState(token),
            getPublicAcceptanceConfirmation(token)
          ]);
          setPresentation(readyPayload.ready);
          setConfirmation(confirmationPayload.confirmation);
          await load();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to submit acceptance.");
        }
      })();
    });
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-8 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (!review || !presentation) {
    return (
      <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Loading proposal review...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={presentation.state} />
        <StatusBadge value={review.intakeStatus} />
      </div>

      {review.proposal ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
            {review.proposal.organizationName ?? "FieldMetriq"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {review.proposal.title ?? "Proposal Review"}
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">{review.proposal.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatCurrency(review.proposal.totals.totalCents)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit Policy</p>
              <p className="mt-2 text-sm text-white">
                {humanizeToken(review.proposal.depositSummary.policy)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outstanding</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatCurrency(review.proposal.depositSummary.outstandingAmountCents)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {review.proposal.sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-white/10 px-4 py-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <div className="mt-3 space-y-3">
                  {section.lines.map((line) => (
                    <div key={`${section.title}-${line.name}`} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-white">{line.name}</p>
                        {line.description ? <p className="mt-1 text-slate-300">{line.description}</p> : null}
                      </div>
                      <div className="text-right text-slate-200">
                        <p>
                          {line.qty} {line.unit ?? "item"}
                        </p>
                        <p>{formatCurrency(line.lineTotalCents)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          This proposal is not available for public review.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Instructions</p>
          <div className="mt-4 space-y-3">
            {instructions.map((item) => (
              <div key={item.key} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <p className="font-medium text-white">{item.label}</p>
                <p className="mt-1 text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confirm Acceptance</p>
          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Your Name</span>
              <input
                value={form.signerName}
                onChange={(event) => setForm((current) => ({ ...current, signerName: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Email (optional)</span>
              <input
                value={form.signerEmail}
                onChange={(event) => setForm((current) => ({ ...current, signerEmail: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Note (optional)</span>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isPending ||
                !presentation.reviewAllowed ||
                !presentation.nextActions.includes("confirm") ||
                !form.signerName.trim()
              }
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 disabled:opacity-60"
            >
              {isPending ? "Submitting..." : "Confirm Acceptance"}
            </button>
          </div>
        </article>
      </section>

      {confirmation?.confirmationSummary ? (
        <section className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 p-6">
          <h3 className="text-xl font-semibold text-white">{confirmation.confirmationSummary.headline}</h3>
          <p className="mt-2 text-sm text-emerald-50/90">{confirmation.confirmationSummary.detail}</p>
        </section>
      ) : null}
    </div>
  );
}
