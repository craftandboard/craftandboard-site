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
  createCraftBoardProductionJobFromOrder: vi.fn(),
  getCraftBoardProductionBoard: vi.fn(),
  listCraftBoardProductionJobs: vi.fn(),
  getCraftBoardProductionJobDetail: vi.fn(),
  updateCraftBoardProductionJob: vi.fn()
}));

vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);
vi.mock("../modules/craftBoardProductionJobs/service.js", () => serviceMocks);

import craftBoardProductionJobsRouter from "../routes/craftBoardProductionJobs.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardProductionJobsRouter);

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
    currentOrganization: { id: "org_local_craft_board" },
    currentUser: { email: "demo@craftboard.local", name: "Craft Board Owner" }
  });
  serviceMocks.createCraftBoardProductionJobFromOrder.mockResolvedValue({
    ok: true,
    productionJob: { id: "cbj_1" }
  });
  serviceMocks.listCraftBoardProductionJobs.mockResolvedValue({
    ok: true,
    productionJobs: []
  });
  serviceMocks.getCraftBoardProductionBoard.mockResolvedValue({
    ok: true,
    productionJobs: []
  });
  serviceMocks.getCraftBoardProductionJobDetail.mockResolvedValue({
    ok: true,
    productionJob: { id: "cbj_1" }
  });
  serviceMocks.updateCraftBoardProductionJob.mockResolvedValue({
    ok: true,
    productionJob: { id: "cbj_1", status: "READY_FOR_BUILD" }
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

describe("craft board production job routes", () => {
  it("creates a production job from an order", async () => {
    const response = await fetch(`${baseUrl}/craft-board/orders/cbo_1/production-job`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productionPrepNotes: "Prep the white oak shelf"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardProductionJobFromOrder).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      orderId: "cbo_1",
      actorName: "Craft Board Owner",
      productionPrepNotes: "Prep the white oak shelf"
    });
  });

  it("lists production jobs", async () => {
    const response = await fetch(`${baseUrl}/craft-board/production-jobs?status=RELEASED&q=alice`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listCraftBoardProductionJobs).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "RELEASED",
      query: "alice"
    });
  });

  it("lists the production board", async () => {
    const response = await fetch(
      `${baseUrl}/craft-board/production-board?q=oak&includeFulfilled=true`
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardProductionBoard).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "oak",
      includeFulfilled: true,
      includeCancelled: undefined
    });
  });

  it("reads production job detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/production-jobs/cbj_1`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardProductionJobDetail).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbj_1"
    });
  });

  it("updates production job detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/production-jobs/cbj_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "READY_FOR_BUILD",
        checklistReadyForBuild: true
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCraftBoardProductionJob).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbj_1",
      status: "READY_FOR_BUILD",
      checklistReadyForBuild: true
    });
  });
});
