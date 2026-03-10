"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createAcceptanceIntake,
  createProposalAcceptance,
  createProposalLine,
  createProposalSection,
  createDepositRequest,
  evaluateConversion,
  getConversion,
  getProposal,
  getProposalAcceptance,
  getProposalPaymentSummary,
  listAcceptanceIntakes,
  listDepositRequests,
  listPayments,
  recordPayment,
  updateProposal,
  updateProposalAcceptance,
  updateProposalLine,
  updateProposalSection,
  convertProposal,
  type DepositRequestItem,
  type PaymentItem,
  type ProposalAcceptanceIntakeItem,
  type ProposalAcceptanceItem,
  type ProposalConversionItem,
  type ProposalDetail,
  type ProposalEligibility,
  type ProposalLineItem,
  type ProposalPaymentSummary,
  type ProposalSectionItem
} from "../lib/api";
import {
  buildAcceptanceReviewUrl,
  centsToInputValue,
  formatCurrency,
  getIntakeStatusLabel,
  humanizeToken,
  parseCurrencyInputToCents
} from "../lib/mvp";
import { AcceptanceLinkStatusCard } from "./acceptance-link-status-card";
import { PilotFeedbackForm } from "./pilot-feedback-form";
import { PilotStatusCard } from "./pilot-status-card";
import { StatusBadge } from "./status-badge";

const proposalStatusOptions = ["draft", "sent", "accepted", "rejected", "archived"] as const;
const depositPolicyOptions = [
  "NO_DEPOSIT_REQUIRED",
  "DEPOSIT_REQUIRED_BEFORE_CONVERSION"
] as const;

