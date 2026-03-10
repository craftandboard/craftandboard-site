import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listWorkModulesForOrganization: vi.fn(),
  getWorkModuleForOrganization: vi.fn(),
  createWorkModuleForOrganization: vi.fn(),
  updateWorkModuleForOrganization: vi.fn()
}));

vi.mock("../modules/workModules/adapters/workModuleRepository.js", () => repositoryMocks);

import {
  createWorkModule,
  getWorkModuleDetailView,
  listWorkModulesView,
  updateWorkModule
} from "../modules/workModules/service.js";

describe("work modules service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes organization scoping to the repository", async () => {
    repositoryMocks.listWorkModulesForOrganization.mockResolvedValueOnce([]);

    await listWorkModulesView({
      organizationId: "org_local_craft_board",
      projectLookup: "alpha"
    });

    expect(repositoryMocks.listWorkModulesForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectLookup: "alpha"
    });
  });

  it("maps work module detail into project-domain output", async () => {
    repositoryMocks.getWorkModuleForOrganization.mockResolvedValueOnce({
      id: "phase_1",
      name: "Scheduling",
      sortOrder: 0,
      project: {
        id: "proj_1",
        key: "alpha",
        name: "Alpha Project",
        status: "scheduled",
        stage: "ACTIVE"
      },
      tasks: [
        {
          id: "task_1",
          title: "Confirm start",
          status: "OPEN",
          dueDate: new Date("2026-03-10T00:00:00.000Z"),
          isRequired: true,
          sortOrder: 0,
          assignedToUser: {
            id: "user_1",
            email: "demo@craftboard.local",
            name: "Demo User"
          }
        }
      ]
    });

    const payload = await getWorkModuleDetailView({
      organizationId: "org_local_craft_board",
      workModuleId: "phase_1"
    });

    expect(payload.workModule.projectId).toBe("proj_1");
    expect(payload.workModule.tasks[0].assignedToUser?.email).toBe("demo@craftboard.local");
  });

  it("creates a work module through the target repository boundary", async () => {
    repositoryMocks.createWorkModuleForOrganization.mockResolvedValueOnce({
      id: "phase_new",
      name: "Planning",
      status: "OPEN",
      summary: "Initial planning",
      sortOrder: 0,
      project: {
        id: "proj_1",
        key: "alpha",
        name: "Alpha Project",
        status: "planned",
        stage: "ACTIVE"
      },
      tasks: []
    });

    const payload = await createWorkModule({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      name: "Planning",
      status: "OPEN"
    });

    expect(repositoryMocks.createWorkModuleForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      name: "Planning",
      status: "OPEN"
    });
    expect(payload.workModule.id).toBe("phase_new");
  });

  it("updates a work module through the target repository boundary", async () => {
    repositoryMocks.updateWorkModuleForOrganization.mockResolvedValueOnce({
      id: "phase_1",
      name: "Planning",
      status: "ACTIVE",
      summary: "Updated summary",
      sortOrder: 0,
      project: {
        id: "proj_1",
        key: "alpha",
        name: "Alpha Project",
        status: "planned",
        stage: "ACTIVE"
      },
      tasks: []
    });

    const payload = await updateWorkModule({
      organizationId: "org_local_craft_board",
      workModuleId: "phase_1",
      summary: "Updated summary"
    });

    expect(repositoryMocks.updateWorkModuleForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      workModuleId: "phase_1",
      summary: "Updated summary"
    });
    expect(payload.workModule.summary).toBe("Updated summary");
  });
});
