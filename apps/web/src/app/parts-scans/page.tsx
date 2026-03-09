import { getCanonicalManufacturingParts, getScanEvents, getWorkflowStationRules } from "../../lib/api";

export default async function PartsScansPage() {
  const [partsPayload, scanEventsPayload, workflowRulesPayload] = await Promise.all([
    getCanonicalManufacturingParts(),
    getScanEvents(),
    getWorkflowStationRules()
  ]);

  const parts = partsPayload?.parts ?? [];
  const events = scanEventsPayload?.events ?? [];
  const rules = workflowRulesPayload?.rules ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Parts &amp; Scans</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Part labels, scan audit, and workflow rules</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Manufacturing parts are the canonical record for floor execution. This view
          exposes their current status together with scan history and station rules.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Recent Parts</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Part</th>
                  <th className="pb-3 pr-4">Material</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Packaging</th>
                </tr>
              </thead>
              <tbody>
                {parts.slice(0, 12).map((part) => (
                  <tr key={part.id} className="border-t border-white/5">
                    <td className="py-3 pr-4">{part.partNumber}</td>
                    <td className="py-3 pr-4">{part.materialType}</td>
                    <td className="py-3 pr-4">{part.status}</td>
                    <td className="py-3 pr-4">{part.requiresPackaging ? "Required" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Recent Scan Events</h3>
          <div className="mt-4 space-y-3">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                <p className="font-medium text-white">{event.scanValue ?? event.entityId ?? event.id}</p>
                <p className="mt-1 text-slate-300">
                  {event.stationType} · {event.actionType} · {event.result}
                </p>
                <p className="mt-1 text-slate-400">
                  {event.previousStatus ?? "Unknown"} → {event.nextStatus ?? "No change"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Workflow Rules</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Station</th>
                <th className="pb-3 pr-4">Entity</th>
                <th className="pb-3 pr-4">From</th>
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">To</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t border-white/5">
                  <td className="py-3 pr-4">{rule.stationType}</td>
                  <td className="py-3 pr-4">{rule.entityType}</td>
                  <td className="py-3 pr-4">{rule.fromStatus}</td>
                  <td className="py-3 pr-4">{rule.actionType}</td>
                  <td className="py-3 pr-4">{rule.toStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
