import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function getPresentationBundleByTokenHash(input: {
  tokenHash: string;
}) {
  return prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      tokenHash: input.tokenHash
    },
    include: {
      proposal: {
        include: {
          acceptance: {
            select: {
              id: true,
              status: true,
              acceptedAt: true
            }
          },
          conversion: {
            select: {
              id: true,
              status: true,
              projectId: true
            }
          },
          project: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });
}

export async function createProposalAcceptancePresentationLogRecord(input: {
  organizationId: string;
  proposalId: string;
  intakeId: string;
  action:
    | "PRESENTATION_VIEWED"
    | "INSTRUCTIONS_RETURNED"
    | "READY_STATE_RETURNED"
    | "SUBMISSION_STATE_RETURNED"
    | "CONFIRMATION_RETURNED"
    | "PRESENTATION_BLOCKED"
    | "REQUEST_IGNORED_DUPLICATE";
  outcome: "APPLIED" | "SKIPPED" | "FAILED";
  message?: string | null;
  details?: unknown;
}) {
  return prismaClient.proposalAcceptancePresentationLog.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      intakeId: input.intakeId,
      action: input.action,
      outcome: input.outcome,
      message: input.message ?? null,
      details: normalizeMetadata(input.details)
    }
  });
}

export async function listProposalAcceptancePresentationLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposalAcceptancePresentationLog.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
