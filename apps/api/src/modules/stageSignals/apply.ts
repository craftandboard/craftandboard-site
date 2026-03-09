import { transitionBatchStatus } from "../batches/service.js";
import { transitionPartStatusById } from "../parts/service.js";
import type { StageCandidateAction } from "./contracts.js";

export async function applyStageCandidateAction(input: {
  organizationId: string;
  action: StageCandidateAction;
  targetBatchId?: string | null;
  targetPartId?: string | null;
  targetManufacturingJobId?: string | null;
}) {
  switch (input.action) {
    case "MARK_PART_CUT":
      if (!input.targetPartId) {
        throw new Error("Candidate signal target part is missing.");
      }
      return transitionPartStatusById(input.targetPartId, "cut", input.organizationId);
    case "MARK_PART_EDGEBANDED":
      if (!input.targetPartId) {
        throw new Error("Candidate signal target part is missing.");
      }
      return transitionPartStatusById(input.targetPartId, "edgebanded", input.organizationId);
    case "MARK_BATCH_CUT_IN_PROGRESS":
      if (!input.targetBatchId) {
        throw new Error("Candidate signal target batch is missing.");
      }
      return transitionBatchStatus(input.targetBatchId, "cutting", input.organizationId);
    case "MARK_BATCH_CUT_COMPLETE":
      if (!input.targetBatchId) {
        throw new Error("Candidate signal target batch is missing.");
      }
      return transitionBatchStatus(input.targetBatchId, "cut_complete", input.organizationId);
    case "MARK_JOB_EDGE_IN_PROGRESS":
    case "MARK_JOB_EDGE_COMPLETE":
      throw new Error("Applying job-level edge-band candidate signals is not supported yet.");
  }
}
