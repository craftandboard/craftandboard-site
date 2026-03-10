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
              sortOrder: true
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
          sortOrder: true
        }
      }
    }
  });
}

