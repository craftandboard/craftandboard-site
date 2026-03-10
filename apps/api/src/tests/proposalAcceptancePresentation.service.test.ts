import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createProposalAcceptancePresentationLogRecord: vi.fn(),
  getPresentationBundleByTokenHash: vi.fn(),
  listProposalAcceptancePresentationLogsForProposal: vi.fn()
}));

const tokenMocks = vi.hoisted(() => ({
  hashAcceptanceToken: vi.fn(() => "hash_presentation_token")
}));

const paymentsMocks = vi.hoisted(() => ({
  getProposalPaymentSummaryView: vi.fn()
}));

vi.mock("../modules/proposalAcceptancePresentation/repository.js", () => repositoryMocks);
vi.mock("../modules/proposalAcceptanceIntake/token.js", () => tokenMocks);
vi.mock("../modules/payments/service.js", () => paymentsMocks);

import {
  getPublicConfirmation,
  getPublicPresentationState,
  getReadyToConfirmState,
  getSignerInstructions,
  listPresentationLogsForProposal,
  ProposalAcceptancePresentationTokenError,
  recordPresentationViewed
} from "../modules/proposalAcceptancePresentation/service.js";

describe("proposal acceptance presentation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getPresentationBundleByTokenHash.mockResolvedValue({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-18T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      note: "Please review carefully before confirming.",
      proposal: {
        id: "proposal_1",
        status: "sent",
        depositPolicy: "DEPOSIT_REQUIRED_BEFORE_CONVERSION",
        acceptance: null,
        conversion: null,
        project: null
      }
    });
    paymentsMocks.getProposalPaymentSummaryView.mockResolvedValue({
      ok: true,
      summary: {
        requestedAmountCents: 240000,
        paidAmountCents: 50000,
        outstandingAmountCents: 190000,
        depositRequestedAmountCents: 50000,
        depositPaidAmountCents: 0,
        hasOpenDepositRequest: true
      }
    });
  });

  it("returns presentation state for a valid token", async () => {
    const payload = await getPublicPresentationState({
      token: "presentation_token_1234567890"
    });

    expect(payload.presentation.state).toBe("REVIEW_READY");
    expect(payload.presentation.reviewAllowed).toBe(true);
  });

  it("returns signer instructions for a valid token", async () => {
    const payload = await getSignerInstructions({
      token: "presentation_token_1234567890"
    });

    expect(payload.instructions.instructions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "review" }),
        expect.objectContaining({ key: "confirm" })
      ])
    );
  });

  it("returns ready state only when intake is confirmable", async () => {
    const payload = await getReadyToConfirmState({
      token: "presentation_token_1234567890"
    });

    expect(payload.ready.state).toBe("READY_TO_CONFIRM");
    expect(payload.ready.nextActions).toContain("confirm");
  });

  it("rejects invalid presentation tokens safely", async () => {
    repositoryMocks.getPresentationBundleByTokenHash.mockResolvedValueOnce(null);

    await expect(
      getPublicPresentationState({ token: "presentation_token_1234567890" })
    ).rejects.toBeInstanceOf(ProposalAcceptancePresentationTokenError);
  });

  it("returns blocked presentation state for blocked intake", async () => {
    repositoryMocks.getPresentationBundleByTokenHash.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "HANDOFF_REJECTED",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-18T00:00:00.000Z"),
      submittedAt: new Date("2026-03-10T01:00:00.000Z"),
      verifiedAt: new Date("2026-03-10T01:00:00.000Z"),
      handedOffAt: new Date("2026-03-10T01:01:00.000Z"),
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      note: null,
      proposal: {
        id: "proposal_1",
        status: "sent",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        acceptance: null,
        conversion: null,
        project: null
      }
    });

    const payload = await getPublicPresentationState({
      token: "presentation_token_1234567890"
    });

    expect(payload.presentation.state).toBe("BLOCKED");
  });

  it("returns safe confirmation after submission/acceptance", async () => {
    repositoryMocks.getPresentationBundleByTokenHash.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "HANDOFF_ACCEPTED",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-18T00:00:00.000Z"),
      submittedAt: new Date("2026-03-10T01:00:00.000Z"),
      verifiedAt: new Date("2026-03-10T01:00:00.000Z"),
      handedOffAt: new Date("2026-03-10T01:01:00.000Z"),
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      note: null,
      proposal: {
        id: "proposal_1",
        status: "accepted",
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        acceptance: {
          status: "ACCEPTED",
          acceptedAt: new Date("2026-03-10T01:01:00.000Z")
        },
        conversion: null,
        project: null
      }
    });

    const payload = await getPublicConfirmation({
      token: "presentation_token_1234567890"
    });

    expect(payload.confirmation.state).toBe("CONFIRMED");
    expect(payload.confirmation.confirmationSummary?.headline).toBe("Confirmation received");
  });

  it("records viewed events and lists presentation logs safely", async () => {
    repositoryMocks.listProposalAcceptancePresentationLogsForProposal.mockResolvedValueOnce([
      {
        id: "log_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        intakeId: "intake_1",
        action: "PRESENTATION_VIEWED",
        outcome: "APPLIED",
        message: "Viewed",
        details: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const viewed = await recordPresentationViewed({
      token: "presentation_token_1234567890"
    });
    const logs = await listPresentationLogsForProposal({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });

    expect(viewed.ok).toBe(true);
    expect(logs.logs).toHaveLength(1);
  });
});
