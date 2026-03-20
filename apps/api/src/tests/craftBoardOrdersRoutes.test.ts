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
  createCraftBoardOrderFromProposal: vi.fn(),
  listCraftBoardOrders: vi.fn(),
  getCraftBoardOrderDetail: vi.fn(),
  updateCraftBoardOrder: vi.fn()
}));

vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);
vi.mock("../modules/craftBoardOrders/service.js", () => serviceMocks);

import craftBoardOrdersRouter from "../routes/craftBoardOrders.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardOrdersRouter);

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
  serviceMocks.createCraftBoardOrderFromProposal.mockResolvedValue({
    ok: true,
    order: { id: "cbo_1" }
  });
  serviceMocks.listCraftBoardOrders.mockResolvedValue({
    ok: true,
    orders: []
  });
  serviceMocks.getCraftBoardOrderDetail.mockResolvedValue({
    ok: true,
    order: { id: "cbo_1" }
  });
  serviceMocks.updateCraftBoardOrder.mockResolvedValue({
    ok: true,
    order: { id: "cbo_1", status: "PREP_IN_PROGRESS" }
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

describe("craft board order routes", () => {
  it("creates an order from a proposal", async () => {
    const response = await fetch(`${baseUrl}/craft-board/proposals/cbp_1/order`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        internalReleaseNotes: "Ready to release"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardOrderFromProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "cbp_1",
      actorName: "Craft Board Owner",
      internalReleaseNotes: "Ready to release"
    });
  });

  it("lists orders", async () => {
    const response = await fetch(`${baseUrl}/craft-board/orders?status=RELEASED&q=alice`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listCraftBoardOrders).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "RELEASED",
      query: "alice"
    });
  });

  it("reads order detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/orders/cbo_1`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardOrderDetail).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbo_1"
    });
  });

  it("updates order detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/orders/cbo_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "PREP_IN_PROGRESS",
        productionPrepNotes: "Material confirmed"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCraftBoardOrder).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbo_1",
      status: "PREP_IN_PROGRESS",
      productionPrepNotes: "Material confirmed"
    });
  });
});
