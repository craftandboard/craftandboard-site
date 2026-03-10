import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getPilotFeedbackReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getPilotFeedbackWriteContext: vi.fn(() => ({
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
  createPilotFeedback: vi.fn(),
  listPilotFeedback: vi.fn(),
  updatePilotFeedback: vi.fn()
}));

vi.mock("../modules/pilotFeedback/contextAdapter.js", () => contextMocks);
vi.mock("../modules/pilotFeedback/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import pilotFeedbackRouter from "../routes/pilotFeedback.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", pilotFeedbackRouter);

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

  contextMocks.getPilotFeedbackReadContext.mockReturnValue(defaultContext);
  contextMocks.getPilotFeedbackWriteContext.mockReturnValue(defaultContext);

  serviceMocks.listPilotFeedback.mockResolvedValue({
    ok: true,
    feedback: [],
    summary: {
      openBlockerCount: 0,
      openHighSeverityCount: 0,
      openCount: 0,
      latestSubmittedAt: null
    }
  });
  serviceMocks.createPilotFeedback.mockResolvedValue({
    ok: true,
    feedback: {
      id: "feedback_1"
    }
  });
  serviceMocks.updatePilotFeedback.mockResolvedValue({
    ok: true,
    feedback: {
      id: "feedback_1",
      status: "REVIEWED"
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

describe("pilot feedback routes", () => {
  it("lists feedback in org scope", async () => {
    const response = await fetch(`${baseUrl}/pilot-feedback?area=PROPOSALS&status=NEW`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listPilotFeedback).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      area: "PROPOSALS",
      status: "NEW"
    });
  });

  it("creates feedback in org scope", async () => {
    const response = await fetch(`${baseUrl}/pilot-feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        area: "PROPOSALS",
        severity: "HIGH",
        title: "Totals were easy to miss",
        message: "Tester did not notice the total summary card."
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createPilotFeedback).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      membershipId: "membership_1",
      area: "PROPOSALS",
      severity: "HIGH",
      title: "Totals were easy to miss",
      message: "Tester did not notice the total summary card."
    });
  });

  it("updates feedback status in org scope", async () => {
    const response = await fetch(`${baseUrl}/pilot-feedback/feedback_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "REVIEWED" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updatePilotFeedback).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      feedbackId: "feedback_1",
      status: "REVIEWED"
    });
  });

  it("returns 403 when capability enforcement fails", async () => {
    contextMocks.getPilotFeedbackReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/pilot-feedback`);
    expect(response.status).toBe(403);
  });
});
