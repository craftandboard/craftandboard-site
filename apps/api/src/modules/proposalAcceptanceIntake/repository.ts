import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function getProposalForAcceptanceIntakeOrganization(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    include: {
      project: {
        select: { id: true }
      },
      acceptance: {
        select: { id: true, status: true }
      },
      conversion: {
        select: { id: true, status: true, projectId: true }
      }
    }
  });
}

export async function getProposalForAcceptanceIntakeLookup(input: {
  proposalLookup: string;
}) {
  const proposalLookup = input.proposalLookup.trim();

  return prismaClient.proposal.findFirst({
    where: {
      OR: [{ id: proposalLookup }, { publicToken: proposalLookup }]
    },
    include: {
      project: {
        select: { id: true }
      },
      acceptance: {
        select: { id: true, status: true }
      },
      conversion: {
        select: { id: true, status: true, projectId: true }
      }
    }
  });
}

export async function createProposalAcceptanceIntakeRecord(input: {
  organizationId: string;
  proposalId: string;
  source: "PUBLIC_TOKEN" | "PROVIDER_CALLBACK" | "EXTERNAL_MANUAL_ENTRY";
  status?: "OPEN" | "SUBMITTED" | "VERIFIED" | "HANDOFF_ACCEPTED" | "HANDOFF_REJECTED" | "EXPIRED" | "REVOKED" | "FAILED";
  tokenHash?: string | null;
  tokenExpiresAt?: Date | null;
  openedAt?: Date | null;
  submittedAt?: Date | null;
  verifiedAt?: Date | null;
  handedOffAt?: Date | null;
  expiredAt?: Date | null;
  revokedAt?: Date | null;
  failedAt?: Date | null;
  externalIdentityName?: string | null;
  externalIdentityEmail?: string | null;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  provider?: "STRIPE" | null;
  providerReference?: string | null;
  note?: string | null;
  payload?: unknown;
  verificationSnapshot?: unknown;
  metadata?: unknown;
  createdByMembershipId?: string | null;
  updatedByMembershipId?: string | null;
}) {
  return prismaClient.proposalAcceptanceIntake.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      source: input.source,
      status: input.status ?? "OPEN",
      tokenHash: input.tokenHash ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      openedAt: input.openedAt ?? null,
      submittedAt: input.submittedAt ?? null,
      verifiedAt: input.verifiedAt ?? null,
      handedOffAt: input.handedOffAt ?? null,
      expiredAt: input.expiredAt ?? null,
      revokedAt: input.revokedAt ?? null,
      failedAt: input.failedAt ?? null,
      externalIdentityName: input.externalIdentityName ?? null,
      externalIdentityEmail: input.externalIdentityEmail ?? null,
      externalIp: input.externalIp ?? null,
      externalUserAgent: input.externalUserAgent ?? null,
      provider: input.provider ?? null,
      providerReference: input.providerReference ?? null,
      note: input.note ?? null,
      payload: normalizeMetadata(input.payload),
      verificationSnapshot: normalizeMetadata(input.verificationSnapshot),
      metadata: normalizeMetadata(input.metadata),
      createdByMembershipId: input.createdByMembershipId ?? null,
      updatedByMembershipId: input.updatedByMembershipId ?? null
    }
  });
}

export async function updateProposalAcceptanceIntakeRecord(input: {
  organizationId: string;
  intakeId: string;
  status?: "OPEN" | "SUBMITTED" | "VERIFIED" | "HANDOFF_ACCEPTED" | "HANDOFF_REJECTED" | "EXPIRED" | "REVOKED" | "FAILED";
  tokenExpiresAt?: Date | null;
  submittedAt?: Date | null;
  verifiedAt?: Date | null;
  handedOffAt?: Date | null;
  expiredAt?: Date | null;
  revokedAt?: Date | null;
  failedAt?: Date | null;
  externalIdentityName?: string | null;
  externalIdentityEmail?: string | null;
  externalIp?: string | null;
  externalUserAgent?: string | null;
  provider?: "STRIPE" | null;
  providerReference?: string | null;
  note?: string | null;
  payload?: unknown;
  verificationSnapshot?: unknown;
  metadata?: unknown;
  updatedByMembershipId?: string | null;
}) {
  const intake = await prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      id: input.intakeId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!intake) {
    return null;
  }

  return prismaClient.proposalAcceptanceIntake.update({
    where: { id: intake.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.tokenExpiresAt !== undefined ? { tokenExpiresAt: input.tokenExpiresAt } : {}),
      ...(input.submittedAt !== undefined ? { submittedAt: input.submittedAt } : {}),
      ...(input.verifiedAt !== undefined ? { verifiedAt: input.verifiedAt } : {}),
      ...(input.handedOffAt !== undefined ? { handedOffAt: input.handedOffAt } : {}),
      ...(input.expiredAt !== undefined ? { expiredAt: input.expiredAt } : {}),
      ...(input.revokedAt !== undefined ? { revokedAt: input.revokedAt } : {}),
      ...(input.failedAt !== undefined ? { failedAt: input.failedAt } : {}),
      ...(input.externalIdentityName !== undefined ? { externalIdentityName: input.externalIdentityName ?? null } : {}),
      ...(input.externalIdentityEmail !== undefined ? { externalIdentityEmail: input.externalIdentityEmail ?? null } : {}),
      ...(input.externalIp !== undefined ? { externalIp: input.externalIp ?? null } : {}),
      ...(input.externalUserAgent !== undefined ? { externalUserAgent: input.externalUserAgent ?? null } : {}),
      ...(input.provider !== undefined ? { provider: input.provider ?? null } : {}),
      ...(input.providerReference !== undefined ? { providerReference: input.providerReference ?? null } : {}),
      ...(input.note !== undefined ? { note: input.note ?? null } : {}),
      ...(input.payload !== undefined ? { payload: normalizeMetadata(input.payload) } : {}),
      ...(input.verificationSnapshot !== undefined ? { verificationSnapshot: normalizeMetadata(input.verificationSnapshot) } : {}),
      ...(input.metadata !== undefined ? { metadata: normalizeMetadata(input.metadata) } : {}),
      ...(input.updatedByMembershipId !== undefined ? { updatedByMembershipId: input.updatedByMembershipId ?? null } : {})
    }
  });
}

export async function listProposalAcceptanceIntakesForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposalAcceptanceIntake.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function getProposalAcceptanceIntakeById(input: {
  organizationId?: string;
  intakeId: string;
}) {
  return prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      id: input.intakeId.trim(),
      ...(input.organizationId ? { organizationId: input.organizationId } : {})
    }
  });
}

export async function getProposalAcceptanceIntakeByTokenHash(input: {
  tokenHash: string;
}) {
  return prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      tokenHash: input.tokenHash
    },
    include: {
      proposal: {
        include: {
          project: { select: { id: true } },
          acceptance: { select: { id: true, status: true } },
          conversion: { select: { id: true, status: true, projectId: true } }
        }
      }
    }
  });
}

export async function getProposalAcceptanceIntakeByProviderReference(input: {
  organizationId: string;
  provider: "STRIPE";
  providerReference: string;
  proposalId?: string;
}) {
  return prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      organizationId: input.organizationId,
      provider: input.provider,
      providerReference: input.providerReference.trim(),
      ...(input.proposalId ? { proposalId: input.proposalId } : {})
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function createProposalAcceptanceEvidenceRecords(input: {
  organizationId: string;
  proposalId: string;
  intakeId: string;
  entries: Array<{
    kind:
      | "CHECKBOX_CONFIRMATION"
      | "TYPED_NAME"
      | "EMAIL_MATCH"
      | "PROVIDER_ASSERTION"
      | "IP_CAPTURE"
      | "USER_AGENT_CAPTURE"
      | "NOTE";
    value?: string | null;
    details?: unknown;
  }>;
}) {
  const created = [];

  for (const entry of input.entries) {
    created.push(
      await prismaClient.proposalAcceptanceEvidence.create({
        data: {
          organizationId: input.organizationId,
          proposalId: input.proposalId,
          intakeId: input.intakeId,
          kind: entry.kind,
          value: entry.value ?? null,
          details: normalizeMetadata(entry.details)
        }
      })
    );
  }

  return created;
}

export async function listProposalAcceptanceEvidenceForIntake(input: {
  organizationId: string;
  intakeId: string;
}) {
  return prismaClient.proposalAcceptanceEvidence.findMany({
    where: {
      organizationId: input.organizationId,
      intakeId: input.intakeId
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  });
}

export async function createProposalAcceptanceIntakeLogRecord(input: {
  organizationId: string;
  proposalId: string;
  intakeId?: string | null;
  action:
    | "INTAKE_CREATED"
    | "TOKEN_ISSUED"
    | "TOKEN_VALIDATED"
    | "TOKEN_REJECTED"
    | "SUBMISSION_RECEIVED"
    | "SUBMISSION_VERIFIED"
    | "SUBMISSION_FAILED"
    | "HANDOFF_REQUESTED"
    | "HANDOFF_ACCEPTED"
    | "HANDOFF_REJECTED"
    | "INTAKE_EXPIRED"
    | "INTAKE_REVOKED"
    | "REQUEST_IGNORED_DUPLICATE";
  outcome: "APPLIED" | "SKIPPED" | "FAILED";
  message?: string | null;
  details?: unknown;
}) {
  return prismaClient.proposalAcceptanceIntakeLog.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      intakeId: input.intakeId ?? null,
      action: input.action,
      outcome: input.outcome,
      message: input.message ?? null,
      details: normalizeMetadata(input.details)
    }
  });
}

export async function listProposalAcceptanceIntakeLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposalAcceptanceIntakeLog.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
