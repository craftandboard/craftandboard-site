"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getCraftBoardOrders, type CraftBoardOrderItem } from "../lib/api";
import { formatCurrency, formatDate, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = [
  "ALL",
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_FULFILL",
  "FULFILLED",
  "CLOSED",
  "CANCELLED"
] as const;

export function CraftBoardOrdersList() {
  const [orders, setOrders] = useState<CraftBoardOrderItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextStatus = status, nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardOrders({
        status: nextStatus === "ALL" ? undefined : nextStatus,
        q: nextQuery.trim() || undefined
      });
      setOrders(payload?.orders ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    startTransition(() => {
      void load(status, query);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Orders</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Paid order release queue</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Manage released orders, internal prep, and the first execution handoff after approved and paid work.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number, proposal, customer, or email"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All statuses" : humanizeToken(option)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            className="h-[50px] rounded-full bg-emerald-400 px-5 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Refreshing..." : "Apply Filters"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
        {loading ? (
          <div className="p-5 text-sm text-slate-300">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 p-8 text-sm text-slate-300">
            No Craft & Board orders match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Commercial</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Proposal / Deposit</th>
                  <th className="px-4 py-3">Production</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="px-4 py-4 align-top">
                      <Link
                        href={`/admin/craft-board/orders/${order.id}`}
                        className="font-medium text-white hover:text-emerald-200"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">
                        Released {formatDateTime(order.releasedAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{order.customerNameSnapshot}</p>
                      <p className="mt-1 text-xs text-slate-400">{order.customerEmailSnapshot}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{order.productName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.reviewedWidthValue ?? "?"}&quot; x {order.reviewedDepthValue ?? "?"}
                        &quot; x {order.reviewedThicknessValue ?? "?"}&quot; · Qty {order.reviewedQuantity}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.reviewedMaterialLabel ?? "Unset material"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{formatCurrency(order.proposalTotalAmountCents, order.currencyCode)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Deposit {formatCurrency(order.depositAmountPaidCents, order.currencyCode)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                        {humanizeToken(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      <p>{order.proposal?.proposalNumber ?? "No proposal"}</p>
                      <p className="mt-1">{order.depositRequest?.depositNumber ?? "No deposit"}</p>
                      <p className="mt-1">
                        {order.depositRequest ? humanizeToken(order.depositRequest.status) : "No paid state"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      {order.linkedProductionJob ? (
                        <>
                          <Link
                            href={`/admin/craft-board/production-jobs/${order.linkedProductionJob.id}`}
                            className="text-white hover:text-emerald-200"
                          >
                            {order.linkedProductionJob.productionJobNumber}
                          </Link>
                          <p className="mt-1">{humanizeToken(order.linkedProductionJob.status)}</p>
                          <p className="mt-1">{humanizeToken(order.linkedProductionJob.stage ?? order.linkedProductionJob.status)}</p>
                        </>
                      ) : (
                        <span className="text-slate-500">Not released</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      <p>{formatDate(order.targetCompletionDate)}</p>
                      <p className="mt-1">{formatDate(order.requestedShipDate)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
