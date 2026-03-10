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

