import { createHash } from "node:crypto";

export function buildMachineEventHashes(input: {
  organizationId: string;
  machineSourceId: string;
  externalEventId?: string;
  eventType: string;
  eventTimestamp: Date;
  batchRef?: string;
  partRef?: string;
  remnantRef?: string;
  programName?: string;
}) {
  const identity = [
    input.organizationId,
    input.machineSourceId,
    input.eventType,
    input.eventTimestamp.toISOString(),
    input.batchRef ?? "",
    input.partRef ?? "",
    input.remnantRef ?? "",
    input.programName ?? "",
    input.externalEventId ?? ""
  ].join("|");

  const eventHash = createHash("sha256").update(identity).digest("hex");
  const dedupeKey = input.externalEventId
    ? `${input.machineSourceId}:${input.externalEventId}:${input.eventType}`
    : eventHash;

  return {
    eventHash,
    dedupeKey
  };
}
