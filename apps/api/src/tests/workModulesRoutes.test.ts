import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getWorkModuleReadContext: vi.fn(() => ({
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
  listWorkModulesView: vi.fn(),
  getWorkModuleDetailView: vi.fn()
}));

vi.mock("../modules/projects/adapters/contextAdapter.js", () => contextMocks);
vi.mock("../modules/workModules/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import workModulesRouter from "../routes/workModules.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/work-modules", workModulesRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  contextMocks.getWorkModuleReadContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  serviceMocks.listWorkModulesView.mockResolvedValue({
    ok: true,
    workModules: []
  });
  serviceMocks.getWorkModuleDetailView.mockResolvedValue({
    ok: true,
    workModule: {
      id: "phase_1",
      name: "Scheduling"
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

describe("work module routes", () => {
  it("lists work modules using target org context", async () => {
    const response = await fetch(`${baseUrl}/work-modules?projectId=proj_alpha`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.listWorkModulesView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectLookup: "proj_alpha"
    });
    expect(payload.ok).toBe(true);
  });

  it("returns 404 for a missing work module", async () => {
    serviceMocks.getWorkModuleDetailView.mockRejectedValueOnce(new Error("Work module not found."));

    const response = await fetch(`${baseUrl}/work-modules/missing`);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
  });

  it("returns 403 when capability enforcement rejects access", async () => {
    contextMocks.getWorkModuleReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/work-modules`);
    expect(response.status).toBe(403);
  });
});
