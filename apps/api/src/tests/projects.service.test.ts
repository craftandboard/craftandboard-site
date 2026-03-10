import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listProjectsForOrganization: vi.fn(),
  getProjectForOrganization: vi.fn(),
  createProjectForOrganization: vi.fn(),
  updateProjectForOrganization: vi.fn(),
  createProjectTaskForOrganization: vi.fn(),
  updateProjectTaskForOrganization: vi.fn()
}));

vi.mock("../modules/projects/adapters/projectRepository.js", () => repositoryMocks);

import {
  createProject,
  createProjectTask,
  getProjectDetailView,
  listProjectsView,
  updateProject,
  updateProjectTask
} from "../modules/projects/service.js";

describe("projects service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes organization scoping to the repository", async () => {
    repositoryMocks.listProjectsForOrganization.mockResolvedValueOnce([]);

    await listProjectsView({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });

    expect(repositoryMocks.listProjectsForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });
  });

  it("maps project detail into a read view", async () => {
    repositoryMocks.getProjectForOrganization.mockResolvedValueOnce({
      id: "proj_1",
      key: "alpha",
      name: "Alpha Project",
      address: "123 Main",
      status: "scheduled",
      stage: "ACTIVE",
      scopeSummary: "Cabinet install",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      phases: [
        {
          id: "phase_1",
          name: "Scheduling",
          sortOrder: 0,
          tasks: [
            {
              id: "task_1",
              title: "Confirm start",
              status: "OPEN",
              dueDate: new Date("2026-03-10T00:00:00.000Z"),
              isRequired: true,
              sortOrder: 0
            }
          ]
        }
      ],
      tasks: []
    });

    const payload = await getProjectDetailView({
      organizationId: "org_local_craft_board",
      projectLookup: "alpha"
    });

    expect(payload.project.id).toBe("proj_1");
    expect(payload.project.phases[0].openTaskCount).toBe(1);
  });

  it("creates a project through the target repository boundary", async () => {
    repositoryMocks.createProjectForOrganization.mockResolvedValueOnce({
      id: "proj_new",
      key: "alpha",
      name: "Alpha",
      address: null,
      status: "planned",
      stage: null,
      scopeSummary: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z")
    });

    const payload = await createProject({
      organizationId: "org_local_craft_board",
      key: "alpha",
      name: "Alpha",
      status: "planned"
    });

    expect(repositoryMocks.createProjectForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      key: "alpha",
      name: "Alpha",
      status: "planned"
    });
    expect(payload.project.id).toBe("proj_new");
  });

  it("updates a project through the target repository boundary", async () => {
    repositoryMocks.updateProjectForOrganization.mockResolvedValueOnce({
      id: "proj_1",
      key: "alpha",
      name: "Alpha",
      address: null,
      status: "in_progress",
      stage: null,
      scopeSummary: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z")
    });

    const payload = await updateProject({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      status: "in_progress"
    });

    expect(repositoryMocks.updateProjectForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      status: "in_progress"
    });
    expect(payload.project.status).toBe("in_progress");
  });

  it("creates a project task through the target repository boundary", async () => {
    repositoryMocks.createProjectTaskForOrganization.mockResolvedValueOnce({
      id: "task_1",
      title: "Confirm schedule",
      status: "OPEN",
      dueDate: null,
      isRequired: true,
      sortOrder: 0,
      assignedToUser: null
    });

    const payload = await createProjectTask({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      title: "Confirm schedule",
      isRequired: true
    });

    expect(repositoryMocks.createProjectTaskForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      title: "Confirm schedule",
      isRequired: true
    });
    expect(payload.task.id).toBe("task_1");
  });

  it("updates a project task through the target repository boundary", async () => {
    repositoryMocks.updateProjectTaskForOrganization.mockResolvedValueOnce({
      id: "task_1",
      title: "Confirm schedule",
      status: "DONE",
      dueDate: null,
      isRequired: true,
      sortOrder: 0,
      assignedToUser: null
    });

    const payload = await updateProjectTask({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      taskId: "task_1",
      status: "DONE"
    });

    expect(repositoryMocks.updateProjectTaskForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      taskId: "task_1",
      status: "DONE"
    });
    expect(payload.task.status).toBe("DONE");
  });
});
