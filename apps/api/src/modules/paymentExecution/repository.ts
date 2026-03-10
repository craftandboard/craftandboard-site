import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function createPaymentExecutionRecord(input: {
  organizationId: string;
  proposalId: string;
  depositRequestId?: string | null;
  paymentId?: string | null;
  provider: "STRIPE";
  mode: "HOSTED_CHECKOUT" | "PAYMENT_LINK" | "MANUAL_PROVIDER_SESSION";
  status: "CREATED" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELED" | "FAILED";
  amountCents: number;
  currency: string;
  externalReference?: string | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  return prismaClient.paymentExecution.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      depositRequestId: input.depositRequestId ?? null,
      paymentId: input.paymentId ?? null,
      provider: input.provider,
      mode: input.mode,
      status: input.status,
      amountCents: input.amountCents,
      currency: input.currency,
      externalReference: input.externalReference ?? null,
      metadata: normalizeMetadata(input.metadata),
      createdByMembershipId: input.actorMembershipId ?? null,
      updatedByMembershipId: input.actorMembershipId ?? null
    }
  });
}

export async function updatePaymentExecutionRecord(input: {
  organizationId: string;
  executionId: string;
  status?: "CREATED" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELED" | "FAILED";
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  providerCustomerId?: string | null;
  providerUrl?: string | null;
  externalReference?: string | null;
  initiatedAt?: Date | null;
  completedAt?: Date | null;
  expiredAt?: Date | null;
  canceledAt?: Date | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  const existing = await prismaClient.paymentExecution.findFirst({
    where: {
      id: input.executionId,
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.paymentExecution.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.providerSessionId !== undefined ? { providerSessionId: input.providerSessionId ?? null } : {}),
      ...(input.providerPaymentIntentId !== undefined ? { providerPaymentIntentId: input.providerPaymentIntentId ?? null } : {}),
      ...(input.providerCustomerId !== undefined ? { providerCustomerId: input.providerCustomerId ?? null } : {}),
      ...(input.providerUrl !== undefined ? { providerUrl: input.providerUrl ?? null } : {}),
      ...(input.externalReference !== undefined ? { externalReference: input.externalReference ?? null } : {}),
      ...(input.initiatedAt !== undefined ? { initiatedAt: input.initiatedAt } : {}),
      ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
      ...(input.expiredAt !== undefined ? { expiredAt: input.expiredAt } : {}),
      ...(input.canceledAt !== undefined ? { canceledAt: input.canceledAt } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {}),
      ...(input.actorMembershipId !== undefined ? { updatedByMembershipId: input.actorMembershipId ?? null } : {})
    }
  });
}

export async function getPaymentExecutionById(input: {
  organizationId: string;
  executionId: string;
}) {
  return prismaClient.paymentExecution.findFirst({
    where: {
      id: input.executionId,
      organizationId: input.organizationId
    }
  });
}

export async function listPaymentExecutionsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.paymentExecution.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function findExecutionByProviderLookup(input: {
  organizationId: string;
  provider: "STRIPE";
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  externalReference?: string | null;
}) {
  const conditions = [
    input.providerSessionId ? { providerSessionId: input.providerSessionId } : null,
    input.providerPaymentIntentId ? { providerPaymentIntentId: input.providerPaymentIntentId } : null,
    input.externalReference ? { externalReference: input.externalReference } : null
  ].filter(Boolean);

  if (!conditions.length) {
    return null;
  }

  return prismaClient.paymentExecution.findFirst({
    where: {
      organizationId: input.organizationId,
      provider: input.provider,
      OR: conditions
    }
  });
}

