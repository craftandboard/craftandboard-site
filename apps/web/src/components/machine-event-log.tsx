import type { MachineEventRecord } from "../lib/api";
import { MachineEventStatusChip } from "./machine-event-status-chip";

export function MachineEventLog(props: { events: MachineEventRecord[]; title?: string }) {
  if (!props.events.length) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        No machine events have been recorded yet.
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      {props.title ? <h3 className="text-lg font-semibold text-white">{props.title}</h3> : null}
      <div className="mt-4 space-y-3">
        {props.events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{event.eventType}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(event.eventTs).toLocaleString()} · {event.sourceType}
                  {event.machine ? ` · ${event.machine.name} (${event.machine.code})` : ""}
                </p>
              </div>
              <MachineEventStatusChip status={event.processingStatus} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
              <p>Batch: {event.linkedBatch?.code ?? event.normalizedBatchRef ?? "Unmatched"}</p>
              <p>Job: {event.linkedManufacturingJob?.labelCode ?? event.normalizedJobRef ?? "Unmatched"}</p>
              <p>Part: {event.linkedPart?.scanCode ?? event.normalizedPartRef ?? "Unmatched"}</p>
              <p>Sheet: {event.sheetRef ?? "n/a"}</p>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-slate-300">
              {JSON.stringify(event.payloadJson, null, 2)}
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}
