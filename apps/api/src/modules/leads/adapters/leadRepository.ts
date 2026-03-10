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

export async function createLeadForOrganization(input: {
  organizationId: string;
  projectId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  notes?: string | null;
}) {
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId.trim(),
        organizationId: input.organizationId
      },
      select: { id: true }
    });

    if (!project) {
      throw new Error("Project not found.");
    }
  }

  return prisma.lead.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId?.trim() || null,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      status: input.status?.trim() || null,
      stage: input.stage?.trim() || null,
      notes: input.notes?.trim() || null
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
        select: { id: true }
      }
    }
  });
}

export async function updateLeadForOrganization(input: {
  organizationId: string;
  leadId: string;
  projectId?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  notes?: string | null;
}) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: input.leadId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!lead) {
    return null;
  }

  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId.trim(),
        organizationId: input.organizationId
      },
      select: { id: true }
    });

    if (!project) {
      throw new Error("Project not found.");
    }
  }

  return prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(input.projectId !== undefined ? { projectId: input.projectId?.trim() || null } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status?.trim() || null } : {}),
      ...(input.stage !== undefined ? { stage: input.stage?.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {})
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
        select: { id: true }
      }
    }
  });
}
