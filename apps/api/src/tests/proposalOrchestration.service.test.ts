import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getProposalForOrchestration: vi.fn(),
  createProposalAcceptanceRecord: vi.fn(),
  updateProposalDepositPolicyForOrganization: vi.fn(),
  updateProposalAcceptanceRecord: vi.fn(),
  createProposalConversionRecord: vi.fn(),
  updateProposalConversionRecord: vi.fn(),
  listProposalOrchestrationLogs: vi.fn()
}));

const auditMocks = vi.hoisted(() => ({
  writeProposalOrchestrationLog: vi.fn()
}));

const eligibilityMocks = vi.hoisted(() => ({
  evaluateProposalConversionEligibility: vi.fn()
}));

const projectAdapterMocks = vi.hoisted(() => ({
  createProjectFromProposal: vi.fn()
}));

const proposalAdapterMocks = vi.hoisted(() => ({
  syncProposalStatus: vi.fn()
}));

const leadAdapterMocks = vi.hoisted(() => ({
  syncLeadWonState: vi.fn()
}));

vi.mock("../modules/proposalOrchestration/repository.js", () => repositoryMocks);
vi.mock("../modules/proposalOrchestration/audit.js", () => auditMocks);
vi.mock("../modules/proposalOrchestration/eligibility.js", () => eligibilityMocks);
vi.mock("../modules/proposalOrchestration/projectAdapter.js", () => projectAdapterMocks);
vi.mock("../modules/proposalOrchestration/proposalAdapter.js", () => proposalAdapterMocks);
vi.mock("../modules/proposalOrchestration/leadAdapter.js", () => leadAdapterMocks);

import {
  acceptProposal,
  convertProposalToProject,
  createOrGetAcceptance,
  evaluateConversionEligibility,
  ProposalOrchestrationConflictError
} from "../modules/proposalOrchestration/service.js";

