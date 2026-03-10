import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProjectReadContext: vi.fn(() => ({
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
  listProjectsView: vi.fn(),
  getProjectDetailView: vi.fn()
}));

vi.mock("../modules/projects/adapters/contextAdapter.js", () => contextMocks);
vi.mock("../modules/projects/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import projectsRouter from "../routes/projects.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/projects", projectsRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  contextMocks.getProjectReadContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  serviceMocks.listProjectsView.mockResolvedValue({
    ok: true,
    projects: []
  });
  serviceMocks.getProjectDetailView.mockResolvedValue({
    ok: true,
    project: {
      id: "proj_1",
      name: "Kitchen Remodel"
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

describe("projects routes", () => {
  it("lists projects using target org context", async () => {
    const response = await fetch(`${baseUrl}/projects?q=kitchen`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.listProjectsView).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      query: "kitchen"
    });
    expect(payload.ok).toBe(true);
  });

  it("returns 401 when context adapter rejects authentication", async () => {
    contextMocks.getProjectReadContext.mockImplementationOnce(() => {
      throw new requestContextMocks.RequestAuthenticationError("Authentication required.");
    });

    const response = await fetch(`${baseUrl}/projects`);
    expect(response.status).toBe(401);
  });

  it("returns 403 when capability enforcement rejects access", async () => {
    contextMocks.getProjectReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/projects`);
    expect(response.status).toBe(403);
  });

  it("returns 404 for missing project detail", async () => {
    serviceMocks.getProjectDetailView.mockRejectedValueOnce(new Error("Project not found."));

    const response = await fetch(`${baseUrl}/projects/missing`);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
  });
});
