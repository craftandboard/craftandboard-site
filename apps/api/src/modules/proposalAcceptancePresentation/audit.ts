import { createProposalAcceptancePresentationLogRecord } from "./repository.js";

export async function writeProposalAcceptancePresentationLog(
  input: Parameters<typeof createProposalAcceptancePresentationLogRecord>[0]
) {
  return createProposalAcceptancePresentationLogRecord(input);
}
