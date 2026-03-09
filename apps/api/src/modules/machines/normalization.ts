import type { MachineEventSourceType, MachineEventType } from "./contracts.js";

export type NormalizedMachineEventInput = {
  eventType: MachineEventType;
  eventTs: Date;
  sourceType: MachineEventSourceType;
  sourceEventId?: string;
  payloadJson: unknown;
  normalizedBatchRef?: string;
  normalizedJobRef?: string;
  normalizedPartRef?: string;
  sheetRef?: string;
  severity?: string;
  notes?: string;
};

type RawMachineEventInput = {
  eventType: MachineEventType;
  eventTs?: string | Date;
  sourceType: MachineEventSourceType;
  sourceEventId?: string;
  payload?: unknown;
  batchRef?: string;
  jobRef?: string;
  partRef?: string;
  scanCode?: string;
  sheetRef?: string;
  severity?: string;
  notes?: string;
};

function normalizeRef(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeMachineEventInput(input: RawMachineEventInput): NormalizedMachineEventInput {
  const eventTs = input.eventTs ? new Date(input.eventTs) : new Date();

  if (Number.isNaN(eventTs.getTime())) {
    throw new Error("Machine event timestamp is invalid.");
  }

  return {
    eventType: input.eventType,
    eventTs,
    sourceType: input.sourceType,
    sourceEventId: normalizeRef(input.sourceEventId),
    payloadJson: input.payload ?? {},
    normalizedBatchRef: normalizeRef(input.batchRef),
    normalizedJobRef: normalizeRef(input.jobRef),
    normalizedPartRef: normalizeRef(input.scanCode) ?? normalizeRef(input.partRef),
    sheetRef: normalizeRef(input.sheetRef),
    severity: normalizeRef(input.severity),
    notes: normalizeRef(input.notes)
  };
}
