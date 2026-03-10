import { getProjectForOrganization, listProjectsForOrganization } from "./adapters/projectRepository.js";

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function listProjectsView(input: {
  organizationId: string;
  query?: string;
}) {
  const projects = await listProjectsForOrganization(input);

  return {
    ok: true,
    projects
  };
}

export async function getProjectDetailView(input: {
  organizationId: string;
  projectLookup: string;
}) {
  const project = await getProjectForOrganization(input);

  if (!project) {
    throw new Error("Project not found.");
  }

  const phases = project.phases.map((phase) => {
    const openTaskCount = phase.tasks.filter((task) => task.status !== "DONE").length;

    return {
      id: phase.id,
      name: phase.name,
      sortOrder: phase.sortOrder,
      taskCount: phase.tasks.length,
      openTaskCount,
      tasks: phase.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: toIsoDate(task.dueDate),
        isRequired: task.isRequired,
        sortOrder: task.sortOrder
      }))
    };
  });

  return {
    ok: true,
    project: {
      id: project.id,
      key: project.key,
      name: project.name,
      address: project.address,
      status: project.status,
      stage: project.stage,
      scopeSummary: project.scopeSummary,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      phases,
      backlogTasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: toIsoDate(task.dueDate),
        isRequired: task.isRequired,
        sortOrder: task.sortOrder
      }))
    }
  };
}

