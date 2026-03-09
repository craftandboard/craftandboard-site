type StationType = "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
type ActionType = "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";

export type WorkflowRuleView = {
  stationType: StationType;
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
  fromStatus: string;
  actionType: ActionType;
  toStatus: string;
  source: "workflow_rule" | "default";
};

export const DEFAULT_PART_WORKFLOW_RULES: WorkflowRuleView[] = [
  { stationType: "CUT", entityType: "MANUFACTURING_PART", fromStatus: "READY_FOR_BATCH", actionType: "CHECK_IN", toStatus: "CUT_IN_PROGRESS", source: "default" },
  { stationType: "CUT", entityType: "MANUFACTURING_PART", fromStatus: "BATCHED", actionType: "CHECK_IN", toStatus: "CUT_IN_PROGRESS", source: "default" },
  { stationType: "CUT", entityType: "MANUFACTURING_PART", fromStatus: "CUT_PENDING", actionType: "CHECK_IN", toStatus: "CUT_IN_PROGRESS", source: "default" },
  { stationType: "CUT", entityType: "MANUFACTURING_PART", fromStatus: "CUT_IN_PROGRESS", actionType: "MARK_STAGE_COMPLETE", toStatus: "CUT_COMPLETE", source: "default" },
  { stationType: "EDGEBAND", entityType: "MANUFACTURING_PART", fromStatus: "CUT_COMPLETE", actionType: "CHECK_IN", toStatus: "EDGEBAND_IN_PROGRESS", source: "default" },
  { stationType: "EDGEBAND", entityType: "MANUFACTURING_PART", fromStatus: "EDGEBAND_PENDING", actionType: "CHECK_IN", toStatus: "EDGEBAND_IN_PROGRESS", source: "default" },
  { stationType: "EDGEBAND", entityType: "MANUFACTURING_PART", fromStatus: "EDGEBAND_IN_PROGRESS", actionType: "MARK_STAGE_COMPLETE", toStatus: "EDGEBAND_COMPLETE", source: "default" },
  { stationType: "PACKAGING", entityType: "MANUFACTURING_PART", fromStatus: "EDGEBAND_COMPLETE", actionType: "CHECK_IN", toStatus: "PACKAGING_IN_PROGRESS", source: "default" },
  { stationType: "PACKAGING", entityType: "MANUFACTURING_PART", fromStatus: "PACKAGING_PENDING", actionType: "CHECK_IN", toStatus: "PACKAGING_IN_PROGRESS", source: "default" },
  { stationType: "PACKAGING", entityType: "MANUFACTURING_PART", fromStatus: "PACKAGING_IN_PROGRESS", actionType: "MARK_STAGE_COMPLETE", toStatus: "PACKAGED", source: "default" }
];

export function resolveWorkflowRule(input: {
  stationType: StationType;
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
  fromStatus: string;
  actionType: ActionType;
  configuredRules: Array<{
    stationType: StationType;
    entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
    fromStatus: string;
    actionType: ActionType;
    toStatus: string;
    isActive: boolean;
  }>;
}) {
  const configuredRule = input.configuredRules.find(
    (rule) =>
      rule.isActive &&
      rule.stationType === input.stationType &&
      rule.entityType === input.entityType &&
      rule.fromStatus === input.fromStatus &&
      rule.actionType === input.actionType
  );

  if (configuredRule) {
    return { ...configuredRule, source: "workflow_rule" as const };
  }

  return (
    DEFAULT_PART_WORKFLOW_RULES.find(
      (rule) =>
        rule.stationType === input.stationType &&
        rule.entityType === input.entityType &&
        rule.fromStatus === input.fromStatus &&
        rule.actionType === input.actionType
    ) ?? null
  );
}

export function listAllowedActionsForStation(input: {
  stationType: StationType;
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
  fromStatus: string;
  configuredRules: Array<{
    stationType: StationType;
    entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
    fromStatus: string;
    actionType: ActionType;
    toStatus: string;
    isActive: boolean;
  }>;
}) {
  const configuredMatches = input.configuredRules
    .filter(
      (rule) =>
        rule.isActive &&
        rule.stationType === input.stationType &&
        rule.entityType === input.entityType &&
        rule.fromStatus === input.fromStatus
    )
    .map((rule) => ({ ...rule, source: "workflow_rule" as const }));

  if (configuredMatches.length > 0) {
    return configuredMatches;
  }

  return DEFAULT_PART_WORKFLOW_RULES.filter(
    (rule) =>
      rule.stationType === input.stationType &&
      rule.entityType === input.entityType &&
      rule.fromStatus === input.fromStatus
  );
}
