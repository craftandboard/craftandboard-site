import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listProposalsForOrganization: vi.fn(),
  getProposalForOrganization: vi.fn()
}));

vi.mock("../modules/proposals/adapters/proposalRepository.js", () => repositoryMocks);

import { getProposalDetailView, listProposalsView } from "../modules/proposals/service.js";

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
});

