import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createProposalAcceptanceEvidenceRecords: vi.fn(),
  createProposalAcceptanceIntakeRecord: vi.fn(),
  getProposalAcceptanceIntakeById: vi.fn(),
  getProposalAcceptanceIntakeByProviderReference: vi.fn(),
  getProposalAcceptanceIntakeByTokenHash: vi.fn(),
  getProposalForAcceptanceIntakeLookup: vi.fn(),
  getProposalForAcceptanceIntakeOrganization: vi.fn(),
  listProposalAcceptanceEvidenceForIntake: vi.fn(),
  listProposalAcceptanceIntakeLogsForProposal: vi.fn(),
  listProposalAcceptanceIntakesForProposal: vi.fn(),
  updateProposalAcceptanceIntakeRecord: vi.fn()
}));

const auditMocks = vi.hoisted(() => ({
  writeProposalAcceptanceIntakeLog: vi.fn()
}));

const handoffMocks = vi.hoisted(() => ({
  handoffToProposalOrchestrator: vi.fn()
}));

const providerAdapterMocks = vi.hoisted(() => ({
  getAcceptanceProviderAdapter: vi.fn()
}));

const tokenMocks = vi.hoisted(() => ({
  generateAcceptanceToken: vi.fn(() => "token_public_1"),
  hashAcceptanceToken: vi.fn(() => "hash_public_1")
}));

vi.mock("../modules/proposalAcceptanceIntake/repository.js", () => repositoryMocks);
vi.mock("../modules/proposalAcceptanceIntake/audit.js", () => auditMocks);
vi.mock("../modules/proposalAcceptanceIntake/handoff.js", () => handoffMocks);
vi.mock("../modules/proposalAcceptanceIntake/providerAdapter.js", () => providerAdapterMocks);
vi.mock("../modules/proposalAcceptanceIntake/token.js", () => tokenMocks);

import {
  createIntakeSession,
  ingestProviderAcceptanceSignal,
  ProposalAcceptancePublicTokenError,
  revokeIntakeSession,
  submitExternalAcceptance
} from "../modules/proposalAcceptanceIntake/service.js";

