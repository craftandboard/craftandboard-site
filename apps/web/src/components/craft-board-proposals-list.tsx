"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getCraftBoardProposals, type CraftBoardProposalItem } from "../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = ["ALL", "DRAFT", "READY", "SHARED", "VIEWED", "APPROVED", "DECLINED", "EXPIRED", "ARCHIVED"] as const;

export function CraftBoardProposalsList() {
  const [proposals, setProposals] = useState<CraftBoardProposalItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextStatus = status, nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardProposals({
        status: nextStatus === "ALL" ? undefined : nextStatus,
        q: nextQuery.trim() || undefined
      });
      setProposals(payload?.proposals ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters() {
    startTransition(() => {
      void load(status, query);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Proposals</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Proposal queue</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Review prepared proposals, share customer links, and track approvals.
          </p>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Proposal number, customer, or email"
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
            onClick={handleApplyFilters}
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
          <div className="p-5 text-sm text-slate-300">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 p-8 text-sm text-slate-300">
            No Craft & Board proposals match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Proposal</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Response</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="border-t border-white/10">
                    <td className="px-4 py-4 align-top">
                      <Link
                        href={`/admin/craft-board/proposals/${proposal.id}`}
                        className="font-medium text-white hover:text-emerald-200"
                      >
                        {proposal.proposalNumber}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{proposal.title}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{proposal.customerNameSnapshot}</p>
                      <p className="mt-1 text-xs text-slate-400">{proposal.customerEmailSnapshot}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{proposal.productName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Qty {proposal.reviewedQuantity} · {proposal.reviewedMaterialLabel ?? "Unset"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {formatCurrency(proposal.totalAmountCents, proposal.currencyCode)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                        {humanizeToken(proposal.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {proposal.latestDepositRequest ? (
                        <div className="text-xs text-slate-300">
                          <p>{proposal.latestDepositRequest.depositNumber}</p>
                          <p className="mt-1">{humanizeToken(proposal.latestDepositRequest.status)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">No deposit</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {proposal.linkedOrder ? (
                        <div className="text-xs text-slate-300">
                          <Link
                            href={`/admin/craft-board/orders/${proposal.linkedOrder.id}`}
                            className="text-white hover:text-emerald-200"
                          >
                            {proposal.linkedOrder.orderNumber}
                          </Link>
                          <p className="mt-1">{humanizeToken(proposal.linkedOrder.status)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Not released</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {proposal.customerApprovedAt ? (
                        <span className="text-emerald-300">Approved</span>
                      ) : proposal.customerDeclinedAt ? (
                        <span className="text-rose-300">Declined</span>
                      ) : proposal.customerViewedAt ? (
                        <span className="text-amber-300">Viewed</span>
                      ) : proposal.sharedAt ? (
                        <span className="text-slate-300">Shared</span>
                      ) : (
                        <span className="text-slate-500">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-400">
                      {formatDateTime(proposal.createdAt)}
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
