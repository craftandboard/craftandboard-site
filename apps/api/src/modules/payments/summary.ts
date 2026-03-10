import type { ProposalPaymentSummaryView } from "./contracts.js";

type DepositRequestStatus = "DRAFT" | "REQUESTED" | "PARTIALLY_PAID" | "PAID" | "VOID";
type PaymentDirection = "INBOUND";
type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";

type PaymentSummaryRow = {
  amountCents: number;
  status: PaymentStatus;
  direction: PaymentDirection;
  depositRequestId: string | null;
};

type DepositRequestSummaryRow = {
  id: string;
  amountCents: number;
  kind: string;
  status: DepositRequestStatus;
  payments: PaymentSummaryRow[];
};

export function sumSucceededInboundPayments(payments: PaymentSummaryRow[]) {
  return payments.reduce((sum, payment) => {
    if (payment.status !== "SUCCEEDED" || payment.direction !== "INBOUND") {
      return sum;
    }
    return sum + payment.amountCents;
  }, 0);
}

export function deriveDepositRequestComputedStatus(input: {
  amountCents: number;
  currentStatus: DepositRequestStatus;
  payments: PaymentSummaryRow[];
}) {
  if (input.currentStatus === "VOID" || input.currentStatus === "PAID") {
    return input.currentStatus;
  }

  const paidAmountCents = sumSucceededInboundPayments(input.payments);

  if (paidAmountCents >= input.amountCents) {
    return "PAID" as const;
  }
  if (paidAmountCents > 0) {
    return "PARTIALLY_PAID" as const;
  }
  if (input.currentStatus === "PARTIALLY_PAID") {
    return "REQUESTED" as const;
  }
  return input.currentStatus;
}

export function buildProposalPaymentSummary(input: {
  depositRequests: DepositRequestSummaryRow[];
  payments: PaymentSummaryRow[];
}): ProposalPaymentSummaryView {
  const requestedAmountCents = input.depositRequests.reduce((sum, request) => {
    if (request.status === "VOID") {
      return sum;
    }
    return sum + request.amountCents;
  }, 0);
  const paidAmountCents = sumSucceededInboundPayments(input.payments);
  const depositRequestedAmountCents = input.depositRequests.reduce((sum, request) => {
    if (request.kind !== "DEPOSIT" || request.status === "VOID") {
      return sum;
    }
    return sum + request.amountCents;
  }, 0);
  const depositPaidAmountCents = input.depositRequests.reduce((sum, request) => {
    if (request.kind !== "DEPOSIT") {
      return sum;
    }
    return sum + sumSucceededInboundPayments(request.payments);
  }, 0);

  return {
    requestedAmountCents,
    paidAmountCents,
    outstandingAmountCents: Math.max(0, requestedAmountCents - paidAmountCents),
    depositRequestedAmountCents,
    depositPaidAmountCents,
    hasOpenDepositRequest: input.depositRequests.some((request) => request.status !== "PAID" && request.status !== "VOID")
  };
}