export async function createProviderEventRecord(input: {
  organizationId: string;
  provider: "STRIPE";
  eventType: string;
  providerEventId: string;
  providerObjectId?: string | null;
  executionId?: string | null;
  paymentId?: string | null;
  depositRequestId?: string | null;
  proposalId?: string | null;
  receivedAt: Date;
  processingStatus: "RECEIVED" | "PROCESSED" | "IGNORED" | "FAILED";
  dedupeKey: string;
  payload: unknown;
  metadata?: unknown;
}) {
  return prismaClient.paymentProviderEvent.create({
    data: {
      organizationId: input.organizationId,
      provider: input.provider,
      eventType: input.eventType,
      providerEventId: input.providerEventId,
      providerObjectId: input.providerObjectId ?? null,
      executionId: input.executionId ?? null,
      paymentId: input.paymentId ?? null,
      depositRequestId: input.depositRequestId ?? null,
      proposalId: input.proposalId ?? null,
      receivedAt: input.receivedAt,
      processingStatus: input.processingStatus,
      dedupeKey: input.dedupeKey,
      payload: normalizeMetadata(input.payload),
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function updateProviderEventRecord(input: {
  organizationId: string;
  eventId: string;
  processingStatus?: "RECEIVED" | "PROCESSED" | "IGNORED" | "FAILED";
  processedAt?: Date | null;
  executionId?: string | null;
  paymentId?: string | null;
  depositRequestId?: string | null;
  proposalId?: string | null;
  errorMessage?: string | null;
  metadata?: unknown;
}) {
  const existing = await prismaClient.paymentProviderEvent.findFirst({
    where: {
      id: input.eventId,
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.paymentProviderEvent.update({
    where: { id: existing.id },
    data: {
      ...(input.processingStatus !== undefined ? { processingStatus: input.processingStatus } : {}),
      ...(input.processedAt !== undefined ? { processedAt: input.processedAt } : {}),
      ...(input.executionId !== undefined ? { executionId: input.executionId ?? null } : {}),
      ...(input.paymentId !== undefined ? { paymentId: input.paymentId ?? null } : {}),
      ...(input.depositRequestId !== undefined ? { depositRequestId: input.depositRequestId ?? null } : {}),
      ...(input.proposalId !== undefined ? { proposalId: input.proposalId ?? null } : {}),
      ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {})
    }
  });
}

export async function getProviderEventById(input: {
  organizationId: string;
  eventId: string;
}) {
  return prismaClient.paymentProviderEvent.findFirst({
    where: {
      id: input.eventId,
      organizationId: input.organizationId
    }
  });
}

export async function getProviderEventByDedupeKey(input: {
  organizationId: string;
  dedupeKey: string;
}) {
  return prismaClient.paymentProviderEvent.findFirst({
    where: {
      organizationId: input.organizationId,
      dedupeKey: input.dedupeKey
    }
  });
}

export async function listProviderEventsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.paymentProviderEvent.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ receivedAt: "desc" }, { id: "desc" }]
  });
}

export async function createReconciliationLogRecord(input: {
  organizationId: string;
  provider: "STRIPE";
  executionId?: string | null;
  providerEventId?: string | null;
  paymentId?: string | null;
  depositRequestId?: string | null;
  action:
    | "PAYMENT_MARKED_SUCCEEDED"
    | "PAYMENT_MARKED_FAILED"
    | "DEPOSIT_STATUS_SYNCED"
    | "EVENT_IGNORED"
    | "EVENT_DUPLICATE"
    | "EXECUTION_REFRESHED";
  outcome: "APPLIED" | "SKIPPED" | "FAILED";
  message?: string | null;
  details?: unknown;
}) {
  return prismaClient.paymentReconciliationLog.create({
    data: {
      organizationId: input.organizationId,
      provider: input.provider,
      executionId: input.executionId ?? null,
      providerEventId: input.providerEventId ?? null,
      paymentId: input.paymentId ?? null,
      depositRequestId: input.depositRequestId ?? null,
      action: input.action,
      outcome: input.outcome,
      message: input.message ?? null,
      details: normalizeMetadata(input.details)
    }
  });
}

export async function listReconciliationLogsForExecution(input: {
  organizationId: string;
  executionId: string;
}) {
  return prismaClient.paymentReconciliationLog.findMany({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
