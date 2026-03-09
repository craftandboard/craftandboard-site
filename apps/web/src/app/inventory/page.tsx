import Link from "next/link";
import {
  getActiveContainerSessions,
  getManagedContainers,
  getRemnants
} from "../../lib/api";

export default async function InventoryPage() {
  const [containersPayload, sessionsPayload, remnantsPayload] = await Promise.all([
    getManagedContainers(),
    getActiveContainerSessions(),
    getRemnants()
  ]);

  const containers = containersPayload?.containers ?? [];
  const sessions = sessionsPayload?.sessions ?? [];
  const remnants = remnantsPayload?.remnants ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Inventory & Physical Flow</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Containers, sessions, and remnant inventory</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This page combines the physical sorting units and remnant inventory the shop uses
          daily, without forcing operators to jump across separate tool pages.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Containers</h3>
            <span className="text-sm text-slate-400">{containers.length} tracked</span>
          </div>
          <div className="mt-4 space-y-3">
            {containers.map((container) => (
              <div key={container.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                <p className="font-medium text-white">{container.displayName}</p>
                <p className="mt-1 text-slate-300">
                  {container.containerCode} · {container.status} · {container.activePartCount} active parts
                </p>
                <p className="mt-1 text-slate-400">
                  {container.currentLocationName ?? container.currentLocationCode ?? "No location set"}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Active Container Sessions</h3>
            <Link href="/parts-scans" className="text-sm text-emerald-300">
              Open scans
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-300">No active sorting sessions.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                  <p className="font-medium text-white">
                    {session.container?.displayName ?? session.container?.containerCode ?? session.containerId}
                  </p>
                  <p className="mt-1 text-slate-300">
                    {session.stationType ?? "Unassigned station"} · {new Date(session.startedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Remnants</h3>
          <Link href="/remnants" className="text-sm text-emerald-300">
            Open remnant catalog
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 pr-4">Material</th>
                <th className="pb-3 pr-4">Dimensions</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Location</th>
              </tr>
            </thead>
            <tbody>
              {remnants.slice(0, 12).map((remnant) => (
                <tr key={remnant.id} className="border-t border-white/5">
                  <td className="py-3 pr-4">{remnant.code}</td>
                  <td className="py-3 pr-4">{remnant.materialCode}</td>
                  <td className="py-3 pr-4">
                    {remnant.lengthIn}&quot; × {remnant.widthIn}&quot; × {remnant.thicknessIn}&quot;
                  </td>
                  <td className="py-3 pr-4">{remnant.status}</td>
                  <td className="py-3 pr-4">{remnant.locationLabel ?? "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
