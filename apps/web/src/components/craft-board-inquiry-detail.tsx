"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createCraftBoardProposalFromInquiry,
  getCraftBoardInquiry,
  getOrganizationMembers,
  updateCraftBoardInquiry,
  type CraftBoardInquiryItem,
  type OrganizationMemberRecord
} from "../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = ["NEW", "REVIEWED", "QUOTE_IN_PROGRESS", "QUOTED", "CLOSED", "LOST"] as const;

type FormState = {
  status: (typeof statusOptions)[number];
  assignedToUserId: string;
  internalNotes: string;
  followUpNotes: string;
  reviewedWidthValue: string;
  reviewedDepthValue: string;
  reviewedThicknessValue: string;
  reviewedQuantity: string;
  reviewedMaterialCode: string;
  reviewedMaterialLabel: string;
  reviewedMountingCode: string;
  reviewedMountingLabel: string;
  estimateBaseAmount: string;
  estimateLowAmount: string;
  estimateHighAmount: string;
  estimateLeadTimeText: string;
  quotePreparedBy: string;
  quoteReferenceCode: string;
};

function centsFromInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}

function amountInputFromCents(value: number | null | undefined) {
  return value === null || value === undefined ? "" : (value / 100).toFixed(2);
}

function numberInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function buildFormState(inquiry: CraftBoardInquiryItem): FormState {
  return {
    status: inquiry.status,
    assignedToUserId: inquiry.assignedToUserId ?? "",
    internalNotes: inquiry.internalNotes ?? "",
    followUpNotes: inquiry.followUpNotes ?? "",
    reviewedWidthValue: numberInput(inquiry.reviewedWidthValue ?? inquiry.widthValue),
    reviewedDepthValue: numberInput(inquiry.reviewedDepthValue ?? inquiry.depthValue),
    reviewedThicknessValue: numberInput(inquiry.reviewedThicknessValue ?? inquiry.thicknessValue),
    reviewedQuantity: numberInput(inquiry.reviewedQuantity ?? inquiry.quantity),
    reviewedMaterialCode: inquiry.reviewedMaterialCode ?? inquiry.materialCode ?? "",
    reviewedMaterialLabel: inquiry.reviewedMaterialLabel ?? inquiry.materialLabel ?? "",
    reviewedMountingCode: inquiry.reviewedMountingCode ?? inquiry.mountingCode ?? "",
    reviewedMountingLabel: inquiry.reviewedMountingLabel ?? inquiry.mountingLabel ?? "",
    estimateBaseAmount: amountInputFromCents(inquiry.estimateBaseAmountCents),
    estimateLowAmount: amountInputFromCents(inquiry.estimateLowAmountCents),
    estimateHighAmount: amountInputFromCents(inquiry.estimateHighAmountCents),
    estimateLeadTimeText: inquiry.estimateLeadTimeText ?? "",
    quotePreparedBy: inquiry.quotePreparedBy ?? "",
    quoteReferenceCode: inquiry.quoteReferenceCode ?? ""
  };
}

