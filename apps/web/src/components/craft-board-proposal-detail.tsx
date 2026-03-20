"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  createCraftBoardOrderFromProposal,
  createCraftBoardDepositRequestFromProposal,
  getCraftBoardProposal,
  updateCraftBoardProposal,
  type CraftBoardProposalItem
} from "../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../lib/mvp";
import { marketingUrl } from "../lib/site-config";

const statusOptions = ["DRAFT", "READY", "SHARED", "VIEWED", "APPROVED", "DECLINED", "EXPIRED", "ARCHIVED"] as const;

type LineItemForm = {
  id?: string;
  sortOrder: number;
  label: string;
  description: string;
  quantity: string;
  unitLabel: string;
  unitAmount: string;
  itemType: string;
};

type FormState = {
  status: (typeof statusOptions)[number];
  title: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  productFamily: string;
  productName: string;
  reviewedWidthValue: string;
  reviewedDepthValue: string;
  reviewedThicknessValue: string;
  reviewedQuantity: string;
  reviewedMaterialCode: string;
  reviewedMaterialLabel: string;
  reviewedMountingCode: string;
  reviewedMountingLabel: string;
  shippingAmount: string;
  discountAmount: string;
  currencyCode: string;
  leadTimeText: string;
  scopeSummary: string;
  inclusionsText: string;
  exclusionsText: string;
  notesForCustomer: string;
  internalNotes: string;
  expirationDate: string;
  preparedBy: string;
  referenceCode: string;
  lineItems: LineItemForm[];
};

function centsToInput(value: number | null | undefined) {
  return ((value ?? 0) / 100).toFixed(2);
}

function inputToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(Math.round(parsed * 100), 0);
}

function numberInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function buildFormState(proposal: CraftBoardProposalItem): FormState {
  return {
    status: proposal.status,
    title: proposal.title,
    customerNameSnapshot: proposal.customerNameSnapshot,
    customerEmailSnapshot: proposal.customerEmailSnapshot,
    customerPhoneSnapshot: proposal.customerPhoneSnapshot ?? "",
    productFamily: proposal.productFamily,
    productName: proposal.productName,
    reviewedWidthValue: numberInput(proposal.reviewedWidthValue),
    reviewedDepthValue: numberInput(proposal.reviewedDepthValue),
    reviewedThicknessValue: numberInput(proposal.reviewedThicknessValue),
    reviewedQuantity: String(proposal.reviewedQuantity),
    reviewedMaterialCode: proposal.reviewedMaterialCode ?? "",
    reviewedMaterialLabel: proposal.reviewedMaterialLabel ?? "",
    reviewedMountingCode: proposal.reviewedMountingCode ?? "",
    reviewedMountingLabel: proposal.reviewedMountingLabel ?? "",
    shippingAmount: centsToInput(proposal.shippingAmountCents),
    discountAmount: centsToInput(proposal.discountAmountCents),
    currencyCode: proposal.currencyCode,
    leadTimeText: proposal.leadTimeText ?? "",
    scopeSummary: proposal.scopeSummary,
    inclusionsText: proposal.inclusionsText ?? "",
    exclusionsText: proposal.exclusionsText ?? "",
    notesForCustomer: proposal.notesForCustomer ?? "",
    internalNotes: proposal.internalNotes ?? "",
    expirationDate: proposal.expirationDate ? proposal.expirationDate.slice(0, 10) : "",
    preparedBy: proposal.preparedBy ?? "",
    referenceCode: proposal.referenceCode ?? "",
    lineItems: proposal.lineItems.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      label: item.label,
      description: item.description ?? "",
      quantity: String(item.quantity),
      unitLabel: item.unitLabel ?? "",
      unitAmount: centsToInput(item.unitAmountCents),
      itemType: item.itemType ?? ""
    }))
  };
}

function addBlankLineItem(lineItems: LineItemForm[]) {
  return [
    ...lineItems,
    {
      sortOrder: lineItems.length,
      label: "",
      description: "",
      quantity: "1",
      unitLabel: "ea",
      unitAmount: "0.00",
      itemType: "product"
    }
  ];
}

