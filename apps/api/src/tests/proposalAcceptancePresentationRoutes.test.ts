import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProposalAcceptancePresentationReadContext: vi.fn(() => ({
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
  ProposalAcceptancePresentationTokenError: class ProposalAcceptancePresentationTokenError extends Error {},
  getPublicConfirmation: vi.fn(),
  getPublicPresentationState: vi.fn(),
  getReadyToConfirmState: vi.fn(),
  getSignerInstructions: vi.fn(),
  listPresentationLogsForProposal: vi.fn(),
  recordPresentationViewed: vi.fn()
}));

vi.mock("../modules/proposalAcceptancePresentation/contextAdapter.js", () => contextMocks);
vi.mock("../modules/proposalAcceptancePresentation/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import proposalAcceptancePresentationRouter from "../routes/proposalAcceptancePresentation.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", proposalAcceptancePresentationRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();

  contextMocks.getProposalAcceptancePresentationReadContext.mockReturnValue({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  });

  serviceMocks.getPublicPresentationState.mockResolvedValue({
    ok: true,
    presentation: {
      state: "REVIEW_READY"
    }
  });
  serviceMocks.getSignerInstructions.mockResolvedValue({
    ok: true,
    instructions: {
      state: "INSTRUCTIONS_READY",
      instructions: []
    }
  });
  serviceMocks.getReadyToConfirmState.mockResolvedValue({
    ok: true,
    ready: {
      state: "READY_TO_CONFIRM"
    }
  });
  serviceMocks.getPublicConfirmation.mockResolvedValue({
    ok: true,
    confirmation: {
      state: "CONFIRMED"
    }
  });
  serviceMocks.recordPresentationViewed.mockResolvedValue({ ok: true });
  serviceMocks.listPresentationLogsForProposal.mockResolvedValue({ ok: true, logs: [] });
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

describe("proposal acceptance presentation routes", () => {
  it("returns presentation state for valid tokens", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/presentation-state`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.getPublicPresentationState).toHaveBeenCalledWith({
      token: "presentation_token_1234567890"
    });
  });

  it("returns instructions, ready-state, and confirmation for valid tokens", async () => {
    const instructionsResponse = await fetch(`${baseUrl}/public/proposal-acceptance/instructions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });
    const readyResponse = await fetch(`${baseUrl}/public/proposal-acceptance/ready-state`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });
    const confirmationResponse = await fetch(`${baseUrl}/public/proposal-acceptance/confirmation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });

    expect(instructionsResponse.status).toBe(200);
    expect(readyResponse.status).toBe(200);
    expect(confirmationResponse.status).toBe(200);
  });

  it("tracks presentation viewed events", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/presentation-viewed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.recordPresentationViewed).toHaveBeenCalledWith({
      token: "presentation_token_1234567890"
    });
  });

  it("returns safe generic errors for invalid presentation tokens", async () => {
    serviceMocks.getPublicPresentationState.mockRejectedValueOnce(
      new serviceMocks.ProposalAcceptancePresentationTokenError("Invalid or expired acceptance token.")
    );

    const response = await fetch(`${baseUrl}/public/proposal-acceptance/presentation-state`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      code: "INVALID",
      error: "This acceptance link is not available."
    });
  });

  it("does not leak internal data in public payloads", async () => {
    serviceMocks.getPublicConfirmation.mockResolvedValueOnce({
      ok: true,
      confirmation: {
        state: "CONFIRMED",
        confirmationSummary: {
          headline: "Confirmation received",
          detail: "Your acceptance was received.",
          submittedAt: null,
          confirmedAt: null
        }
      }
    });

    const response = await fetch(`${baseUrl}/public/proposal-acceptance/confirmation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "presentation_token_1234567890" })
    });
    const payload = await response.json();

    expect(payload.confirmation.internalId).toBeUndefined();
  });

  it("enforces capability checks on internal presentation-log routes", async () => {
    contextMocks.getProposalAcceptancePresentationReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-presentation-logs`);
    expect(response.status).toBe(403);
  });

  it("lists presentation logs in org scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-presentation-logs`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listPresentationLogsForProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });
});
