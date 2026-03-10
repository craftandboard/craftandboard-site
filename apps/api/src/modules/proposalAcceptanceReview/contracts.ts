export type PublicProposalSnapshot = {
  organizationName: string | null;
  title: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    title: string;
    lines: Array<{
      name: string;
      description: string | null;
      qty: number;
      unit: string | null;
      priceCents: number;
    }>;
  }>;
  unsectionedLines: Array<{
    name: string;
    description: string | null;
    qty: number;
    unit: string | null;
    priceCents: number;
  }>;
  totals: {
    totalAmountCents: number;
    currency: string;
  };
  depositSummary: {
    policy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
    requestedAmountCents: number;
    paidAmountCents: number;
    outstandingAmountCents: number;
    depositRequestedAmountCents: number;
    depositPaidAmountCents: number;
    hasOpenDepositRequest: boolean;
  };
};

export type PublicProposalReviewView = {
  reviewAllowed: boolean;
  intakeStatus: string;
  blockedReasons: string[];
  nextActions: string[];
  proposal: PublicProposalSnapshot | null;
  instructions: string | null;
};

export type ProposalAcceptanceReviewLogView = {
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