export function CraftBoardProposalDetail({ proposalId }: { proposalId: string }) {
  const [proposal, setProposal] = useState<CraftBoardProposalItem | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardProposal(proposalId);
      if (!payload?.proposal) {
        setError("Proposal not found.");
        return;
      }
      setProposal(payload.proposal);
      setForm(buildFormState(payload.proposal));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load proposal.");
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setMessage(null);
  }

  function updateLineItem(index: number, key: keyof LineItemForm, value: string | number) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const lineItems = current.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      );

      return { ...current, lineItems };
    });
    setMessage(null);
  }

  function removeLineItem(index: number) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        lineItems: current.lineItems
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }))
      };
    });
    setMessage(null);
  }

  function save(nextStatus?: (typeof statusOptions)[number]) {
    if (!form) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const payload = await updateCraftBoardProposal(proposalId, {
            status: nextStatus ?? form.status,
            title: form.title,
            customerNameSnapshot: form.customerNameSnapshot,
            customerEmailSnapshot: form.customerEmailSnapshot,
            customerPhoneSnapshot: form.customerPhoneSnapshot || null,
            productFamily: form.productFamily,
            productName: form.productName,
            reviewedWidthValue: form.reviewedWidthValue ? Number(form.reviewedWidthValue) : null,
            reviewedDepthValue: form.reviewedDepthValue ? Number(form.reviewedDepthValue) : null,
            reviewedThicknessValue: form.reviewedThicknessValue ? Number(form.reviewedThicknessValue) : null,
            reviewedQuantity: Number(form.reviewedQuantity),
            reviewedMaterialCode: form.reviewedMaterialCode || null,
            reviewedMaterialLabel: form.reviewedMaterialLabel || null,
            reviewedMountingCode: form.reviewedMountingCode || null,
            reviewedMountingLabel: form.reviewedMountingLabel || null,
            shippingAmountCents: inputToCents(form.shippingAmount),
            discountAmountCents: inputToCents(form.discountAmount),
            currencyCode: form.currencyCode,
            leadTimeText: form.leadTimeText || null,
            scopeSummary: form.scopeSummary,
            inclusionsText: form.inclusionsText || null,
            exclusionsText: form.exclusionsText || null,
            notesForCustomer: form.notesForCustomer || null,
            internalNotes: form.internalNotes || null,
            expirationDate: form.expirationDate ? new Date(`${form.expirationDate}T00:00:00.000Z`).toISOString() : null,
            preparedBy: form.preparedBy || null,
            referenceCode: form.referenceCode || null,
            lineItems: form.lineItems.map((item, index) => ({
              id: item.id,
              sortOrder: index,
              label: item.label,
              description: item.description || null,
              quantity: Number(item.quantity),
              unitLabel: item.unitLabel || null,
              unitAmountCents: inputToCents(item.unitAmount),
              itemType: item.itemType || null
            }))
          });

          setProposal(payload.proposal);
          setForm(buildFormState(payload.proposal));
          setMessage(nextStatus === "SHARED" ? "Proposal shared." : "Proposal updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update proposal.");
        }
      })();
    });
  }

  function createDeposit() {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCraftBoardDepositRequestFromProposal(proposalId, {
            depositType: "PERCENTAGE",
            depositPercentBasisPoints: 5000
          });

          setProposal((current) =>
            current
              ? {
                  ...current,
                  latestDepositRequest: payload.depositRequest
                    ? {
                        id: payload.depositRequest.id,
                        depositNumber: payload.depositRequest.depositNumber,
                        status: payload.depositRequest.status,
                        depositAmountCents: payload.depositRequest.depositAmountCents,
                        paidAt: payload.depositRequest.paidAt ?? null,
                        sharedAt: payload.depositRequest.sharedAt ?? null
                      }
                    : current.latestDepositRequest
                }
              : current
          );
          setMessage("Deposit request created.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create deposit request.");
        }
      })();
    });
  }

  function releaseOrder() {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCraftBoardOrderFromProposal(proposalId);
          setProposal((current) =>
            current
              ? {
                  ...current,
                  linkedOrder: payload.order
                    ? {
                        id: payload.order.id,
                        orderNumber: payload.order.orderNumber,
                        status: payload.order.status,
                        releasedAt: payload.order.releasedAt
                      }
                    : current.linkedOrder
                }
              : current
          );
          setMessage("Order released from approved and paid proposal.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to release order.");
        }
      })();
    });
  }

  const shareUrl = proposal?.publicToken ? marketingUrl(`/proposal/${proposal.publicToken}`) : null;

  const computedSummary = useMemo(() => {
    if (!form) {
      return null;
    }

    const subtotal = form.lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitAmountCents = inputToCents(item.unitAmount);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return sum;
      }
      return sum + Math.round(quantity * unitAmountCents);
    }, 0);
    const shipping = inputToCents(form.shippingAmount);
    const discount = inputToCents(form.discountAmount);

    return {
      subtotal,
      shipping,
      discount,
      total: Math.max(subtotal + shipping - discount, 0)
    };
  }, [form]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading proposal...
      </div>
    );
  }

  if (error || !proposal || !form || !computedSummary) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Proposal not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Proposal</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{proposal.proposalNumber}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Linked inquiry{" "}
            <Link className="text-emerald-300" href={`/admin/craft-board/inquiries/${proposal.inquiryId}`}>
              {proposal.inquiryId}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => save("READY")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Mark Ready
          </button>
          <button
            type="button"
            onClick={() => save("SHARED")}
            disabled={isPending}
            className="rounded-full border border-emerald-200/30 bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
          >
            Mark Shared
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Proposal"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">1. Proposal Header</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Title</span>
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Status</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value as FormState["status"])} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{humanizeToken(option)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Prepared By</span>
                <input value={form.preparedBy} onChange={(event) => updateField("preparedBy", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Reference Code</span>
                <input value={form.referenceCode} onChange={(event) => updateField("referenceCode", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Expiration Date</span>
                <input type="date" value={form.expirationDate} onChange={(event) => updateField("expirationDate", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">2. Customer Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Name</span>
                <input value={form.customerNameSnapshot} onChange={(event) => updateField("customerNameSnapshot", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Email</span>
                <input value={form.customerEmailSnapshot} onChange={(event) => updateField("customerEmailSnapshot", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
                <span>Phone</span>
                <input value={form.customerPhoneSnapshot} onChange={(event) => updateField("customerPhoneSnapshot", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3. Product + Reviewed Configuration Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Product Family</span>
                <input value={form.productFamily} onChange={(event) => updateField("productFamily", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Product Name</span>
                <input value={form.productName} onChange={(event) => updateField("productName", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Width</span>
                <input value={form.reviewedWidthValue} onChange={(event) => updateField("reviewedWidthValue", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Depth</span>
                <input value={form.reviewedDepthValue} onChange={(event) => updateField("reviewedDepthValue", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Thickness</span>
                <input value={form.reviewedThicknessValue} onChange={(event) => updateField("reviewedThicknessValue", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Quantity</span>
                <input value={form.reviewedQuantity} onChange={(event) => updateField("reviewedQuantity", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Material Code</span>
                <input value={form.reviewedMaterialCode} onChange={(event) => updateField("reviewedMaterialCode", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Material Label</span>
                <input value={form.reviewedMaterialLabel} onChange={(event) => updateField("reviewedMaterialLabel", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Mounting Code</span>
                <input value={form.reviewedMountingCode} onChange={(event) => updateField("reviewedMountingCode", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Mounting Label</span>
                <input value={form.reviewedMountingLabel} onChange={(event) => updateField("reviewedMountingLabel", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">4. Pricing / Line Items</p>
              <button type="button" onClick={() => updateField("lineItems", addBlankLineItem(form.lineItems))} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white">
                Add Line Item
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {form.lineItems.map((item, index) => (
                <div key={item.id ?? `new-${index}`} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2 text-sm text-slate-200">
                      <span>Label</span>
                      <input value={item.label} onChange={(event) => updateLineItem(index, "label", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-200">
                      <span>Quantity</span>
                      <input value={item.quantity} onChange={(event) => updateLineItem(index, "quantity", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-200">
                      <span>Unit Amount</span>
                      <input value={item.unitAmount} onChange={(event) => updateLineItem(index, "unitAmount", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-200">
                      <span>Unit Label</span>
                      <input value={item.unitLabel} onChange={(event) => updateLineItem(index, "unitLabel", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-200">
                      <span>Item Type</span>
                      <input value={item.itemType} onChange={(event) => updateLineItem(index, "itemType", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                    <div className="space-y-2 text-sm text-slate-200">
                      <span>Line Total</span>
                      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white">
                        {formatCurrency(Math.round(Number(item.quantity || 0) * inputToCents(item.unitAmount || "0")), form.currencyCode)}
                      </div>
                    </div>
                    <label className="space-y-2 text-sm text-slate-200 md:col-span-2 xl:col-span-3">
                      <span>Description</span>
                      <textarea value={item.description} onChange={(event) => updateLineItem(index, "description", event.target.value)} rows={3} className="w-full rounded-[1.25rem] border border-white/10 bg-black/30 px-4 py-3 text-white" />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => removeLineItem(index)} className="text-sm text-rose-200">
                      Remove line item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Shipping</span>
                <input value={form.shippingAmount} onChange={(event) => updateField("shippingAmount", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Discount</span>
                <input value={form.discountAmount} onChange={(event) => updateField("discountAmount", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5. Customer-Facing Proposal Content</p>
            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Scope Summary</span>
                <textarea value={form.scopeSummary} onChange={(event) => updateField("scopeSummary", event.target.value)} rows={5} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Inclusions</span>
                <textarea value={form.inclusionsText} onChange={(event) => updateField("inclusionsText", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Exclusions</span>
                <textarea value={form.exclusionsText} onChange={(event) => updateField("exclusionsText", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Lead Time</span>
                <input value={form.leadTimeText} onChange={(event) => updateField("leadTimeText", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Notes For Customer</span>
                <textarea value={form.notesForCustomer} onChange={(event) => updateField("notesForCustomer", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">6. Sharing Controls</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Public URL</p>
                <p className="mt-2 break-all text-slate-100">{shareUrl ?? "Available after proposal is created."}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shared At</p>
                <p className="mt-2">{proposal.sharedAt ? formatDateTime(proposal.sharedAt) : "Not shared yet"}</p>
              </div>
              {shareUrl ? (
                <Link href={shareUrl} target="_blank" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  Open Public Proposal
                </Link>
              ) : null}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit Progression</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              {proposal.latestDepositRequest ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest Deposit</p>
                    <p className="mt-2">{proposal.latestDepositRequest.depositNumber}</p>
                    <p className="mt-1">{humanizeToken(proposal.latestDepositRequest.status)}</p>
                    <p className="mt-1">{formatCurrency(proposal.latestDepositRequest.depositAmountCents, proposal.currencyCode)}</p>
                  </div>
                  <Link
                    href={`/admin/craft-board/deposits/${proposal.latestDepositRequest.id}`}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open Deposit Request
                  </Link>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-slate-300">
                    No deposit request has been created for this proposal yet.
                  </div>
                  <button
                    type="button"
                    onClick={createDeposit}
                    disabled={isPending || proposal.status !== "APPROVED"}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    Create Deposit Request
                  </button>
                </>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order Release</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              {proposal.linkedOrder ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Released Order</p>
                    <p className="mt-2">{proposal.linkedOrder.orderNumber}</p>
                    <p className="mt-1">{humanizeToken(proposal.linkedOrder.status)}</p>
                    <p className="mt-1">
                      Released{" "}
                      {proposal.linkedOrder.releasedAt
                        ? formatDateTime(proposal.linkedOrder.releasedAt)
                        : "Not recorded"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/craft-board/orders/${proposal.linkedOrder.id}`}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open Released Order
                  </Link>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-slate-300">
                    Release an order after the proposal is approved and the deposit request is marked paid.
                  </div>
                  <button
                    type="button"
                    onClick={releaseOrder}
                    disabled={
                      isPending ||
                      proposal.status !== "APPROVED" ||
                      proposal.latestDepositRequest?.status !== "PAID"
                    }
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    Release Order
                  </button>
                </>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">7. Status and Response Tracking</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Status</p>
                <p className="mt-2">{humanizeToken(proposal.status)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Customer Response</p>
                <p className="mt-2">Viewed {proposal.customerViewedAt ? formatDateTime(proposal.customerViewedAt) : "Not yet"}</p>
                <p className="mt-1">Approved {proposal.customerApprovedAt ? formatDateTime(proposal.customerApprovedAt) : "No"}</p>
                <p className="mt-1">Declined {proposal.customerDeclinedAt ? formatDateTime(proposal.customerDeclinedAt) : "No"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">8. Internal Notes</p>
            <label className="mt-5 block space-y-2 text-sm text-slate-200">
              <span>Internal Notes</span>
              <textarea value={form.internalNotes} onChange={(event) => updateField("internalNotes", event.target.value)} rows={8} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quote Summary</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Configuration</p>
                <p className="mt-2">
                  {form.reviewedWidthValue || "?"}&quot; × {form.reviewedDepthValue || "?"}&quot; × {form.reviewedThicknessValue || "?"}&quot;
                </p>
                <p className="mt-1">Qty {form.reviewedQuantity}</p>
                <p className="mt-1">{form.reviewedMaterialLabel || "No finish selected"}</p>
                <p className="mt-1">{form.reviewedMountingLabel || "No mounting selected"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Totals</p>
                <p className="mt-2">Subtotal {formatCurrency(computedSummary.subtotal, form.currencyCode)}</p>
                <p className="mt-1">Shipping {formatCurrency(computedSummary.shipping, form.currencyCode)}</p>
                <p className="mt-1">Discount {formatCurrency(computedSummary.discount, form.currencyCode)}</p>
                <p className="mt-1 text-base font-semibold text-white">Total {formatCurrency(computedSummary.total, form.currencyCode)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                Approval captures customer intent to proceed. Payment and scheduling still happen after this proposal step.
              </div>
            </div>
            <div className="mt-6 text-sm text-slate-300">
              <p>Created {formatDateTime(proposal.createdAt)}</p>
              <p className="mt-1">Updated {formatDateTime(proposal.updatedAt)}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
