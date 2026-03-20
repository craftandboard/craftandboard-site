"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getCraftBoardProductionBoard,
  updateCraftBoardProductionJob,
  type CraftBoardProductionJobItem
} from "../lib/api";
import { formatDate, humanizeToken } from "../lib/mvp";

const boardStages = [
  { key: "PREP", label: "Prep" },
  { key: "READY_TO_BUILD", label: "Ready To Build" },
  { key: "IN_BUILD", label: "In Build" },
  { key: "BUILD_COMPLETE", label: "Build Complete" },
  { key: "READY_TO_FULFILL", label: "Ready To Fulfill" },
  { key: "FULFILLED", label: "Fulfilled" }
] as const;

function toneForJob(job: CraftBoardProductionJobItem) {
  if (!job.targetCompletionDate) {
    return "border-white/10";
  }
  const due = new Date(job.targetCompletionDate).getTime();
  const now = Date.now();
  const days = (due - now) / (1000 * 60 * 60 * 24);
  if (days < 0) {
    return "border-rose-300/40";
  }
  if (days < 2) {
    return "border-amber-300/40";
  }
  return "border-emerald-300/20";
}

export function CraftBoardProductionBoard() {
  const [jobs, setJobs] = useState<CraftBoardProductionJobItem[]>([]);
  const [query, setQuery] = useState("");
  const [includeFulfilled, setIncludeFulfilled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load(nextQuery = query, nextIncludeFulfilled = includeFulfilled) {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardProductionBoard({
        q: nextQuery.trim() || undefined,
        includeFulfilled: nextIncludeFulfilled,
        includeCancelled: false
      });
      setJobs(payload?.productionJobs ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load production board.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    return boardStages.reduce<Record<string, CraftBoardProductionJobItem[]>>((acc, stage) => {
      acc[stage.key] = jobs.filter((job) => job.stage === stage.key);
      return acc;
    }, {});
  }, [jobs]);

  function moveJob(job: CraftBoardProductionJobItem, stage: CraftBoardProductionJobItem["stage"]) {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await updateCraftBoardProductionJob(job.id, { stage });
          setJobs((current) =>
            current.map((entry) => (entry.id === job.id ? payload.productionJob : entry))
          );
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update stage.");
        }
      })();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Production Board</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Active shop board</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage active work orders by stage, move jobs forward, and surface due work without opening every detail page.
          </p>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Job number, order, customer, or material"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={includeFulfilled}
              onChange={(event) => setIncludeFulfilled(event.target.checked)}
            />
            <span>Show fulfilled</span>
          </label>
          <button
            type="button"
            onClick={() => startTransition(() => void load(query, includeFulfilled))}
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

      {loading ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading production board...
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-6">
          {boardStages.map((stage, index) => (
            <section key={stage.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stage.label}</p>
                  <p className="mt-1 text-sm text-slate-300">{grouped[stage.key]?.length ?? 0} jobs</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {grouped[stage.key]?.length ? (
                  grouped[stage.key].map((job) => (
                    <article
                      key={job.id}
                      className={`rounded-[1.25rem] border bg-black/20 p-4 text-sm text-slate-200 ${toneForJob(job)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/admin/craft-board/production-jobs/${job.id}`}
                            className="font-medium text-white hover:text-emerald-200"
                          >
                            {job.productionJobCode}
                          </Link>
                          <p className="mt-1 text-xs text-slate-400">{job.customerNameSnapshot}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-300">
                          {job.order?.orderNumber ?? "No order"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-slate-300">
                        <p>{job.productName}</p>
                        <p>
                          {job.reviewedWidthValue ?? "?"}&quot; x {job.reviewedDepthValue ?? "?"}&quot; x{" "}
                          {job.reviewedThicknessValue ?? "?"}&quot; · Qty {job.reviewedQuantity}
                        </p>
                        <p>{job.reviewedMaterialLabel ?? "Unset material"}</p>
                        <p>Due {formatDate(job.targetCompletionDate)}</p>
                        <p>{job.checklistReadyForBuild ? "Checklist ready" : "Checklist incomplete"}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => moveJob(job, boardStages[index - 1].key)}
                            disabled={isPending}
                            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white disabled:opacity-60"
                          >
                            Back
                          </button>
                        ) : null}
                        {index < boardStages.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => moveJob(job, boardStages[index + 1].key)}
                            disabled={isPending}
                            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white disabled:opacity-60"
                          >
                            Forward
                          </button>
                        ) : null}
                        <select
                          value={job.stage}
                          onChange={(event) => moveJob(job, event.target.value as CraftBoardProductionJobItem["stage"])}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white"
                        >
                          {boardStages.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-white/10 p-4 text-xs text-slate-500">
                    No jobs in this stage.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
