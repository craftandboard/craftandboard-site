"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import { formatCurrency, getPublicAcceptanceStateLabel, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

type ReviewState = {
  reviewAllowed: boolean;
  intakeStatus: string;
  blockedReasons: string[];
  nextActions: string[];
  proposal: PublicProposalSnapshot | null;
};

type PresentationState = {
  state: string;
  reviewAllowed: boolean;
  blockedReasons: string[];
  nextActions: string[];
  reviewCompleted: boolean;
  submissionCompleted: boolean;
  confirmationCompleted: boolean;
};

type ConfirmationState = {
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
};

export function PublicProposalAcceptancePage({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [presentation, setPresentation] = useState<PresentationState | null>(null);
  const [instructions, setInstructions] = useState<Array<{ key: string; label: string; detail: string }>>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [form, setForm] = useState({
    signerName: "",
    signerEmail: "",
    note: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
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
      const code =
        caught && typeof caught === "object" && "code" in caught && typeof caught.code === "string"
          ? caught.code
          : null;
      setErrorCode(code);
      setError(caught instanceof Error ? caught.message : "This acceptance link is not available.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSubmit() {
    setError(null);
    setErrorCode(null);
    startTransition(() => {
      void (async () => {
        try {
          await submitPublicProposalAcceptance({
            token,
            confirmed: true,
            signerName: form.signerName.trim(),
            signerEmail: form.signerEmail.trim() || null,
            note: form.note.trim() || null
          });
          const [readyPayload, confirmationPayload] = await Promise.all([
            getPublicAcceptanceReadyState(token),
            getPublicAcceptanceConfirmation(token)
          ]);
          setPresentation(readyPayload.ready);
          setConfirmation(confirmationPayload.confirmation);
          await load();
        } catch (caught) {
          const code =
            caught && typeof caught === "object" && "code" in caught && typeof caught.code === "string"
              ? caught.code
              : null;
          setErrorCode(code);
          setError(caught instanceof Error ? caught.message : "Failed to submit acceptance.");
        }
      })();
    });
  }

  const fallbackState = useMemo(() => buildFallbackState(error, errorCode), [error, errorCode]);
  const currentState = presentation?.state ?? fallbackState.state;
  const blockedReasons = presentation?.blockedReasons ?? fallbackState.blockedReasons;
  const canConfirm =
    Boolean(presentation?.reviewAllowed) &&
    Boolean(presentation?.nextActions.includes("confirm")) &&
    !presentation?.submissionCompleted &&
    !confirmation?.submissionCompleted;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
        Loading proposal review...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className={`rounded-[1.5rem] border p-6 ${stateContainerClass(currentState)}`}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge value={currentState} label={getPublicAcceptanceStateLabel(currentState)} />
          {review?.intakeStatus ? (
            <StatusBadge value={review.intakeStatus} label={humanizeToken(review.intakeStatus)} />
          ) : null}
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">{stateHeadline(currentState)}</h2>
        <p className="mt-2 text-sm text-slate-100/90">{stateDetail(currentState, blockedReasons)}</p>
      </section>

      {review?.proposal ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
            {review.proposal.organizationName ?? "FieldMetriq"}
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-white">
            {review.proposal.title ?? "Proposal Review"}
          </h3>
          <p className="mt-3 text-sm text-[var(--muted)]">{review.proposal.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SnapshotCard label="Total" value={formatCurrency(review.proposal.totals.totalCents)} />
            <SnapshotCard
              label="Deposit Policy"
              value={humanizeToken(review.proposal.depositSummary.policy)}
            />
            <SnapshotCard
              label="Outstanding"
              value={formatCurrency(review.proposal.depositSummary.outstandingAmountCents)}
            />
          </div>

          <div className="mt-6 space-y-4">
            {review.proposal.sections.length ? (
              review.proposal.sections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-white/10 px-4 py-4">
                  <h4 className="text-lg font-semibold text-white">{section.title}</h4>
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
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                No itemized sections were published for public review.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          A signer-safe proposal snapshot is not available for this link.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Instructions</p>
          <div className="mt-4 space-y-3">
            {instructions.length ? (
              instructions.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-slate-300">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-slate-300">
                Review the proposal details, then confirm acceptance if the sender asked you to proceed.
              </div>
            )}
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
                disabled={!canConfirm}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:opacity-60"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Email (optional)</span>
              <input
                value={form.signerEmail}
                onChange={(event) => setForm((current) => ({ ...current, signerEmail: event.target.value }))}
                disabled={!canConfirm}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:opacity-60"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Note (optional)</span>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                rows={4}
                disabled={!canConfirm}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:opacity-60"
              />
            </label>
            {!canConfirm ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                {currentState === "EXPIRED" || currentState === "BLOCKED"
                  ? "This link cannot be used. Contact the sender and ask for a fresh acceptance link."
                  : "This proposal was already submitted or completed. No further action is required right now."}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canConfirm || !form.signerName.trim()}
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

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function buildFallbackState(error: string | null, errorCode: string | null) {
  if (errorCode === "EXPIRED") {
    return { state: "EXPIRED", blockedReasons: ["This link expired. Please contact the sender for a new link."] };
  }
  if (errorCode === "REVOKED") {
    return { state: "REVOKED", blockedReasons: ["This link was revoked. Please contact the sender for a new link."] };
  }
  if (errorCode === "INVALID") {
    return { state: "INVALID", blockedReasons: ["This link is not available. Please contact the sender for help."] };
  }

  const normalized = (error ?? "").toLowerCase();
  if (normalized.includes("expired")) {
    return { state: "EXPIRED", blockedReasons: ["This link expired. Please contact the sender for a new link."] };
  }
  if (normalized.includes("revoked")) {
    return { state: "REVOKED", blockedReasons: ["This link was revoked. Please contact the sender for a new link."] };
  }
  if (normalized.includes("invalid")) {
    return { state: "INVALID", blockedReasons: ["This link is not available. Please contact the sender for help."] };
  }
  return { state: "BLOCKED", blockedReasons: ["This link is not available. Please contact the sender for help."] };
}

function stateHeadline(state: string) {
  switch (state) {
    case "EXPIRED":
      return "This review link expired";
    case "REVOKED":
      return "This review link was revoked";
    case "INVALID":
      return "This review link is unavailable";
    case "BLOCKED":
      return "This review link is unavailable";
    case "SUBMITTED":
      return "Your response was already submitted";
    case "CONFIRMED":
      return "Acceptance already completed";
    default:
      return "Review this proposal before confirming";
  }
}

function stateDetail(state: string, blockedReasons: string[]) {
  if (blockedReasons.length) {
    return blockedReasons[0];
  }

  switch (state) {
    case "SUBMITTED":
      return "The confirmation was already received. No further action is required.";
    case "CONFIRMED":
      return "This proposal has already been accepted.";
    case "REVOKED":
      return "Please contact the sender and ask for a fresh acceptance link.";
    case "INVALID":
      return "Please contact the sender if you still need to review this proposal.";
    default:
      return "Check the proposal details, then confirm only if the sender asked you to proceed.";
  }
}

function stateContainerClass(state: string) {
  if (state === "BLOCKED" || state === "EXPIRED" || state === "REVOKED" || state === "INVALID") {
    return "border-amber-300/30 bg-amber-500/10";
  }
  if (state === "SUBMITTED" || state === "CONFIRMED") {
    return "border-emerald-300/30 bg-emerald-500/10";
  }
  return "border-white/10 bg-white/5";
}
