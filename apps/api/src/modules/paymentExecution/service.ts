import crypto from "node:crypto";
import type {
  PaymentExecutionView,
  PaymentProviderEventView,
  PaymentReconciliationLogView
} from "./contracts.js";
import { getPaymentProviderAdapter, UnknownPaymentProviderError } from "./providerRegistry.js";
import {
  createPaymentExecutionRecord,
  createProviderEventRecord,
  createReconciliationLogRecord,
  findExecutionByProviderLookup,
  getPaymentExecutionById,
  getProviderEventByDedupeKey,
  getProviderEventById,
  listPaymentExecutionsForProposal,
  listProviderEventsForProposal,
  listReconciliationLogsForExecution,
  updatePaymentExecutionRecord
} from "./repository.js";
import { canTransitionExecutionStatus, isKnownExecutionStatus, normalizeExecutionStatusInput } from "./statusAdapter.js";
import {
  getDepositRequestById,
  getPaymentById,
  getProposalForPaymentsOrganization
} from "../payments/repository.js";
import { reconcileExecutionRefresh, reconcileProviderEvent } from "./reconciliation.js";

type ExecutionStatus =
  | "CREATED"
  | "OPEN"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELED"
  | "FAILED";

type PaymentStatus = "SUCCEEDED" | "FAILED" | "CANCELED";

type DepositRequestRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  amountCents: number;
  currency: string;
};

type PaymentRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  depositRequestId: string | null;
  amountCents: number;
  currency: string;
  status: string;
};

type ExecutionRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  depositRequestId: string | null;
  paymentId: string | null;
  provider: string;
  mode: string;
  status: string;
  amountCents: number;
  currency: string;
  providerSessionId: string | null;
  providerPaymentIntentId: string | null;
  providerCustomerId: string | null;
  providerUrl: string | null;
  externalReference: string | null;
  initiatedAt: Date | null;
  completedAt: Date | null;
  expiredAt: Date | null;
  canceledAt: Date | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProviderEventRecord = {
  id: string;
  organizationId: string;
  provider: string;
  eventType: string;
  providerEventId: string;
  providerObjectId: string | null;
  executionId: string | null;
  paymentId: string | null;
  depositRequestId: string | null;
  proposalId: string | null;
  receivedAt: Date;
  processedAt: Date | null;
  processingStatus: string;
  dedupeKey: string;
  payload: unknown;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type ReconciliationLogRecord = {
  id: string;
  organizationId: string;
  provider: string;
  executionId: string | null;
  providerEventId: string | null;
  paymentId: string | null;
  depositRequestId: string | null;
  action: string;
  outcome: string;
  message: string | null;
  details: unknown;
  createdAt: Date;
};

export class PaymentExecutionConflictError extends Error {}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || "USD";
}

function buildDedupeKey(input: {
  provider: string;
  providerEventId: string;
  organizationId: string;
  payload: unknown;
}) {
  if (input.providerEventId) {
    return `${input.provider}:${input.providerEventId}`;
  }

  return crypto
    .createHash("sha256")
    .update(`${input.organizationId}:${input.provider}:${JSON.stringify(input.payload)}`)
    .digest("hex");
}