describe("proposal orchestration service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proposalAdapterMocks.syncProposalStatus.mockResolvedValue({ skipped: false });
    leadAdapterMocks.syncLeadWonState.mockResolvedValue({ skipped: false });
    repositoryMocks.updateProposalDepositPolicyForOrganization.mockResolvedValue({
      id: "proposal_1",
      depositPolicy: "NO_DEPOSIT_REQUIRED"
    });
  });

  it("creates an acceptance record once and skips duplicates", async () => {
    repositoryMocks.getProposalForOrchestration
      .mockResolvedValueOnce({
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        title: "Kitchen Proposal",
        status: "sent",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        lead: null,
        project: null,
        acceptance: null,
        conversion: null
      })
      .mockResolvedValueOnce({
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        title: "Kitchen Proposal",
        status: "sent",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        lead: null,
        project: null,
        acceptance: {
          id: "acceptance_1",
          organizationId: "org_local_craft_board",
          proposalId: "proposal_1",
          status: "PENDING",
          acceptedAt: null,
          rejectedAt: null,
          canceledAt: null,
          acceptedByMembershipId: null,
          rejectedByMembershipId: null,
          canceledByMembershipId: null,
          decisionSource: "MANUAL_INTERNAL",
          note: null,
          metadata: null,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        },
        conversion: null
      });
    repositoryMocks.createProposalAcceptanceRecord.mockResolvedValueOnce({
      id: "acceptance_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "PENDING",
      acceptedAt: null,
      rejectedAt: null,
      canceledAt: null,
      acceptedByMembershipId: null,
      rejectedByMembershipId: null,
      canceledByMembershipId: null,
      decisionSource: "MANUAL_INTERNAL",
      note: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const created = await createOrGetAcceptance({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
    const duplicate = await createOrGetAcceptance({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });

    expect(created.acceptance.id).toBe("acceptance_1");
    expect(duplicate.acceptance.id).toBe("acceptance_1");
    expect(repositoryMocks.createProposalAcceptanceRecord).toHaveBeenCalledTimes(1);
  });

  it("accepts a proposal and syncs proposal status", async () => {
    repositoryMocks.getProposalForOrchestration.mockResolvedValueOnce({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal",
      status: "sent",
      depositPolicy: "NO_DEPOSIT_REQUIRED",
      lead: null,
      project: null,
      acceptance: {
        id: "acceptance_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "PENDING",
        acceptedAt: null,
        rejectedAt: null,
        canceledAt: null,
        acceptedByMembershipId: null,
        rejectedByMembershipId: null,
        canceledByMembershipId: null,
        decisionSource: "MANUAL_INTERNAL",
        note: null,
        metadata: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      },
      conversion: null
    });
    repositoryMocks.updateProposalAcceptanceRecord.mockResolvedValueOnce({
      id: "acceptance_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "ACCEPTED",
      acceptedAt: new Date("2026-03-10T01:00:00.000Z"),
      rejectedAt: null,
      canceledAt: null,
      acceptedByMembershipId: "membership_1",
      rejectedByMembershipId: null,
      canceledByMembershipId: null,
      decisionSource: "MANUAL_INTERNAL",
      note: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T01:00:00.000Z")
    });

    const payload = await acceptProposal({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1",
      decisionSource: "MANUAL_INTERNAL"
    });

    expect(payload.acceptance.status).toBe("ACCEPTED");
    expect(proposalAdapterMocks.syncProposalStatus).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      nextStatus: "accepted"
    });
  });

  it("evaluates conversion eligibility and blocks when acceptance or deposit rules fail", async () => {
    repositoryMocks.getProposalForOrchestration.mockResolvedValueOnce({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal",
      status: "sent",
      depositPolicy: "DEPOSIT_REQUIRED_BEFORE_CONVERSION",
      lead: null,
      project: null,
      acceptance: null,
      conversion: null
    });
    eligibilityMocks.evaluateProposalConversionEligibility.mockResolvedValueOnce({
      eligible: false,
      reasons: ["acceptance_required", "deposit_not_satisfied"],
      requiredActions: ["accept_proposal", "collect_required_deposit"],
      snapshot: { ok: false }
    });
    repositoryMocks.createProposalConversionRecord.mockResolvedValueOnce({
      id: "conversion_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      leadId: null,
      acceptanceId: null,
      status: "PENDING",
      eligibilitySnapshot: null,
      blockedReasonCode: null,
      blockedReasonMessage: null,
      convertedAt: null,
      projectId: null,
      initiatedByMembershipId: "membership_1",
      completedByMembershipId: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.updateProposalConversionRecord.mockResolvedValueOnce({
      id: "conversion_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      leadId: null,
      acceptanceId: null,
      status: "BLOCKED",
      eligibilitySnapshot: { ok: false },
      blockedReasonCode: "acceptance_required",
      blockedReasonMessage: "acceptance_required, deposit_not_satisfied",
      convertedAt: null,
      projectId: null,
      initiatedByMembershipId: "membership_1",
      completedByMembershipId: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:01:00.000Z")
    });

    const payload = await evaluateConversionEligibility({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1"
    });

    expect(payload.eligibility.eligible).toBe(false);
    expect(payload.conversion.status).toBe("BLOCKED");
  });

  it("converts an eligible proposal to a project idempotently", async () => {
    repositoryMocks.getProposalForOrchestration
      .mockResolvedValueOnce({
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        title: "Kitchen Proposal",
        status: "accepted",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        lead: {
          id: "lead_1",
          name: "Alice Example"
        },
        project: null,
        acceptance: {
          id: "acceptance_1",
          organizationId: "org_local_craft_board",
          proposalId: "proposal_1",
          status: "ACCEPTED",
          acceptedAt: new Date("2026-03-10T00:00:00.000Z"),
          rejectedAt: null,
          canceledAt: null,
          acceptedByMembershipId: "membership_1",
          rejectedByMembershipId: null,
          canceledByMembershipId: null,
          decisionSource: "MANUAL_INTERNAL",
          note: null,
          metadata: null,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        },
        conversion: {
          id: "conversion_1",
          organizationId: "org_local_craft_board",
          proposalId: "proposal_1",
          leadId: "lead_1",
          acceptanceId: "acceptance_1",
          status: "ELIGIBLE",
          eligibilitySnapshot: { ok: true },
          blockedReasonCode: null,
          blockedReasonMessage: null,
          convertedAt: null,
          projectId: null,
          initiatedByMembershipId: "membership_1",
          completedByMembershipId: null,
          metadata: null,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        }
      })
      .mockResolvedValueOnce({
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        title: "Kitchen Proposal",
        status: "accepted",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        lead: {
          id: "lead_1",
          name: "Alice Example"
        },
        project: null,
        acceptance: {
          id: "acceptance_1",
          organizationId: "org_local_craft_board",
          proposalId: "proposal_1",
          status: "ACCEPTED",
          acceptedAt: new Date("2026-03-10T00:00:00.000Z"),
          rejectedAt: null,
          canceledAt: null,
          acceptedByMembershipId: "membership_1",
          rejectedByMembershipId: null,
          canceledByMembershipId: null,
          decisionSource: "MANUAL_INTERNAL",
          note: null,
          metadata: null,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        },
        conversion: {
          id: "conversion_1",
          organizationId: "org_local_craft_board",
          proposalId: "proposal_1",
          leadId: "lead_1",
          acceptanceId: "acceptance_1",
          status: "ELIGIBLE",
          eligibilitySnapshot: { ok: true },
          blockedReasonCode: null,
          blockedReasonMessage: null,
          convertedAt: null,
          projectId: null,
          initiatedByMembershipId: "membership_1",
          completedByMembershipId: null,
          metadata: null,
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z")
        }
      });
    eligibilityMocks.evaluateProposalConversionEligibility.mockResolvedValue({
      eligible: true,
      reasons: [],
      requiredActions: [],
      snapshot: { ok: true }
    });
    repositoryMocks.updateProposalConversionRecord
      .mockResolvedValueOnce({
        id: "conversion_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        leadId: "lead_1",
        acceptanceId: "acceptance_1",
        status: "ELIGIBLE",
        eligibilitySnapshot: { ok: true },
        blockedReasonCode: null,
        blockedReasonMessage: null,
        convertedAt: null,
        projectId: null,
        initiatedByMembershipId: "membership_1",
        completedByMembershipId: null,
        metadata: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "conversion_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        leadId: "lead_1",
        acceptanceId: "acceptance_1",
        status: "CONVERTED",
        eligibilitySnapshot: { ok: true },
        blockedReasonCode: null,
        blockedReasonMessage: null,
        convertedAt: new Date("2026-03-10T01:00:00.000Z"),
        projectId: "project_1",
        initiatedByMembershipId: "membership_1",
        completedByMembershipId: "membership_1",
        metadata: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T01:00:00.000Z")
      });
    projectAdapterMocks.createProjectFromProposal.mockResolvedValueOnce({
      id: "project_1",
      name: "Kitchen Proposal"
    });

    const payload = await convertProposalToProject({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1"
    });

    expect(payload.conversion.status).toBe("CONVERTED");
    expect(projectAdapterMocks.createProjectFromProposal).toHaveBeenCalled();
    expect(leadAdapterMocks.syncLeadWonState).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      leadId: "lead_1",
      projectId: "project_1"
    });
  });

  it("blocks conversion when eligibility fails", async () => {
    repositoryMocks.getProposalForOrchestration.mockResolvedValueOnce({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal",
      status: "sent",
      depositPolicy: "DEPOSIT_REQUIRED_BEFORE_CONVERSION",
      lead: null,
      project: null,
      acceptance: null,
      conversion: null
    });
    eligibilityMocks.evaluateProposalConversionEligibility.mockResolvedValue({
      eligible: false,
      reasons: ["acceptance_required"],
      requiredActions: ["accept_proposal"],
      snapshot: { ok: false }
    });
    repositoryMocks.createProposalConversionRecord.mockResolvedValueOnce({
      id: "conversion_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      leadId: null,
      acceptanceId: null,
      status: "PENDING",
      eligibilitySnapshot: null,
      blockedReasonCode: null,
      blockedReasonMessage: null,
      convertedAt: null,
      projectId: null,
      initiatedByMembershipId: "membership_1",
      completedByMembershipId: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.updateProposalConversionRecord.mockResolvedValueOnce({
      id: "conversion_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      leadId: null,
      acceptanceId: null,
      status: "BLOCKED",
      eligibilitySnapshot: { ok: false },
      blockedReasonCode: "acceptance_required",
      blockedReasonMessage: "acceptance_required",
      convertedAt: null,
      projectId: null,
      initiatedByMembershipId: "membership_1",
      completedByMembershipId: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    await expect(
      convertProposalToProject({
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        membershipId: "membership_1"
      })
    ).rejects.toBeInstanceOf(ProposalOrchestrationConflictError);
  });
});
