import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProposalAcceptanceReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getProposalAcceptanceWriteContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getProposalConversionReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getProposalConversionWriteContext: vi.fn(() => ({
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
  ProposalOrchestrationConflictError: class ProposalOrchestrationConflictError extends Error {},
  acceptProposal: vi.fn(),
  cancelAcceptance: vi.fn(),
  createOrGetAcceptance: vi.fn(),
  convertProposalToProject: vi.fn(),
  evaluateConversionEligibility: vi.fn(),
  getAcceptanceByProposal: vi.fn(),
  getConversionByProposal: vi.fn(),
  listOrchestrationLogsForProposal: vi.fn(),
  rejectProposal: vi.fn()
}));

vi.mock("../modules/proposalOrchestration/contextAdapter.js", () => contextMocks);
vi.mock("../modules/proposalOrchestration/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import proposalOrchestrationRouter from "../routes/proposalOrchestration.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", proposalOrchestrationRouter);

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

  contextMocks.getProposalAcceptanceReadContext.mockReturnValue(defaultContext);
  contextMocks.getProposalAcceptanceWriteContext.mockReturnValue(defaultContext);
  contextMocks.getProposalConversionReadContext.mockReturnValue(defaultContext);
  contextMocks.getProposalConversionWriteContext.mockReturnValue(defaultContext);

  serviceMocks.createOrGetAcceptance.mockResolvedValue({ ok: true, acceptance: { id: "acceptance_1" } });
  serviceMocks.getAcceptanceByProposal.mockResolvedValue({ ok: true, acceptance: { id: "acceptance_1" } });
  serviceMocks.acceptProposal.mockResolvedValue({ ok: true, acceptance: { id: "acceptance_1", status: "ACCEPTED" } });
  serviceMocks.rejectProposal.mockResolvedValue({ ok: true, acceptance: { id: "acceptance_1", status: "REJECTED" } });
  serviceMocks.cancelAcceptance.mockResolvedValue({ ok: true, acceptance: { id: "acceptance_1", status: "CANCELED" } });
  serviceMocks.evaluateConversionEligibility.mockResolvedValue({
    ok: true,
    eligibility: { eligible: true, reasons: [], requiredActions: [], snapshot: {} },
    conversion: { id: "conversion_1", status: "ELIGIBLE" }
  });
  serviceMocks.getConversionByProposal.mockResolvedValue({ ok: true, conversion: { id: "conversion_1" } });
  serviceMocks.convertProposalToProject.mockResolvedValue({
    ok: true,
    conversion: { id: "conversion_1", status: "CONVERTED" },
    project: { id: "project_1" }
  });
  serviceMocks.listOrchestrationLogsForProposal.mockResolvedValue({ ok: true, logs: [] });
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

describe("proposal orchestration routes", () => {
  it("creates an acceptance record", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisionSource: "MANUAL_INTERNAL" })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createOrGetAcceptance).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      decisionSource: "MANUAL_INTERNAL"
    });
  });

  it("patches acceptance with accept action", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "accept", decisionSource: "MANUAL_INTERNAL" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.acceptProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1",
      decisionSource: "MANUAL_INTERNAL",
      note: undefined,
      metadata: undefined
    });
  });

  it("evaluates conversion eligibility in proposal scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/conversion-evaluation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.evaluateConversionEligibility).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1"
    });
  });

  it("converts a proposal through the orchestrator", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/convert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.convertProposalToProject).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      membershipId: "membership_1",
      metadata: undefined
    });
  });

  it("returns 409 for orchestration conflicts", async () => {
    serviceMocks.convertProposalToProject.mockRejectedValueOnce(
      new serviceMocks.ProposalOrchestrationConflictError("Proposal conversion is blocked.")
    );

    const response = await fetch(`${baseUrl}/proposals/proposal_1/convert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(409);
  });

  it("returns 403 on capability failure", async () => {
    contextMocks.getProposalConversionReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals/proposal_1/conversion`);
    expect(response.status).toBe(403);
  });

  it("lists orchestration logs in scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/orchestration-logs`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listOrchestrationLogsForProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });
});
