import { MachineEventLog } from "../../../components/machine-event-log";
import { MachineUpdateForm } from "../../../components/machine-update-form";
import { SimulateMachineEventForm } from "../../../components/simulate-machine-event-form";
import { getMachineDetail } from "../../../lib/api";

export default async function MachineDetailPage(props: { params: Promise<{ machineId: string }> }) {
  const params = await props.params;
  const payload = await getMachineDetail(params.machineId);

  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Machine detail is unavailable right now. Confirm the API is running and that the machine exists in your current
        organization.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{payload.machine.type}</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{payload.machine.name}</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
          <p>Code: <span className="font-mono text-emerald-200">{payload.machine.code}</span></p>
          <p>Status: {payload.machine.status}</p>
          <p>Location: {payload.machine.locationLabel ?? "Unassigned"}</p>
          <p>Adapter: {payload.machine.adapterType ?? "Generic"}</p>
        </div>
      </section>

      <MachineUpdateForm machine={payload.machine} />
      <SimulateMachineEventForm machineId={payload.machine.id} machineCode={payload.machine.code} />
      <MachineEventLog events={payload.recentEvents} title="Recent Events" />
    </div>
  );
}
