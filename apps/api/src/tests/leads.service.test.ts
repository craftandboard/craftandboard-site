import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listLeadsForOrganization: vi.fn(),
  getLeadForOrganization: vi.fn()
}));

vi.mock("../modules/leads/adapters/leadRepository.js", () => repositoryMocks);

import { getLeadDetailView, listLeadsView } from "../modules/leads/service.js";

describe("leads service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes org scoping to the repository", async () => {
    repositoryMocks.listLeadsForOrganization.mockResolvedValueOnce([]);

    await listLeadsView({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });

    expect(repositoryMocks.listLeadsForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });
  });

  it("translates lead status in detail view", async () => {
    repositoryMocks.getLeadForOrganization.mockResolvedValueOnce({
      id: "lead_1",
      name: "Alice Example",
      email: "alice@example.com",
      phone: "555-0100",
      address: "123 Main",
      notes: "Warm lead",
      status: "proposal_sent",
      stage: "proposal",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: {
        id: "proj_1",
        key: "alpha",
        name: "Alpha Project",
        status: "planned",
        stage: "ACTIVE"
      },
      proposals: []
    });

    const payload = await getLeadDetailView({
      organizationId: "org_local_craft_board",
      leadLookup: "lead_1"
    });

    expect(payload.lead.stageKey).toBe("proposal");
    expect(payload.lead.stageLabel).toBe("Proposal Sent");
  });
});

