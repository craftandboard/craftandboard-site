import { StageSignalSummaryCards } from "../../components/stage-signal-summary-cards";
import { StageSignalTable } from "../../components/stage-signal-table";
import { getStageSignals } from "../../lib/api";

export default async function StageSignalsPage(props: {
  searchParams?: Promise<{
    status?: "OPEN" | "APPLIED" | "REJECTED" | "SUPERSEDED";
    targetType?: "PART" | "BATCH" | "MANUFACTURING_JOB";
    machineId?: string;
    batchId?: string;
    recommendedAction?:
      | "MARK_PART_CUT"
      | "MARK_PART_EDGEBANDED"
      | "MARK_BATCH_CUT_IN_PROGRESS"
      | "MARK_BATCH_CUT_COMPLETE"
      | "MARK_JOB_EDGE_IN_PROGRESS"
      | "MARK_JOB_EDGE_COMPLETE";
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const payload = await getStageSignals(searchParams);

  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Stage candidate signals are unavailable right now. Confirm the API is running and you are signed in.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Auto Stage Candidate Signals</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Review machine-driven stage suggestions before applying them</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Linked machine events can suggest cut or edge-band stage updates. They stay advisory until a user applies or rejects them.
        </p>
      </section>

      <StageSignalSummaryCards summary={payload.summary} />

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
          <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white">
            <option value="">All statuses</option>
            {["OPEN", "APPLIED", "REJECTED", "SUPERSEDED"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select name="targetType" defaultValue={searchParams.targetType ?? ""} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white">
            <option value="">All targets</option>
            {["PART", "BATCH", "MANUFACTURING_JOB"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input name="machineId" defaultValue={searchParams.machineId ?? ""} placeholder="Machine id" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white" />
          <input name="batchId" defaultValue={searchParams.batchId ?? ""} placeholder="Batch id" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white" />
          <button type="submit" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white">
            Apply Filters
          </button>
        </form>
      </section>

      <StageSignalTable candidates={payload.candidates} />
    </div>
  );
}
