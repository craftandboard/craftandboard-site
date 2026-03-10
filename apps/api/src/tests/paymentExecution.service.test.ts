import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createPaymentExecutionRecord: vi.fn(),
  updatePaymentExecutionRecord: vi.fn(),
  getPaymentExecutionById: vi.fn(),
  listPaymentExecutionsForProposal: vi.fn(),
  findExecutionByProviderLookup: vi.fn(),
  createProviderEventRecord: vi.fn(),
  getProviderEventById: vi.fn(),
  getProviderEventByDedupeKey: vi.fn(),
  listProviderEventsForProposal: vi.fn(),
  createReconciliationLogRecord: vi.fn(),
  listReconciliationLogsForExecution: vi.fn()
}));

const paymentsRepositoryMocks = vi.hoisted(() => ({
  getProposalForPaymentsOrganization: vi.fn(),
  getDepositRequestById: vi.fn(),
  getPaymentById: vi.fn()
}));

const providerRegistryMocks = vi.hoisted(() => ({
  UnknownPaymentProviderError: class UnknownPaymentProviderError extends Error {},
  getPaymentProviderAdapter: vi.fn()
}));

const reconciliationMocks = vi.hoisted(() => ({
  reconcileExecutionRefresh: vi.fn(),
  reconcileProviderEvent: vi.fn()
}));

vi.mock("../modules/paymentExecution/repository.js", () => repositoryMocks);
vi.mock("../modules/payments/repository.js", () => paymentsRepositoryMocks);
vi.mock("../modules/paymentExecution/providerRegistry.js", () => providerRegistryMocks);
vi.mock("../modules/paymentExecution/reconciliation.js", () => reconciliationMocks);

import {
  createPaymentExecution,
  getProviderEventView,
  ingestProviderEvent,
  listReconciliationLogsView,
  refreshPaymentExecution,
  PaymentExecutionConflictError
} from "../modules/paymentExecution/service.js";

