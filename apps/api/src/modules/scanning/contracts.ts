export type ScanLookupResponse = {
  ok: true;
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  stationType: string;
  entity: Record<string, unknown>;
  allowedActions: Array<{
    actionType: string;
    nextStatus: string;
    source: "workflow_rule" | "default";
  }>;
  event: Record<string, unknown>;
};
