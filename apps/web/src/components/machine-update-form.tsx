"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { updateMachine, type MachineSummary } from "../lib/api";

const MACHINE_STATUSES = ["ACTIVE", "INACTIVE", "HOLD", "MAINTENANCE"] as const;

export function MachineUpdateForm(props: { machine: MachineSummary }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      await updateMachine(props.machine.id, {
        name: String(formData.get("name") ?? props.machine.name),
        status: String(formData.get("status") ?? props.machine.status) as (typeof MACHINE_STATUSES)[number],
        locationLabel: String(formData.get("locationLabel") ?? "").trim() || undefined,
        adapterType: String(formData.get("adapterType") ?? "").trim() || undefined,
        notes: String(formData.get("notes") ?? "").trim() || undefined
      });
      setMessage("Machine updated. Refresh to load the latest detail.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Machine update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Update Machine</h3>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          name="name"
          defaultValue={props.machine.name}
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <select
          name="status"
          defaultValue={props.machine.status}
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        >
          {MACHINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="locationLabel"
          defaultValue={props.machine.locationLabel ?? ""}
          placeholder="Location"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <input
          name="adapterType"
          defaultValue={props.machine.adapterType ?? ""}
          placeholder="Adapter type"
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <textarea
          name="notes"
          defaultValue={props.machine.notes ?? ""}
          rows={3}
          placeholder="Notes"
          className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/60 hover:text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Machine"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
    </section>
  );
}
