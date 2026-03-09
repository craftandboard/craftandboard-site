import { MachineCreateForm } from "../../components/machine-create-form";
import { MachineEventLog } from "../../components/machine-event-log";
import { MachineSummaryCards } from "../../components/machine-summary-cards";
import { MachineTable } from "../../components/machine-table";
import { getMachineEvents, getMachineStageCandidates, getMachines } from "../../lib/api";

export default async function MachinesPage() {
  const [registry, recentEvents, candidates] = await Promise.all([
    getMachines(),
    getMachineEvents(),
    getMachineStageCandidates()
  ]);

  if (!registry) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Machine registry is unavailable right now. Confirm the API is running and you are signed in.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Machine Telemetry Prep</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Register machines and inspect diagnostic event flow</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This layer stores raw machine events, normalizes them, and safely links them to batch, job, or part context
          without mutating production states automatically.
        </p>
      </section>

      <MachineSummaryCards summary={registry.summary} />
      <MachineCreateForm />
      <MachineTable machines={registry.machines} />
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Machine Stage Candidates</h3>
          <p className="text-sm text-slate-400">{(candidates?.candidates ?? []).length} open</p>
        </div>
        <div className="mt-4 space-y-3">
          {(candidates?.candidates ?? []).slice(0, 6).map((candidate) => (
            <div key={candidate.id} className="rounded-2xl border border-white/10 p-4 text-sm">
              <p className="font-medium text-white">{candidate.suggestedAction}</p>
              <p className="mt-1 text-slate-300">
                {candidate.machineName ?? candidate.machineCode ?? "Unknown machine"} · {candidate.status}
              </p>
            </div>
          ))}
        </div>
      </section>
      <MachineEventLog events={recentEvents?.events ?? []} title="Recent Org Events" />
    </div>
  );
}