describe("payment execution service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentsRepositoryMocks.getProposalForPaymentsOrganization.mockResolvedValue({
      id: "proposal_1",
      organizationId: "org_local_craft_board"
    });
    providerRegistryMocks.getPaymentProviderAdapter.mockReturnValue({
      provider: "STRIPE",
      createExecutionSession: vi.fn().mockResolvedValue({
        status: "OPEN",
        providerSessionId: "stripe_cs_1",
        providerPaymentIntentId: "stripe_pi_1",
        providerUrl: "https://payments.fieldmetriq.test/checkout/1",
        initiatedAt: new Date("2026-03-10T00:00:00.000Z"),
        metadata: { stubbed: true }
      }),
      fetchExecutionStatus: vi.fn().mockResolvedValue({
        status: "COMPLETED",
        providerSessionId: "stripe_cs_1",
        providerPaymentIntentId: "stripe_pi_1",
        completedAt: new Date("2026-03-10T01:00:00.000Z"),
        metadata: { stubbed: true }
      }),
      mapIncomingEvent: vi.fn().mockResolvedValue({
        provider: "STRIPE",
        eventType: "checkout.session.completed",
        providerEventId: "evt_1",
        providerObjectId: "cs_1",
        providerSessionId: "stripe_cs_1",
        providerPaymentIntentId: "stripe_pi_1",
        paymentStatus: "SUCCEEDED",
        executionStatus: "COMPLETED",
        metadata: { stubbed: true }
      }),
      normalizeEventToCanonical: vi.fn().mockResolvedValue({
        provider: "STRIPE",
        eventType: "checkout.session.completed",
        providerEventId: "evt_1",
        providerObjectId: "cs_1",
        providerSessionId: "stripe_cs_1",
        providerPaymentIntentId: "stripe_pi_1",
        dedupeKey: "STRIPE:evt_1",
        paymentStatus: "SUCCEEDED",
        executionStatus: "COMPLETED",
        metadata: { stubbed: true }
      })
    });
  });

  it("creates a payment execution for a canonical deposit request", async () => {
    paymentsRepositoryMocks.getDepositRequestById.mockResolvedValueOnce({
      id: "deposit_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      amountCents: 50000,
      currency: "USD"
    });
    repositoryMocks.createPaymentExecutionRecord.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      paymentId: null,
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      status: "CREATED",
      amountCents: 50000,
      currency: "USD",
      providerSessionId: null,
      providerPaymentIntentId: null,
      providerCustomerId: null,
      providerUrl: null,
      externalReference: null,
      initiatedAt: null,
      completedAt: null,
      expiredAt: null,
      canceledAt: null,
      metadata: null,
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.updatePaymentExecutionRecord.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      paymentId: null,
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      status: "OPEN",
      amountCents: 50000,
      currency: "USD",
      providerSessionId: "stripe_cs_1",
      providerPaymentIntentId: "stripe_pi_1",
      providerCustomerId: null,
      providerUrl: "https://payments.fieldmetriq.test/checkout/1",
      externalReference: null,
      initiatedAt: new Date("2026-03-10T00:00:00.000Z"),
      completedAt: null,
      expiredAt: null,
      canceledAt: null,
      metadata: { stubbed: true },
      createdByMembershipId: "membership_1",
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });

    const payload = await createPaymentExecution({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      depositRequestId: "deposit_1"
    });

    expect(repositoryMocks.createPaymentExecutionRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "proposal_1",
        depositRequestId: "deposit_1",
        amountCents: 50000
      })
    );
    expect(payload.execution.status).toBe("OPEN");
  });

  it("rejects mismatched org/proposal deposit ownership", async () => {
    paymentsRepositoryMocks.getDepositRequestById.mockResolvedValueOnce({
      id: "deposit_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_2",
      amountCents: 50000,
      currency: "USD"
    });

    await expect(
      createPaymentExecution({
        organizationId: "org_local_craft_board",
        proposalId: "proposal_1",
        provider: "STRIPE",
        mode: "HOSTED_CHECKOUT",
        depositRequestId: "deposit_1"
      })
    ).rejects.toThrow("Deposit request does not belong to the proposal.");
  });

  it("refreshes execution status safely and reconciles through the canonical money boundary", async () => {
    repositoryMocks.getPaymentExecutionById.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      paymentId: "payment_1",
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      status: "OPEN",
      amountCents: 50000,
      currency: "USD",
      providerSessionId: "stripe_cs_1",
      providerPaymentIntentId: "stripe_pi_1",
      providerCustomerId: null,
      providerUrl: "https://payments.fieldmetriq.test/checkout/1",
      externalReference: null,
      initiatedAt: new Date("2026-03-10T00:00:00.000Z"),
      completedAt: null,
      expiredAt: null,
      canceledAt: null,
      metadata: { stubbed: true },
      createdByMembershipId: null,
      updatedByMembershipId: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z")
    });
    repositoryMocks.updatePaymentExecutionRecord.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      paymentId: "payment_1",
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      status: "COMPLETED",
      amountCents: 50000,
      currency: "USD",
      providerSessionId: "stripe_cs_1",
      providerPaymentIntentId: "stripe_pi_1",
      providerCustomerId: null,
      providerUrl: "https://payments.fieldmetriq.test/checkout/1",
      externalReference: null,
      initiatedAt: new Date("2026-03-10T00:00:00.000Z"),
      completedAt: new Date("2026-03-10T01:00:00.000Z"),
      expiredAt: null,
      canceledAt: null,
      metadata: { stubbed: true },
      createdByMembershipId: null,
      updatedByMembershipId: "membership_1",
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T01:00:00.000Z")
    });

    const payload = await refreshPaymentExecution({
      organizationId: "org_local_craft_board",
      executionId: "exec_1",
      actorMembershipId: "membership_1"
    });

    expect(payload.execution.status).toBe("COMPLETED");
    expect(reconciliationMocks.reconcileExecutionRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: "exec_1",
        paymentId: "payment_1",
        paymentStatus: "SUCCEEDED"
      })
    );
  });

  it("rejects invalid execution status transitions", async () => {
    repositoryMocks.getPaymentExecutionById.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: null,
      paymentId: null,
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      status: "COMPLETED",
      amountCents: 50000,
      currency: "USD",
      providerSessionId: "stripe_cs_1",
      providerPaymentIntentId: "stripe_pi_1",
      providerCustomerId: null,
      providerUrl: null,
      externalReference: null,
      initiatedAt: new Date("2026-03-10T00:00:00.000Z"),
      completedAt: new Date("2026-03-10T01:00:00.000Z"),
      expiredAt: null,
      canceledAt: null,
      metadata: {},
      createdByMembershipId: null,
      updatedByMembershipId: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T01:00:00.000Z")
    });

    providerRegistryMocks.getPaymentProviderAdapter.mockReturnValueOnce({
      provider: "STRIPE",
      createExecutionSession: vi.fn(),
      fetchExecutionStatus: vi.fn().mockResolvedValue({
        status: "OPEN",
        metadata: { stubbed: true }
      }),
      mapIncomingEvent: vi.fn(),
      normalizeEventToCanonical: vi.fn()
    });

    await expect(
      refreshPaymentExecution({
        organizationId: "org_local_craft_board",
        executionId: "exec_1"
      })
    ).rejects.toBeInstanceOf(PaymentExecutionConflictError);
  });

  it("ingests a provider event and persists normalized event data", async () => {
    repositoryMocks.getProviderEventByDedupeKey.mockResolvedValueOnce(null);
    repositoryMocks.findExecutionByProviderLookup.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      depositRequestId: "deposit_1",
      paymentId: "payment_1"
    });
    repositoryMocks.createProviderEventRecord.mockResolvedValueOnce({
      id: "event_1",
      organizationId: "org_local_craft_board",
      provider: "STRIPE",
      eventType: "checkout.session.completed",
      providerEventId: "evt_1",
      providerObjectId: "cs_1",
      executionId: "exec_1",
      paymentId: "payment_1",
      depositRequestId: "deposit_1",
      proposalId: "proposal_1",
      receivedAt: new Date("2026-03-10T00:00:00.000Z"),
      processedAt: new Date("2026-03-10T00:00:01.000Z"),
      processingStatus: "PROCESSED",
      dedupeKey: "STRIPE:evt_1",
      payload: { id: "evt_1" },
      errorMessage: null,
      metadata: { stubbed: true },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:01.000Z")
    });
    repositoryMocks.getProviderEventById.mockResolvedValueOnce({
      id: "event_1",
      organizationId: "org_local_craft_board",
      provider: "STRIPE",
      eventType: "checkout.session.completed",
      providerEventId: "evt_1",
      providerObjectId: "cs_1",
      executionId: "exec_1",
      paymentId: "payment_1",
      depositRequestId: "deposit_1",
      proposalId: "proposal_1",
      receivedAt: new Date("2026-03-10T00:00:00.000Z"),
      processedAt: new Date("2026-03-10T00:00:01.000Z"),
      processingStatus: "PROCESSED",
      dedupeKey: "STRIPE:evt_1",
      payload: { id: "evt_1" },
      errorMessage: null,
      metadata: { stubbed: true },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:01.000Z")
    });

    const payload = await ingestProviderEvent({
      organizationId: "org_local_craft_board",
      provider: "STRIPE",
      payload: { id: "evt_1", type: "checkout.session.completed" },
      headers: {}
    });

    expect(repositoryMocks.createProviderEventRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        providerEventId: "evt_1",
        executionId: "exec_1",
        paymentId: "payment_1"
      })
    );
    expect(reconciliationMocks.reconcileProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "SUCCEEDED",
        executionStatus: "COMPLETED"
      })
    );
    expect(payload.event.providerEventId).toBe("evt_1");
  });

  it("rejects duplicate provider events idempotently", async () => {
    repositoryMocks.getProviderEventByDedupeKey.mockResolvedValueOnce({
      id: "event_existing",
      executionId: "exec_1",
      paymentId: "payment_1",
      depositRequestId: "deposit_1"
    });

    await expect(
      ingestProviderEvent({
        organizationId: "org_local_craft_board",
        provider: "STRIPE",
        payload: { id: "evt_1", type: "checkout.session.completed" },
        headers: {}
      })
    ).rejects.toBeInstanceOf(PaymentExecutionConflictError);

    expect(repositoryMocks.createReconciliationLogRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EVENT_DUPLICATE",
        outcome: "SKIPPED"
      })
    );
  });

  it("reads provider events and reconciliation logs in org scope", async () => {
    repositoryMocks.getProviderEventById.mockResolvedValueOnce({
      id: "event_1",
      organizationId: "org_local_craft_board",
      provider: "STRIPE",
      eventType: "checkout.session.completed",
      providerEventId: "evt_1",
      providerObjectId: "cs_1",
      executionId: "exec_1",
      paymentId: "payment_1",
      depositRequestId: "deposit_1",
      proposalId: "proposal_1",
      receivedAt: new Date("2026-03-10T00:00:00.000Z"),
      processedAt: new Date("2026-03-10T00:00:01.000Z"),
      processingStatus: "PROCESSED",
      dedupeKey: "STRIPE:evt_1",
      payload: { id: "evt_1" },
      errorMessage: null,
      metadata: null,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:01.000Z")
    });
    repositoryMocks.getPaymentExecutionById.mockResolvedValueOnce({
      id: "exec_1",
      organizationId: "org_local_craft_board"
    });
    repositoryMocks.listReconciliationLogsForExecution.mockResolvedValueOnce([
      {
        id: "log_1",
        organizationId: "org_local_craft_board",
        provider: "STRIPE",
        executionId: "exec_1",
        providerEventId: "event_1",
        paymentId: "payment_1",
        depositRequestId: "deposit_1",
        action: "PAYMENT_MARKED_SUCCEEDED",
        outcome: "APPLIED",
        message: "ok",
        details: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z")
      }
    ]);

    const eventPayload = await getProviderEventView({
      organizationId: "org_local_craft_board",
      eventId: "event_1"
    });
    const logsPayload = await listReconciliationLogsView({
      organizationId: "org_local_craft_board",
      executionId: "exec_1"
    });

    expect(eventPayload.event.id).toBe("event_1");
    expect(logsPayload.logs).toHaveLength(1);
  });
});