describe("proposal acceptance intake service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getProposalForAcceptanceIntakeOrganization.mockResolvedValue({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      status: "sent",
      publicToken: "proposal_public_1",
      project: null,
      acceptance: null,
      conversion: null
    });
    handoffMocks.handoffToProposalOrchestrator.mockResolvedValue({
      accepted: true,
      skipped: false,
      acceptance: { id: "acceptance_1", status: "ACCEPTED" }
    });
  });

  it("creates a public intake session and issues a token", async () => {
    repositoryMocks.createProposalAcceptanceIntakeRecord.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      externalIdentityName: null,
      externalIdentityEmail: null,
      externalIp: null,
      externalUserAgent: null,
      provider: null,
      providerReference: null,
      note: null,
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z")
    });

    const payload = await createIntakeSession({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1"
    });

    expect("publicToken" in payload ? payload.publicToken : null).toBe("token_public_1");
    expect(repositoryMocks.createProposalAcceptanceIntakeRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        source: "PUBLIC_TOKEN",
        tokenHash: "hash_public_1"
      })
    );
  });

  it("revokes an open intake session", async () => {
    repositoryMocks.getProposalAcceptanceIntakeById.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: null,
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      externalIdentityName: null,
      externalIdentityEmail: null,
      externalIp: null,
      externalUserAgent: null,
      provider: null,
      providerReference: null,
      note: null,
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z")
    });
    repositoryMocks.updateProposalAcceptanceIntakeRecord.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "REVOKED",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: null,
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: new Date("2026-03-09T01:00:00.000Z"),
      failedAt: null,
      externalIdentityName: null,
      externalIdentityEmail: null,
      externalIp: null,
      externalUserAgent: null,
      provider: null,
      providerReference: null,
      note: "revoked",
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T01:00:00.000Z")
    });

    const payload = await revokeIntakeSession({
      organizationId: "org_local_craft_board",
      intakeId: "intake_1",
      actorMembershipId: "membership_1",
      note: "revoked"
    });

    expect(payload.intake.status).toBe("REVOKED");
  });

  it("rejects invalid public tokens", async () => {
    repositoryMocks.getProposalAcceptanceIntakeByTokenHash.mockResolvedValueOnce(null);

    await expect(
      submitExternalAcceptance({
        token: "bad_token",
        confirmed: true,
        signerName: "Alice Example"
      })
    ).rejects.toBeInstanceOf(ProposalAcceptancePublicTokenError);
  });

  it("records evidence, verifies, and hands off a public submission", async () => {
    repositoryMocks.getProposalAcceptanceIntakeByTokenHash.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      externalIdentityName: null,
      externalIdentityEmail: null,
      externalIp: null,
      externalUserAgent: null,
      provider: null,
      providerReference: null,
      note: null,
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      proposal: {
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        status: "sent",
        publicToken: "proposal_public_1",
        project: null,
        acceptance: null,
        conversion: null
      }
    });
    repositoryMocks.updateProposalAcceptanceIntakeRecord
      .mockResolvedValueOnce({
        id: "intake_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "SUBMITTED",
        source: "PUBLIC_TOKEN",
        tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
        openedAt: new Date("2026-03-09T00:00:00.000Z"),
        submittedAt: new Date("2026-03-09T00:30:00.000Z"),
        verifiedAt: null,
        handedOffAt: null,
        expiredAt: null,
        revokedAt: null,
        failedAt: null,
        externalIdentityName: "Alice Example",
        externalIdentityEmail: "alice@example.com",
        externalIp: "127.0.0.1",
        externalUserAgent: "Vitest",
        provider: null,
        providerReference: null,
        note: "approved",
        payload: null,
        verificationSnapshot: null,
        metadata: null,
        createdByMembershipId: "membership_1",
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:30:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "intake_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "VERIFIED",
        source: "PUBLIC_TOKEN",
        tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
        openedAt: new Date("2026-03-09T00:00:00.000Z"),
        submittedAt: new Date("2026-03-09T00:30:00.000Z"),
        verifiedAt: new Date("2026-03-09T00:31:00.000Z"),
        handedOffAt: null,
        expiredAt: null,
        revokedAt: null,
        failedAt: null,
        externalIdentityName: "Alice Example",
        externalIdentityEmail: "alice@example.com",
        externalIp: "127.0.0.1",
        externalUserAgent: "Vitest",
        provider: null,
        providerReference: null,
        note: "approved",
        payload: null,
        verificationSnapshot: null,
        metadata: null,
        createdByMembershipId: "membership_1",
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:31:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "intake_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "HANDOFF_ACCEPTED",
        source: "PUBLIC_TOKEN",
        tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
        openedAt: new Date("2026-03-09T00:00:00.000Z"),
        submittedAt: new Date("2026-03-09T00:30:00.000Z"),
        verifiedAt: new Date("2026-03-09T00:31:00.000Z"),
        handedOffAt: new Date("2026-03-09T00:32:00.000Z"),
        expiredAt: null,
        revokedAt: null,
        failedAt: null,
        externalIdentityName: "Alice Example",
        externalIdentityEmail: "alice@example.com",
        externalIp: "127.0.0.1",
        externalUserAgent: "Vitest",
        provider: null,
        providerReference: null,
        note: "approved",
        payload: null,
        verificationSnapshot: null,
        metadata: null,
        createdByMembershipId: "membership_1",
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:32:00.000Z")
      });
    repositoryMocks.createProposalAcceptanceEvidenceRecords.mockResolvedValueOnce([]);

    const payload = await submitExternalAcceptance({
      token: "token_public_1",
      confirmed: true,
      signerName: "Alice Example",
      signerEmail: "alice@example.com",
      note: "approved",
      externalIp: "127.0.0.1",
      externalUserAgent: "Vitest"
    });

    expect(payload.ok).toBe(true);
    expect(payload.intake.status).toBe("HANDOFF_ACCEPTED");
    expect(repositoryMocks.createProposalAcceptanceEvidenceRecords).toHaveBeenCalled();
    expect(handoffMocks.handoffToProposalOrchestrator).toHaveBeenCalled();
  });

  it("fails verification when required evidence is missing", async () => {
    repositoryMocks.getProposalAcceptanceIntakeByTokenHash.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      externalIdentityName: null,
      externalIdentityEmail: null,
      externalIp: null,
      externalUserAgent: null,
      provider: null,
      providerReference: null,
      note: null,
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      proposal: {
        id: "proposal_1",
        organizationId: "org_local_craft_board",
        status: "sent",
        publicToken: "proposal_public_1",
        project: null,
        acceptance: null,
        conversion: null
      }
    });
    repositoryMocks.updateProposalAcceptanceIntakeRecord
      .mockResolvedValueOnce({
        id: "intake_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "SUBMITTED",
        source: "PUBLIC_TOKEN",
        tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
        openedAt: new Date("2026-03-09T00:00:00.000Z"),
        submittedAt: new Date("2026-03-09T00:30:00.000Z"),
        verifiedAt: null,
        handedOffAt: null,
        expiredAt: null,
        revokedAt: null,
        failedAt: null,
        externalIdentityName: "",
        externalIdentityEmail: null,
        externalIp: null,
        externalUserAgent: null,
        provider: null,
        providerReference: null,
        note: null,
        payload: null,
        verificationSnapshot: null,
        metadata: null,
        createdByMembershipId: "membership_1",
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:30:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "intake_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        status: "FAILED",
        source: "PUBLIC_TOKEN",
        tokenExpiresAt: new Date("2026-03-16T00:00:00.000Z"),
        openedAt: new Date("2026-03-09T00:00:00.000Z"),
        submittedAt: new Date("2026-03-09T00:30:00.000Z"),
        verifiedAt: null,
        handedOffAt: null,
        expiredAt: null,
        revokedAt: null,
        failedAt: new Date("2026-03-09T00:31:00.000Z"),
        externalIdentityName: "",
        externalIdentityEmail: null,
        externalIp: null,
        externalUserAgent: null,
        provider: null,
        providerReference: null,
        note: null,
        payload: null,
        verificationSnapshot: null,
        metadata: null,
        createdByMembershipId: "membership_1",
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:31:00.000Z")
      });
    repositoryMocks.createProposalAcceptanceEvidenceRecords.mockResolvedValueOnce([]);

    const payload = await submitExternalAcceptance({
      token: "token_public_1",
      confirmed: true,
      signerName: ""
    });

    expect(payload.ok).toBe(false);
    expect(payload.intake.status).toBe("FAILED");
    expect(handoffMocks.handoffToProposalOrchestrator).not.toHaveBeenCalled();
  });

  it("treats duplicate provider callbacks as idempotent", async () => {
    providerAdapterMocks.getAcceptanceProviderAdapter.mockReturnValue({
      normalizeSignal: vi.fn().mockResolvedValue({
        provider: "STRIPE",
        proposalLookup: "proposal_1",
        providerReference: "event_1",
        confirmed: true,
        payload: { id: "event_1" }
      })
    });
    repositoryMocks.getProposalForAcceptanceIntakeLookup.mockResolvedValueOnce({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      status: "accepted",
      publicToken: "proposal_public_1",
      project: null,
      acceptance: { id: "acceptance_1", status: "ACCEPTED" },
      conversion: null
    });
    repositoryMocks.getProposalAcceptanceIntakeByProviderReference.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "HANDOFF_ACCEPTED",
      source: "PROVIDER_CALLBACK",
      tokenExpiresAt: null,
      openedAt: new Date("2026-03-09T00:00:00.000Z"),
      submittedAt: new Date("2026-03-09T00:30:00.000Z"),
      verifiedAt: new Date("2026-03-09T00:31:00.000Z"),
      handedOffAt: new Date("2026-03-09T00:32:00.000Z"),
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      externalIdentityName: "Alice Example",
      externalIdentityEmail: "alice@example.com",
      externalIp: null,
      externalUserAgent: null,
      provider: "STRIPE",
      providerReference: "event_1",
      note: null,
      payload: null,
      verificationSnapshot: null,
      metadata: null,
      createdByMembershipId: null,
      updatedByMembershipId: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:32:00.000Z")
    });

    const payload = await ingestProviderAcceptanceSignal({
      provider: "STRIPE",
      payload: { proposalLookup: "proposal_1", providerReference: "event_1" },
      headers: {}
    });

    expect(payload.ok).toBe(true);
    expect(payload.intake.status).toBe("HANDOFF_ACCEPTED");
  });
});
