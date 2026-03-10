import { prisma } from "../../../lib/prisma.js";

export async function listLeadsForOrganization(input: {
  organizationId: string;
  query?: string;
}) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const rows = await prisma.lead.findMany({
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
      proposals: {
        select: { id: true }
      }
    }
  });

  return rows.filter((row) => {
    if (!query) {
      return true;
    }

    return [row.id, row.name, row.email ?? "", row.phone ?? "", row.status ?? "", row.stage ?? ""]
      .map((value) => value.toLowerCase())
      .some((value) => value.includes(query));
  });
}

export async function getLeadForOrganization(input: {
  organizationId: string;
  leadLookup: string;
}) {
  const leadLookup = input.leadLookup.trim();

  return prisma.lead.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [{ id: leadLookup }, { email: leadLookup }]
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
      proposals: {
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          version: true,
          publicToken: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
}

