export const MACHINE_SOURCE_TYPES = ["WEBHOOK", "POLL_IMPORT", "MANUAL_UPLOAD", "LOCAL_AGENT", "PLC_BRIDGE"] as const;
export const MACHINE_INGEST_TYPES = ["SINGLE_EVENT", "EVENT_BATCH", "FILE_IMPORT"] as const;
export const MACHINE_INGEST_RUN_STATUSES = ["RECEIVED", "PROCESSED", "PARTIAL", "FAILED"] as const;
export const MACHINE_TELEMETRY_EVENT_TYPES = [
  "PROGRAM_STARTED",
  "PROGRAM_COMPLETED",
  "SHEET_LOADED",
  "SHEET_UNLOADED",
  "PART_CUT",
  "JOB_STARTED",
  "JOB_COMPLETED",
  "ERROR_RAISED",
  "HEARTBEAT",
  "UNKNOWN",
  "RUN_STARTED",
  "RUN_COMPLETED",
  "SHEET_STARTED",
  "SHEET_COMPLETED",
  "PART_SCANNED",
  "EDGEBAND_RUN_STARTED",
  "EDGEBAND_RUN_COMPLETED",
  "MACHINE_HEARTBEAT",
  "FAULT",
  "STOPPED"
] as const;
export const MACHINE_TELEMETRY_PROCESSING_STATUSES = [
  "RECEIVED",
  "RAW",
  "PARSED",
  "NORMALIZED",
  "LINKED",
  "SIGNAL_EMITTED",
  "UNMATCHED",
  "DUPLICATE",
  "FAILED",
  "ERROR"
] as const;
export const MACHINE_TELEMETRY_ENTITY_TYPES = ["MANUFACTURING_BATCH", "MANUFACTURING_PART", "REMNANT", "MACHINE_SOURCE", "UNKNOWN"] as const;
export const MACHINE_EVENT_LINK_CONFIDENCE = ["HIGH", "MEDIUM", "LOW"] as const;
export const MACHINE_EVENT_LINK_METHODS = [
  "EXTERNAL_ID_MATCH",
  "PART_NUMBER_MATCH",
  "BATCH_NUMBER_MATCH",
  "PROGRAM_NAME_MATCH",
  "REMNANT_CODE_MATCH",
  "MANUAL",
  "HEURISTIC"
] as const;
export const MACHINE_STAGE_CANDIDATE_STATUSES = ["NEW", "REVIEWED", "APPLIED", "REJECTED"] as const;

export type MachineSourceType = (typeof MACHINE_SOURCE_TYPES)[number];
export type MachineIngestType = (typeof MACHINE_INGEST_TYPES)[number];
export type MachineIngestRunStatus = (typeof MACHINE_INGEST_RUN_STATUSES)[number];
export type MachineTelemetryEventType = (typeof MACHINE_TELEMETRY_EVENT_TYPES)[number];
export type MachineTelemetryProcessingStatus = (typeof MACHINE_TELEMETRY_PROCESSING_STATUSES)[number];
export type MachineTelemetryEntityType = (typeof MACHINE_TELEMETRY_ENTITY_TYPES)[number];
export type MachineEventLinkConfidence = (typeof MACHINE_EVENT_LINK_CONFIDENCE)[number];
export type MachineEventLinkMethod = (typeof MACHINE_EVENT_LINK_METHODS)[number];
export type MachineStageCandidateStatus = (typeof MACHINE_STAGE_CANDIDATE_STATUSES)[number];
