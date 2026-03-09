import Link from "next/link";
import type { MachineSummary } from "../lib/api";

export function MachineTable(props: { machines: MachineSummary[] }) {
  if (!props.machines.length) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        No machines registered yet. Add a CNC, edgebander, or scanner station to start capturing telemetry.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-slate-950/50 text-left text-xs uppercase tracking-[0.25em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Machine</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Adapter</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {props.machines.map((machine) => (
              <tr key={machine.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{machine.name}</p>
                  <p className="mt-1 font-mono text-xs text-emerald-200">{machine.code}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{machine.type}</td>
                <td className="px-4 py-3 text-slate-300">{machine.status}</td>
                <td className="px-4 py-3 text-slate-300">{machine.locationLabel ?? "Unassigned"}</td>
                <td className="px-4 py-3 text-slate-300">{machine.adapterType ?? "Generic"}</td>
                <td className="px-4 py-3 text-slate-300">{new Date(machine.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/machines/${machine.id}`}
                    className="rounded-full border border-emerald-300/25 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/60 hover:text-white"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
