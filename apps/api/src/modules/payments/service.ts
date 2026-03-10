import type { DepositRequestView, PaymentView, ProposalPaymentSummaryView } from "./contracts.js";
import {
  createDepositRequestForProposal,
  createPaymentForProposal,
  getDepositRequestById,
  getPaymentById,
  getProposalForPaymentsOrganization,
  getProposalPaymentState,
  listDepositRequestsForProposal,
  listPaymentsForProposal,
  updateDepositRequestForOrganization,
  updatePaymentForOrganization
} from "./repository.js";
import {
  canTransitionDepositRequestStatus,
  canTransitionPaymentStatus,
  isKnownDepositRequestStatus,
  isKnownPaymentStatus,
  normalizeDepositRequestStatusInput,
  normalizePaymentStatusInput
} from "./statusAdapter.js";
import {
  buildProposalPaymentSummary,
  deriveDepositRequestComputedStatus,
  sumSucceededInboundPayments
} from "./summary.js";

type DepositRequestStatus = "DRAFT" | "REQUESTED" | "PARTIALLY_PAID" | "PAID" | "VOID";
type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";

type DepositRequestRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string | null;
  requestedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  externalReference: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments: Array<{
    amountCents: number;
    status: string;
    direction: string;
    depositRequestId: string | null;
  }>;
};

type PaymentRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  depositRequestId: string | null;
  status: string;
  method: string;
  amountCents: number;
  currency: string;
  direction: string;
  receivedAt: Date | null;
  externalReference: string | null;
  provider: string | null;
  note: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeMoneyCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || "USD";
}

function mapDepositRequest(request: DepositRequestRecord): DepositRequestView {
  const paidAmountCents = sumSucceededInboundPayments(
    request.payments.map((payment) => ({
      amountCents: payment.amountCents,
      status: payment.status as PaymentStatus,
      direction: payment.direction as "INBOUND",
      depositRequestId: payment.depositRequestId
    }))
  );

  return {
    id: request.id,
    orgId: request.organizationId,
    proposalId: request.proposalId,
    kind: request.kind,
    status: request.status,
    amountCents: request.amountCents,
    currency: request.currency,
    description: request.description,
    requestedAt: toIso(request.requestedAt),
    dueAt: toIso(request.dueAt),
    paidAt: toIso(request.paidAt),
    voidedAt: toIso(request.voidedAt),
    externalReference: request.externalReference,
    metadata: request.metadata,
    createdByMembershipId: request.createdByMembershipId,
    updatedByMembershipId: request.updatedByMembershipId,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    paidAmountCents,
    outstandingAmountCents: Math.max(0, request.amountCents - paidAmountCents)
  };
}

function mapPayment(payment: PaymentRecord): PaymentView {
  return {
    id: payment.id,
    orgId: payment.organizationId,
    proposalId: payment.proposalId,
    depositRequestId: payment.depositRequestId,
    status: payment.status,
    method: payment.method,
    amountCents: payment.amountCents,
    currency: payment.currency,
    direction: payment.direction,
    receivedAt: toIso(payment.receivedAt),
    externalReference: payment.externalReference,
    provider: payment.provider,
    note: payment.note,
    metadata: payment.metadata,
    createdByMembershipId: payment.createdByMembershipId,
    updatedByMembershipId: payment.updatedByMembershipId,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString()
  };
}

function resolveCreateDepositStatus(rawStatus?: string | null) {
  if (rawStatus === undefined || rawStatus === null) {
    return "DRAFT" as const;
  }

  const normalized = normalizeDepositRequestStatusInput(rawStatus);
  if (!isKnownDepositRequestStatus(normalized)) {
    throw new Error("Invalid deposit request status.");
  }
  if (normalized !== "DRAFT" && normalized !== "REQUESTED") {
    throw new Error("Deposit request creation only supports DRAFT or REQUESTED status.");
  }
  return normalized;
}

function resolveCreatePaymentStatus(rawStatus?: string | null) {
  if (rawStatus === undefined || rawStatus === null) {
    return "SUCCEEDED" as const;
  }

  const normalized = normalizePaymentStatusInput(rawStatus);
  if (!isKnownPaymentStatus(normalized)) {
    throw new Error("Invalid payment status.");
  }
  if (normalized === "REFUNDED") {
    throw new Error("Payment creation cannot start in REFUNDED status.");
  }
  return normalized;
}

