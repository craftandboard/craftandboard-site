export type DepositRequestView = {
  id: string;
  orgId: string;
  proposalId: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string | null;
  requestedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  externalReference: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
  paidAmountCents: number;
  outstandingAmountCents: number;
};

export type PaymentView = {
  id: string;
  orgId: string;
  proposalId: string;
  depositRequestId: string | null;
  status: string;
  method: string;
  amountCents: number;
  currency: string;
  direction: string;
  receivedAt: string | null;
  externalReference: string | null;
  provider: string | null;
  note: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalPaymentSummaryView = {
  requestedAmountCents: number;
  paidAmountCents: number;
  outstandingAmountCents: number;
  depositRequestedAmountCents: number;
  depositPaidAmountCents: number;
  hasOpenDepositRequest: boolean;
};
