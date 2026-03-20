"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createCraftBoardProductionJobFromOrder,
  getCraftBoardOrder,
  updateCraftBoardOrder,
  type CraftBoardOrderItem
} from "../lib/api";
import { formatCurrency, formatDate, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = [
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_FULFILL",
  "FULFILLED",
  "CLOSED",
  "CANCELLED"
] as const;

type FormState = {
  status: (typeof statusOptions)[number];
  internalReleaseNotes: string;
  productionPrepNotes: string;
  fulfillmentNotes: string;
  requestedShipDate: string;
  targetCompletionDate: string;
};

function buildFormState(order: CraftBoardOrderItem): FormState {
  return {
    status: order.status,
    internalReleaseNotes: order.internalReleaseNotes ?? "",
    productionPrepNotes: order.productionPrepNotes ?? "",
    fulfillmentNotes: order.fulfillmentNotes ?? "",
    requestedShipDate: order.requestedShipDate ? order.requestedShipDate.slice(0, 10) : "",
    targetCompletionDate: order.targetCompletionDate ? order.targetCompletionDate.slice(0, 10) : ""
  };
}

export function CraftBoardOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<CraftBoardOrderItem | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardOrder(orderId);
      if (!payload?.order) {
        setError("Order not found.");
        return;
      }
      setOrder(payload.order);
      setForm(buildFormState(payload.order));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

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
          const payload = await updateCraftBoardOrder(orderId, {
            status: nextStatus ?? form.status,
            internalReleaseNotes: form.internalReleaseNotes || null,
            productionPrepNotes: form.productionPrepNotes || null,
            fulfillmentNotes: form.fulfillmentNotes || null,
            requestedShipDate: form.requestedShipDate
              ? new Date(`${form.requestedShipDate}T00:00:00.000Z`).toISOString()
              : null,
            targetCompletionDate: form.targetCompletionDate
              ? new Date(`${form.targetCompletionDate}T00:00:00.000Z`).toISOString()
              : null
          });

          setOrder(payload.order);
          setForm(buildFormState(payload.order));
          setMessage("Order updated.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update order.");
        }
      })();
    });
  }

  function createProductionJob() {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createCraftBoardProductionJobFromOrder(orderId);
          setOrder((current) =>
            current
              ? {
                  ...current,
                  linkedProductionJob: payload.productionJob
                    ? {
                        id: payload.productionJob.id,
                        productionJobNumber: payload.productionJob.productionJobNumber,
                        status: payload.productionJob.status,
                        stage: payload.productionJob.stage,
                        releasedFromOrderAt: payload.productionJob.releasedFromOrderAt
                      }
                    : current.linkedProductionJob
                }
              : current
          );
          setMessage("Production job released from order.");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create production job.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading order...
      </div>
    );
  }

  if (error || !order || !form) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Order not found."}
      </div>
    );
  }

  const canCreateProductionJob = ["RELEASED", "PREP_IN_PROGRESS", "READY_FOR_PRODUCTION", "IN_PRODUCTION", "READY_TO_FULFILL", "FULFILLED"].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Order</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{order.orderNumber}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Released from proposal{" "}
            <Link className="text-emerald-300" href={`/admin/craft-board/proposals/${order.proposalId}`}>
              {order.proposal?.proposalNumber ?? order.proposalId}
            </Link>
          </p>
          {order.linkedProductionJob ? (
            <p className="mt-2 text-xs text-slate-400">
              Work order {order.linkedProductionJob.productionJobNumber} ·{" "}
              {humanizeToken(order.linkedProductionJob.stage ?? order.linkedProductionJob.status)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => save("PREP_IN_PROGRESS")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Start Prep
          </button>
          <button
            type="button"
            onClick={() => save("READY_FOR_PRODUCTION")}
            disabled={isPending}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Mark Ready
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Order"}
          </button>
          {order.linkedProductionJob ? (
            <Link
              href={`/admin/craft-board/production-jobs/${order.linkedProductionJob.id}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
            >
              Open Work Order
            </Link>
          ) : (
            <button
              type="button"
              onClick={createProductionJob}
              disabled={isPending || !canCreateProductionJob}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              Create Work Order
            </button>
          )}
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">1. Order Header</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-2">{humanizeToken(order.status)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Released By</p>
                <p className="mt-2">{order.releasedBy ?? "Not recorded"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Released</p>
                <p className="mt-2">{formatDateTime(order.releasedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                <p className="mt-2">{formatDateTime(order.updatedAt)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">2. Customer Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{order.customerNameSnapshot}</p>
                <p className="mt-1 text-slate-400">{order.customerEmailSnapshot}</p>
                <p className="mt-1 text-slate-400">{order.customerPhoneSnapshot ?? "No phone recorded"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3. Commercial Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>Subtotal {formatCurrency(order.proposalSubtotalAmountCents, order.currencyCode)}</p>
                <p className="mt-1">Discount {formatCurrency(order.proposalDiscountAmountCents, order.currencyCode)}</p>
                <p className="mt-1">Shipping {formatCurrency(order.proposalShippingAmountCents, order.currencyCode)}</p>
                <p className="mt-1 font-medium text-white">
                  Proposal Total {formatCurrency(order.proposalTotalAmountCents, order.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>Deposit Paid {formatCurrency(order.depositAmountPaidCents, order.currencyCode)}</p>
                <p className="mt-1">Remaining Balance {formatCurrency(order.remainingBalanceAmountCents, order.currencyCode)}</p>
                <p className="mt-1">{order.leadTimeText ?? "Lead time not set"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope Summary</p>
                <p className="mt-2 text-slate-300">{order.scopeSummary ?? "No scope summary captured."}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">4. Product Configuration Snapshot</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{order.productName}</p>
                <p className="mt-1">
                  {order.reviewedWidthValue ?? "?"} {order.reviewedWidthUnit} x {order.reviewedDepthValue ?? "?"}{" "}
                  {order.reviewedDepthUnit} x {order.reviewedThicknessValue ?? "?"} {order.reviewedThicknessUnit}
                </p>
                <p className="mt-1">Qty {order.reviewedQuantity}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p>{order.reviewedMaterialLabel ?? "Material not recorded"}</p>
                <p className="mt-1">{order.reviewedMountingLabel ?? "Mounting not recorded"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Customer Notes Snapshot</p>
                <p className="mt-2 text-slate-300">{order.customerNotesSnapshot ?? "No customer notes captured."}</p>
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5. Release / Readiness Workflow</p>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm text-slate-200">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as FormState["status"])}
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
                <span>Target Completion Date</span>
                <input
                  type="date"
                  value={form.targetCompletionDate}
                  onChange={(event) => updateField("targetCompletionDate", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Requested Ship Date</span>
                <input
                  type="date"
                  value={form.requestedShipDate}
                  onChange={(event) => updateField("requestedShipDate", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Internal Release Notes</span>
                <textarea
                  value={form.internalReleaseNotes}
                  onChange={(event) => updateField("internalReleaseNotes", event.target.value)}
                  rows={5}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p>Ready for production {order.readyForProductionAt ? formatDateTime(order.readyForProductionAt) : "Not marked"}</p>
              <p className="mt-1">Production released {order.productionReleasedAt ? formatDateTime(order.productionReleasedAt) : "Not marked"}</p>
              <p className="mt-1">Closed {order.closedAt ? formatDateTime(order.closedAt) : "Not closed"}</p>
              <p className="mt-1">
                Work order{" "}
                {order.linkedProductionJob ? (
                  <Link
                    href={`/admin/craft-board/production-jobs/${order.linkedProductionJob.id}`}
                    className="text-emerald-300"
                  >
                    {order.linkedProductionJob.productionJobNumber}
                  </Link>
                ) : (
                  "Not created"
                )}
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">6. Production Prep</p>
            <label className="mt-5 block space-y-2 text-sm text-slate-200">
              <span>Production Prep Notes</span>
              <textarea
                value={form.productionPrepNotes}
                onChange={(event) => updateField("productionPrepNotes", event.target.value)}
                rows={8}
                className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">7. Fulfillment Notes</p>
            <label className="mt-5 block space-y-2 text-sm text-slate-200">
              <span>Fulfillment Notes</span>
              <textarea
                value={form.fulfillmentNotes}
                onChange={(event) => updateField("fulfillmentNotes", event.target.value)}
                rows={8}
                className="w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">8. Linked Record Navigation</p>
            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <Link
                href={`/admin/craft-board/inquiries/${order.inquiryId}`}
                className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inquiry</p>
                <p className="mt-2">{order.inquiry?.id ?? order.inquiryId}</p>
                <p className="mt-1 text-slate-400">{order.inquiry ? humanizeToken(order.inquiry.status) : "Open inquiry"}</p>
              </Link>
              <Link
                href={`/admin/craft-board/proposals/${order.proposalId}`}
                className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proposal</p>
                <p className="mt-2">{order.proposal?.proposalNumber ?? order.proposalId}</p>
                <p className="mt-1 text-slate-400">{order.proposal ? humanizeToken(order.proposal.status) : "Proposal link"}</p>
              </Link>
              <Link
                href={`/admin/craft-board/deposits/${order.depositRequestId}`}
                className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-emerald-200/30"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deposit</p>
                <p className="mt-2">{order.depositRequest?.depositNumber ?? order.depositRequestId}</p>
                <p className="mt-1 text-slate-400">
                  {order.depositRequest
                    ? `${humanizeToken(order.depositRequest.status)} · ${order.depositRequest.paidAt ? formatDateTime(order.depositRequest.paidAt) : "No paid timestamp"}`
                    : "Deposit link"}
                </p>
              </Link>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p>Target completion {formatDate(order.targetCompletionDate)}</p>
              <p className="mt-1">Requested ship date {formatDate(order.requestedShipDate)}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