function validateDepositRequestWriteFields(input: {
  amountCents?: number;
  status: "DRAFT" | "REQUESTED" | "PARTIALLY_PAID" | "PAID" | "VOID";
  requestedAt?: Date | null;
}) {
  if (input.amountCents !== undefined && input.amountCents <= 0) {
    throw new Error("Deposit request amount must be greater than zero.");
  }
  if (input.status === "DRAFT" && input.requestedAt) {
    throw new Error("Draft deposit requests cannot set requestedAt.");
  }
}

async function ensureProposalOwnership(input: { organizationId: string; proposalId: string }) {
  const proposal = await getProposalForPaymentsOrganization(input);

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return proposal;
}

async function syncDepositRequestPaymentState(input: {
  organizationId: string;
  depositRequestId: string;
  actorMembershipId?: string | null;
}) {
  const depositRequest = (await getDepositRequestById(input)) as DepositRequestRecord | null;

  if (!depositRequest) {
    throw new Error("Deposit request not found.");
  }

  const nextStatus = deriveDepositRequestComputedStatus({
    amountCents: depositRequest.amountCents,
    currentStatus: depositRequest.status as DepositRequestStatus,
    payments: depositRequest.payments.map((payment) => ({
      amountCents: payment.amountCents,
      status: payment.status as PaymentStatus,
      direction: payment.direction as "INBOUND",
      depositRequestId: payment.depositRequestId
    }))
  });

  const paidAmountCents = sumSucceededInboundPayments(
    depositRequest.payments.map((payment) => ({
      amountCents: payment.amountCents,
      status: payment.status as PaymentStatus,
      direction: payment.direction as "INBOUND",
      depositRequestId: payment.depositRequestId
    }))
  );
  const nextPaidAt =
    nextStatus === "PAID" && paidAmountCents >= depositRequest.amountCents
      ? depositRequest.paidAt ?? new Date()
      : depositRequest.paidAt;

  if (nextStatus === depositRequest.status && nextPaidAt?.toISOString() === depositRequest.paidAt?.toISOString()) {
    return depositRequest;
  }

  return updateDepositRequestForOrganization({
    organizationId: input.organizationId,
    depositRequestId: input.depositRequestId,
    status: nextStatus,
    paidAt: nextStatus === "PAID" ? nextPaidAt : depositRequest.paidAt,
    actorMembershipId: input.actorMembershipId
  });
}

export async function createDepositRequest(input: {
  organizationId: string;
  proposalId: string;
  actorMembershipId?: string | null;
  kind?: string | null;
  status?: string | null;
  amountCents: number;
  currency?: string | null;
  description?: string | null;
  requestedAt?: Date | null;
  dueAt?: Date | null;
  externalReference?: string | null;
  metadata?: unknown;
}) {
  await ensureProposalOwnership({
    organizationId: input.organizationId,
    proposalId: input.proposalId
  });

  const kind = (input.kind?.trim().toUpperCase() || "DEPOSIT") as "DEPOSIT";
  if (kind !== "DEPOSIT") {
    throw new Error("Unsupported deposit request kind.");
  }

  const status = resolveCreateDepositStatus(input.status);
  validateDepositRequestWriteFields({
    amountCents: input.amountCents,
    status,
    requestedAt: input.requestedAt ?? null
  });

  const depositRequest = (await createDepositRequestForProposal({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    actorMembershipId: input.actorMembershipId,
    kind,
    status,
    amountCents: input.amountCents,
    currency: normalizeMoneyCurrency(input.currency),
    description: input.description ?? null,
    requestedAt: status === "REQUESTED" ? input.requestedAt ?? new Date() : null,
    dueAt: input.dueAt ?? null,
    externalReference: input.externalReference ?? null,
    metadata: input.metadata
  })) as DepositRequestRecord;

  return {
    ok: true,
    depositRequest: mapDepositRequest(depositRequest)
  };
}

