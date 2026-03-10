import type { PublicAcceptanceInstructionsView } from "./contracts.js";

export function buildSignerInstructions(input: {
  state: PublicAcceptanceInstructionsView["state"];
  reviewAllowed: boolean;
  blockedReasons: string[];
  nextActions: string[];
  depositRequired: boolean;
  depositOutstandingAmountCents: number;
  note?: string | null;
}): PublicAcceptanceInstructionsView {
  if (!input.reviewAllowed) {
    return {
      state: input.state,
      reviewAllowed: false,
      instructions: [],
      nextActions: [],
      blockedReasons: input.blockedReasons
    };
  }

  const instructions = [
    {
      key: "review",
      label: "Review",
      detail: "Review the proposal summary and pricing details before confirming acceptance."
    },
    {
      key: "confirm",
      label: "Confirm",
      detail: "Submitting confirmation sends your acceptance through the platform’s acceptance workflow."
    }
  ];

  if (input.depositRequired) {
    instructions.push({
      key: "deposit",
      label: "Deposit",
      detail:
        input.depositOutstandingAmountCents > 0
          ? `A deposit is required before conversion. Remaining deposit due: ${input.depositOutstandingAmountCents} cents.`
          : "A deposit requirement is already satisfied."
    });
  }

  if (input.note?.trim()) {
    instructions.push({
      key: "note",
      label: "Additional note",
      detail: input.note.trim()
    });
  }

  return {
    state: input.state,
    reviewAllowed: true,
    instructions,
    nextActions: input.nextActions,
    blockedReasons: []
  };
}
