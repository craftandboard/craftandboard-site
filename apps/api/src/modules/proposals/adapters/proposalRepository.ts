import { prisma } from "../../../lib/prisma.js";

export async function listProposalsForOrganization(input: {
  organizationId: string;
  query?: string;
}) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const rows = await prisma.proposal.findMany({
    where: {
      organizationId: input.organizationId
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      project: {
        select: {
          id: true,
          key: true,
          name: true,
          status: true,
          stage: true
        }
      },
      lead: {
        select: {
          id: true,
          name: true,
          status: true,
          stage: true
        }
      },
      sections: {
        select: { id: true }
      },
      lines: {
        select: { id: true, priceCents: true }
      }
    }
  });

  return rows.filter((row) => {
    if (!query) {
      return true;
    }

    return [row.id, row.title ?? "", row.status ?? "", row.publicToken ?? "", row.project?.name ?? "", row.lead?.name ?? ""]
      .map((value) => value.toLowerCase())
      .some((value) => value.includes(query));
  });
}

export async function getProposalForOrganization(input: {
  organizationId: string;
  proposalLookup: string;
}) {
  const proposalLookup = input.proposalLookup.trim();

  return prisma.proposal.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [{ id: proposalLookup }, { publicToken: proposalLookup }]
    },
    include: {
      project: {
        select: {
          id: true,
          key: true,
          name: true,
          status: true,
          stage: true
        }
      },
      lead: {
        select: {
          id: true,
          name: true,
          status: true,
          stage: true
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
  });
}

