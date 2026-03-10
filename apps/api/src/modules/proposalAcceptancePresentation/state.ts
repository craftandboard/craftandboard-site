import { buildReviewState } from "../proposalAcceptanceReview/tokenView.js";
import type { PresentationStateValue, PublicAcceptancePresentationView } from "./contracts.js";

type PresentationBundle = {
  status: string;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  handedOffAt: Date | null;
  expiredAt: Date | null;
  revokedAt: Date | null;
  failedAt: Date | null;
  proposal: {
    status: string | null;
    acceptance: { status: string } | null;
    conversion: { status: string; projectId: string | null } | null;
    project: { id: string } | null;
  };
};

export function resolvePresentationState(input: {
  bundle: PresentationBundle;
  view: "state" | "instructions" | "ready" | "confirmation";
}): PublicAcceptancePresentationView {
  const review = buildReviewState({
    intakeStatus: input.bundle.status,
    proposalStatus: input.bundle.proposal.status,
    acceptanceStatus: input.bundle.proposal.acceptance?.status ?? null,
    conversionStatus: input.bundle.proposal.conversion?.status ?? null,
    hasProject: Boolean(input.bundle.proposal.project?.id ?? input.bundle.proposal.conversion?.projectId)
  });

  let state: PresentationStateValue;

  if (input.bundle.expiredAt || input.bundle.status === "EXPIRED") {
    state = "EXPIRED";
  } else if (!review.reviewAllowed || input.bundle.revokedAt || input.bundle.failedAt || input.bundle.status === "HANDOFF_REJECTED") {
    state = "BLOCKED";
  } else if (input.bundle.status === "HANDOFF_ACCEPTED" || input.bundle.proposal.acceptance?.status === "ACCEPTED") {
    state = "CONFIRMED";
  } else if (input.bundle.status === "VERIFIED" || input.bundle.status === "SUBMITTED" || input.bundle.submittedAt || input.bundle.verifiedAt) {
    state = "SUBMITTED";
  } else if (input.view === "instructions") {
    state = "INSTRUCTIONS_READY";
  } else if (input.view === "ready") {
    state = "READY_TO_CONFIRM";
  } else {
    state = "REVIEW_READY";
  }

  const nextActions =
    state === "REVIEW_READY"
      ? ["review", "continue_to_instructions"]
      : state === "INSTRUCTIONS_READY"
        ? ["review", "confirm"]
        : state === "READY_TO_CONFIRM"
          ? ["confirm"]
          : state === "CONFIRMED"
            ? ["done"]
            : [];

  return {
    state,
    reviewAllowed: review.reviewAllowed,
    blockedReasons: review.blockedReasons,
    nextActions,
    reviewCompleted: state !== "REVIEW_READY",
    submissionCompleted: ["SUBMITTED", "CONFIRMED"].includes(state),
    confirmationCompleted: state === "CONFIRMED"
  };
}
