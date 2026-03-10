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

async function ensureLeadOwnership(organizationId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId.trim(),
      organizationId
    },
    select: { id: true }
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }
}

async function ensureProjectOwnership(organizationId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId.trim(),
      organizationId
    },
    select: { id: true }
  });

  if (!project) {
    throw new Error("Project not found.");
  }
}

export async function createProposalForOrganization(input: {
  organizationId: string;
  projectId?: string | null;
  leadId?: string | null;
  title?: string | null;
  status?: string | null;
  version?: number;
  publicToken?: string | null;
}) {
  if (input.projectId) {
    await ensureProjectOwnership(input.organizationId, input.projectId);
  }
  if (input.leadId) {
    await ensureLeadOwnership(input.organizationId, input.leadId);
  }

  return prisma.proposal.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      projectId: input.projectId?.trim() || null,
      leadId: input.leadId?.trim() || null,
      title: input.title?.trim() || null,
      status: input.status?.trim() || null,
      version: input.version ?? 1,
      publicToken: input.publicToken?.trim() || null
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

export async function updateProposalForOrganization(input: {
  organizationId: string;
  proposalId: string;
  projectId?: string | null;
  leadId?: string | null;
  title?: string | null;
  status?: string | null;
  version?: number;
  publicToken?: string | null;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!proposal) {
    return null;
  }

  if (input.projectId) {
    await ensureProjectOwnership(input.organizationId, input.projectId);
  }
  if (input.leadId) {
    await ensureLeadOwnership(input.organizationId, input.leadId);
  }

  return prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      ...(input.projectId !== undefined ? { projectId: input.projectId?.trim() || null } : {}),
      ...(input.leadId !== undefined ? { leadId: input.leadId?.trim() || null } : {}),
      ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status?.trim() || null } : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(input.publicToken !== undefined ? { publicToken: input.publicToken?.trim() || null } : {})
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

export async function createProposalSectionForOrganization(input: {
  organizationId: string;
  proposalId: string;
  title: string;
  sortOrder?: number;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  const maxSort = await prisma.proposalSection.aggregate({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId.trim()
    },
    _max: { sortOrder: true }
  });

  return prisma.proposalSection.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId.trim(),
      title: input.title.trim(),
      sortOrder: input.sortOrder ?? Number(maxSort._max.sortOrder ?? -1) + 1
    }
  });
}

export async function updateProposalSectionForOrganization(input: {
  organizationId: string;
  proposalId: string;
  sectionId: string;
  title?: string;
  sortOrder?: number;
}) {
  const section = await prisma.proposalSection.findFirst({
    where: {
      id: input.sectionId.trim(),
      proposalId: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!section) {
    return null;
  }

  return prisma.proposalSection.update({
    where: { id: section.id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
    }
  });
}

export async function createProposalLineForOrganization(input: {
  organizationId: string;
  proposalId: string;
  sectionId?: string | null;
  name: string;
  description?: string | null;
  qty?: number;
  unit?: string | null;
  priceCents?: number;
  sortOrder?: number;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  if (input.sectionId) {
    const section = await prisma.proposalSection.findFirst({
      where: {
        id: input.sectionId.trim(),
        proposalId: input.proposalId.trim(),
        organizationId: input.organizationId
      },
      select: { id: true }
    });

    if (!section) {
      throw new Error("Proposal section not found.");
    }
  }

  const maxSort = await prisma.proposalLine.aggregate({
    where: {
      organizationId: input.organizationId,
      proposalId: input.proposalId.trim(),
      sectionId: input.sectionId?.trim() || null
    },
    _max: { sortOrder: true }
  });

  return prisma.proposalLine.create({
    data: {
      organizationId: input.organizationId,
      proposalId: input.proposalId.trim(),
      sectionId: input.sectionId?.trim() || null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      qty: input.qty ?? 1,
      unit: input.unit?.trim() || null,
      priceCents: input.priceCents ?? 0,
      sortOrder: input.sortOrder ?? Number(maxSort._max.sortOrder ?? -1) + 1
    }
  });
}

export async function updateProposalLineForOrganization(input: {
  organizationId: string;
  proposalId: string;
  lineId: string;
  sectionId?: string | null;
  name?: string;
  description?: string | null;
  qty?: number;
  unit?: string | null;
  priceCents?: number;
  sortOrder?: number;
}) {
  const line = await prisma.proposalLine.findFirst({
    where: {
      id: input.lineId.trim(),
      proposalId: input.proposalId.trim(),
      organizationId: input.organizationId
    },
    select: { id: true }
  });

  if (!line) {
    return null;
  }

  if (input.sectionId) {
    const section = await prisma.proposalSection.findFirst({
      where: {
        id: input.sectionId.trim(),
        proposalId: input.proposalId.trim(),
        organizationId: input.organizationId
      },
      select: { id: true }
    });

    if (!section) {
      throw new Error("Proposal section not found.");
    }
  }

  return prisma.proposalLine.update({
    where: { id: line.id },
    data: {
      ...(input.sectionId !== undefined ? { sectionId: input.sectionId?.trim() || null } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.qty !== undefined ? { qty: input.qty } : {}),
      ...(input.unit !== undefined ? { unit: input.unit?.trim() || null } : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
    }
  });
}
