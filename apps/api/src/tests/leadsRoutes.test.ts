import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getLeadReadContext: vi.fn(() => ({
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
  listLeadsView: vi.fn(),
  getLeadDetailView: vi.fn()
}));

vi.mock("../modules/leads/adapters/contextAdapter.js", () => contextMocks);
vi.mock("../modules/leads/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import leadsRouter from "../routes/leads.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/leads", leadsRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  contextMocks.getLeadReadContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  serviceMocks.listLeadsView.mockResolvedValue({
    ok: true,
    leads: []
  });
  serviceMocks.getLeadDetailView.mockResolvedValue({
    ok: true,
    lead: {
      id: "lead_1",
      name: "Alice Example"
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

describe("leads routes", () => {
  it("lists leads using target org context", async () => {
    const response = await fetch(`${baseUrl}/leads?q=alice`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listLeadsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "alice"
    });
  });

  it("returns 404 for missing lead detail", async () => {
    serviceMocks.getLeadDetailView.mockRejectedValueOnce(new Error("Lead not found."));

    const response = await fetch(`${baseUrl}/leads/missing`);
    expect(response.status).toBe(404);
  });

  it("returns 403 when capability enforcement rejects access", async () => {
    contextMocks.getLeadReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/leads`);
    expect(response.status).toBe(403);
  });
});

