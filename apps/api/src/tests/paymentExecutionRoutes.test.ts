import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getPaymentExecutionReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPaymentExecutionWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPaymentEventReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPaymentEventWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  }))
}));

const requestContextMocks = vi.hoisted(() => ({
  RequestAuthenticationError: class RequestAuthenticationError extends Error {}
}));

const authorizationMocks = vi.hoisted(() => ({
  AuthorizationError: class AuthorizationError extends Error {}
}));

const providerRegistryMocks = vi.hoisted(() => ({
  UnknownPaymentProviderError: class UnknownPaymentProviderError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  PaymentExecutionConflictError: class PaymentExecutionConflictError extends Error {},
  createPaymentExecution: vi.fn(),
  getPaymentExecutionView: vi.fn(),
  getProviderEventView: vi.fn(),
  ingestProviderEvent: vi.fn(),
  listPaymentExecutionsView: vi.fn(),
  listProposalProviderEventsView: vi.fn(),
  listReconciliationLogsView: vi.fn(),
  refreshPaymentExecution: vi.fn()
}));

vi.mock("../modules/paymentExecution/contextAdapter.js", () => contextMocks);
vi.mock("../modules/paymentExecution/providerRegistry.js", () => providerRegistryMocks);
vi.mock("../modules/paymentExecution/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import paymentExecutionRouter from "../routes/paymentExecution.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", paymentExecutionRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();

  const defaultContext = {
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  };

  contextMocks.getPaymentExecutionReadContext.mockReturnValue(defaultContext);
  contextMocks.getPaymentExecutionWriteContext.mockReturnValue(defaultContext);
  contextMocks.getPaymentEventReadContext.mockReturnValue(defaultContext);
  contextMocks.getPaymentEventWriteContext.mockReturnValue(defaultContext);

  serviceMocks.createPaymentExecution.mockResolvedValue({ ok: true, execution: { id: "exec_1" } });
  serviceMocks.listPaymentExecutionsView.mockResolvedValue({ ok: true, executions: [] });
  serviceMocks.getPaymentExecutionView.mockResolvedValue({ ok: true, execution: { id: "exec_1" } });
  serviceMocks.refreshPaymentExecution.mockResolvedValue({ ok: true, execution: { id: "exec_1", status: "OPEN" } });
  serviceMocks.ingestProviderEvent.mockResolvedValue({ ok: true, event: { id: "event_1" } });
  serviceMocks.getProviderEventView.mockResolvedValue({ ok: true, event: { id: "event_1" } });
  serviceMocks.listProposalProviderEventsView.mockResolvedValue({ ok: true, events: [] });
  serviceMocks.listReconciliationLogsView.mockResolvedValue({ ok: true, logs: [] });
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error: Error | undefined) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

describe("payment execution routes", () => {
  it("creates payment executions in proposal scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payment-executions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "STRIPE",
        mode: "HOSTED_CHECKOUT",
        depositRequestId: "deposit_1"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createPaymentExecution).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      provider: "STRIPE",
      mode: "HOSTED_CHECKOUT",
      depositRequestId: "deposit_1"
    });
  });

  it("lists payment executions with org scoping", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payment-executions`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listPaymentExecutionsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });

  it("refreshes payment execution through the target runtime", async () => {
    const response = await fetch(`${baseUrl}/payment-executions/exec_1/refresh`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.refreshPaymentExecution).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      executionId: "exec_1",
      actorMembershipId: "membership_1"
    });
  });

  it("ingests provider events through the target runtime", async () => {
    const response = await fetch(`${baseUrl}/payments/providers/STRIPE/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "evt_1",
        type: "checkout.session.completed"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.ingestProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        provider: "STRIPE"
      })
    );
  });

  it("returns 409 for duplicate event conflicts", async () => {
    serviceMocks.ingestProviderEvent.mockRejectedValueOnce(
      new serviceMocks.PaymentExecutionConflictError("Duplicate provider event.")
    );

    const response = await fetch(`${baseUrl}/payments/providers/STRIPE/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "evt_1",
        type: "checkout.session.completed"
      })
    });

    expect(response.status).toBe(409);
  });

  it("returns 403 when capability enforcement rejects event access", async () => {
    contextMocks.getPaymentEventReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/payments/provider-events/event_1`);
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid execution payloads", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payment-executions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "STRIPE",
        mode: "HOSTED_CHECKOUT"
      })
    });

    expect(response.status).toBe(400);
  });

  it("reads provider event and reconciliation views in scope", async () => {
    const eventResponse = await fetch(`${baseUrl}/payments/provider-events/event_1`);
    const logsResponse = await fetch(`${baseUrl}/payment-executions/exec_1/reconciliation-logs`);

    expect(eventResponse.status).toBe(200);
    expect(logsResponse.status).toBe(200);
    expect(serviceMocks.getProviderEventView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      eventId: "event_1"
    });
    expect(serviceMocks.listReconciliationLogsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      executionId: "exec_1"
    });
  });
});
