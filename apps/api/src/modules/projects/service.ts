import {
  createProjectForOrganization,
  createProjectTaskForOrganization,
  getProjectForOrganization,
  listProjectsForOrganization,
  updateProjectForOrganization,
  updateProjectTaskForOrganization
} from "./adapters/projectRepository.js";

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function toTaskView(task: {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  isRequired: boolean;
  sortOrder: number;
  assignedToUser?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: toIsoDate(task.dueDate),
    isRequired: task.isRequired,
    sortOrder: task.sortOrder,
    assignedToUser: task.assignedToUser
      ? {
          id: task.assignedToUser.id,
          email: task.assignedToUser.email,
          name: task.assignedToUser.name
        }
      : null
  };
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
      status: phase.status,
      summary: phase.summary,
      sortOrder: phase.sortOrder,
      taskCount: phase.tasks.length,
      openTaskCount,
      tasks: phase.tasks.map(toTaskView)
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
      backlogTasks: project.tasks.map(toTaskView)
    }
  };
}

export async function createProject(input: {
  organizationId: string;
  key?: string;
  name: string;
  address?: string;
  status?: string;
  stage?: string;
  scopeSummary?: string;
}) {
  const project = await createProjectForOrganization(input);

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
      updatedAt: project.updatedAt.toISOString()
    }
  };
}

export async function updateProject(input: {
  organizationId: string;
  projectId: string;
  key?: string | null;
  name?: string;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  scopeSummary?: string | null;
}) {
  const project = await updateProjectForOrganization(input);

  if (!project) {
    throw new Error("Project not found.");
  }

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
      updatedAt: project.updatedAt.toISOString()
    }
  };
}

export async function createProjectTask(input: {
  organizationId: string;
  projectId: string;
  phaseId?: string;
  title: string;
  status?: string;
  dueDate?: Date | null;
  assignedToUserId?: string | null;
  isRequired?: boolean;
}) {
  const task = await createProjectTaskForOrganization(input);

  return {
    ok: true,
    task: toTaskView(task)
  };
}

export async function updateProjectTask(input: {
  organizationId: string;
  projectId: string;
  taskId: string;
  title?: string;
  status?: string;
  dueDate?: Date | null;
  assignedToUserId?: string | null;
  isRequired?: boolean;
}) {
  const task = await updateProjectTaskForOrganization(input);

  if (!task) {
    throw new Error("Project task not found.");
  }

  return {
    ok: true,
    task: toTaskView(task)
  };
}
