import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getDepositReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getDepositWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPaymentReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPaymentWriteContext: vi.fn(() => ({
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

const serviceMocks = vi.hoisted(() => ({
  createDepositRequest: vi.fn(),
  getDepositRequestView: vi.fn(),
  getPaymentView: vi.fn(),
  getProposalPaymentSummaryView: vi.fn(),
  listDepositRequestsView: vi.fn(),
  listPaymentsView: vi.fn(),
  recordPayment: vi.fn(),
  updateDepositRequest: vi.fn(),
  updatePaymentStatus: vi.fn()
}));

vi.mock("../modules/payments/contextAdapter.js", () => contextMocks);
vi.mock("../modules/payments/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import paymentsRouter from "../routes/payments.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", paymentsRouter);

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

  contextMocks.getDepositReadContext.mockReturnValue(defaultContext);
  contextMocks.getDepositWriteContext.mockReturnValue(defaultContext);
  contextMocks.getPaymentReadContext.mockReturnValue(defaultContext);
  contextMocks.getPaymentWriteContext.mockReturnValue(defaultContext);

  serviceMocks.createDepositRequest.mockResolvedValue({ ok: true, depositRequest: { id: "deposit_1" } });
  serviceMocks.listDepositRequestsView.mockResolvedValue({ ok: true, depositRequests: [] });
  serviceMocks.getDepositRequestView.mockResolvedValue({ ok: true, depositRequest: { id: "deposit_1" } });
  serviceMocks.recordPayment.mockResolvedValue({ ok: true, payment: { id: "payment_1" } });
  serviceMocks.listPaymentsView.mockResolvedValue({ ok: true, payments: [] });
  serviceMocks.getPaymentView.mockResolvedValue({ ok: true, payment: { id: "payment_1" } });
  serviceMocks.updateDepositRequest.mockResolvedValue({ ok: true, depositRequest: { id: "deposit_1" } });
  serviceMocks.updatePaymentStatus.mockResolvedValue({ ok: true, payment: { id: "payment_1" } });
  serviceMocks.getProposalPaymentSummaryView.mockResolvedValue({
    ok: true,
    summary: {
      requestedAmountCents: 50000,
      paidAmountCents: 0,
      outstandingAmountCents: 50000,
      depositRequestedAmountCents: 50000,
      depositPaidAmountCents: 0,
      hasOpenDepositRequest: true
    }
  });
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

describe("payments routes", () => {
  it("creates a deposit request through target org context", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/deposit-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: 50000 })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createDepositRequest).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      amountCents: 50000
    });
  });

  it("lists deposit requests with org scoping", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/deposit-requests`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listDepositRequestsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });

  it("returns 404 for missing deposit request detail", async () => {
    serviceMocks.getDepositRequestView.mockRejectedValueOnce(new Error("Deposit request not found."));

    const response = await fetch(`${baseUrl}/deposit-requests/missing`);
    expect(response.status).toBe(404);
  });

  it("creates a payment through target org context", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: 10000 })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.recordPayment).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      amountCents: 10000
    });
  });

  it("updates a deposit request through the target write route", async () => {
    const response = await fetch(`${baseUrl}/deposit-requests/deposit_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "REQUESTED" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateDepositRequest).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      depositRequestId: "deposit_1",
      actorMembershipId: "membership_1",
      status: "REQUESTED"
    });
  });

  it("updates a payment through the target write route", async () => {
    const response = await fetch(`${baseUrl}/payments/payment_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "SUCCEEDED" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updatePaymentStatus).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      paymentId: "payment_1",
      actorMembershipId: "membership_1",
      status: "SUCCEEDED"
    });
  });

  it("returns 403 when payment capability enforcement rejects access", async () => {
    contextMocks.getPaymentReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals/proposal_1/payment-summary`);
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid payloads", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: 0 })
    });

    expect(response.status).toBe(400);
  });

  it("returns proposal payment summary through the target runtime", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/payment-summary`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getProposalPaymentSummaryView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });
});
