import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getProposalForPaymentsOrganization: vi.fn(),
  listDepositRequestsForProposal: vi.fn(),
  getDepositRequestById: vi.fn(),
  createDepositRequestForProposal: vi.fn(),
  updateDepositRequestForOrganization: vi.fn(),
  listPaymentsForProposal: vi.fn(),
  getPaymentById: vi.fn(),
  createPaymentForProposal: vi.fn(),
  updatePaymentForOrganization: vi.fn(),
  getProposalPaymentState: vi.fn()
}));

vi.mock("../modules/payments/repository.js", () => repositoryMocks);

import {
  createDepositRequest,
  getProposalPaymentSummaryView,
  recordPayment,
  updateDepositRequest,
  updatePaymentStatus
} from "../modules/payments/service.js";

describe("payments service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.getProposalForPaymentsOrganization.mockResolvedValue({
      id: "proposal_1",
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal"
    });
  });

  it("creates a deposit request through the target repository boundary", async () => {
    repositoryMocks.createDepositRequestForProposal.mockResolvedValueOnce({
      id: "deposit_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      kind: "DEPOSIT",
      status: "DRAFT",
      amountCents: 50000,
      currency: "USD",
      description: "Initial deposit",
      requestedAt: null,
      dueAt: null,
      paidAt: null,
      voidedAt: null,
      externalReference: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      payments: []
    });

    const payload = await createDepositRequest({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      amountCents: 50000,
      description: "Initial deposit"
    });

    expect(repositoryMocks.createDepositRequestForProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      kind: "DEPOSIT",
      status: "DRAFT",
      amountCents: 50000,
      currency: "USD",
      description: "Initial deposit",
      requestedAt: null,
      dueAt: null,
      externalReference: null,
      metadata: undefined
    });
    expect(payload.depositRequest.id).toBe("deposit_1");
  });

  it("rejects invalid deposit amounts", async () => {
    await expect(
      createDepositRequest({
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        amountCents: 0
      })
    ).rejects.toThrow("Deposit request amount must be greater than zero.");
  });

  it("rejects invalid deposit status transitions", async () => {
    repositoryMocks.getDepositRequestById.mockResolvedValueOnce({
      id: "deposit_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      kind: "DEPOSIT",
      status: "PAID",
      amountCents: 50000,
      currency: "USD",
      description: null,
      requestedAt: new Date("2026-03-09T00:00:00.000Z"),
      dueAt: null,
      paidAt: new Date("2026-03-09T00:00:00.000Z"),
      voidedAt: null,
      externalReference: null,
      metadata: null,
      createdByMembershipId: null,
      updatedByMembershipId: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      payments: []
    });

    await expect(
      updateDepositRequest({
        organizationId: "org_local_craft_board",
        depositRequestId: "deposit_1",
        status: "REQUESTED"
      })
    ).rejects.toThrow("Invalid deposit request status transition.");
  });

  it("records a payment against a deposit request and syncs deposit status", async () => {
    repositoryMocks.getDepositRequestById
      .mockResolvedValueOnce({
        id: "deposit_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        amountCents: 50000,
        status: "REQUESTED"
      })
      .mockResolvedValueOnce({
        id: "deposit_1",
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        kind: "DEPOSIT",
        status: "REQUESTED",
        amountCents: 50000,
        currency: "USD",
        description: null,
        requestedAt: new Date("2026-03-09T00:00:00.000Z"),
        dueAt: null,
        paidAt: null,
        voidedAt: null,
        externalReference: null,
        metadata: null,
        createdByMembershipId: null,
        updatedByMembershipId: null,
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        updatedAt: new Date("2026-03-09T00:00:00.000Z"),
        payments: [
          {
            amountCents: 25000,
            status: "SUCCEEDED",
            direction: "INBOUND",
            depositRequestId: "deposit_1"
          }
        ]
      });
    repositoryMocks.createPaymentForProposal.mockResolvedValueOnce({
      id: "payment_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      status: "SUCCEEDED",
      method: "MANUAL",
      amountCents: 25000,
      currency: "USD",
      direction: "INBOUND",
      receivedAt: new Date("2026-03-09T00:00:00.000Z"),
      externalReference: null,
      provider: null,
      note: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      depositRequest: null
    });
    repositoryMocks.updateDepositRequestForOrganization.mockResolvedValueOnce({
      id: "deposit_1"
    });

    const payload = await recordPayment({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      depositRequestId: "deposit_1",
      amountCents: 25000
    });

    expect(payload.payment.id).toBe("payment_1");
    expect(repositoryMocks.updateDepositRequestForOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        depositRequestId: "deposit_1",
        status: "PARTIALLY_PAID"
      })
    );
  });

  it("rejects mismatched proposal and deposit request ownership", async () => {
    repositoryMocks.getDepositRequestById.mockResolvedValueOnce({
      id: "deposit_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_2"
    });

    await expect(
      recordPayment({
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        depositRequestId: "deposit_1",
        amountCents: 10000
      })
    ).rejects.toThrow("Deposit request does not belong to the proposal.");
  });

  it("rejects invalid payment status transitions", async () => {
    repositoryMocks.getPaymentById.mockResolvedValueOnce({
      id: "payment_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: null,
      status: "FAILED",
      method: "MANUAL",
      amountCents: 10000,
      currency: "USD",
      direction: "INBOUND",
      receivedAt: null,
      externalReference: null,
      provider: null,
      note: null,
      metadata: null,
      createdByMembershipId: null,
      updatedByMembershipId: null,
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
      updatedAt: new Date("2026-03-09T00:00:00.000Z"),
      depositRequest: null
    });

    await expect(
      updatePaymentStatus({
        organizationId: "org_local_craft_board",
        paymentId: "payment_1",
        status: "SUCCEEDED"
      })
    ).rejects.toThrow("Invalid payment status transition.");
  });

  it("builds a proposal payment summary for overpayment-safe behavior", async () => {
    repositoryMocks.getProposalPaymentState.mockResolvedValueOnce({
      id: "proposal_1",
      depositRequests: [
        {
          id: "deposit_1",
          kind: "DEPOSIT",
          status: "REQUESTED",
          amountCents: 50000,
          payments: [
            {
              amountCents: 60000,
              status: "SUCCEEDED",
              direction: "INBOUND",
              depositRequestId: "deposit_1"
            }
          ]
        }
      ],
      payments: [
        {
          amountCents: 60000,
          status: "SUCCEEDED",
          direction: "INBOUND",
          depositRequestId: "deposit_1"
        }
      ]
    });

    const payload = await getProposalPaymentSummaryView({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });

    expect(payload.summary.paidAmountCents).toBe(60000);
    expect(payload.summary.outstandingAmountCents).toBe(0);
    expect(payload.summary.depositPaidAmountCents).toBe(60000);
    expect(payload.summary.hasOpenDepositRequest).toBe(true);
  });
});
