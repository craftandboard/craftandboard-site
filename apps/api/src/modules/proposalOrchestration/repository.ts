import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function getProposalForOrchestration(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          status: true,
          stage: true,
          projectId: true
        }
      },
      project: {
        select: {
          id: true,
          key: true,
          name: true,
          status: true,
          stage: true
        }
      },
      acceptance: true,
      conversion: true
    }
  });
}

export async function createProposalAcceptanceRecord(input: {
  organizationId: string;
  proposalId: string;
  decisionSource: "MANUAL_INTERNAL" | "MANUAL_EXTERNAL" | "PROVIDER_CONFIRMED";
  note?: string | null;
  metadata?: unknown;
}) {
  return prismaClient.proposalAcceptance.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      decisionSource: input.decisionSource,
      note: input.note ?? null,
      metadata: normalizeMetadata(input.metadata)
    }
  });
}

export async function updateProposalDepositPolicyForOrganization(input: {
  organizationId: string;
  proposalId: string;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
}) {
  const proposal = await prismaClient.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!proposal) {
    return null;
  }

  return prismaClient.proposal.update({
    where: { id: proposal.id },
    data: {
      depositPolicy: input.depositPolicy
    },
    select: {
      id: true,
      depositPolicy: true
    }
  });
}

export async function updateProposalAcceptanceRecord(input: {
  organizationId: string;
  proposalId: string;
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  canceledAt?: Date | null;
  acceptedByMembershipId?: string | null;
  rejectedByMembershipId?: string | null;
  canceledByMembershipId?: string | null;
  decisionSource?: "MANUAL_INTERNAL" | "MANUAL_EXTERNAL" | "PROVIDER_CONFIRMED";
  note?: string | null;
  metadata?: unknown;
}) {
  const existing = await prismaClient.proposalAcceptance.findFirst({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.proposalAcceptance.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.acceptedAt !== undefined ? { acceptedAt: input.acceptedAt } : {}),
      ...(input.rejectedAt !== undefined ? { rejectedAt: input.rejectedAt } : {}),
      ...(input.canceledAt !== undefined ? { canceledAt: input.canceledAt } : {}),
      ...(input.acceptedByMembershipId !== undefined ? { acceptedByMembershipId: input.acceptedByMembershipId ?? null } : {}),
      ...(input.rejectedByMembershipId !== undefined ? { rejectedByMembershipId: input.rejectedByMembershipId ?? null } : {}),
      ...(input.canceledByMembershipId !== undefined ? { canceledByMembershipId: input.canceledByMembershipId ?? null } : {}),
      ...(input.decisionSource !== undefined ? { decisionSource: input.decisionSource } : {}),
      ...(input.note !== undefined ? { note: input.note ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {})
    }
  });
}

export async function createProposalConversionRecord(input: {
  organizationId: string;
  proposalId: string;
  leadId?: string | null;
  acceptanceId?: string | null;
  initiatedByMembershipId?: string | null;
  eligibilitySnapshot?: unknown;
}) {
  return prismaClient.proposalConversion.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      leadId: input.leadId ?? null,
      acceptanceId: input.acceptanceId ?? null,
      initiatedByMembershipId: input.initiatedByMembershipId ?? null,
      eligibilitySnapshot: normalizeMetadata(input.eligibilitySnapshot)
    }
  });
}

export async function updateProposalConversionRecord(input: {
  organizationId: string;
  proposalId: string;
  acceptanceId?: string | null;
  status?: "PENDING" | "ELIGIBLE" | "BLOCKED" | "CONVERTED" | "FAILED" | "CANCELED";
  eligibilitySnapshot?: unknown;
  blockedReasonCode?: string | null;
  blockedReasonMessage?: string | null;
  convertedAt?: Date | null;
  projectId?: string | null;
  initiatedByMembershipId?: string | null;
  completedByMembershipId?: string | null;
  metadata?: unknown;
}) {
  const existing = await prismaClient.proposalConversion.findFirst({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    select: { id: true }
  });

  if (!existing) {
    return null;
  }

  return prismaClient.proposalConversion.update({
    where: { id: existing.id },
    data: {
      ...(input.acceptanceId !== undefined ? { acceptanceId: input.acceptanceId ?? null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.eligibilitySnapshot !== undefined ? { eligibilitySnapshot: normalizeMetadata(input.eligibilitySnapshot) } : {}),
      ...(input.blockedReasonCode !== undefined ? { blockedReasonCode: input.blockedReasonCode ?? null } : {}),
      ...(input.blockedReasonMessage !== undefined ? { blockedReasonMessage: input.blockedReasonMessage ?? null } : {}),
      ...(input.convertedAt !== undefined ? { convertedAt: input.convertedAt } : {}),
      ...(input.projectId !== undefined ? { projectId: input.projectId ?? null } : {}),
      ...(input.initiatedByMembershipId !== undefined ? { initiatedByMembershipId: input.initiatedByMembershipId ?? null } : {}),
      ...(input.completedByMembershipId !== undefined ? { completedByMembershipId: input.completedByMembershipId ?? null } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {})
    }
  });
}

export async function createProposalOrchestrationLogRecord(input: {
  organizationId: string;
  proposalId: string;
  acceptanceId?: string | null;
  conversionId?: string | null;
  action:
    | "ACCEPTANCE_CREATED"
    | "ACCEPTANCE_ACCEPTED"
    | "ACCEPTANCE_REJECTED"
    | "ACCEPTANCE_CANCELED"
    | "ELIGIBILITY_CHECKED"
    | "CONVERSION_MARKED_ELIGIBLE"
    | "CONVERSION_BLOCKED"
    | "PROJECT_CREATED"
    | "LEAD_STATUS_SYNCED"
    | "PROPOSAL_STATUS_SYNCED"
    | "REQUEST_IGNORED_DUPLICATE"
    | "ORCHESTRATION_FAILED";
  outcome: "APPLIED" | "SKIPPED" | "FAILED";
  message?: string | null;
  details?: unknown;
}) {
  return prismaClient.proposalOrchestrationLog.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      acceptanceId: input.acceptanceId ?? null,
      conversionId: input.conversionId ?? null,
      action: input.action,
      outcome: input.outcome,
      message: input.message ?? null,
      details: normalizeMetadata(input.details)
    }
  });
}

export async function listProposalOrchestrationLogs(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposalOrchestrationLog.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
