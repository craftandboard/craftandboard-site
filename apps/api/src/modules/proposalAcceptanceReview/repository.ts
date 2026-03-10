import { prisma } from "../../lib/prisma.js";

const prismaClient = prisma as any;

function normalizeMetadata(value: unknown) {
  return value === undefined ? undefined : (value as any);
}

export async function getReviewBundleByTokenHash(input: { tokenHash: string }) {
  return prismaClient.proposalAcceptanceIntake.findFirst({
    where: {
      tokenHash: input.tokenHash
    },
    include: {
      proposal: {
        include: {
          organization: {
            select: {
              name: true
            }
          },
          acceptance: {
            select: {
              id: true,
              status: true
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
          },
          sections: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              lines: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          },
          lines: {
            where: { sectionId: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      }
    }
  });
}

export async function createProposalAcceptanceReviewLogRecord(input: {
  organizationId: string;
  proposalId: string;
  intakeId: string;
  action:
    | "SNAPSHOT_GENERATED"
    | "SNAPSHOT_VIEWED"
    | "TOKEN_VALIDATED_FOR_REVIEW"
    | "REVIEW_BLOCKED"
    | "REVIEW_CONTEXT_RETURNED"
    | "REQUEST_IGNORED_DUPLICATE";
  outcome: "APPLIED" | "SKIPPED" | "FAILED";
  message?: string | null;
  details?: unknown;
}) {
  return prismaClient.proposalAcceptanceReviewLog.create({
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

export async function listProposalAcceptanceReviewLogsForProposal(input: {
  organizationId: string;
  proposalId: string;
}) {
  return prismaClient.proposalAcceptanceReviewLog.findMany({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
