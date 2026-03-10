"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  getPilotFeedback,
  updatePilotFeedback,
  type PilotFeedbackItem,
  type PilotFeedbackSummary
} from "../lib/api";
import { formatDateTime, humanizeToken, toneForStatus } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

const areaOptions = ["ALL", "GENERAL", "LEADS", "PROPOSALS", "PUBLIC_ACCEPTANCE", "PROJECTS"] as const;
const severityOptions = ["ALL", "LOW", "MEDIUM", "HIGH", "BLOCKER"] as const;
const statusOptions = ["ALL", "NEW", "REVIEWED", "RESOLVED"] as const;

export function PilotFeedbackList({
  initialArea = "ALL",
  initialSeverity = "ALL",
  initialStatus = "ALL",
  compact = false
}: {
  initialArea?: (typeof areaOptions)[number];
  initialSeverity?: (typeof severityOptions)[number];
  initialStatus?: (typeof statusOptions)[number];
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PilotFeedbackItem[]>([]);
  const [summary, setSummary] = useState<PilotFeedbackSummary | null>(null);
  const [filters, setFilters] = useState({
    area: initialArea,
    severity: initialSeverity,
    status: initialStatus
  });

  const resolvedFilters = useMemo(
    () => ({
      area: filters.area === "ALL" ? undefined : filters.area,
      severity: filters.severity === "ALL" ? undefined : filters.severity,
      status: filters.status === "ALL" ? undefined : filters.status
    }),
    [filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getPilotFeedback(resolvedFilters);
      setFeedback(payload?.feedback ?? []);
      setSummary(payload?.summary ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load pilot feedback.");
    } finally {
      setLoading(false);
    }
  }, [resolvedFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateFilter(name: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleStatusChange(feedbackId: string, status: "NEW" | "REVIEWED" | "RESOLVED") {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await updatePilotFeedback(feedbackId, { status });
          setSuccess(`Feedback marked ${humanizeToken(status)}.`);
          await load();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to update pilot feedback.");
        }
      })();
    });
  }

  const visibleItems = compact ? feedback.slice(0, 6) : feedback;

  return (
    <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilot Status</p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {compact ? "Blocker and high-severity triage" : "Pilot feedback"}
          </h3>
        </div>
        {!compact ? (
          <div className="flex flex-wrap gap-3">
            <FilterSelect
              label="Area"
              value={filters.area}
              onChange={(value) => updateFilter("area", value)}
              options={areaOptions}
            />
            <FilterSelect
              label="Severity"
              value={filters.severity}
              onChange={(value) => updateFilter("severity", value)}
              options={severityOptions}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(value) => updateFilter("status", value)}
              options={statusOptions}
            />
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Open Issues" value={String(summary.openCount)} />
          <SummaryCard label="Blockers" value={String(summary.openBlockerCount)} tone="danger" />
          <SummaryCard label="High Severity" value={String(summary.openHighSeverityCount)} tone="warning" />
          <SummaryCard
            label="Latest Submission"
            value={summary.latestSubmittedAt ? formatDateTime(summary.latestSubmittedAt) : "None"}
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-300">
          Loading pilot feedback...
        </div>
      ) : visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.severity} label={humanizeToken(item.severity)} />
                    <StatusBadge value={item.status} label={humanizeToken(item.status)} />
                    <StatusBadge value={item.area} label={humanizeToken(item.area)} />
                  </div>
                  <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-300">{item.message}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(event) =>
                    handleStatusChange(item.id, event.target.value as "NEW" | "REVIEWED" | "RESOLVED")
                  }
                  disabled={isPending}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {statusOptions
                    .filter((option) => option !== "ALL")
                    .map((status) => (
                      <option key={status} value={status}>
                        {humanizeToken(status)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mt-3 grid gap-3 text-xs text-slate-400 md:grid-cols-4">
                <p>Page: {item.pagePath ?? "General feedback"}</p>
                <p>Created: {formatDateTime(item.createdAt)}</p>
                <p className={toneClass(item.severity)}>Severity: {humanizeToken(item.severity)}</p>
                <p>Status: {humanizeToken(item.status)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {item.pagePath?.startsWith("/") ? (
                  <Link
                    href={item.pagePath}
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open affected page
                  </Link>
                ) : null}
                {item.screenshotUrl ? (
                  <a
                    href={item.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open screenshot
                  </a>
                ) : null}
              </div>

              {item.reproductionNotes ? (
                <p className="mt-3 text-sm text-slate-300">Repro: {item.reproductionNotes}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
          No pilot feedback matches the current filters.
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-xs text-slate-400">
      <span className="uppercase tracking-[0.2em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? `All ${label}` : humanizeToken(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const classes =
    tone === "danger"
      ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
      : tone === "warning"
        ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-black/10 text-white";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${classes}`}>
      <p className="text-xs uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function toneClass(value: string) {
  const tone = toneForStatus(value);
  if (tone === "danger") return "text-rose-200";
  if (tone === "warning") return "text-amber-200";
  if (tone === "success") return "text-emerald-200";
  return "text-slate-400";
}
