import type { StageCandidateAction, StageCandidateTargetType } from "./contracts.js";

type LinkedMachineEventContext = {
  id: string;
  eventType: string;
  machine: {
    id: string;
    type: string;
  };
  linkedBatchId?: string | null;
  linkedManufacturingJobId?: string | null;
  linkedPartId?: string | null;
};

export type GeneratedCandidateDraft = {
  targetType: StageCandidateTargetType;
  targetBatchId?: string;
  targetManufacturingJobId?: string;
  targetPartId?: string;
  recommendedAction: StageCandidateAction;
  candidateStage: string;
  currentStage?: string;
  confidence: "HIGH";
  rationale: string;
};

export function deriveStageCandidateDrafts(
  event: LinkedMachineEventContext & {
    linkedBatch?: { status?: string | null } | null;
    linkedManufacturingJob?: { status?: string | null } | null;
    linkedPart?: { status?: string | null } | null;
  }
): GeneratedCandidateDraft[] {
  if (event.machine.type === "CNC" && event.eventType === "RUN_STARTED" && event.linkedBatchId) {
    return [
      {
        targetType: "BATCH",
        targetBatchId: event.linkedBatchId,
        recommendedAction: "MARK_BATCH_CUT_IN_PROGRESS",
        candidateStage: "CUTTING",
        currentStage: event.linkedBatch?.status ?? undefined,
        confidence: "HIGH",
        rationale: "Linked CNC RUN_STARTED event indicates the batch has likely entered cutting."
      }
    ];
  }

  if (event.machine.type === "CNC" && event.eventType === "RUN_COMPLETED" && event.linkedBatchId) {
    return [
      {
        targetType: "BATCH",
        targetBatchId: event.linkedBatchId,
        recommendedAction: "MARK_BATCH_CUT_COMPLETE",
        candidateStage: "CUT_COMPLETE",
        currentStage: event.linkedBatch?.status ?? undefined,
        confidence: "HIGH",
        rationale: "Linked CNC RUN_COMPLETED event indicates the batch cut is likely complete."
      }
    ];
  }

  if (
    event.machine.type === "CNC" &&
    event.linkedPartId &&
    (event.eventType === "PART_SCANNED" || event.eventType === "SHEET_COMPLETED")
  ) {
    return [
      {
        targetType: "PART",
        targetPartId: event.linkedPartId,
        recommendedAction: "MARK_PART_CUT",
        candidateStage: "CUT",
        currentStage: event.linkedPart?.status ?? undefined,
        confidence: "HIGH",
        rationale: "Linked CNC part event indicates the part is likely cut and ready for the next stage."
      }
    ];
  }

  if (event.machine.type === "EDGEBANDER" && event.eventType === "EDGEBAND_RUN_COMPLETED" && event.linkedPartId) {
    return [
      {
        targetType: "PART",
        targetPartId: event.linkedPartId,
        recommendedAction: "MARK_PART_EDGEBANDED",
        candidateStage: "EDGEBANDED",
        currentStage: event.linkedPart?.status ?? undefined,
        confidence: "HIGH",
        rationale: "Linked edgebander completion indicates the part is likely ready to leave edge banding."
      }
    ];
  }

  if (
    event.machine.type === "EDGEBANDER" &&
    event.eventType === "EDGEBAND_RUN_COMPLETED" &&
    event.linkedManufacturingJobId
  ) {
    return [
      {
        targetType: "MANUFACTURING_JOB",
        targetManufacturingJobId: event.linkedManufacturingJobId,
        recommendedAction: "MARK_JOB_EDGE_COMPLETE",
        candidateStage: "EDGE_COMPLETE",
        currentStage: event.linkedManufacturingJob?.status ?? undefined,
        confidence: "HIGH",
        rationale: "Linked edgebander completion indicates the manufacturing job may have completed edge banding."
      }
    ];
  }

  return [];
}
