import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProposalReadContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  })),
  getProposalWriteContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  }))
}));

const requestContextMocks = vi.hoisted(() => ({
  RequestAuthenticationError: class RequestAuthenticationError extends Error {}
}));

const authorizationMocks = vi.hoisted(() => ({
  AuthorizationError: class AuthorizationError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  listProposalsView: vi.fn(),
  getProposalDetailView: vi.fn(),
  createProposal: vi.fn(),
  updateProposal: vi.fn(),
  createProposalSection: vi.fn(),
  updateProposalSection: vi.fn(),
  createProposalLine: vi.fn(),
  updateProposalLine: vi.fn()
}));

vi.mock("../modules/leads/adapters/contextAdapter.js", () => contextMocks);
vi.mock("../modules/proposals/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import proposalsRouter from "../routes/proposals.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/proposals", proposalsRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  contextMocks.getProposalReadContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  contextMocks.getProposalWriteContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  serviceMocks.listProposalsView.mockResolvedValue({
    ok: true,
    proposals: []
  });
  serviceMocks.getProposalDetailView.mockResolvedValue({
    ok: true,
    proposal: {
      id: "proposal_1",
      title: "Kitchen Proposal"
    }
  });
  serviceMocks.createProposal.mockResolvedValue({
    ok: true,
    proposal: {
      id: "proposal_new",
      title: "Kitchen Proposal"
    }
  });
  serviceMocks.updateProposal.mockResolvedValue({
    ok: true,
    proposal: {
      id: "proposal_1",
      title: "Kitchen Proposal"
    }
  });
  serviceMocks.createProposalSection.mockResolvedValue({
    ok: true,
    section: {
      id: "section_1",
      title: "Base Scope"
    }
  });
  serviceMocks.updateProposalSection.mockResolvedValue({
    ok: true,
    section: {
      id: "section_1",
      title: "Updated Scope"
    }
  });
  serviceMocks.createProposalLine.mockResolvedValue({
    ok: true,
    line: {
      id: "line_1",
      name: "Cabinet install"
    }
  });
  serviceMocks.updateProposalLine.mockResolvedValue({
    ok: true,
    line: {
      id: "line_1",
      name: "Cabinet install"
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

describe("proposals routes", () => {
  it("lists proposals using target org context", async () => {
    const response = await fetch(`${baseUrl}/proposals?q=kitchen`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listProposalsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "kitchen"
    });
  });

  it("returns 404 for missing proposal detail", async () => {
    serviceMocks.getProposalDetailView.mockRejectedValueOnce(new Error("Proposal not found."));

    const response = await fetch(`${baseUrl}/proposals/missing`);
    expect(response.status).toBe(404);
  });

  it("returns 403 when capability enforcement rejects access", async () => {
    contextMocks.getProposalReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals`);
    expect(response.status).toBe(403);
  });

  it("creates a proposal using target org context", async () => {
    const response = await fetch(`${baseUrl}/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Kitchen Proposal"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      title: "Kitchen Proposal"
    });
  });

  it("updates a proposal using target org context", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "sent"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      status: "sent"
    });
  });

  it("creates and updates proposal sections", async () => {
    const createResponse = await fetch(`${baseUrl}/proposals/proposal_1/sections`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Base Scope"
      })
    });
    const updateResponse = await fetch(`${baseUrl}/proposals/proposal_1/sections/section_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Updated Scope"
      })
    });

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
  });

  it("creates and updates proposal lines", async () => {
    const createResponse = await fetch(`${baseUrl}/proposals/proposal_1/lines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Cabinet install"
      })
    });
    const updateResponse = await fetch(`${baseUrl}/proposals/proposal_1/lines/line_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        priceCents: 240000
      })
    });

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
  });

  it("rejects invalid proposal payloads", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/lines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: ""
      })
    });

    expect(response.status).toBe(400);
  });
});
