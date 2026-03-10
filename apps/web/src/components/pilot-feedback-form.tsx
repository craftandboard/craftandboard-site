"use client";

import { useMemo, useState, useTransition } from "react";
import { createPilotFeedback } from "../lib/api";

const areaOptions = ["GENERAL", "LEADS", "PROPOSALS", "PUBLIC_ACCEPTANCE", "PROJECTS"] as const;
const severityOptions = ["LOW", "MEDIUM", "HIGH", "BLOCKER"] as const;

export function PilotFeedbackForm({
  defaultArea = "GENERAL",
  defaultPagePath = "",
  onSubmitted
}: {
  defaultArea?: (typeof areaOptions)[number];
  defaultPagePath?: string;
  onSubmitted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    area: defaultArea,
    severity: "MEDIUM" as (typeof severityOptions)[number],
    pagePath: defaultPagePath,
    title: "",
    message: "",
    reproductionNotes: "",
    screenshotUrl: ""
  });

  const disabled = useMemo(
    () => isPending || !form.title.trim() || !form.message.trim(),
    [form.message, form.title, isPending]
  );

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          await createPilotFeedback({
            area: form.area,
            severity: form.severity,
            pagePath: form.pagePath || null,
            title: form.title.trim(),
            message: form.message.trim(),
            reproductionNotes: form.reproductionNotes || null,
            screenshotUrl: form.screenshotUrl || null
          });
          setForm((current) => ({
            ...current,
            severity: "MEDIUM",
            title: "",
            message: "",
            reproductionNotes: "",
            screenshotUrl: ""
          }));
          setSuccess("Feedback saved for the pilot review loop.");
          onSubmitted?.();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to submit feedback.");
        }
      })();
    });
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilot Feedback</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Capture tester friction immediately</h3>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Area</span>
          <select
            value={form.area}
            onChange={(event) => updateField("area", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            {areaOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Severity</span>
          <select
            value={form.severity}
            onChange={(event) => updateField("severity", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            {severityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>Page Path</span>
          <input
            value={form.pagePath}
            onChange={(event) => updateField("pagePath", event.target.value)}
            placeholder="/proposals/proposal_123"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Proposal editor totals were hard to notice"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>Feedback</span>
          <textarea
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            rows={5}
            placeholder="Describe what the tester tried, what was confusing, and what happened instead."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Reproduction Notes</span>
          <textarea
            value={form.reproductionNotes}
            onChange={(event) => updateField("reproductionNotes", event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Screenshot URL</span>
          <input
            value={form.screenshotUrl}
            onChange={(event) => updateField("screenshotUrl", event.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send Feedback"}
        </button>
        <p className="self-center text-xs text-slate-400">
          Use this during live pilot sessions so blocker and high-severity issues are not lost.
        </p>
      </div>
    </section>
  );
}
