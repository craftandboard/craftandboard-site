import { createProposalOrchestrationLogRecord } from "./repository.js";

export async function writeProposalOrchestrationLog(input: Parameters<typeof createProposalOrchestrationLogRecord>[0]) {
  return createProposalOrchestrationLogRecord(input);
}
