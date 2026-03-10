export function buildReviewState(input: {
  intakeStatus: string;
  proposalStatus: string | null;
  acceptanceStatus: string | null;
  conversionStatus: string | null;
  hasProject: boolean;
}) {
  const blockedReasons: string[] = [];
  const nextActions: string[] = [];

  if (["EXPIRED", "REVOKED", "FAILED", "HANDOFF_REJECTED"].includes(input.intakeStatus)) {
    blockedReasons.push("review_unavailable");
  }

  const proposalStatus = input.proposalStatus?.trim().toLowerCase() ?? "";
  if (["rejected", "archived"].includes(proposalStatus)) {
    blockedReasons.push("review_unavailable");
  }
  if (input.conversionStatus === "CONVERTED" || input.hasProject) {
    blockedReasons.push("already_converted");
  }

  const reviewAllowed = blockedReasons.length === 0;

  if (reviewAllowed && input.intakeStatus !== "HANDOFF_ACCEPTED" && input.acceptanceStatus !== "ACCEPTED") {
    nextActions.push("confirm_acceptance");
  }

  return {
    reviewAllowed,
    blockedReasons: [...new Set(blockedReasons)],
    nextActions
  };
}