export function MvpProposalEditor({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<ProposalPaymentSummary | null>(null);
  const [depositRequests, setDepositRequests] = useState<DepositRequestItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [intakes, setIntakes] = useState<ProposalAcceptanceIntakeItem[]>([]);
  const [acceptance, setAcceptance] = useState<ProposalAcceptanceItem | null>(null);
  const [conversion, setConversion] = useState<ProposalConversionItem | null>(null);
  const [eligibility, setEligibility] = useState<ProposalEligibility | null>(null);
  const [latestLink, setLatestLink] = useState<string | null>(null);
  const [headerForm, setHeaderForm] = useState<{
    title: string;
    status: string;
    depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  }>({
    title: "",
    status: "draft",
    depositPolicy: depositPolicyOptions[0]
  });
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newUnsectionedLine, setNewUnsectionedLine] = useState({
    name: "",
    description: "",
    qty: "1",
    unit: "ea",
    price: "0.00"
  });
  const [depositForm, setDepositForm] = useState({
    amount: "0.00",
    description: "",
    dueAt: ""
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "0.00",
    depositRequestId: "",
    status: "SUCCEEDED",
    note: ""
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProposalState() {
      setLoading(true);
      setError(null);
      try {
        const [
          proposalPayload,
          paymentSummaryPayload,
          depositRequestsPayload,
          paymentsPayload,
          intakesPayload,
          acceptancePayload,
          conversionPayload
        ] = await Promise.all([
          getProposal(proposalId),
          getProposalPaymentSummary(proposalId),
          listDepositRequests(proposalId),
          listPayments(proposalId),
          listAcceptanceIntakes(proposalId),
          getProposalAcceptance(proposalId),
          getConversion(proposalId)
        ]);

        if (cancelled) {
          return;
        }

        if (!proposalPayload?.proposal) {
          setError("Proposal not found.");
          return;
        }

        setProposal(proposalPayload.proposal);
        setHeaderForm({
          title: proposalPayload.proposal.title ?? "",
          status: proposalPayload.proposal.rawStatus ?? "draft",
          depositPolicy: proposalPayload.proposal.depositPolicy
        });
        setPaymentSummary(paymentSummaryPayload?.summary ?? null);
        setDepositRequests(depositRequestsPayload?.depositRequests ?? []);
        setPayments(paymentsPayload?.payments ?? []);
        setIntakes(intakesPayload?.intakes ?? []);
        setAcceptance(acceptancePayload?.acceptance ?? null);
        setConversion(conversionPayload?.conversion ?? null);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load proposal.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProposalState();

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  async function loadProposalState() {
    setLoading(true);
    setError(null);
    try {
      const [
        proposalPayload,
        paymentSummaryPayload,
        depositRequestsPayload,
        paymentsPayload,
        intakesPayload,
        acceptancePayload,
        conversionPayload
      ] = await Promise.all([
        getProposal(proposalId),
        getProposalPaymentSummary(proposalId),
        listDepositRequests(proposalId),
        listPayments(proposalId),
        listAcceptanceIntakes(proposalId),
        getProposalAcceptance(proposalId),
        getConversion(proposalId)
      ]);

      if (!proposalPayload?.proposal) {
        setError("Proposal not found.");
        return;
      }

      setProposal(proposalPayload.proposal);
      setHeaderForm({
        title: proposalPayload.proposal.title ?? "",
        status: proposalPayload.proposal.rawStatus ?? "draft",
        depositPolicy: proposalPayload.proposal.depositPolicy
      });
      setPaymentSummary(paymentSummaryPayload?.summary ?? null);
      setDepositRequests(depositRequestsPayload?.depositRequests ?? []);
      setPayments(paymentsPayload?.payments ?? []);
      setIntakes(intakesPayload?.intakes ?? []);
      setAcceptance(acceptancePayload?.acceptance ?? null);
      setConversion(conversionPayload?.conversion ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load proposal.");
    } finally {
      setLoading(false);
    }
  }

  function updateHeaderField(name: string, value: string) {
    setHeaderForm((current) => ({ ...current, [name]: value }));
  }

  function handleSaveHeader() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await updateProposal(proposalId, {
            title: headerForm.title || null,
            status: headerForm.status,
            depositPolicy: headerForm.depositPolicy as typeof depositPolicyOptions[number]
          });
          await loadProposalState();
          setSuccess("Proposal header updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update proposal.");
        }
      })();
    });
  }

  function handleCreateSection() {
    if (!newSectionTitle.trim()) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await createProposalSection(proposalId, { title: newSectionTitle.trim() });
          setNewSectionTitle("");
          await loadProposalState();
          setSuccess("Section added.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add section.");
        }
      })();
    });
  }

  function handleCreateUnsectionedLine() {
    if (!newUnsectionedLine.name.trim()) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await createProposalLine(proposalId, {
            name: newUnsectionedLine.name.trim(),
            description: newUnsectionedLine.description || null,
            qty: Number(newUnsectionedLine.qty) || 1,
            unit: newUnsectionedLine.unit || null,
            priceCents: parseCurrencyInputToCents(newUnsectionedLine.price)
          });
          setNewUnsectionedLine({
            name: "",
            description: "",
            qty: "1",
            unit: "ea",
            price: "0.00"
          });
          await loadProposalState();
          setSuccess("Line item added.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to add line item.");
        }
      })();
    });
  }

  function handleCreateAcceptanceLink() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createAcceptanceIntake(proposalId, {
            source: "PUBLIC_TOKEN",
            note: "FieldMetriq MVP review link",
            tokenTtlHours: 168
          });
          if (payload.publicToken) {
            setLatestLink(buildAcceptanceReviewUrl(payload.publicToken));
          }
          await loadProposalState();
          setSuccess("Acceptance link created.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create acceptance link.");
        }
      })();
    });
  }

  function handleReissueAcceptanceLink() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createAcceptanceIntake(proposalId, {
            source: "PUBLIC_TOKEN",
            note: "FieldMetriq MVP reissued review link",
            tokenTtlHours: 168
          });
          if (payload.publicToken) {
            setLatestLink(buildAcceptanceReviewUrl(payload.publicToken));
          }
          await loadProposalState();
          setSuccess("A fresh acceptance link is ready to copy and share.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to reissue acceptance link.");
        }
      })();
    });
  }

  function handleManualAccept() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          if (!acceptance) {
            await createProposalAcceptance(proposalId, {
              decisionSource: "MANUAL_INTERNAL",
              depositPolicy: headerForm.depositPolicy as typeof depositPolicyOptions[number],
              note: "Internal tester backup acceptance."
            });
          }
          await updateProposalAcceptance(proposalId, {
            action: "accept",
            decisionSource: "MANUAL_INTERNAL",
            note: "Accepted manually from MVP UI."
          });
          await loadProposalState();
          setSuccess("Proposal accepted internally.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to accept proposal.");
        }
      })();
    });
  }

  function handleCreateDepositRequest() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await createDepositRequest(proposalId, {
            amountCents: parseCurrencyInputToCents(depositForm.amount),
            description: depositForm.description || null,
            dueAt: depositForm.dueAt ? new Date(`${depositForm.dueAt}T00:00:00.000Z`).toISOString() : null,
            status: "REQUESTED"
          });
          setDepositForm({ amount: "0.00", description: "", dueAt: "" });
          await loadProposalState();
          setSuccess("Deposit request created.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create deposit request.");
        }
      })();
    });
  }

  function handleRecordPayment() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await recordPayment(proposalId, {
            depositRequestId: paymentForm.depositRequestId || null,
            amountCents: parseCurrencyInputToCents(paymentForm.amount),
            status: paymentForm.status,
            method: "MANUAL",
            direction: "INBOUND",
            note: paymentForm.note || null,
            receivedAt: new Date().toISOString()
          });
          setPaymentForm({
            amount: "0.00",
            depositRequestId: "",
            status: "SUCCEEDED",
            note: ""
          });
          await loadProposalState();
          setSuccess("Payment recorded.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to record payment.");
        }
      })();
    });
  }

  function handleEvaluateConversion() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await evaluateConversion(proposalId);
          setEligibility(payload.eligibility);
          setConversion(payload.conversion);
          setSuccess(payload.eligibility.eligible ? "Conversion is eligible." : "Conversion is blocked.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to evaluate conversion.");
        }
      })();
    });
  }

  function handleConvertProposal() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await convertProposal(proposalId);
          setSuccess("Proposal converted to project.");
          router.push(`/projects/${payload.project.id}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to convert proposal.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading proposal...
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const totalCents =
    proposal.sections
      .flatMap((section) => section.lines)
      .reduce((sum, line) => sum + line.priceCents * line.qty, 0) +
    proposal.unsectionedLines.reduce((sum, line) => sum + line.priceCents * line.qty, 0);

  const latestIntake = intakes[0] ?? null;
  const activeOpenIntake = intakes.find((intake) => intake.status === "OPEN") ?? null;
  const primaryIntake = activeOpenIntake ?? latestIntake;
  const needsFreshLink =
    !primaryIntake ||
    primaryIntake.status !== "OPEN" ||
    (primaryIntake.status === "OPEN" && !latestLink);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {proposal.title ?? "Untitled Proposal"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Simple estimate builder, acceptance tracking, deposit visibility, and project conversion in one screen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {proposal.lead ? (
            <Link href={`/leads/${proposal.lead.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
              Open Lead
            </Link>
          ) : null}
          <StatusBadge value={proposal.rawStatus} label={proposal.statusLabel} />
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="space-y-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
              <span>Proposal Title</span>
              <input
                value={headerForm.title}
                onChange={(event) => updateHeaderField("title", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Status</span>
              <select
                value={headerForm.status}
                onChange={(event) => updateHeaderField("status", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {proposalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {humanizeToken(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Deposit Policy</span>
              <select
                value={headerForm.depositPolicy}
                onChange={(event) => updateHeaderField("depositPolicy", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {depositPolicyOptions.map((option) => (
                  <option key={option} value={option}>
                    {humanizeToken(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveHeader}
              disabled={isPending}
              className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save Proposal"}
            </button>
            <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
              Total: {formatCurrency(totalCents)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sections</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Estimate builder</h3>
              </div>
              <div className="flex gap-3">
                <input
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                  placeholder="New section title"
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateSection}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Add Section
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {proposal.sections.length ? (
                proposal.sections.map((section) => (
                  <ProposalSectionEditor
                    key={section.id}
                    proposalId={proposalId}
                    section={section}
                    sections={proposal.sections}
                    onRefresh={() => void loadProposalState()}
                    onError={setError}
                    onSuccess={setSuccess}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
                  No sections yet. Start the estimate by adding a section like Labor, Materials, or Scope.
                </div>
              )}

              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">Standalone line items</p>
                  <p className="text-xs text-slate-400">
                    Use this only when a line does not belong in a specific section.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  {proposal.unsectionedLines.length ? (
                    proposal.unsectionedLines.map((line) => (
                      <ProposalLineEditor
                        key={line.id}
                        proposalId={proposalId}
                        line={line}
                        sections={proposal.sections}
                        onRefresh={() => void loadProposalState()}
                        onError={setError}
                        onSuccess={setSuccess}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                      No standalone lines yet. Add a line item below if you need a quick one-off charge.
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  <input
                    value={newUnsectionedLine.name}
                    onChange={(event) =>
                      setNewUnsectionedLine((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Line item name"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={newUnsectionedLine.description}
                    onChange={(event) =>
                      setNewUnsectionedLine((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Description"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={newUnsectionedLine.qty}
                    onChange={(event) =>
                      setNewUnsectionedLine((current) => ({ ...current, qty: event.target.value }))
                    }
                    placeholder="Qty"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={newUnsectionedLine.price}
                    onChange={(event) =>
                      setNewUnsectionedLine((current) => ({ ...current, price: event.target.value }))
                    }
                    placeholder="Unit price"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateUnsectionedLine}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white"
                  >
                    Add Line Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <PilotStatusCard
            leadId={proposal.lead?.id}
            latestIntakeStatus={latestIntake?.status}
            acceptanceStatus={acceptance?.status}
            conversionStatus={conversion?.status}
            conversionBlockedReason={conversion?.blockedReasonMessage ?? eligibility?.reasons?.[0] ?? null}
            requestedAmountCents={paymentSummary?.requestedAmountCents}
            paidAmountCents={paymentSummary?.paidAmountCents}
            outstandingAmountCents={paymentSummary?.outstandingAmountCents}
          />

          <AcceptanceLinkStatusCard
            latestIntake={primaryIntake}
            recentIntakes={intakes}
            latestLink={latestLink}
            isPending={isPending}
            onCreate={handleCreateAcceptanceLink}
            onReissue={handleReissueAcceptanceLink}
          />

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Acceptance State</p>
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  value={acceptance?.status ?? "pending"}
                  label={acceptance?.status ? humanizeToken(acceptance.status) : "No acceptance yet"}
                />
                {primaryIntake ? (
                  <StatusBadge value={primaryIntake.status} label={getIntakeStatusLabel(primaryIntake.status)} />
                ) : null}
              </div>
              <p>
                {primaryIntake?.status === "OPEN" && !latestLink
                  ? "An active link exists, but the original token is not stored in plain text. Reissue a fresh link to share it again."
                  : primaryIntake
                    ? `Current public intake state: ${getIntakeStatusLabel(primaryIntake.status)}.`
                    : "No public intake created yet."}
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-slate-200">
                {acceptance?.status === "ACCEPTED" || primaryIntake?.status === "HANDOFF_ACCEPTED"
                  ? "Public acceptance is complete. The next step is deposit or conversion, not another share action."
                  : needsFreshLink
                    ? "This proposal needs a fresh share link before the contractor can complete the public flow again."
                    : "The current public link is the one that should be shared with the tester."}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleManualAccept}
                  disabled={isPending}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  Manual Accept
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit & Payments</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Requested</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(paymentSummary?.requestedAmountCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(paymentSummary?.paidAmountCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outstanding</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(paymentSummary?.outstandingAmountCents)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit Paid</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(paymentSummary?.depositPaidAmountCents)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="font-medium text-white">Create deposit request</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <input
                    value={depositForm.amount}
                    onChange={(event) => setDepositForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="Amount"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={depositForm.description}
                    onChange={(event) =>
                      setDepositForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Description"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <input
                    type="date"
                    value={depositForm.dueAt}
                    onChange={(event) => setDepositForm((current) => ({ ...current, dueAt: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateDepositRequest}
                  className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Create Deposit Request
                </button>
              </div>

              {depositRequests.length ? (
                depositRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-white/10 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{request.description ?? "Deposit request"}</p>
                      <StatusBadge value={request.status} />
                    </div>
                    <p className="mt-2 text-slate-300">
                      {formatCurrency(request.amountCents)} · Outstanding {formatCurrency(request.outstandingAmountCents)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                  No deposit requests yet. Create one if the pilot needs a required deposit before conversion.
                </div>
              )}

              <div className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="font-medium text-white">Record manual payment</p>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <input
                    value={paymentForm.amount}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="Amount"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                  <select
                    value={paymentForm.depositRequestId}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, depositRequestId: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  >
                    <option value="">Proposal-level payment</option>
                    {depositRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.description ?? request.id}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paymentForm.status}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  >
                    <option value="SUCCEEDED">Succeeded</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                  <input
                    value={paymentForm.note}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Note"
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRecordPayment}
                  className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Record Payment
                </button>
              </div>

              {payments.length ? (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-white/10 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{formatCurrency(payment.amountCents)}</p>
                      <StatusBadge value={payment.status} />
                    </div>
                    <p className="mt-2 text-slate-300">{payment.note ?? payment.method}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
                  No payments recorded yet. Manual payments can be logged here for pilot validation.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Conversion</p>
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={conversion?.status ?? "pending"} label={conversion?.status ? undefined : "Not evaluated"} />
                {eligibility ? (
                  <StatusBadge value={eligibility.eligible ? "eligible" : "blocked"} />
                ) : null}
              </div>
              {conversion?.blockedReasonMessage ? (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-4 text-amber-100">
                  {conversion.blockedReasonMessage}
                </div>
              ) : null}
              {eligibility?.reasons?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-slate-300">
                  {eligibility.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleEvaluateConversion}
                  disabled={isPending}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  Evaluate Conversion
                </button>
                <button
                  type="button"
                  onClick={handleConvertProposal}
                  disabled={isPending || !eligibility?.eligible}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
                >
                  Convert to Project
                </button>
              </div>
              {conversion?.projectId ? (
                <Link
                  href={`/projects/${conversion.projectId}`}
                  className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Open Project
                </Link>
              ) : null}
            </div>
          </article>

          <PilotFeedbackForm defaultArea="PROPOSALS" defaultPagePath={`/proposals/${proposalId}`} />
        </div>
      </section>
    </div>
  );
}

function ProposalSectionEditor({
  proposalId,
  section,
  sections,
  onRefresh,
  onError,
  onSuccess
}: {
  proposalId: string;
  section: ProposalSectionItem;
  sections: ProposalSectionItem[];
  onRefresh: () => void;
  onError: (value: string | null) => void;
  onSuccess: (value: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(section.title);
  const [sortOrder, setSortOrder] = useState(String(section.sortOrder));
  const [newLine, setNewLine] = useState({
    name: "",
    description: "",
    qty: "1",
    unit: "ea",
    price: "0.00"
  });

  function saveSection() {
    onError(null);
    onSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await updateProposalSection(proposalId, section.id, {
            title,
            sortOrder: Number(sortOrder) || 0
          });
          onRefresh();
          onSuccess("Section updated.");
        } catch (caught) {
          onError(caught instanceof Error ? caught.message : "Failed to update section.");
        }
      })();
    });
  }

  function addLine() {
    onError(null);
    onSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await createProposalLine(proposalId, {
            sectionId: section.id,
            name: newLine.name,
            description: newLine.description || null,
            qty: Number(newLine.qty) || 1,
            unit: newLine.unit || null,
            priceCents: parseCurrencyInputToCents(newLine.price)
          });
          setNewLine({ name: "", description: "", qty: "1", unit: "ea", price: "0.00" });
          onRefresh();
          onSuccess("Line item added.");
        } catch (caught) {
          onError(caught instanceof Error ? caught.message : "Failed to add line item.");
        }
      })();
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 px-4 py-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</p>
        <p className="mt-1 text-sm text-slate-300">Keep related scope items grouped so the estimate is easier to scan.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <input
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={saveSection}
          disabled={isPending}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-60"
        >
          Save Section
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {section.lines.length ? (
          section.lines.map((line) => (
            <ProposalLineEditor
              key={line.id}
              proposalId={proposalId}
              line={line}
              sections={sections}
              onRefresh={onRefresh}
              onError={onError}
              onSuccess={onSuccess}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300">
            No line items in this section yet. Add the first one below.
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input
          value={newLine.name}
          onChange={(event) => setNewLine((current) => ({ ...current, name: event.target.value }))}
          placeholder="Line item name"
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <input
          value={newLine.description}
          onChange={(event) => setNewLine((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description"
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <input
          value={newLine.qty}
          onChange={(event) => setNewLine((current) => ({ ...current, qty: event.target.value }))}
          placeholder="Qty"
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <input
          value={newLine.price}
          onChange={(event) => setNewLine((current) => ({ ...current, price: event.target.value }))}
          placeholder="Unit price"
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={addLine}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white"
        >
          Add Line Item
        </button>
      </div>
    </div>
  );
}

function ProposalLineEditor({
  proposalId,
  line,
  sections,
  onRefresh,
  onError,
  onSuccess
}: {
  proposalId: string;
  line: ProposalLineItem;
  sections: ProposalSectionItem[];
  onRefresh: () => void;
  onError: (value: string | null) => void;
  onSuccess: (value: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const currentSectionId = sections.find((section) => section.lines.some((entry) => entry.id === line.id))?.id ?? "";
  const [form, setForm] = useState({
    name: line.name,
    description: line.description ?? "",
    qty: String(line.qty),
    unit: line.unit ?? "",
    price: centsToInputValue(line.priceCents),
    sortOrder: String(line.sortOrder),
    sectionId: currentSectionId
  });

  function saveLine() {
    onError(null);
    onSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await updateProposalLine(proposalId, line.id, {
            name: form.name,
            description: form.description || null,
            qty: Number(form.qty) || 1,
            unit: form.unit || null,
            priceCents: parseCurrencyInputToCents(form.price),
            sortOrder: Number(form.sortOrder) || 0,
            sectionId: form.sectionId || null
          });
          onRefresh();
          onSuccess("Line updated.");
        } catch (caught) {
          onError(caught instanceof Error ? caught.message : "Failed to update line.");
        }
      })();
    });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 px-4 py-4 md:grid-cols-6">
      <input
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
      />
      <input
        value={form.description}
        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
      />
      <input
        value={form.qty}
        onChange={(event) => setForm((current) => ({ ...current, qty: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
      />
      <input
        value={form.price}
        onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
      />
      <select
        value={form.sectionId}
        onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
      >
        <option value="">Unsectioned</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={saveLine}
        disabled={isPending}
        className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-60"
      >
        Save Line
      </button>
    </div>
  );
}
