import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestContextMocks = vi.hoisted(() => ({
  getRequestContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    },
    currentUser: {
      email: "demo@craftboard.local",
      name: "Craft Board Owner"
    }
  })),
  RequestAuthenticationError: class RequestAuthenticationError extends Error {}
}));

const authorizationMocks = vi.hoisted(() => ({
  AuthorizationError: class AuthorizationError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  createCraftBoardDepositRequestFromProposal: vi.fn(),
  listCraftBoardDepositRequests: vi.fn(),
  getCraftBoardDepositRequestDetail: vi.fn(),
  updateCraftBoardDepositRequest: vi.fn(),
  getPublicCraftBoardDepositRequest: vi.fn(),
  markCraftBoardDepositViewed: vi.fn(),
  initiateCraftBoardDepositPayment: vi.fn()
}));

vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);
vi.mock("../modules/craftBoardDeposits/service.js", () => serviceMocks);

import craftBoardDepositsRouter from "../routes/craftBoardDeposits.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardDepositsRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  requestContextMocks.getRequestContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    },
    currentUser: {
      email: "demo@craftboard.local",
      name: "Craft Board Owner"
    }
  });
  serviceMocks.createCraftBoardDepositRequestFromProposal.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1" }
  });
  serviceMocks.listCraftBoardDepositRequests.mockResolvedValue({
    ok: true,
    depositRequests: []
  });
  serviceMocks.getCraftBoardDepositRequestDetail.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1" }
  });
  serviceMocks.updateCraftBoardDepositRequest.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1", status: "READY" }
  });
  serviceMocks.getPublicCraftBoardDepositRequest.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1", status: "VIEWED" }
  });
  serviceMocks.markCraftBoardDepositViewed.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1", status: "VIEWED" }
  });
  serviceMocks.initiateCraftBoardDepositPayment.mockResolvedValue({
    ok: true,
    depositRequest: { id: "cbd_1", status: "PAYMENT_INITIATED" }
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

describe("craft board deposit routes", () => {
  it("creates a deposit request from a proposal", async () => {
    const response = await fetch(`${baseUrl}/craft-board/proposals/cbp_1/deposit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        depositType: "PERCENTAGE",
        depositPercentBasisPoints: 5000
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardDepositRequestFromProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "cbp_1",
      actorName: "Craft Board Owner",
      depositType: "PERCENTAGE",
      depositPercentBasisPoints: 5000
    });
  });

  it("lists deposits", async () => {
    const response = await fetch(`${baseUrl}/craft-board/deposits?status=READY&q=alice`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listCraftBoardDepositRequests).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "READY",
      query: "alice"
    });
  });

  it("reads deposit detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/deposits/cbd_1`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardDepositRequestDetail).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbd_1"
    });
  });

  it("updates deposit detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/deposits/cbd_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "READY",
        title: "Deposit Request"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCraftBoardDepositRequest).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbd_1",
      actorName: "Craft Board Owner",
      status: "READY",
      title: "Deposit Request"
    });
  });

  it("reads a public deposit token", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/deposits/token_123`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getPublicCraftBoardDepositRequest).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });

  it("tracks a public deposit view", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/deposits/token_123/view`, {
      method: "POST"
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.markCraftBoardDepositViewed).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });

  it("tracks payment initiation", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/deposits/token_123/payment-init`, {
      method: "POST"
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.initiateCraftBoardDepositPayment).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });
});
