export const MACHINE_TYPES = [
  "CNC",
  "EDGEBANDER",
  "LABEL_PRINTER",
  "SCANNER_STATION",
  "OTHER"
] as const;

export const MACHINE_STATUSES = ["ACTIVE", "INACTIVE", "HOLD", "MAINTENANCE"] as const;

export const MACHINE_EVENT_SOURCE_TYPES = [
  "MANUAL_SIMULATION",
  "API",
  "FILE_IMPORT",
  "PLC_BRIDGE",
  "WEBHOOK",
  "OTHER"
] as const;

export const MACHINE_EVENT_PROCESSING_STATUSES = [
  "RECEIVED",
  "PARSED",
  "LINKED",
  "UNMATCHED",
  "ERROR"
] as const;

export const MACHINE_EVENT_TYPES = [
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

export type MachineType = (typeof MACHINE_TYPES)[number];
export type MachineStatus = (typeof MACHINE_STATUSES)[number];
export type MachineEventSourceType = (typeof MACHINE_EVENT_SOURCE_TYPES)[number];
export type MachineEventProcessingStatus = (typeof MACHINE_EVENT_PROCESSING_STATUSES)[number];
export type MachineEventType = (typeof MACHINE_EVENT_TYPES)[number];
