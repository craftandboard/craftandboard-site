import { createProposalAcceptanceReviewLogRecord } from "./repository.js";

export async function writeProposalAcceptanceReviewLog(
  input: Parameters<typeof createProposalAcceptanceReviewLogRecord>[0]
) {
  return createProposalAcceptanceReviewLogRecord(input);
}
