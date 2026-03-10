import { prisma } from "../../../lib/prisma.js";

export async function listWorkModulesForOrganization(input: {
  organizationId: string;
  projectLookup?: string;
}) {
  const projectLookup = input.projectLookup?.trim();

  return prisma.projectPhase.findMany({
    where: {
      organizationId: input.organizationId,
      ...(projectLookup
        ? {
            project: {
              OR: [{ id: projectLookup }, { key: projectLookup }]
            }
          }
        : {})
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          status: true,
          isRequired: true
        }
      }
    }
  });
}

export async function getWorkModuleForOrganization(input: {
  organizationId: string;
  workModuleId: string;
}) {
  return prisma.projectPhase.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.workModuleId.trim()
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
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          assignedToUser: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }
    }
  });
}

export async function createWorkModuleForOrganization(input: {
  organizationId: string;
  projectId: string;
  name: string;
  status?: string;
  summary?: string;
  sortOrder?: number;
}) {
  const project = await prisma.project.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.projectId.trim()
    },
    select: { id: true }
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const maxSort = await prisma.projectPhase.aggregate({
      where: {
        organizationId: input.organizationId,
        projectId: input.projectId.trim()
      },
      _max: { sortOrder: true }
    });
    sortOrder = Number(maxSort._max.sortOrder ?? -1) + 1;
  }

  return prisma.projectPhase.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId.trim(),
      name: input.name.trim(),
      status: input.status?.trim() || null,
      summary: input.summary?.trim() || null,
      sortOrder
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
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          assignedToUser: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }
    }
  });
}

export async function updateWorkModuleForOrganization(input: {
  organizationId: string;
  workModuleId: string;
  name?: string;
  status?: string | null;
  summary?: string | null;
  sortOrder?: number;
}) {
  const phase = await prisma.projectPhase.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.workModuleId.trim()
    },
    select: { id: true }
  });

  if (!phase) {
    return null;
  }

  return prisma.projectPhase.update({
    where: { id: phase.id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status?.trim() || null } : {}),
      ...(input.summary !== undefined ? { summary: input.summary?.trim() || null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
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
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          assignedToUser: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }
    }
  });
}
