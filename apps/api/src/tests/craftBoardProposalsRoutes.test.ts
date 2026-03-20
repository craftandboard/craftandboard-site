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
  createCraftBoardProposalFromInquiry: vi.fn(),
  listCraftBoardProposals: vi.fn(),
  getCraftBoardProposalDetail: vi.fn(),
  updateCraftBoardProposal: vi.fn(),
  getPublicCraftBoardProposal: vi.fn(),
  markCraftBoardProposalViewed: vi.fn(),
  approveCraftBoardProposal: vi.fn(),
  declineCraftBoardProposal: vi.fn()
}));

vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);
vi.mock("../modules/craftBoardProposals/service.js", () => serviceMocks);

import craftBoardProposalsRouter from "../routes/craftBoardProposals.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardProposalsRouter);

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
  serviceMocks.createCraftBoardProposalFromInquiry.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1" }
  });
  serviceMocks.listCraftBoardProposals.mockResolvedValue({
    ok: true,
    proposals: []
  });
  serviceMocks.getCraftBoardProposalDetail.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1" }
  });
  serviceMocks.updateCraftBoardProposal.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1", status: "READY" }
  });
  serviceMocks.getPublicCraftBoardProposal.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1", status: "VIEWED" }
  });
  serviceMocks.markCraftBoardProposalViewed.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1", status: "VIEWED" }
  });
  serviceMocks.approveCraftBoardProposal.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1", status: "APPROVED" }
  });
  serviceMocks.declineCraftBoardProposal.mockResolvedValue({
    ok: true,
    proposal: { id: "cbp_1", status: "DECLINED" }
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

describe("craft board proposal routes", () => {
  it("creates a proposal from an inquiry", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries/inq_1/proposal`, {
      method: "POST"
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardProposalFromInquiry).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      inquiryId: "inq_1",
      actorName: "Craft Board Owner"
    });
  });

  it("lists internal proposals", async () => {
    const response = await fetch(`${baseUrl}/craft-board/proposals?status=READY&q=alice`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listCraftBoardProposals).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "READY",
      query: "alice"
    });
  });

  it("reads internal proposal detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/proposals/cbp_1`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardProposalDetail).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbp_1"
    });
  });

  it("updates proposal detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/proposals/cbp_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "READY",
        title: "Shelf Proposal"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCraftBoardProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "cbp_1",
      actorName: "Craft Board Owner",
      status: "READY",
      title: "Shelf Proposal"
    });
  });

  it("reads public proposal by token", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/proposals/token_123`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getPublicCraftBoardProposal).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });

  it("tracks public proposal view", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/proposals/token_123/view`, {
      method: "POST"
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.markCraftBoardProposalViewed).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });

  it("approves a public proposal", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/proposals/token_123/respond`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "approve"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.approveCraftBoardProposal).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });

  it("declines a public proposal", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/proposals/token_123/respond`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "decline"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.declineCraftBoardProposal).toHaveBeenCalledWith({
      publicToken: "token_123"
    });
  });
});
