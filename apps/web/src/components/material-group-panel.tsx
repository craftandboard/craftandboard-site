"use client";

import { useMemo, useState } from "react";
import type { MaterialForecastResponse } from "../lib/api";
import { CreateBatchFromForecastButton } from "./create-batch-from-forecast-button";

function formatSqFt(value: number) {
  return `${value.toFixed(2)} sq ft`;
}

function formatDate(value?: string) {
  if (!value) {
    return "No ship-by date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function MaterialGroupPanel(props: {
  group: MaterialForecastResponse["materials"][number];
}) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(props.group.jobs.map((job) => job.jobId));
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>(props.group.jobs.slice(0, 1).map((job) => job.jobId));

  const selectedPartsCount = useMemo(() => {
    const selected = new Set(selectedJobIds);
    return props.group.jobs.reduce((sum, job) => (selected.has(job.jobId) ? sum + job.partCount : sum), 0);
  }, [props.group.jobs, selectedJobIds]);

  function toggleJob(jobId: string) {
    setSelectedJobIds((current) =>
      current.includes(jobId) ? current.filter((candidate) => candidate !== jobId) : [...current, jobId]
    );
  }

  function toggleExpanded(jobId: string) {
    setExpandedJobIds((current) =>
      current.includes(jobId) ? current.filter((candidate) => candidate !== jobId) : [...current, jobId]
    );
  }

  function selectAll() {
    setSelectedJobIds(props.group.jobs.map((job) => job.jobId));
  }

  function clearSelection() {
    setSelectedJobIds([]);
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{props.group.materialCode}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{props.group.materialDisplayName}</h3>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-white/10 px-4 py-2">
              {props.group.pendingPartCount} pending parts
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              {props.group.pendingJobCount} jobs
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              {formatSqFt(props.group.totalAreaSqFt)}
            </span>
            <span className="rounded-full border border-amber-300/20 px-4 py-2 text-amber-100">
              {props.group.estimatedFullSheetsNeeded} est. sheets
            </span>
          </div>
        </div>

        <div className="min-w-[18rem] space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Remnant Advisory</p>
          <p className="text-sm text-slate-200">
            {props.group.candidateRemnantsCount > 0
              ? `${props.group.candidateRemnantsCount} candidates covering ${props.group.recommendedCoverageAreaSqIn.toFixed(1)} of ${props.group.totalAreaSqIn.toFixed(1)} sq in demand`
              : "No candidate remnants identified yet."}
          </p>
          {props.group.candidateRemnantsCount > 0 ? (
            <p className="text-xs text-slate-400">
              {props.group.candidateRemnantsAreaSqIn.toFixed(1)} sq in live inventory · estimated full-sheet reduction{" "}
              {props.group.estimatedNewSheetReduction}
            </p>
          ) : null}
          {props.group.candidateRemnantsPreview.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {props.group.candidateRemnantsPreview.map((candidate) => (
                <li key={candidate.id} className="rounded-xl border border-white/10 px-3 py-2">
                  <div>{candidate.label}</div>
                  <div className="mt-1 text-slate-400">
                    {candidate.availableAreaSqIn.toFixed(1)} sq in · {candidate.status}
                    {candidate.locationLabel ? ` · ${candidate.locationLabel}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
        >
          Select All Jobs
        </button>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
        >
          Clear
        </button>
        <span className="text-sm text-slate-400">
          Selected {selectedJobIds.length} jobs · {selectedPartsCount} parts
        </span>
      </div>

      <div className="mt-4">
        <CreateBatchFromForecastButton materialCode={props.group.materialCode} jobIds={selectedJobIds} />
      </div>

      <div className="mt-6 space-y-3">
        {props.group.jobs.map((job) => {
          const expanded = expandedJobIds.includes(job.jobId);
          const checked = selectedJobIds.includes(job.jobId);

          return (
            <article key={job.jobId} className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleJob(job.jobId)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-400"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
                      {job.source} · {job.channel}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-white">
                      {job.customerName} · Job {job.jobId}
                    </h4>
                    <p className="mt-2 text-sm text-slate-300">
                      Order {job.orderId ?? "Unknown"} · Ship by {formatDate(job.shipByDate)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="rounded-full border border-white/10 px-3 py-2">{job.partCount} parts</span>
                  <span className="rounded-full border border-white/10 px-3 py-2">
                    {(job.totalAreaSqIn / 144).toFixed(2)} sq ft
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(job.jobId)}
                    className="rounded-full border border-white/10 px-3 py-2 transition hover:border-emerald-300/40 hover:text-white"
                  >
                    {expanded ? "Hide Parts" : "Show Parts"}
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="mt-4 overflow-x-auto rounded-[1.25rem] border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">Part</th>
                        <th className="px-4 py-3 font-medium">Scan</th>
                        <th className="px-4 py-3 font-medium">Dimensions</th>
                        <th className="px-4 py-3 font-medium">Area</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-200">
                      {job.parts.map((part) => (
                        <tr key={part.partId}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{part.labelCode}</div>
                            <div className="text-xs text-slate-400">{part.partId}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300">{part.scanCode}</td>
                          <td className="px-4 py-3">
                            {part.widthIn}&quot; × {part.depthIn}&quot; × {part.thicknessIn}&quot;
                          </td>
                          <td className="px-4 py-3">{part.areaSqIn.toFixed(1)} sq in</td>
                          <td className="px-4 py-3 uppercase tracking-[0.18em] text-emerald-200">{part.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
