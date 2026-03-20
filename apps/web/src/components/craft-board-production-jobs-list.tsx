"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getCraftBoardProductionJobs, type CraftBoardProductionJobItem } from "../lib/api";
import { formatDate, formatDateTime, humanizeToken } from "../lib/mvp";

const statusOptions = [
  "ALL",
  "RELEASED",
  "PREP_IN_PROGRESS",
  "READY_FOR_BUILD",
  "IN_BUILD",
  "BUILD_COMPLETE",
  "READY_FOR_FULFILLMENT",
  "FULFILLED",
  "CANCELLED"
] as const;

function isOverdue(job: CraftBoardProductionJobItem) {
  if (!job.targetCompletionDate) {
    return false;
  }

  return !["FULFILLED", "CANCELLED"].includes(job.status) && new Date(job.targetCompletionDate) < new Date();
}

export function CraftBoardProductionJobsList() {
  const [productionJobs, setProductionJobs] = useState<CraftBoardProductionJobItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextStatus = status, nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardProductionJobs({
        status: nextStatus === "ALL" ? undefined : nextStatus,
        q: nextQuery.trim() || undefined
      });
      setProductionJobs(payload?.productionJobs ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load production jobs.");
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
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Production</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Work order queue</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Track released work orders from prep through build completion and fulfillment readiness.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Job number, order, customer, or email"
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
          <div className="p-5 text-sm text-slate-300">Loading production jobs...</div>
        ) : productionJobs.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 p-8 text-sm text-slate-300">
            No production jobs match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {productionJobs.map((job) => (
                  <tr key={job.id} className="border-t border-white/10">
                    <td className="px-4 py-4 align-top">
                      <Link
                        href={`/admin/craft-board/production-jobs/${job.id}`}
                        className="font-medium text-white hover:text-emerald-200"
                      >
                        {job.productionJobNumber}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">
                        Released {formatDateTime(job.releasedFromOrderAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{job.customerNameSnapshot}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{job.productName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {job.reviewedWidthValue ?? "?"}&quot; x {job.reviewedDepthValue ?? "?"}&quot; x{" "}
                        {job.reviewedThicknessValue ?? "?"}&quot; · Qty {job.reviewedQuantity}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p>{job.reviewedMaterialLabel ?? "Unset material"}</p>
                      <p className="mt-1 text-xs text-slate-400">{job.reviewedMountingLabel ?? "Unset mounting"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                        {humanizeToken(job.status)}
                      </span>
                      {isOverdue(job) ? (
                        <p className="mt-2 text-xs text-amber-300">Past target date</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      <p>{job.order?.orderNumber ?? "No order"}</p>
                      <p className="mt-1">{job.order ? humanizeToken(job.order.status) : "No status"}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-300">
                      <p>{formatDate(job.targetCompletionDate)}</p>
                      <p className="mt-1">{formatDate(job.requestedShipDate)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-400">
                      {formatDateTime(job.createdAt)}
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
