import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listLeadsForOrganization: vi.fn(),
  getLeadForOrganization: vi.fn(),
  createLeadForOrganization: vi.fn(),
  updateLeadForOrganization: vi.fn()
}));

vi.mock("../modules/leads/adapters/leadRepository.js", () => repositoryMocks);

import { createLead, getLeadDetailView, listLeadsView, updateLead } from "../modules/leads/service.js";

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

  it("creates a lead through the target repository boundary", async () => {
    repositoryMocks.createLeadForOrganization.mockResolvedValueOnce({
      id: "lead_1",
      name: "Alice Example",
      email: null,
      phone: null,
      address: null,
      notes: null,
      status: "lead_new",
      stage: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: null,
      proposals: []
    });

    const payload = await createLead({
      organizationId: "org_local_craft_board",
      name: "Alice Example"
    });

    expect(repositoryMocks.createLeadForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      name: "Alice Example",
      status: "lead_new",
      stage: null
    });
    expect(payload.lead.id).toBe("lead_1");
  });

  it("updates a lead through the target repository boundary", async () => {
    repositoryMocks.getLeadForOrganization.mockResolvedValueOnce({
      id: "lead_1",
      status: "lead_new"
    });
    repositoryMocks.updateLeadForOrganization.mockResolvedValueOnce({
      id: "lead_1",
      name: "Alice Example",
      email: null,
      phone: null,
      address: null,
      notes: null,
      status: "jobwalk_scheduled",
      stage: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: null,
      proposals: []
    });

    const payload = await updateLead({
      organizationId: "org_local_craft_board",
      leadId: "lead_1",
      status: "jobwalk_scheduled"
    });

    expect(repositoryMocks.updateLeadForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      leadId: "lead_1",
      status: "jobwalk_scheduled"
    });
    expect(payload.lead.stageKey).toBe("jobwalk");
  });
});
