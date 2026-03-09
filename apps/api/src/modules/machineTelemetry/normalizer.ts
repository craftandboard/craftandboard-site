import type { MachineEventSourceType } from "../machines/contracts.js";
import type { MachineTelemetryEventType } from "./contracts.js";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function stripPrefix(value: string | undefined, prefix: string) {
  if (!value) {
    return undefined;
  }
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function normalizeTimestamp(value?: string | Date) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Machine event timestamp is invalid.");
  }
  return parsed;
}

function normalizeEventType(value: MachineTelemetryEventType): MachineTelemetryEventType {
  const map: Record<string, MachineTelemetryEventType> = {
    RUN_STARTED: "PROGRAM_STARTED",
    RUN_COMPLETED: "PROGRAM_COMPLETED",
    SHEET_STARTED: "SHEET_LOADED",
    SHEET_COMPLETED: "SHEET_UNLOADED",
    PART_SCANNED: "PART_CUT",
    EDGEBAND_RUN_STARTED: "JOB_STARTED",
    EDGEBAND_RUN_COMPLETED: "JOB_COMPLETED",
    MACHINE_HEARTBEAT: "HEARTBEAT",
    FAULT: "ERROR_RAISED",
    STOPPED: "UNKNOWN"
  };

  return map[value] ?? value;
}

export function normalizeTelemetryPayload(input: {
  eventType: MachineTelemetryEventType;
  eventTimestamp?: string | Date;
  sourceType: MachineEventSourceType;
  externalEventId?: string;
  payload?: unknown;
  batchRef?: string;
  jobRef?: string;
  partRef?: string;
  remnantCode?: string;
  sheetRef?: string;
  severity?: string;
  notes?: string;
}) {
  const payload = asRecord(input.payload);
  const batchNumber = asString(input.batchRef) ?? asString(payload.batchNumber) ?? asString(payload.batchCode) ?? asString(payload.batchId);
  const jobRef = asString(input.jobRef) ?? asString(payload.jobRef) ?? asString(payload.jobId) ?? asString(payload.jobCode);
  const partRef =
    stripPrefix(asString(input.partRef), "PART:") ??
    stripPrefix(asString(payload.partNumber), "PART:") ??
    stripPrefix(asString(payload.scanValue), "PART:") ??
    stripPrefix(asString(payload.partRef), "PART:");
  const remnantCode =
    stripPrefix(asString(input.remnantCode), "REMNANT:") ??
    stripPrefix(asString(payload.remnantCode), "REMNANT:") ??
    stripPrefix(asString(payload.scanValue), "REMNANT:");
  const programName = asString(payload.programName) ?? asString(payload.program) ?? asString(payload.jobName);

  return {
    eventType: normalizeEventType(input.eventType),
    eventTimestamp: normalizeTimestamp(input.eventTimestamp),
    sourceType: input.sourceType,
    externalEventId: asString(input.externalEventId),
    rawPayloadJson: payload,
    normalizedPayloadJson: {
      batchNumber,
      jobRef,
      partNumber: partRef,
      remnantCode,
      sheetRef: asString(input.sheetRef) ?? asString(payload.sheetRef),
      programName,
      operator: asString(payload.operator),
      machineState: asString(payload.machineState),
      severity: asString(input.severity) ?? asString(payload.severity)
    },
    normalizedBatchRef: batchNumber,
    normalizedJobRef: jobRef,
    normalizedPartRef: partRef,
    normalizedRemnantRef: remnantCode,
    sheetRef: asString(input.sheetRef) ?? asString(payload.sheetRef),
    programName,
    operatorName: asString(payload.operator),
    machineState: asString(payload.machineState),
    severity: asString(input.severity) ?? asString(payload.severity),
    notes: asString(input.notes) ?? asString(payload.notes)
  };
}
