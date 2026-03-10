import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

const depositRequestInclude = {
  payments: {
    orderBy: [{ createdAt: "asc" as const }]
  }
};

const paymentInclude = {
  depositRequest: {
    select: {
      id: true,
      proposalId: true,
      organizationId: true,
      amountCents: true,
      status: true
    }
  }
};

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function getProposalForPaymentsOrganization(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: {
      id: true,
      organizationId: true,
      title: true
    }
  });
}

export async function listDepositRequestsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.depositRequest.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: depositRequestInclude
  });
}

export async function getDepositRequestById(input: {
  organizationId: string;
  depositRequestId: string;
}) {
  return prismaClient.depositRequest.findFirst({
    where: {
      id: input.depositRequestId.trim(),
      organizationId: input.organizationId
    },
    include: depositRequestInclude
  });
}

export async function createDepositRequestForProposal(input: {
  organizationId: string;
  proposalId: string;
  kind: "DEPOSIT";
  status: "DRAFT" | "REQUESTED";
  amountCents: number;
  currency: string;
  description?: string | null;
  requestedAt?: Date | null;
  dueAt?: Date | null;
  externalReference?: string | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  return prismaClient.depositRequest.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      kind: input.kind,
      status: input.status,
      amountCents: input.amountCents,
      currency: input.currency,
      description: input.description ?? null,
      requestedAt: input.requestedAt ?? null,
      dueAt: input.dueAt ?? null,
      externalReference: input.externalReference ?? null,
      metadata: normalizeMetadata(input.metadata),
      createdByMembershipId: input.actorMembershipId ?? null,
      updatedByMembershipId: input.actorMembershipId ?? null
    },
    include: depositRequestInclude
  });
}

export async function updateDepositRequestForOrganization(input: {
  organizationId: string;
  depositRequestId: string;
  status?: "DRAFT" | "REQUESTED" | "PARTIALLY_PAID" | "PAID" | "VOID";
  amountCents?: number;
  currency?: string;
  description?: string | null;
  requestedAt?: Date | null;
  dueAt?: Date | null;
  paidAt?: Date | null;
  voidedAt?: Date | null;
  externalReference?: string | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  const existing = await prismaClient.depositRequest.findFirst({
    where: {
      id: input.depositRequestId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.depositRequest.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.amountCents !== undefined ? { amountCents: input.amountCents } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.requestedAt !== undefined ? { requestedAt: input.requestedAt } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
      ...(input.paidAt !== undefined ? { paidAt: input.paidAt } : {}),
      ...(input.voidedAt !== undefined ? { voidedAt: input.voidedAt } : {}),
      ...(input.externalReference !== undefined ? { externalReference: input.externalReference ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {}),
      ...(input.actorMembershipId !== undefined ? { updatedByMembershipId: input.actorMembershipId ?? null } : {})
    },
    include: depositRequestInclude
  });
}

export async function listPaymentsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.payment.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: paymentInclude
  });
}

export async function getPaymentById(input: {
  organizationId: string;
  paymentId: string;
}) {
  return prismaClient.payment.findFirst({
    where: {
      id: input.paymentId.trim(),
      organizationId: input.organizationId
    },
    include: paymentInclude
  });
}

export async function createPaymentForProposal(input: {
  organizationId: string;
  proposalId: string;
  depositRequestId?: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  method: "MANUAL" | "EXTERNAL_PROVIDER";
  amountCents: number;
  currency: string;
  direction: "INBOUND";
  receivedAt?: Date | null;
  externalReference?: string | null;
  provider?: string | null;
  note?: string | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  return prismaClient.payment.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      depositRequestId: input.depositRequestId ?? null,
      status: input.status,
      method: input.method,
      amountCents: input.amountCents,
      currency: input.currency,
      direction: input.direction,
      receivedAt: input.receivedAt ?? null,
      externalReference: input.externalReference ?? null,
      provider: input.provider ?? null,
      note: input.note ?? null,
      metadata: normalizeMetadata(input.metadata),
      createdByMembershipId: input.actorMembershipId ?? null,
      updatedByMembershipId: input.actorMembershipId ?? null
    },
    include: paymentInclude
  });
}

export async function updatePaymentForOrganization(input: {
  organizationId: string;
  paymentId: string;
  status?: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED";
  receivedAt?: Date | null;
  externalReference?: string | null;
  provider?: string | null;
  note?: string | null;
  metadata?: unknown;
  actorMembershipId?: string | null;
}) {
  const existing = await prismaClient.payment.findFirst({
    where: {
      id: input.paymentId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.payment.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.receivedAt !== undefined ? { receivedAt: input.receivedAt } : {}),
      ...(input.externalReference !== undefined ? { externalReference: input.externalReference ?? null } : {}),
      ...(input.provider !== undefined ? { provider: input.provider ?? null } : {}),
      ...(input.note !== undefined ? { note: input.note ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {}),
      ...(input.actorMembershipId !== undefined ? { updatedByMembershipId: input.actorMembershipId ?? null } : {})
    },
    include: paymentInclude
  });
}

export async function getProposalPaymentState(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: {
      id: true,
      depositRequests: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          payments: {
            orderBy: [{ createdAt: "asc" }]
          }
        }
      },
      payments: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }]
      }
    }
  });
}