function mapExecution(record: ExecutionRecord): PaymentExecutionView {
  return {
    id: record.id,
    orgId: record.organizationId,
    proposalId: record.proposalId,
    depositRequestId: record.depositRequestId,
    paymentId: record.paymentId,
    provider: record.provider,
    mode: record.mode,
    status: record.status,
    amountCents: record.amountCents,
    currency: record.currency,
    providerSessionId: record.providerSessionId,
    providerPaymentIntentId: record.providerPaymentIntentId,
    providerCustomerId: record.providerCustomerId,
    providerUrl: record.providerUrl,
    externalReference: record.externalReference,
    initiatedAt: toIso(record.initiatedAt),
    completedAt: toIso(record.completedAt),
    expiredAt: toIso(record.expiredAt),
    canceledAt: toIso(record.canceledAt),
    metadata: record.metadata,
    createdByMembershipId: record.createdByMembershipId,
    updatedByMembershipId: record.updatedByMembershipId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapProviderEvent(record: ProviderEventRecord): PaymentProviderEventView {
  return {
    id: record.id,
    orgId: record.organizationId,
    provider: record.provider,
    eventType: record.eventType,
    providerEventId: record.providerEventId,
    providerObjectId: record.providerObjectId,
    executionId: record.executionId,
    paymentId: record.paymentId,
    depositRequestId: record.depositRequestId,
    proposalId: record.proposalId,
    receivedAt: record.receivedAt.toISOString(),
    processedAt: toIso(record.processedAt),
    processingStatus: record.processingStatus,
    dedupeKey: record.dedupeKey,
    payload: record.payload,
    errorMessage: record.errorMessage,
    metadata: record.metadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function mapLog(record: ReconciliationLogRecord): PaymentReconciliationLogView {
  return {
    id: record.id,
    orgId: record.organizationId,
    provider: record.provider,
    executionId: record.executionId,
    providerEventId: record.providerEventId,
    paymentId: record.paymentId,
    depositRequestId: record.depositRequestId,
    action: record.action,
    outcome: record.outcome,
    message: record.message,
    details: record.details,
    createdAt: record.createdAt.toISOString()
  };
}

async function ensureProposalOwnership(input: { organizationId: string; proposalId: string }) {
  const proposal = await getProposalForPaymentsOrganization(input);

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return proposal;
}

async function resolveCanonicalMoneyBoundary(input: {
  organizationId: string;
  proposalId: string;
  depositRequestId?: string | null;
  paymentId?: string | null;
  amountCents?: number;
  currency?: string | null;
}) {
  await ensureProposalOwnership({
    organizationId: input.organizationId,
    proposalId: input.proposalId
  });

  let depositRequest: DepositRequestRecord | null = null;
  let payment: PaymentRecord | null = null;

  if (input.depositRequestId) {
    depositRequest = (await getDepositRequestById({
      organizationId: input.organizationId,
      depositRequestId: input.depositRequestId
    })) as DepositRequestRecord | null;

    if (!depositRequest) {
      throw new Error("Deposit request not found.");
    }
    if (depositRequest.proposalId !== input.proposalId) {
      throw new Error("Deposit request does not belong to the proposal.");
    }
  }

  if (input.paymentId) {
    payment = (await getPaymentById({
      organizationId: input.organizationId,
      paymentId: input.paymentId
    })) as PaymentRecord | null;

    if (!payment) {
      throw new Error("Payment not found.");
    }
    if (payment.proposalId !== input.proposalId) {
      throw new Error("Payment does not belong to the proposal.");
    }
    if (depositRequest && payment.depositRequestId && payment.depositRequestId !== depositRequest.id) {
      throw new Error("Payment does not belong to the deposit request.");
    }
  }

  const amountCents = payment?.amountCents ?? depositRequest?.amountCents ?? input.amountCents;
  const currency = payment?.currency ?? depositRequest?.currency ?? normalizeCurrency(input.currency);

  if (!amountCents || amountCents <= 0) {
    throw new Error("A canonical amount is required for payment execution.");
  }

  if (input.amountCents !== undefined && input.amountCents !== amountCents) {
    throw new Error("Payment execution amount must align with canonical money records.");
  }

  if (input.currency !== undefined && normalizeCurrency(input.currency) !== currency) {
    throw new Error("Payment execution currency must align with canonical money records.");
  }

  return {
    depositRequest,
    payment,
    amountCents,
    currency
  };
}

function mapExecutionStatusToCanonicalPaymentStatus(status: ExecutionStatus): PaymentStatus | null {
  if (status === "COMPLETED") {
    return "SUCCEEDED";
  }
  if (status === "FAILED") {
    return "FAILED";
  }
  if (status === "CANCELED" || status === "EXPIRED") {
    return "CANCELED";
  }
  return null;
}

function toReconciledPaymentStatus(status: string | null | undefined): PaymentStatus | null {
  if (status === "SUCCEEDED" || status === "FAILED" || status === "CANCELED") {
    return status;
  }
  return null;
}

function toReconciledExecutionStatus(status: string | null | undefined): ExecutionStatus | null {
  if (
    status === "CREATED" ||
    status === "OPEN" ||
    status === "COMPLETED" ||
    status === "EXPIRED" ||
    status === "CANCELED" ||
    status === "FAILED"
  ) {
    return status;
  }
  return null;
}

export async function createPaymentExecution(input: {
  organizationId: string;
  proposalId: string;
  actorMembershipId?: string | null;
  provider: string;
  mode: string;
  depositRequestId?: string | null;
  paymentId?: string | null;
  amountCents?: number;
  currency?: string | null;
  externalReference?: string | null;
  metadata?: unknown;
}) {
  const adapter = getPaymentProviderAdapter(input.provider);
  const moneyBoundary = await resolveCanonicalMoneyBoundary(input);

  const execution = (await createPaymentExecutionRecord({
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    actorMembershipId: input.actorMembershipId,
    depositRequestId: moneyBoundary.depositRequest?.id ?? null,
    paymentId: moneyBoundary.payment?.id ?? null,
    provider: adapter.provider,
    mode: input.mode.trim().toUpperCase() as "HOSTED_CHECKOUT" | "PAYMENT_LINK" | "MANUAL_PROVIDER_SESSION",
    status: "CREATED",
    amountCents: moneyBoundary.amountCents,
    currency: moneyBoundary.currency,
    externalReference: input.externalReference ?? null,
    metadata: input.metadata
  })) as ExecutionRecord;

  const providerSession = await adapter.createExecutionSession({
    executionId: execution.id,
    organizationId: input.organizationId,
    proposalId: input.proposalId,
    depositRequestId: moneyBoundary.depositRequest?.id ?? null,
    paymentId: moneyBoundary.payment?.id ?? null,
    provider: adapter.provider,
    mode: execution.mode as "HOSTED_CHECKOUT" | "PAYMENT_LINK" | "MANUAL_PROVIDER_SESSION",
    amountCents: execution.amountCents,
    currency: execution.currency,
    externalReference: execution.externalReference,
    metadata: execution.metadata
  });

  const updatedExecution = (await updatePaymentExecutionRecord({
    organizationId: input.organizationId,
    executionId: execution.id,
    actorMembershipId: input.actorMembershipId,
    status: providerSession.status,
    providerSessionId: providerSession.providerSessionId ?? null,
    providerPaymentIntentId: providerSession.providerPaymentIntentId ?? null,
    providerCustomerId: providerSession.providerCustomerId ?? null,
    providerUrl: providerSession.providerUrl ?? null,
    externalReference: providerSession.externalReference ?? execution.externalReference,
    initiatedAt: providerSession.initiatedAt ?? new Date(),
    metadata: providerSession.metadata ?? execution.metadata
  })) as ExecutionRecord | null;

  if (!updatedExecution) {
    throw new Error("Payment execution not found.");
  }

  return {
    ok: true,
    execution: mapExecution(updatedExecution)
  };
}

export async function listPaymentExecutionsView(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const executions = (await listPaymentExecutionsForProposal(input)) as ExecutionRecord[];

  return {
    ok: true,
    executions: executions.map(mapExecution)
  };
}

export async function getPaymentExecutionView(input: {
  organizationId: string;
  executionId: string;
}) {
  const execution = (await getPaymentExecutionById(input)) as ExecutionRecord | null;

  if (!execution) {
    throw new Error("Payment execution not found.");
  }

  return {
    ok: true,
    execution: mapExecution(execution)
  };
}

export async function refreshPaymentExecution(input: {
  organizationId: string;
  executionId: string;
  actorMembershipId?: string | null;
}) {
  const execution = (await getPaymentExecutionById(input)) as ExecutionRecord | null;

  if (!execution) {
    throw new Error("Payment execution not found.");
  }

  const adapter = getPaymentProviderAdapter(execution.provider);
  const refresh = await adapter.fetchExecutionStatus({
    executionId: execution.id,
    provider: adapter.provider,
    status: execution.status as ExecutionStatus,
    providerSessionId: execution.providerSessionId,
    providerPaymentIntentId: execution.providerPaymentIntentId,
    externalReference: execution.externalReference,
    metadata: execution.metadata
  });

  if (!isKnownExecutionStatus(refresh.status)) {
    throw new Error("Invalid execution status.");
  }
  if (!canTransitionExecutionStatus(execution.status, refresh.status)) {
    throw new PaymentExecutionConflictError("Invalid payment execution status transition.");
  }

  const updatedExecution = (await updatePaymentExecutionRecord({
    organizationId: input.organizationId,
    executionId: execution.id,
    actorMembershipId: input.actorMembershipId,
    status: refresh.status,
    providerSessionId: refresh.providerSessionId ?? execution.providerSessionId,
    providerPaymentIntentId: refresh.providerPaymentIntentId ?? execution.providerPaymentIntentId,
    providerCustomerId: refresh.providerCustomerId ?? execution.providerCustomerId,
    providerUrl: refresh.providerUrl ?? execution.providerUrl,
    externalReference: refresh.externalReference ?? execution.externalReference,
    completedAt: refresh.status === "COMPLETED" ? refresh.completedAt ?? new Date() : undefined,
    expiredAt: refresh.status === "EXPIRED" ? refresh.expiredAt ?? new Date() : undefined,
    canceledAt: refresh.status === "CANCELED" ? refresh.canceledAt ?? new Date() : undefined,
    metadata: refresh.metadata ?? execution.metadata
  })) as ExecutionRecord | null;

  if (!updatedExecution) {
    throw new Error("Payment execution not found.");
  }

  await reconcileExecutionRefresh({
    organizationId: input.organizationId,
    provider: adapter.provider,
    executionId: updatedExecution.id,
    paymentId: updatedExecution.paymentId,
    depositRequestId: updatedExecution.depositRequestId,
    executionStatus: updatedExecution.status as ExecutionStatus,
    paymentStatus: mapExecutionStatusToCanonicalPaymentStatus(updatedExecution.status as ExecutionStatus)
  });

  return {
    ok: true,
    execution: mapExecution(updatedExecution)
  };
}

export async function ingestProviderEvent(input: {
  organizationId: string;
  provider: string;
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
}) {
  const adapter = getPaymentProviderAdapter(input.provider);
  const mapped = await adapter.mapIncomingEvent({
    payload: input.payload,
    headers: input.headers
  });
  const normalized = await adapter.normalizeEventToCanonical(mapped);
  const dedupeKey =
    normalized.dedupeKey ||
    buildDedupeKey({
      provider: adapter.provider,
      providerEventId: normalized.providerEventId,
      organizationId: input.organizationId,
      payload: input.payload
    });

  const existing = (await getProviderEventByDedupeKey({
    organizationId: input.organizationId,
    dedupeKey
  })) as ProviderEventRecord | null;

  if (existing) {
    await createReconciliationLogRecord({
      organizationId: input.organizationId,
      provider: adapter.provider,
      executionId: existing.executionId,
      providerEventId: existing.id,
      paymentId: existing.paymentId,
      depositRequestId: existing.depositRequestId,
      action: "EVENT_DUPLICATE",
      outcome: "SKIPPED",
      message: `Duplicate provider event ${normalized.providerEventId}.`
    });
    throw new PaymentExecutionConflictError("Duplicate provider event.");
  }

  const matchedExecution = (await findExecutionByProviderLookup({
    organizationId: input.organizationId,
    provider: adapter.provider,
    providerSessionId: normalized.providerSessionId,
    providerPaymentIntentId: normalized.providerPaymentIntentId,
    externalReference: normalized.externalReference
  })) as ExecutionRecord | null;

  const event = (await createProviderEventRecord({
    organizationId: input.organizationId,
    provider: adapter.provider,
    eventType: normalized.eventType,
    providerEventId: normalized.providerEventId,
    providerObjectId: normalized.providerObjectId ?? null,
    executionId: matchedExecution?.id ?? null,
    paymentId: matchedExecution?.paymentId ?? null,
    depositRequestId: matchedExecution?.depositRequestId ?? null,
    proposalId: matchedExecution?.proposalId ?? null,
    receivedAt: new Date(),
    processingStatus: "RECEIVED",
    dedupeKey,
    payload: input.payload,
    metadata: normalized.metadata ?? null
  })) as ProviderEventRecord;

  await reconcileProviderEvent({
    organizationId: input.organizationId,
    provider: adapter.provider,
    providerEventRecordId: event.id,
    executionId: matchedExecution?.id ?? null,
    paymentId: matchedExecution?.paymentId ?? null,
    depositRequestId: matchedExecution?.depositRequestId ?? null,
    paymentStatus: toReconciledPaymentStatus(normalized.paymentStatus ?? null),
    executionStatus: toReconciledExecutionStatus(normalized.executionStatus ?? null)
  });

  const updatedEvent = (await getProviderEventById({
    organizationId: input.organizationId,
    eventId: event.id
  })) as ProviderEventRecord | null;

  return {
    ok: true,
    event: mapProviderEvent(updatedEvent ?? event)
  };
}

export async function getProviderEventView(input: {
  organizationId: string;
  eventId: string;
}) {
  const event = (await getProviderEventById(input)) as ProviderEventRecord | null;

  if (!event) {
    throw new Error("Payment provider event not found.");
  }

  return {
    ok: true,
    event: mapProviderEvent(event)
  };
}

export async function listProposalProviderEventsView(input: {
  organizationId: string;
  proposalId: string;
}) {
  await ensureProposalOwnership(input);
  const events = (await listProviderEventsForProposal(input)) as ProviderEventRecord[];

  return {
    ok: true,
    events: events.map(mapProviderEvent)
  };
}

export async function listReconciliationLogsView(input: {
  organizationId: string;
  executionId: string;
}) {
  const execution = (await getPaymentExecutionById(input)) as ExecutionRecord | null;

  if (!execution) {
    throw new Error("Payment execution not found.");
  }

  const logs = (await listReconciliationLogsForExecution(input)) as ReconciliationLogRecord[];

  return {
    ok: true,
    logs: logs.map(mapLog)
  };
}
