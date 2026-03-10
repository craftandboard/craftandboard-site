import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listProposalsForOrganization: vi.fn(),
  getProposalForOrganization: vi.fn(),
  createProposalForOrganization: vi.fn(),
  updateProposalForOrganization: vi.fn(),
  createProposalSectionForOrganization: vi.fn(),
  updateProposalSectionForOrganization: vi.fn(),
  createProposalLineForOrganization: vi.fn(),
  updateProposalLineForOrganization: vi.fn()
}));

vi.mock("../modules/proposals/adapters/proposalRepository.js", () => repositoryMocks);

import {
  createProposal,
  createProposalLine,
  createProposalSection,
  getProposalDetailView,
  listProposalsView,
  updateProposal,
  updateProposalLine,
  updateProposalSection
} from "../modules/proposals/service.js";

describe("proposals service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes org scoping to the repository", async () => {
    repositoryMocks.listProposalsForOrganization.mockResolvedValueOnce([]);

    await listProposalsView({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });

    expect(repositoryMocks.listProposalsForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "alpha"
    });
  });

  it("maps section and line detail into proposal output", async () => {
    repositoryMocks.getProposalForOrganization.mockResolvedValueOnce({
      id: "proposal_1",
      title: "Kitchen Proposal",
      publicToken: "pub_1",
      status: "sent",
      version: 2,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: null,
      lead: {
        id: "lead_1",
        name: "Alice Example",
        status: "proposal_sent",
        stage: "proposal"
      },
      sections: [
        {
          id: "section_1",
          title: "Base Scope",
          sortOrder: 0,
          lines: [
            {
              id: "line_1",
              name: "Cabinet install",
              description: null,
              qty: { toNumber: () => 1 },
              unit: "lot",
              priceCents: 120000,
              sortOrder: 0
            }
          ]
        }
      ],
      lines: []
    });

    const payload = await getProposalDetailView({
      organizationId: "org_local_craft_board",
      proposalLookup: "proposal_1"
    });

    expect(payload.proposal.sections).toHaveLength(1);
    expect(payload.proposal.sections[0].lines[0].priceCents).toBe(120000);
    expect(payload.proposal.statusLabel).toBe("Sent");
  });

  it("creates a proposal through the target repository boundary", async () => {
    repositoryMocks.createProposalForOrganization.mockResolvedValueOnce({
      id: "proposal_1",
      title: "Kitchen Proposal",
      publicToken: null,
      status: "draft",
      version: 1,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: null,
      lead: null,
      sections: [],
      lines: []
    });

    const payload = await createProposal({
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal"
    });

    expect(repositoryMocks.createProposalForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal",
      status: "draft"
    });
    expect(payload.proposal.id).toBe("proposal_1");
  });

  it("updates a proposal through the target repository boundary", async () => {
    repositoryMocks.getProposalForOrganization.mockResolvedValueOnce({
      id: "proposal_1",
      status: "draft"
    });
    repositoryMocks.updateProposalForOrganization.mockResolvedValueOnce({
      id: "proposal_1",
      title: "Kitchen Proposal",
      publicToken: null,
      status: "sent",
      version: 1,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z"),
      project: null,
      lead: null,
      sections: [],
      lines: []
    });

    const payload = await updateProposal({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "sent"
    });

    expect(repositoryMocks.updateProposalForOrganization).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "sent"
    });
    expect(payload.proposal.statusLabel).toBe("Sent");
  });

  it("creates and updates proposal sections", async () => {
    repositoryMocks.createProposalSectionForOrganization.mockResolvedValueOnce({
      id: "section_1",
      title: "Base Scope",
      sortOrder: 0
    });
    repositoryMocks.updateProposalSectionForOrganization.mockResolvedValueOnce({
      id: "section_1",
      title: "Updated Scope",
      sortOrder: 1
    });

    const created = await createProposalSection({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      title: "Base Scope"
    });
    const updated = await updateProposalSection({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      sectionId: "section_1",
      title: "Updated Scope"
    });

    expect(created.section.id).toBe("section_1");
    expect(updated.section.title).toBe("Updated Scope");
  });

  it("creates and updates proposal lines", async () => {
    repositoryMocks.createProposalLineForOrganization.mockResolvedValueOnce({
      id: "line_1",
      name: "Cabinet install",
      description: null,
      qty: { toNumber: () => 1 },
      unit: "lot",
      priceCents: 120000,
      sortOrder: 0
    });
    repositoryMocks.updateProposalLineForOrganization.mockResolvedValueOnce({
      id: "line_1",
      name: "Cabinet install",
      description: "Updated",
      qty: { toNumber: () => 2 },
      unit: "lot",
      priceCents: 240000,
      sortOrder: 0
    });

    const created = await createProposalLine({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      name: "Cabinet install"
    });
    const updated = await updateProposalLine({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      lineId: "line_1",
      qty: 2,
      priceCents: 240000,
      description: "Updated"
    });

    expect(created.line.id).toBe("line_1");
    expect(updated.line.priceCents).toBe(240000);
  });
});
