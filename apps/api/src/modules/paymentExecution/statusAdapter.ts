const EXECUTION_STATUSES = ["CREATED", "OPEN", "COMPLETED", "EXPIRED", "CANCELED", "FAILED"] as const;
const EVENT_PROCESSING_STATUSES = ["RECEIVED", "PROCESSED", "IGNORED", "FAILED"] as const;

export type KnownExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type KnownEventProcessingStatus = (typeof EVENT_PROCESSING_STATUSES)[number];

export function normalizeExecutionStatusInput(rawStatus: string) {
  return rawStatus.trim().toUpperCase().replace(/\s+/g, "_");
}

export function normalizeEventProcessingStatusInput(rawStatus: string) {
  return rawStatus.trim().toUpperCase().replace(/\s+/g, "_");
}

export function isKnownExecutionStatus(status: string): status is KnownExecutionStatus {
  return EXECUTION_STATUSES.includes(status as KnownExecutionStatus);
}

export function isKnownEventProcessingStatus(status: string): status is KnownEventProcessingStatus {
  return EVENT_PROCESSING_STATUSES.includes(status as KnownEventProcessingStatus);
}

export function canTransitionExecutionStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<KnownExecutionStatus, KnownExecutionStatus[]> = {
    CREATED: ["OPEN", "FAILED"],
    OPEN: ["COMPLETED", "EXPIRED", "CANCELED", "FAILED"],
    COMPLETED: [],
    EXPIRED: [],
    CANCELED: [],
    FAILED: []
  };

  return isKnownExecutionStatus(fromStatus) && isKnownExecutionStatus(toStatus) && transitions[fromStatus].includes(toStatus);
}

export function canTransitionEventProcessingStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return true;
  }

  const transitions: Record<KnownEventProcessingStatus, KnownEventProcessingStatus[]> = {
    RECEIVED: ["PROCESSED", "IGNORED", "FAILED"],
    PROCESSED: [],
    IGNORED: [],
    FAILED: []
  };

  return (
    isKnownEventProcessingStatus(fromStatus) &&
    isKnownEventProcessingStatus(toStatus) &&
    transitions[fromStatus].includes(toStatus)
  );
}
