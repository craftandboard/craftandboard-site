import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listProjectsForOrganization: vi.fn(),
  getProjectForOrganization: vi.fn()
}));

vi.mock("../modules/projects/adapters/projectRepository.js", () => repositoryMocks);

import { getProjectDetailView, listProjectsView } from "../modules/projects/service.js";

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
});

