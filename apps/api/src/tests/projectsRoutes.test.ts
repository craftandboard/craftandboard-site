import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProjectReadContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  })),
  getProjectWriteContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  })),
  getProjectTaskWriteContext: vi.fn(() => ({
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
  getProjectDetailView: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  createProjectTask: vi.fn(),
  updateProjectTask: vi.fn()
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
  contextMocks.getProjectWriteContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    }
  });
  contextMocks.getProjectTaskWriteContext.mockReturnValue({
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
  serviceMocks.createProject.mockResolvedValue({
    ok: true,
    project: {
      id: "proj_new",
      name: "New Project"
    }
  });
  serviceMocks.updateProject.mockResolvedValue({
    ok: true,
    project: {
      id: "proj_1",
      name: "Updated Project"
    }
  });
  serviceMocks.createProjectTask.mockResolvedValue({
    ok: true,
    task: {
      id: "task_1",
      title: "Confirm schedule"
    }
  });
  serviceMocks.updateProjectTask.mockResolvedValue({
    ok: true,
    task: {
      id: "task_1",
      title: "Confirm schedule"
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

  it("returns 403 when write capability enforcement rejects access", async () => {
    contextMocks.getProjectWriteContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Alpha Project"
      })
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 for missing project detail", async () => {
    serviceMocks.getProjectDetailView.mockRejectedValueOnce(new Error("Project not found."));

    const response = await fetch(`${baseUrl}/projects/missing`);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
  });

  it("creates a project using target org context", async () => {
    const response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: "alpha",
        name: "Alpha Project",
        status: "planned"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createProject).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      key: "alpha",
      name: "Alpha Project",
      status: "planned"
    });
  });

  it("updates a project through the target write route", async () => {
    const response = await fetch(`${baseUrl}/projects/proj_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "in_progress"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateProject).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      status: "in_progress"
    });
  });

  it("rejects invalid project creation payloads", async () => {
    const response = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: ""
      })
    });

    expect(response.status).toBe(400);
  });

  it("creates a project task in project scope", async () => {
    const response = await fetch(`${baseUrl}/projects/proj_1/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phaseId: "phase_1",
        title: "Confirm schedule",
        isRequired: true
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createProjectTask).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      phaseId: "phase_1",
      title: "Confirm schedule",
      status: undefined,
      dueDate: undefined,
      assignedToUserId: undefined,
      isRequired: true
    });
  });

  it("updates a project task in project scope", async () => {
    const response = await fetch(`${baseUrl}/projects/proj_1/tasks/task_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "DONE"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateProjectTask).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      projectId: "proj_1",
      taskId: "task_1",
      title: undefined,
      status: "DONE",
      dueDate: undefined,
      assignedToUserId: undefined,
      isRequired: undefined
    });
  });
});