export function CraftBoardInquiryDetail({ inquiryId }: { inquiryId: string }) {
  const [inquiry, setInquiry] = useState<CraftBoardInquiryItem | null>(null);
  const [members, setMembers] = useState<OrganizationMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [inquiryPayload, membersPayload] = await Promise.all([
          getCraftBoardInquiry(inquiryId),
          getOrganizationMembers()
        ]);

        if (!inquiryPayload?.inquiry) {
          setError("Inquiry not found.");
          return;
        }

        setInquiry(inquiryPayload.inquiry);
        setForm(buildFormState(inquiryPayload.inquiry));
        setMembers(membersPayload?.members ?? []);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load inquiry.");
      } finally {
        setLoading(false);
      }
    })();
  }, [inquiryId]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSaveMessage(null);
  }

  function saveChanges(nextStatus?: (typeof statusOptions)[number]) {
    if (!form) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const payload = await updateCraftBoardInquiry(inquiryId, {
            status: nextStatus ?? form.status,
            assignedToUserId: form.assignedToUserId || null,
            internalNotes: form.internalNotes || null,
            followUpNotes: form.followUpNotes || null,
            reviewedWidthValue: form.reviewedWidthValue ? Number(form.reviewedWidthValue) : null,
            reviewedDepthValue: form.reviewedDepthValue ? Number(form.reviewedDepthValue) : null,
            reviewedThicknessValue: form.reviewedThicknessValue ? Number(form.reviewedThicknessValue) : null,
            reviewedQuantity: form.reviewedQuantity ? Number(form.reviewedQuantity) : null,
            reviewedMaterialCode: form.reviewedMaterialCode || null,
            reviewedMaterialLabel: form.reviewedMaterialLabel || null,
            reviewedMountingCode: form.reviewedMountingCode || null,
            reviewedMountingLabel: form.reviewedMountingLabel || null,
            estimateBaseAmountCents: centsFromInput(form.estimateBaseAmount),
            estimateLowAmountCents: centsFromInput(form.estimateLowAmount),
            estimateHighAmountCents: centsFromInput(form.estimateHighAmount),
            estimateCurrencyCode: "USD",
            estimateLeadTimeText: form.estimateLeadTimeText || null,
            estimateSummaryJson: {
              reviewedConfiguration: {
                width: form.reviewedWidthValue,
                depth: form.reviewedDepthValue,
                thickness: form.reviewedThicknessValue,
                quantity: form.reviewedQuantity,
                material: form.reviewedMaterialLabel,
                mounting: form.reviewedMountingLabel
              }
            },
            quotePreparedBy: form.quotePreparedBy || null,
            quoteReferenceCode: form.quoteReferenceCode || null
          });

          setInquiry(payload.inquiry);
          setForm(buildFormState(payload.inquiry));
          setSaveMessage("Inquiry workbench updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update inquiry.");
        }
      })();
    });
  }

  function createProposal() {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCraftBoardProposalFromInquiry(inquiryId);
          setInquiry((current) =>
            current
              ? {
                  ...current,
                  proposal: payload.proposal
                    ? {
                        id: payload.proposal.id,
                        proposalNumber: payload.proposal.proposalNumber,
                        status: payload.proposal.status,
                        publicToken: payload.proposal.publicToken ?? "",
                        totalAmountCents: payload.proposal.totalAmountCents,
                        sharedAt: payload.proposal.sharedAt ?? null,
                        customerViewedAt: payload.proposal.customerViewedAt ?? null,
                        customerApprovedAt: payload.proposal.customerApprovedAt ?? null,
                        customerDeclinedAt: payload.proposal.customerDeclinedAt ?? null
                      }
                    : current.proposal
                }
              : current
          );
          setSaveMessage("Proposal created and linked to this inquiry.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create proposal.");
        }
      })();
    });
  }

  const summary = useMemo(() => {
    if (!inquiry || !form) {
      return null;
    }

    const low = centsFromInput(form.estimateLowAmount);
    const high = centsFromInput(form.estimateHighAmount);
    const base = centsFromInput(form.estimateBaseAmount);

    return {
      product: inquiry.productName,
      dimensions: `${form.reviewedWidthValue || inquiry.widthValue} ${inquiry.widthUnit} × ${form.reviewedDepthValue || inquiry.depthValue} ${inquiry.depthUnit} × ${form.reviewedThicknessValue || inquiry.thicknessValue} ${inquiry.thicknessUnit}`,
      quantity: form.reviewedQuantity || inquiry.quantity,
      material: form.reviewedMaterialLabel || inquiry.materialLabel || "Unset",
      mounting: form.reviewedMountingLabel || inquiry.mountingLabel || "Unset",
      estimateRange:
        low !== null && high !== null
          ? `${formatCurrency(low)} - ${formatCurrency(high)}`
          : low !== null
            ? formatCurrency(low)
            : inquiry.hasEstimate
              ? "Estimate stored"
              : "No estimate yet",
      estimateBase: base !== null ? formatCurrency(base) : null,
      leadTime: form.estimateLeadTimeText || "Lead time not set",
      status: form.status,
      owner:
        members.find((member) => member.userId === form.assignedToUserId)?.name ??
        members.find((member) => member.userId === form.assignedToUserId)?.email ??
        "Unassigned",
      reference: form.quoteReferenceCode || inquiry.quoteReferenceCode || "Not assigned"
    };
  }, [form, inquiry, members]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading inquiry...
      </div>
    );
  }

  if (error || !inquiry || !form) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Inquiry not found."}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Quote Workbench</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{inquiry.customerName}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {inquiry.productName} · Submitted {formatDateTime(inquiry.createdAt)} · {summary.reference}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => saveChanges("REVIEWED")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Mark Reviewed
          </button>
          <button
            type="button"
            onClick={() => saveChanges("QUOTE_IN_PROGRESS")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Start Quote
          </button>
          <button
            type="button"
            onClick={() => saveChanges()}
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Workbench"}
          </button>
          {inquiry.proposal ? (
            <Link
              href={`/admin/craft-board/proposals/${inquiry.proposal.id}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
            >
              Open Proposal
            </Link>
          ) : (
            <button
              type="button"
              onClick={createProposal}
              disabled={isPending}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              Create Proposal
            </button>
          )}
        </div>
      </div>

      {saveMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {saveMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">1. Customer Request Summary</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Customer</p>
                <p className="mt-2">{inquiry.customerName}</p>
                <p className="mt-1">{inquiry.customerEmail}</p>
                <p className="mt-1">{inquiry.customerPhone ?? "No phone"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Source</p>
                <p className="mt-2">{inquiry.source}</p>
                <p className="mt-1">{inquiry.sourcePath ?? "No source path"}</p>
                <p className="mt-1">Lead {inquiry.leadId ?? "Not linked"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Product</p>
                <p className="mt-2">{humanizeToken(inquiry.productFamily)}</p>
                <p className="mt-1">{inquiry.productName}</p>
                <p className="mt-1 text-slate-400">{inquiry.productSlug ?? "No product slug"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Original Request</p>
                <p className="mt-2">
                  {inquiry.widthValue} {inquiry.widthUnit} × {inquiry.depthValue} {inquiry.depthUnit} ×{" "}
                  {inquiry.thicknessValue} {inquiry.thicknessUnit}
                </p>
                <p className="mt-1">Qty {inquiry.quantity}</p>
                <p className="mt-1">{inquiry.materialLabel ?? "No material"}</p>
                <p className="mt-1">{inquiry.mountingLabel ?? "No mounting"}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Customer Notes</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">{inquiry.notes ?? "No customer notes."}</p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">2. Reviewed Configuration</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Width</span>
                <input
                  value={form.reviewedWidthValue}
                  onChange={(event) => updateField("reviewedWidthValue", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Depth</span>
                <input
                  value={form.reviewedDepthValue}
                  onChange={(event) => updateField("reviewedDepthValue", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Thickness</span>
                <input
                  value={form.reviewedThicknessValue}
                  onChange={(event) => updateField("reviewedThicknessValue", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Quantity</span>
                <input
                  value={form.reviewedQuantity}
                  onChange={(event) => updateField("reviewedQuantity", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Material Code</span>
                <input
                  value={form.reviewedMaterialCode}
                  onChange={(event) => updateField("reviewedMaterialCode", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Material Label</span>
                <input
                  value={form.reviewedMaterialLabel}
                  onChange={(event) => updateField("reviewedMaterialLabel", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Mounting Code</span>
                <input
                  value={form.reviewedMountingCode}
                  onChange={(event) => updateField("reviewedMountingCode", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reviewed Mounting Label</span>
                <input
                  value={form.reviewedMountingLabel}
                  onChange={(event) => updateField("reviewedMountingLabel", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3. Estimate Guidance</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Estimate Low</span>
                <input
                  value={form.estimateLowAmount}
                  onChange={(event) => updateField("estimateLowAmount", event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Estimate High</span>
                <input
                  value={form.estimateHighAmount}
                  onChange={(event) => updateField("estimateHighAmount", event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Estimate Base</span>
                <input
                  value={form.estimateBaseAmount}
                  onChange={(event) => updateField("estimateBaseAmount", event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Lead Time Text</span>
                <input
                  value={form.estimateLeadTimeText}
                  onChange={(event) => updateField("estimateLeadTimeText", event.target.value)}
                  placeholder="2-4 weeks after approval"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">4. Internal Notes / Follow-Up Notes</p>
            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Internal Estimating Notes</span>
                <textarea
                  value={form.internalNotes}
                  onChange={(event) => updateField("internalNotes", event.target.value)}
                  rows={6}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Follow-Up Notes</span>
                <textarea
                  value={form.followUpNotes}
                  onChange={(event) => updateField("followUpNotes", event.target.value)}
                  rows={5}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5. Workflow Controls</p>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as (typeof statusOptions)[number])}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {humanizeToken(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Assignee</span>
                <select
                  value={form.assignedToUserId}
                  onChange={(event) => updateField("assignedToUserId", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name ?? member.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Quote Prepared By</span>
                <input
                  value={form.quotePreparedBy}
                  onChange={(event) => updateField("quotePreparedBy", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Quote Reference Code</span>
                <input
                  value={form.quoteReferenceCode}
                  onChange={(event) => updateField("quoteReferenceCode", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proposal Linkage</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              {inquiry.proposal ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Linked Proposal</p>
                    <p className="mt-2">{inquiry.proposal.proposalNumber}</p>
                    <p className="mt-1">{humanizeToken(inquiry.proposal.status)}</p>
                    <p className="mt-1">{formatCurrency(inquiry.proposal.totalAmountCents)}</p>
                  </div>
                  <Link
                    href={`/admin/craft-board/proposals/${inquiry.proposal.id}`}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open Proposal Editor
                  </Link>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-slate-300">
                  No proposal has been created for this inquiry yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">6. Quote Summary Panel</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Product</p>
                <p className="mt-2">{summary.product}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Reviewed Configuration</p>
                <p className="mt-2">{summary.dimensions}</p>
                <p className="mt-1">Qty {summary.quantity}</p>
                <p className="mt-1">{summary.material}</p>
                <p className="mt-1">{summary.mounting}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimate Guidance</p>
                <p className="mt-2">{summary.estimateRange}</p>
                {summary.estimateBase ? <p className="mt-1">Base {summary.estimateBase}</p> : null}
                <p className="mt-1">{summary.leadTime}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workflow</p>
                <p className="mt-2">{humanizeToken(summary.status)}</p>
                <p className="mt-1">{summary.owner}</p>
                <p className="mt-1">{summary.reference}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                Final customer-facing proposal and payment flow come later. This screen stores reviewed configuration and internal estimate guidance only.
              </div>
            </div>
            <div className="mt-6 text-sm text-slate-300">
              <p>Created {formatDateTime(inquiry.createdAt)}</p>
              <p className="mt-1">Updated {formatDateTime(inquiry.updatedAt)}</p>
              <p className="mt-1">Reviewed {inquiry.reviewedAt ? formatDateTime(inquiry.reviewedAt) : "Not marked yet"}</p>
              <p className="mt-1">Quoted {inquiry.quotedAt ? formatDateTime(inquiry.quotedAt) : "Not marked yet"}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
