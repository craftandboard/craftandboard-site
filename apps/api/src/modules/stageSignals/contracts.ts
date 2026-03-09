export const STAGE_CANDIDATE_TARGET_TYPES = ["PART", "BATCH", "MANUFACTURING_JOB"] as const;
export const STAGE_CANDIDATE_STATUSES = ["OPEN", "APPLIED", "REJECTED", "SUPERSEDED"] as const;
export const STAGE_CANDIDATE_ACTIONS = [
  "MARK_PART_CUT",
  "MARK_PART_EDGEBANDED",
  "MARK_BATCH_CUT_IN_PROGRESS",
  "MARK_BATCH_CUT_COMPLETE",
  "MARK_JOB_EDGE_IN_PROGRESS",
  "MARK_JOB_EDGE_COMPLETE"
] as const;
export const STAGE_CANDIDATE_CONFIDENCE = ["HIGH", "MEDIUM"] as const;

export type StageCandidateTargetType = (typeof STAGE_CANDIDATE_TARGET_TYPES)[number];
export type StageCandidateStatus = (typeof STAGE_CANDIDATE_STATUSES)[number];
export type StageCandidateAction = (typeof STAGE_CANDIDATE_ACTIONS)[number];
export type StageCandidateConfidence = (typeof STAGE_CANDIDATE_CONFIDENCE)[number];
