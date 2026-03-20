"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getCraftBoardDeposits, type CraftBoardDepositRequestItem } from "../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = ["ALL", "DRAFT", "READY", "SHARED", "VIEWED", "PAYMENT_INITIATED", "PAID", "CANCELLED", "EXPIRED"] as const;

export function CraftBoardDepositsList() {
  const [deposits, setDeposits] = useState<CraftBoardDepositRequestItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextStatus = status, nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardDeposits({
        status: nextStatus === "ALL" ? undefined : nextStatus,
        q: nextQuery.trim() || undefined
      });
      setDeposits(payload?.depositRequests ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load deposits.");
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
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Deposits</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Deposit request queue</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Track deposit requests, customer payment intent, and paid state after proposal approval.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Deposit number, proposal, customer, or email"
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
          <div className="p-5 text-sm text-slate-300">Loading deposit requests...</div>
        ) : deposits.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 p-8 text-sm text-slate-300">
            No deposit requests match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Proposal</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-t border-white/10">
                    <td className="px-4 py-4 align-top">
                      <Link href={`/admin/craft-board/deposits/${deposit.id}`} className="font-medium text-white hover:text-emerald-200">
                        {deposit.depositNumber}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{deposit.title}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{deposit.customerNameSnapshot}</p>
                      <p className="mt-1 text-xs text-slate-400">{deposit.customerEmailSnapshot}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{deposit.proposal?.proposalNumber ?? "Proposal"}</p>
                      <p className="mt-1 text-xs text-slate-400">{deposit.proposal?.title ?? "No proposal title"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{formatCurrency(deposit.depositAmountCents, deposit.currencyCode)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Balance {formatCurrency(deposit.remainingBalanceAmountCents ?? 0, deposit.currencyCode)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                        {humanizeToken(deposit.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {deposit.paidAt ? (
                        <span className="text-emerald-300">{formatDateTime(deposit.paidAt)}</span>
                      ) : (
                        <span className="text-slate-400">Not paid</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {deposit.linkedOrder ? (
                        <div className="text-xs text-slate-300">
                          <Link
                            href={`/admin/craft-board/orders/${deposit.linkedOrder.id}`}
                            className="text-white hover:text-emerald-200"
                          >
                            {deposit.linkedOrder.orderNumber}
                          </Link>
                          <p className="mt-1">{humanizeToken(deposit.linkedOrder.status)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Not released</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-400">
                      {formatDateTime(deposit.createdAt)}
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
