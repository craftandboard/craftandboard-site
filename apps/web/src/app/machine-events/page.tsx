import { MachineEventLog } from "../../components/machine-event-log";
import { getMachineEvents } from "../../lib/api";

export default async function MachineEventsPage(props: {
  searchParams?: Promise<{
    machineId?: string;
    eventType?: string;
    processingStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const payload = await getMachineEvents(searchParams);

  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Machine events are unavailable right now. Confirm the API is running and you are signed in.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Machine Event Ledger</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Recent normalized telemetry events</h2>
      </section>
      <MachineEventLog events={payload.events} />
    </div>
  );
}
