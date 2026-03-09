import type { StageCandidateSignalRecord } from "../lib/api";
import { ApplyStageSignalButton } from "./apply-stage-signal-button";
import { RejectStageSignalButton } from "./reject-stage-signal-button";
import { StageSignalStatusChip } from "./stage-signal-status-chip";

export function StageSignalTable(props: { candidates: StageCandidateSignalRecord[] }) {
  if (!props.candidates.length) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        No stage candidate signals match the current filters.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {props.candidates.map((candidate) => (
        <article key={candidate.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{candidate.recommendedAction}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{candidate.targetType} {"->"} {candidate.candidateStage}</h3>
              <p className="mt-2 text-sm text-slate-300">{candidate.rationale}</p>
            </div>
            <StageSignalStatusChip status={candidate.status} />
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
            <p>Machine: {candidate.sourceMachine ? `${candidate.sourceMachine.name} (${candidate.sourceMachine.code})` : "Unlinked"}</p>
            <p>Event: {candidate.sourceMachineEvent?.eventType ?? "Unknown"}</p>
            <p>Current stage: {candidate.currentStage ?? "Unknown"}</p>
            <p>Confidence: {candidate.confidence}</p>
            <p>Applied mode: {candidate.appliedMode ?? "PENDING_REVIEW"}</p>
            <p>Batch: {candidate.targetBatch?.code ?? "n/a"}</p>
            <p>Job: {candidate.targetManufacturingJob?.labelCode ?? "n/a"}</p>
            <p>Part: {candidate.targetPart?.scanCode ?? "n/a"}</p>
            <p>Created: {new Date(candidate.createdAt).toLocaleString()}</p>
            <p>Auto rule: {candidate.autoAppliedByRule ? candidate.autoAppliedByRule.id : "n/a"}</p>
            <p>Auto applied: {candidate.autoAppliedAt ? new Date(candidate.autoAppliedAt).toLocaleString() : "n/a"}</p>
          </div>

          {candidate.autoApplyRationale ? (
            <p className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100">
              {candidate.autoApplyRationale}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <ApplyStageSignalButton candidateId={candidate.id} disabled={!candidate.canApply || candidate.status !== "OPEN"} />
            <RejectStageSignalButton candidateId={candidate.id} disabled={candidate.status !== "OPEN"} />
          </div>
        </article>
      ))}
    </section>
  );
}
