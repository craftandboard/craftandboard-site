import { createProposalAcceptanceIntakeLogRecord } from "./repository.js";

export async function writeProposalAcceptanceIntakeLog(
  input: Parameters<typeof createProposalAcceptanceIntakeLogRecord>[0]
) {
  return createProposalAcceptanceIntakeLogRecord(input);
}
