import type { PublicAcceptanceConfirmationView } from "./contracts.js";

export function buildPublicConfirmation(input: {
  state: PublicAcceptanceConfirmationView["state"];
  blockedReasons: string[];
  submissionCompleted: boolean;
  confirmationCompleted: boolean;
  submittedAt: Date | null;
  confirmedAt: Date | null;
}): PublicAcceptanceConfirmationView {
  if (input.state === "BLOCKED" || input.state === "EXPIRED") {
    return {
      state: input.state,
      submissionCompleted: false,
      confirmationSummary: null,
      nextActions: [],
      blockedReasons: input.blockedReasons
    };
  }

  if (input.confirmationCompleted) {
    return {
      state: input.state,
      submissionCompleted: true,
      confirmationSummary: {
        headline: "Confirmation received",
        detail: "Your acceptance was received and recorded successfully.",
        submittedAt: input.submittedAt ? input.submittedAt.toISOString() : null,
        confirmedAt: input.confirmedAt ? input.confirmedAt.toISOString() : null
      },
      nextActions: ["done"],
      blockedReasons: []
    };
  }

  if (input.submissionCompleted) {
    return {
      state: input.state,
      submissionCompleted: true,
      confirmationSummary: {
        headline: "Submission received",
        detail: "Your confirmation was received and is being processed.",
        submittedAt: input.submittedAt ? input.submittedAt.toISOString() : null,
        confirmedAt: null
      },
      nextActions: [],
      blockedReasons: []
    };
  }

  return {
    state: input.state,
    submissionCompleted: false,
    confirmationSummary: null,
    nextActions: ["confirm"],
    blockedReasons: []
  };
}
