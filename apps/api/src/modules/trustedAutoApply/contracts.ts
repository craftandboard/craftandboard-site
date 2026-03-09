export const TRUSTED_AUTO_APPLY_ACTIONS = [
  "MARK_PART_CUT",
  "MARK_PART_EDGEBANDED",
  "MARK_BATCH_CUT_IN_PROGRESS",
  "MARK_BATCH_CUT_COMPLETE"
] as const;

export type TrustedAutoApplyAction = (typeof TRUSTED_AUTO_APPLY_ACTIONS)[number];
