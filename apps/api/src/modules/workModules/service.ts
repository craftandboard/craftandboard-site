import {
  createWorkModuleForOrganization,
  getWorkModuleForOrganization,
  listWorkModulesForOrganization,
  updateWorkModuleForOrganization
} from "./adapters/workModuleRepository.js";

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function listWorkModulesView(input: {
  organizationId: string;
  projectLookup?: string;
}) {
  const workModules = await listWorkModulesForOrganization(input);

  return {
    ok: true,
    workModules: workModules.map((phase) => ({
      id: phase.id,
      projectId: phase.project.id,
      projectKey: phase.project.key,
      projectName: phase.project.name,
      projectStatus: phase.project.status,
      projectStage: phase.project.stage,
      name: phase.name,
      status: phase.status,
      summary: phase.summary,
      sortOrder: phase.sortOrder,
      taskCount: phase.tasks.length,
      openTaskCount: phase.tasks.filter((task) => task.status !== "DONE").length,
      requiredOpenTaskCount: phase.tasks.filter((task) => task.isRequired && task.status !== "DONE").length
    }))
  };
}

export async function getWorkModuleDetailView(input: {
  organizationId: string;
  workModuleId: string;
}) {
  const workModule = await getWorkModuleForOrganization(input);

  if (!workModule) {
    throw new Error("Work module not found.");
  }

  return {
    ok: true,
    workModule: {
      id: workModule.id,
      projectId: workModule.project.id,
      projectKey: workModule.project.key,
      projectName: workModule.project.name,
      projectStatus: workModule.project.status,
      projectStage: workModule.project.stage,
      name: workModule.name,
      status: workModule.status,
      summary: workModule.summary,
      sortOrder: workModule.sortOrder,
      tasks: workModule.tasks.map((task) => ({
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
      }))
    }
  };
}

export async function createWorkModule(input: {
  organizationId: string;
  projectId: string;
  name: string;
  status?: string;
  summary?: string;
  sortOrder?: number;
}) {
  const workModule = await createWorkModuleForOrganization(input);

  return {
    ok: true,
    workModule: {
      id: workModule.id,
      projectId: workModule.project.id,
      projectKey: workModule.project.key,
      projectName: workModule.project.name,
      projectStatus: workModule.project.status,
      projectStage: workModule.project.stage,
      name: workModule.name,
      status: workModule.status,
      summary: workModule.summary,
      sortOrder: workModule.sortOrder,
      tasks: []
    }
  };
}

export async function updateWorkModule(input: {
  organizationId: string;
  workModuleId: string;
  name?: string;
  status?: string | null;
  summary?: string | null;
  sortOrder?: number;
}) {
  const workModule = await updateWorkModuleForOrganization(input);

  if (!workModule) {
    throw new Error("Work module not found.");
  }

  return {
    ok: true,
    workModule: {
      id: workModule.id,
      projectId: workModule.project.id,
      projectKey: workModule.project.key,
      projectName: workModule.project.name,
      projectStatus: workModule.project.status,
      projectStage: workModule.project.stage,
      name: workModule.name,
      status: workModule.status,
      summary: workModule.summary,
      sortOrder: workModule.sortOrder,
      tasks: workModule.tasks.map((task) => ({
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
      }))
    }
  };
}
