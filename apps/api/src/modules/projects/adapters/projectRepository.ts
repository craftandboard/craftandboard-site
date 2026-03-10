import { prisma } from "../../../lib/prisma.js";

function normalizeLookupValue(value: string) {
  return value.trim();
}

export async function listProjectsForOrganization(input: {
  organizationId: string;
  query?: string;
}) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const rows = await prisma.project.findMany({
    where: { organizationId: input.organizationId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      phases: {
        select: { id: true }
      },
      tasks: {
        select: { status: true }
      }
    }
  });

  return rows
    .map((row) => {
      const totalTaskCount = row.tasks.length;
      const openTaskCount = row.tasks.filter((task) => task.status !== "DONE").length;

      return {
        id: row.id,
        key: row.key,
        name: row.name,
        address: row.address,
        status: row.status,
        stage: row.stage,
        scopeSummary: row.scopeSummary,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        phaseCount: row.phases.length,
        taskCount: totalTaskCount,
        openTaskCount
      };
    })
    .filter((row) => {
      if (!query) {
        return true;
      }

      return [row.id, row.key ?? "", row.name, row.address ?? "", row.status ?? "", row.stage ?? ""]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(query));
    });
}

export async function getProjectForOrganization(input: {
  organizationId: string;
  projectLookup: string;
}) {
  const projectLookup = normalizeLookupValue(input.projectLookup);

  return prisma.project.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [{ id: projectLookup }, { key: projectLookup }]
    },
    include: {
      phases: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          tasks: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              isRequired: true,
              sortOrder: true,
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
      },
      tasks: {
        where: { phaseId: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          isRequired: true,
          sortOrder: true,
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

export async function createProjectForOrganization(input: {
  organizationId: string;
  key?: string;
  name: string;
  address?: string;
  status?: string;
  stage?: string;
  scopeSummary?: string;
}) {
  return prisma.project.create({
    data: {
      organizationId: input.organizationId,
      key: input.key?.trim() || null,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      status: input.status?.trim() || null,
      stage: input.stage?.trim() || null,
      scopeSummary: input.scopeSummary?.trim() || null
    }
  });
}

export async function updateProjectForOrganization(input: {
  organizationId: string;
  projectId: string;
  key?: string | null;
  name?: string;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  scopeSummary?: string | null;
}) {
  const project = await prisma.project.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.projectId.trim()
    },
    select: { id: true }
  });

  if (!project) {
    return null;
  }

  return prisma.project.update({
    where: { id: project.id },
    data: {
      ...(input.key !== undefined ? { key: input.key?.trim() || null } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status?.trim() || null } : {}),
      ...(input.stage !== undefined ? { stage: input.stage?.trim() || null } : {}),
      ...(input.scopeSummary !== undefined
        ? { scopeSummary: input.scopeSummary?.trim() || null }
        : {})
    }
  });
}

export async function createProjectTaskForOrganization(input: {
  organizationId: string;
  projectId: string;
  phaseId?: string;
  title: string;
  status?: string;
  dueDate?: Date | null;
  assignedToUserId?: string | null;
  isRequired?: boolean;
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

  if (input.phaseId) {
    const phase = await prisma.projectPhase.findFirst({
      where: {
        id: input.phaseId.trim(),
        organizationId: input.organizationId,
        projectId: input.projectId.trim()
      },
      select: { id: true }
    });

    if (!phase) {
      throw new Error("Work module not found.");
    }
  }

  const maxSort = await prisma.projectTask.aggregate({
    where: {
      organizationId: input.organizationId,
      projectId: input.projectId.trim(),
      phaseId: input.phaseId?.trim() || null
    },
    _max: { sortOrder: true }
  });

  return prisma.projectTask.create({
    data: {
      organizationId: input.organizationId,
      projectId: input.projectId.trim(),
      phaseId: input.phaseId?.trim() || null,
      title: input.title.trim(),
      status: input.status?.trim() || "OPEN",
      dueDate: input.dueDate ?? null,
      assignedToUserId: input.assignedToUserId?.trim() || null,
      isRequired: input.isRequired ?? false,
      sortOrder: Number(maxSort._max.sortOrder ?? -1) + 1
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}

export async function updateProjectTaskForOrganization(input: {
  organizationId: string;
  projectId: string;
  taskId: string;
  title?: string;
  status?: string;
  dueDate?: Date | null;
  assignedToUserId?: string | null;
  isRequired?: boolean;
}) {
  const task = await prisma.projectTask.findFirst({
    where: {
      organizationId: input.organizationId,
      projectId: input.projectId.trim(),
      id: input.taskId.trim()
    },
    select: { id: true }
  });

  if (!task) {
    return null;
  }

  return prisma.projectTask.update({
    where: { id: task.id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status.trim() } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.assignedToUserId !== undefined
        ? { assignedToUserId: input.assignedToUserId?.trim() || null }
        : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {})
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}
