export type PresentationStateValue =
  | "REVIEW_READY"
  | "INSTRUCTIONS_READY"
  | "READY_TO_CONFIRM"
  | "SUBMITTED"
  | "CONFIRMED"
  | "BLOCKED"
  | "EXPIRED";

export type PublicAcceptancePresentationView = {
  state: PresentationStateValue;
  reviewAllowed: boolean;
  blockedReasons: string[];
  nextActions: string[];
  reviewCompleted: boolean;
  submissionCompleted: boolean;
  confirmationCompleted: boolean;
};

export type PublicAcceptanceInstructionsView = {
  state: PresentationStateValue;
  reviewAllowed: boolean;
  instructions: Array<{
    key: string;
    label: string;
    detail: string;
  }>;
  nextActions: string[];
  blockedReasons: string[];
};

export type PublicAcceptanceConfirmationView = {
  state: PresentationStateValue;
  submissionCompleted: boolean;
  confirmationSummary: {
    headline: string;
    detail: string;
    submittedAt: string | null;
    confirmedAt: string | null;
  } | null;
  nextActions: string[];
  blockedReasons: string[];
};

export type ProposalAcceptancePresentationLogView = {
  id: string;
  orgId: string;
  proposalId: string;
  intakeId: string;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: string;
};
