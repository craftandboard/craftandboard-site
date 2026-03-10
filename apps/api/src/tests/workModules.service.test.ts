import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listWorkModulesForOrganization: vi.fn(),
  getWorkModuleForOrganization: vi.fn()
}));

vi.mock("../modules/workModules/adapters/workModuleRepository.js", () => repositoryMocks);

import { getWorkModuleDetailView, listWorkModulesView } from "../modules/workModules/service.js";

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
});
