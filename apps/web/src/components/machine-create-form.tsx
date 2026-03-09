"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createMachine, type MachineSummary } from "../lib/api";

const MACHINE_TYPES = ["CNC", "EDGEBANDER", "LABEL_PRINTER", "SCANNER_STATION", "OTHER"] as const;

export function MachineCreateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MachineSummary | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await createMachine({
        code: String(formData.get("code") ?? ""),
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? "CNC") as (typeof MACHINE_TYPES)[number],
        locationLabel: String(formData.get("locationLabel") ?? "").trim() || undefined,
        adapterType: String(formData.get("adapterType") ?? "").trim() || undefined,
        notes: String(formData.get("notes") ?? "").trim() || undefined
      });

      setResult(response.machine);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Machine creation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Register Machine</h3>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          name="code"
          placeholder="Machine code"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="name"
          placeholder="Machine name"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <select
          name="type"
          defaultValue="CNC"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        >
          {MACHINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          name="locationLabel"
          placeholder="Location"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="adapterType"
          placeholder="Adapter type"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="notes"
          placeholder="Notes"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/60 hover:text-white disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create Machine"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {result ? <p className="mt-3 text-sm text-emerald-200">Created {result.name} ({result.code}). Refresh to see it in the registry.</p> : null}
    </section>
  );
}