export async function updateDepositRequest(input: {
  organizationId: string;
  depositRequestId: string;
  actorMembershipId?: string | null;
  status?: string | null;
  amountCents?: number;
  currency?: string | null;
  description?: string | null;
  requestedAt?: Date | null;
  dueAt?: Date | null;
  externalReference?: string | null;
  metadata?: unknown;
}) {
  const current = (await getDepositRequestById({
    organizationId: input.organizationId,
    depositRequestId: input.depositRequestId
  })) as DepositRequestRecord | null;

  if (!current) {
    throw new Error("Deposit request not found.");
  }

  let nextStatus: DepositRequestStatus | undefined;
  if (input.status !== undefined && input.status !== null) {
    const normalized = normalizeDepositRequestStatusInput(input.status);
    if (!isKnownDepositRequestStatus(normalized)) {
      throw new Error("Invalid deposit request status.");
    }
    if (!canTransitionDepositRequestStatus(current.status, normalized)) {
      throw new Error("Invalid deposit request status transition.");
    }
    nextStatus = normalized;
  }

  validateDepositRequestWriteFields({
    amountCents: input.amountCents,
    status: nextStatus ?? (current.status as DepositRequestStatus),
    requestedAt: input.requestedAt ?? current.requestedAt
  });

  const depositRequest = (await updateDepositRequestForOrganization({
    organizationId: input.organizationId,
    depositRequestId: input.depositRequestId,
    actorMembershipId: input.actorMembershipId,
    status: nextStatus,
    amountCents: input.amountCents,
    currency: input.currency === undefined ? undefined : normalizeMoneyCurrency(input.currency),
    description: input.description,
    requestedAt:
      nextStatus === "REQUESTED" && input.requestedAt === undefined ? current.requestedAt ?? new Date() : input.requestedAt,
    dueAt: input.dueAt,
    paidAt: nextStatus === "PAID" && current.paidAt === null ? new Date() : nextStatus === "VOID" ? null : undefined,
    voidedAt: nextStatus === "VOID" ? new Date() : undefined,
    externalReference: input.externalReference,
    metadata: input.metadata
  })) as DepositRequestRecord | null;

  if (!depositRequest) {
    throw new Error("Deposit request not found.");
  }

  return {
    ok: true,
    depositRequest: mapDepositRequest(depositRequest)
  };
}

export async function listDepositRequestsView(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const depositRequests = (await listDepositRequestsForProposal(input)) as DepositRequestRecord[];

  return {
    ok: true,
    depositRequests: depositRequests.map(mapDepositRequest)
  };
}

export async function getDepositRequestView(input: {
  organizationId: string;
  depositRequestId: string;
}) {
  const depositRequest = (await getDepositRequestById(input)) as DepositRequestRecord | null;

  if (!depositRequest) {
    throw new Error("Deposit request not found.");
  }

  return {
    ok: true,
    depositRequest: mapDepositRequest(depositRequest)
  };
}

