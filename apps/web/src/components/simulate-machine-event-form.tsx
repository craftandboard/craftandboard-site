"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { simulateMachineEvent, type MachineEventRecord } from "../lib/api";

const EVENT_TYPES = [
  "RUN_STARTED",
  "RUN_COMPLETED",
  "SHEET_STARTED",
  "SHEET_COMPLETED",
  "PART_SCANNED",
  "EDGEBAND_RUN_STARTED",
  "EDGEBAND_RUN_COMPLETED",
  "MACHINE_HEARTBEAT",
  "FAULT",
  "STOPPED"
] as const;

export function SimulateMachineEventForm(props: { machineId?: string; machineCode?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MachineEventRecord | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const eventType = String(formData.get("eventType") ?? "RUN_STARTED") as (typeof EVENT_TYPES)[number];
      const batchRef = String(formData.get("batchRef") ?? "").trim();
      const jobRef = String(formData.get("jobRef") ?? "").trim();
      const scanCode = String(formData.get("scanCode") ?? "").trim();
      const sheetRef = String(formData.get("sheetRef") ?? "").trim();
      const severity = String(formData.get("severity") ?? "").trim();
      const payloadText = String(formData.get("payload") ?? "").trim();

      const payload = payloadText ? JSON.parse(payloadText) : { simulated: true, eventType };
      const response = await simulateMachineEvent({
        machineId: props.machineId,
        machineCode: props.machineCode,
        eventType,
        batchRef: batchRef || undefined,
        jobRef: jobRef || undefined,
        scanCode: scanCode || undefined,
        sheetRef: sheetRef || undefined,
        severity: severity || undefined,
        payload
      });

      setResult(response.event);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Simulation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Simulate Machine Event</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          name="eventType"
          defaultValue="RUN_STARTED"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        >
          {EVENT_TYPES.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>
        <input
          name="batchRef"
          placeholder="Batch ref / code"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="jobRef"
          placeholder="Job ref / label code"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="scanCode"
          placeholder="Part scan code"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="sheetRef"
          placeholder="Sheet ref"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="severity"
          placeholder="Severity"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <textarea
          name="payload"
          rows={6}
          placeholder='Optional JSON payload, e.g. {"spindleRpm":18000}'
          className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/60 hover:text-white disabled:opacity-60"
        >
          {pending ? "Simulating..." : "Simulate Event"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {result ? (
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-[11px] text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
