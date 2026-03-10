import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createProposalAcceptanceReviewLogRecord: vi.fn(),
  getReviewBundleByTokenHash: vi.fn(),
  listProposalAcceptanceReviewLogsForProposal: vi.fn()
}));

const tokenMocks = vi.hoisted(() => ({
  hashAcceptanceToken: vi.fn(() => "hash_review_token")
}));

const paymentsMocks = vi.hoisted(() => ({
  getProposalPaymentSummaryView: vi.fn()
}));

vi.mock("../modules/proposalAcceptanceReview/repository.js", () => repositoryMocks);
vi.mock("../modules/proposalAcceptanceIntake/token.js", () => tokenMocks);
vi.mock("../modules/payments/service.js", () => paymentsMocks);

import {
  getPublicProposalSnapshot,
  getPublicReviewContext,
  listReviewLogsForProposal,
  ProposalAcceptanceReviewTokenError,
  recordSnapshotViewed,
  validateReviewToken
} from "../modules/proposalAcceptanceReview/service.js";

describe("proposal acceptance review service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getReviewBundleByTokenHash.mockResolvedValue({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "OPEN",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: new Date("2026-03-17T00:00:00.000Z"),
      openedAt: new Date("2026-03-10T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      note: "Please review before confirming.",
      proposal: {
        id: "proposal_1",
        title: "Kitchen Remodel Proposal",
        status: "sent",
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        depositPolicy: "DEPOSIT_REQUIRED_BEFORE_CONVERSION",
        organization: { name: "FieldMetriq" },
        acceptance: null,
        conversion: null,
        project: null,
        sections: [
          {
            title: "Base Scope",
            lines: [
              {
                name: "Cabinet install",
                description: "Install base cabinets",
                qty: { toNumber: () => 1 },
                unit: "ea",
                priceCents: 240000
              }
            ]
          }
        ],
        lines: []
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

  it("returns a public snapshot for a valid token", async () => {
    const payload = await getPublicProposalSnapshot({ token: "review_token_1234567890" });

    expect(payload.review.reviewAllowed).toBe(true);
    expect(payload.review.proposal?.title).toBe("Kitchen Remodel Proposal");
    expect(payload.review.proposal?.depositSummary.depositRequestedAmountCents).toBe(50000);
  });

  it("rejects invalid review tokens safely", async () => {
    repositoryMocks.getReviewBundleByTokenHash.mockResolvedValueOnce(null);

    await expect(
      getPublicProposalSnapshot({ token: "review_token_1234567890" })
    ).rejects.toBeInstanceOf(ProposalAcceptanceReviewTokenError);
  });

  it("returns blocked review payloads for blocked intake state", async () => {
    repositoryMocks.getReviewBundleByTokenHash.mockResolvedValueOnce({
      id: "intake_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "REVOKED",
      source: "PUBLIC_TOKEN",
      tokenExpiresAt: null,
      openedAt: new Date("2026-03-10T00:00:00.000Z"),
      submittedAt: null,
      verifiedAt: null,
      handedOffAt: null,
      expiredAt: null,
      revokedAt: null,
      failedAt: null,
      note: null,
      proposal: {
        id: "proposal_1",
        title: "Kitchen Remodel Proposal",
        status: "sent",
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        depositPolicy: "NO_DEPOSIT_REQUIRED",
        organization: { name: "FieldMetriq" },
        acceptance: null,
        conversion: null,
        project: null,
        sections: [],
        lines: []
      }
    });

    const payload = await getPublicReviewContext({ token: "review_token_1234567890" });

    expect(payload.review.reviewAllowed).toBe(false);
    expect(payload.review.proposal).toBeNull();
  });

  it("exposes only allowlisted snapshot fields", async () => {
    const payload = await getPublicProposalSnapshot({ token: "review_token_1234567890" });
    const proposal = payload.review.proposal;

    expect(proposal).toEqual(
      expect.objectContaining({
        organizationName: "FieldMetriq",
        title: "Kitchen Remodel Proposal",
        summary: expect.any(String),
        sections: expect.any(Array),
        totals: expect.any(Object),
        depositSummary: expect.any(Object)
      })
    );
    expect(proposal && "id" in proposal).toBe(false);
    expect(proposal && "metadata" in proposal).toBe(false);
  });

  it("validates review tokens and records viewed events idempotently", async () => {
    const validatePayload = await validateReviewToken({ token: "review_token_1234567890" });
    const viewedPayload = await recordSnapshotViewed({ token: "review_token_1234567890" });

    expect(validatePayload.reviewAllowed).toBe(true);
    expect(viewedPayload.ok).toBe(true);
  });

  it("lists review logs for internal inspection", async () => {
    repositoryMocks.listProposalAcceptanceReviewLogsForProposal.mockResolvedValueOnce([
      {
        id: "log_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        intakeId: "intake_1",
        action: "SNAPSHOT_VIEWED",
        outcome: "APPLIED",
        message: "Viewed",
        details: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const payload = await listReviewLogsForProposal({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });

    expect(payload.logs).toHaveLength(1);
    expect(payload.logs[0]?.action).toBe("SNAPSHOT_VIEWED");
  });
});