export async function recordPayment(input: {
  organizationId: string;
  proposalId: string;
  actorMembershipId?: string | null;
  depositRequestId?: string | null;
  status?: string | null;
  method?: string | null;
  amountCents: number;
  currency?: string | null;
  direction?: string | null;
  receivedAt?: Date | null;
  externalReference?: string | null;
  provider?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  await ensureProposalOwnership({
    organizationId: input.organizationId,
    proposalId: input.proposalId
  });

  if (input.amountCents <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const status = resolveCreatePaymentStatus(input.status);
  const method = (input.method?.trim().toUpperCase() || "MANUAL") as "MANUAL" | "EXTERNAL_PROVIDER";
  if (method !== "MANUAL" && method !== "EXTERNAL_PROVIDER") {
    throw new Error("Invalid payment method.");
  }

  const direction = (input.direction?.trim().toUpperCase() || "INBOUND") as "INBOUND";
  if (direction !== "INBOUND") {
    throw new Error("Invalid payment direction.");
  }

  const depositRequestId = input.depositRequestId?.trim() || null;
  if (depositRequestId) {
    const depositRequest = (await getDepositRequestById({
      organizationId: input.organizationId,
      depositRequestId
    })) as DepositRequestRecord | null;

    if (!depositRequest) {
      throw new Error("Deposit request not found.");
    }
    if (depositRequest.proposalId !== input.proposalId) {
      throw new Error("Deposit request does not belong to the proposal.");
    }
  }

  const payment = (await createPaymentForProposal({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    actorMembershipId: input.actorMembershipId,
    depositRequestId,
    status,
    method,
    amountCents: input.amountCents,
    currency: normalizeMoneyCurrency(input.currency),
    direction,
    receivedAt: status === "SUCCEEDED" ? input.receivedAt ?? new Date() : input.receivedAt ?? null,
    externalReference: input.externalReference ?? null,
    provider: input.provider ?? null,
    note: input.note ?? null,
    metadata: input.metadata
  })) as PaymentRecord;

  if (depositRequestId) {
    await syncDepositRequestPaymentState({
      organizationId: input.organizationId,
      depositRequestId,
      actorMembershipId: input.actorMembershipId
    });
  }

  return {
    ok: true,
    payment: mapPayment(payment)
  };
}

export async function updatePaymentStatus(input: {
  organizationId: string;
  paymentId: string;
  actorMembershipId?: string | null;
  status?: string | null;
  receivedAt?: Date | null;
  externalReference?: string | null;
  provider?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  const current = (await getPaymentById({
    organizationId: input.organizationId,
    paymentId: input.paymentId
  })) as PaymentRecord | null;

  if (!current) {
    throw new Error("Payment not found.");
  }

  let nextStatus: PaymentStatus | undefined;
  if (input.status !== undefined && input.status !== null) {
    const normalized = normalizePaymentStatusInput(input.status);
    if (!isKnownPaymentStatus(normalized)) {
      throw new Error("Invalid payment status.");
    }
    if (!canTransitionPaymentStatus(current.status, normalized)) {
      throw new Error("Invalid payment status transition.");
    }
    nextStatus = normalized;
  }

  const payment = (await updatePaymentForOrganization({
    organizationId: input.organizationId,
    paymentId: input.paymentId,
    actorMembershipId: input.actorMembershipId,
    status: nextStatus,
    receivedAt:
      nextStatus === "SUCCEEDED" && input.receivedAt === undefined ? current.receivedAt ?? new Date() : input.receivedAt,
    externalReference: input.externalReference,
    provider: input.provider,
    note: input.note,
    metadata: input.metadata
  })) as PaymentRecord | null;

  if (!payment) {
    throw new Error("Payment not found.");
  }

  if (payment.depositRequestId) {
    await syncDepositRequestPaymentState({
      organizationId: input.organizationId,
      depositRequestId: payment.depositRequestId,
      actorMembershipId: input.actorMembershipId
    });
  }

  return {
    ok: true,
    payment: mapPayment(payment)
  };
}

export async function listPaymentsView(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const payments = (await listPaymentsForProposal(input)) as PaymentRecord[];

  return {
    ok: true,
    payments: payments.map(mapPayment)
  };
}

export async function getPaymentView(input: {
  organizationId: string;
  paymentId: string;
}) {
  const payment = (await getPaymentById(input)) as PaymentRecord | null;

  if (!payment) {
    throw new Error("Payment not found.");
  }

  return {
    ok: true,
    payment: mapPayment(payment)
  };
}

export async function getProposalPaymentSummaryView(input: {
  organizationId: string;
  proposalId: string;
}): Promise<{ ok: true; summary: ProposalPaymentSummaryView }> {
  const proposal = (await getProposalPaymentState(input)) as
    | {
        id: string;
        depositRequests: DepositRequestRecord[];
        payments: PaymentRecord[];
      }
    | null;

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return {
    ok: true,
    summary: buildProposalPaymentSummary({
      depositRequests: proposal.depositRequests.map((request) => ({
        id: request.id,
        amountCents: request.amountCents,
        kind: request.kind,
        status: request.status as DepositRequestStatus,
        payments: request.payments.map((payment) => ({
          amountCents: payment.amountCents,
          status: payment.status as PaymentStatus,
          direction: payment.direction as "INBOUND",
          depositRequestId: payment.depositRequestId
        }))
      })),
      payments: proposal.payments.map((payment) => ({
        amountCents: payment.amountCents,
        status: payment.status as PaymentStatus,
        direction: payment.direction as "INBOUND",
        depositRequestId: payment.depositRequestId
      }))
    })
  };
}
