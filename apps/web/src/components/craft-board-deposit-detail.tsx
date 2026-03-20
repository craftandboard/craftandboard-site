"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  createCraftBoardOrderFromProposal,
  getCraftBoardDeposit,
  updateCraftBoardDeposit,
  type CraftBoardDepositRequestItem
} from "../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../lib/mvp";
import { marketingUrl } from "../lib/site-config";

const statusOptions = ["DRAFT", "READY", "SHARED", "VIEWED", "PAYMENT_INITIATED", "PAID", "CANCELLED", "EXPIRED"] as const;
const depositTypeOptions = ["PERCENTAGE", "FIXED_AMOUNT"] as const;

type FormState = {
  status: (typeof statusOptions)[number];
  title: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  currencyCode: string;
  depositType: (typeof depositTypeOptions)[number];
  depositPercent: string;
  depositAmount: string;
  descriptionText: string;
  customerInstructionsText: string;
  dueDate: string;
  internalNotes: string;
  paymentReceiptReference: string;
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

function buildFormState(deposit: CraftBoardDepositRequestItem): FormState {
  return {
    status: deposit.status,
    title: deposit.title,
    customerNameSnapshot: deposit.customerNameSnapshot,
    customerEmailSnapshot: deposit.customerEmailSnapshot,
    customerPhoneSnapshot: deposit.customerPhoneSnapshot ?? "",
    currencyCode: deposit.currencyCode,
    depositType: deposit.depositType,
    depositPercent:
      deposit.depositPercentBasisPoints === null || deposit.depositPercentBasisPoints === undefined
        ? ""
        : (deposit.depositPercentBasisPoints / 100).toFixed(2),
    depositAmount: centsToInput(deposit.depositAmountCents),
    descriptionText: deposit.descriptionText ?? "",
    customerInstructionsText: deposit.customerInstructionsText ?? "",
    dueDate: deposit.dueDate ? deposit.dueDate.slice(0, 10) : "",
    internalNotes: deposit.internalNotes ?? "",
    paymentReceiptReference: deposit.paymentReceiptReference ?? ""
  };
}

export function CraftBoardDepositDetail({ depositId }: { depositId: string }) {
  const [deposit, setDeposit] = useState<CraftBoardDepositRequestItem | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardDeposit(depositId);
      if (!payload?.depositRequest) {
        setError("Deposit request not found.");
        return;
      }
      setDeposit(payload.depositRequest);
      setForm(buildFormState(payload.depositRequest));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load deposit request.");
    } finally {
      setLoading(false);
    }
  }, [depositId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setMessage(null);
  }

  function save(nextStatus?: (typeof statusOptions)[number]) {
    if (!form) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const payload = await updateCraftBoardDeposit(depositId, {
            status: nextStatus ?? form.status,
            title: form.title,
            customerNameSnapshot: form.customerNameSnapshot,
            customerEmailSnapshot: form.customerEmailSnapshot,
            customerPhoneSnapshot: form.customerPhoneSnapshot || null,
            currencyCode: form.currencyCode,
            depositType: form.depositType,
            depositPercentBasisPoints:
              form.depositType === "PERCENTAGE" && form.depositPercent
                ? Math.round(Number(form.depositPercent) * 100)
                : null,
            depositAmountCents:
              form.depositType === "FIXED_AMOUNT" ? inputToCents(form.depositAmount) : null,
            descriptionText: form.descriptionText || null,
            customerInstructionsText: form.customerInstructionsText || null,
            dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00.000Z`).toISOString() : null,
            internalNotes: form.internalNotes || null,
            paymentReceiptReference: form.paymentReceiptReference || null
          });

          setDeposit(payload.depositRequest);
          setForm(buildFormState(payload.depositRequest));
          setMessage(nextStatus === "PAID" ? "Deposit marked paid." : "Deposit request updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update deposit request.");
        }
      })();
    });
  }

  function releaseOrder() {
    if (!deposit?.proposalId) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCraftBoardOrderFromProposal(deposit.proposalId);
          setDeposit((current) =>
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
          setMessage("Order released from paid deposit.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to release order.");
        }
      })();
    });
  }

  const shareUrl = deposit?.publicToken ? marketingUrl(`/deposit/${deposit.publicToken}`) : null;

  const calculated = useMemo(() => {
    if (!deposit || !form) {
      return null;
    }

    const proposalTotal = deposit.proposalTotalAmountCents;
    const depositAmount =
      form.depositType === "PERCENTAGE"
        ? Math.round((proposalTotal * Math.max(Number(form.depositPercent || 0), 0)) / 100)
        : inputToCents(form.depositAmount);

    return {
      proposalTotal,
      depositAmount,
      remainingBalance: Math.max(proposalTotal - depositAmount, 0)
    };
  }, [deposit, form]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading deposit request...
      </div>
    );
  }

  if (error || !deposit || !form || !calculated) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Deposit request not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Deposit</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{deposit.depositNumber}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Linked proposal{" "}
            <Link href={`/admin/craft-board/proposals/${deposit.proposalId}`} className="text-emerald-300">
              {deposit.proposal?.proposalNumber ?? deposit.proposalId}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => save("READY")} disabled={isPending} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
            Mark Ready
          </button>
          <button type="button" onClick={() => save("SHARED")} disabled={isPending} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">
            Mark Shared
          </button>
          <button type="button" onClick={() => save("PAID")} disabled={isPending} className="rounded-full border border-emerald-200/30 bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60">
            Mark Paid
          </button>
          <button type="button" onClick={() => save()} disabled={isPending} className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60">
            {isPending ? "Saving..." : "Save Deposit"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">1. Deposit Header</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-2">{humanizeToken(deposit.status)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created By</p>
                <p className="mt-2">{deposit.createdBy ?? "Not recorded"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                <p className="mt-2">{formatDateTime(deposit.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Due Date</p>
                <p className="mt-2">{deposit.dueDate ? formatDateTime(deposit.dueDate) : "Not set"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">2. Linked Proposal Summary</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{deposit.proposal?.proposalNumber ?? "Proposal"}</p>
                <p className="mt-1">{deposit.proposal?.title ?? "No title"}</p>
                <p className="mt-1 text-slate-400">
                  Approved {deposit.proposal?.customerApprovedAt ? formatDateTime(deposit.proposal.customerApprovedAt) : "Not recorded"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope Snapshot</p>
                <p className="mt-2">{deposit.proposal?.productName ?? "Custom floating shelf"}</p>
                <p className="mt-1">Qty {deposit.proposal?.reviewedQuantity ?? 1}</p>
                <p className="mt-1">{deposit.proposal?.reviewedMaterialLabel ?? "Custom finish"}</p>
                <p className="mt-1">{deposit.proposal?.reviewedMountingLabel ?? "Reviewed mounting"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3. Customer Snapshot</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">4. Deposit Configuration</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Title</span>
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Deposit Type</span>
                <select value={form.depositType} onChange={(event) => updateField("depositType", event.target.value as FormState["depositType"])} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                  {depositTypeOptions.map((option) => (
                    <option key={option} value={option}>{humanizeToken(option)}</option>
                  ))}
                </select>
              </label>
              {form.depositType === "PERCENTAGE" ? (
                <label className="space-y-2 text-sm text-slate-200">
                  <span>Deposit Percent</span>
                  <input value={form.depositPercent} onChange={(event) => updateField("depositPercent", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
                </label>
              ) : (
                <label className="space-y-2 text-sm text-slate-200">
                  <span>Deposit Amount</span>
                  <input value={form.depositAmount} onChange={(event) => updateField("depositAmount", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
                </label>
              )}
              <label className="space-y-2 text-sm text-slate-200">
                <span>Due Date</span>
                <input type="date" value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
                <span>Description</span>
                <textarea value={form.descriptionText} onChange={(event) => updateField("descriptionText", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
                <span>Customer Instructions</span>
                <textarea value={form.customerInstructionsText} onChange={(event) => updateField("customerInstructionsText", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5. Sharing + Payment Controls</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Public URL</p>
                <p className="mt-2 break-all">{shareUrl ?? "Available after creation."}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Provider State</p>
                <p className="mt-2">{deposit.paymentProvider ?? "Not initiated"}</p>
                <p className="mt-1">{deposit.checkoutSessionId ?? "No session yet"}</p>
              </div>
              {shareUrl ? (
                <Link href={shareUrl} target="_blank" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  Open Public Deposit Page
                </Link>
              ) : null}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">6. Payment Status Tracking</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mt-2">Shared {deposit.sharedAt ? formatDateTime(deposit.sharedAt) : "Not yet"}</p>
                <p className="mt-1">Viewed {deposit.customerViewedAt ? formatDateTime(deposit.customerViewedAt) : "Not yet"}</p>
                <p className="mt-1">Payment initiated {deposit.paymentInitiatedAt ? formatDateTime(deposit.paymentInitiatedAt) : "Not yet"}</p>
                <p className="mt-1">Paid {deposit.paidAt ? formatDateTime(deposit.paidAt) : "Not yet"}</p>
              </div>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Receipt Reference</span>
                <input value={form.paymentReceiptReference} onChange={(event) => updateField("paymentReceiptReference", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
              </label>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order Release</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              {deposit.linkedOrder ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Released Order</p>
                    <p className="mt-2">{deposit.linkedOrder.orderNumber}</p>
                    <p className="mt-1">{humanizeToken(deposit.linkedOrder.status)}</p>
                    <p className="mt-1">
                      Released{" "}
                      {deposit.linkedOrder.releasedAt
                        ? formatDateTime(deposit.linkedOrder.releasedAt)
                        : "Not recorded"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/craft-board/orders/${deposit.linkedOrder.id}`}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open Released Order
                  </Link>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-slate-300">
                    Release the internal order after this deposit is marked paid and the linked proposal is approved.
                  </div>
                  <button
                    type="button"
                    onClick={releaseOrder}
                    disabled={isPending || deposit.status !== "PAID" || deposit.proposal?.status !== "APPROVED"}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    Release Order
                  </button>
                </>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">7. Internal Notes</p>
            <label className="mt-5 block space-y-2 text-sm text-slate-200">
              <span>Internal Notes</span>
              <textarea value={form.internalNotes} onChange={(event) => updateField("internalNotes", event.target.value)} rows={7} className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit Summary</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>Proposal Total {formatCurrency(calculated.proposalTotal, deposit.currencyCode)}</p>
                <p className="mt-1">Deposit Due {formatCurrency(calculated.depositAmount, deposit.currencyCode)}</p>
                <p className="mt-1">Remaining Balance {formatCurrency(calculated.remainingBalance, deposit.currencyCode)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300">
                Public payment initiation is tracked on the customer page. Use Mark Paid only as an internal completion/test action when the payment provider is not confirming automatically.
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
