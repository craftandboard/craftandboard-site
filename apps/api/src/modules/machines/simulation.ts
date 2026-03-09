import { ingestMachineEvent } from "./service.js";
import type { MachineEventSourceType, MachineEventType } from "./contracts.js";

export async function simulateMachineEvent(
  input: {
    machineId?: string;
    machineCode?: string;
    eventType: MachineEventType;
    eventTs?: string;
    payload?: unknown;
    batchRef?: string;
    jobRef?: string;
    partRef?: string;
    scanCode?: string;
    sheetRef?: string;
    severity?: string;
    sourceEventId?: string;
    notes?: string;
  },
  organizationId: string
) {
  return ingestMachineEvent(
    {
      ...input,
      sourceType: "MANUAL_SIMULATION" satisfies MachineEventSourceType
    },
    organizationId
  );
}
