import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProposalAcceptanceIntakeReadContext: vi.fn(() => ({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  })),
  getProposalAcceptanceIntakeWriteContext: vi.fn(() => ({
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

const providerAdapterMocks = vi.hoisted(() => ({
  UnknownAcceptanceProviderError: class UnknownAcceptanceProviderError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  ProposalAcceptanceIntakeConflictError: class ProposalAcceptanceIntakeConflictError extends Error {},
  ProposalAcceptancePublicTokenError: class ProposalAcceptancePublicTokenError extends Error {},
  createIntakeSession: vi.fn(),
  getIntakeById: vi.fn(),
  ingestProviderAcceptanceSignal: vi.fn(),
  listEvidenceForIntake: vi.fn(),
  listIntakeLogsForProposal: vi.fn(),
  listIntakesForProposal: vi.fn(),
  revokeIntakeSession: vi.fn(),
  submitExternalAcceptance: vi.fn(),
  validatePublicToken: vi.fn()
}));

vi.mock("../modules/proposalAcceptanceIntake/contextAdapter.js", () => contextMocks);
vi.mock("../modules/proposalAcceptanceIntake/providerAdapter.js", () => providerAdapterMocks);
vi.mock("../modules/proposalAcceptanceIntake/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import proposalAcceptanceIntakeRouter from "../routes/proposalAcceptanceIntake.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", proposalAcceptanceIntakeRouter);

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

  contextMocks.getProposalAcceptanceIntakeReadContext.mockReturnValue(defaultContext);
  contextMocks.getProposalAcceptanceIntakeWriteContext.mockReturnValue(defaultContext);

  serviceMocks.createIntakeSession.mockResolvedValue({ ok: true, intake: { id: "intake_1" } });
  serviceMocks.listIntakesForProposal.mockResolvedValue({ ok: true, intakes: [] });
  serviceMocks.getIntakeById.mockResolvedValue({ ok: true, intake: { id: "intake_1" } });
  serviceMocks.revokeIntakeSession.mockResolvedValue({ ok: true, intake: { id: "intake_1", status: "REVOKED" } });
  serviceMocks.listEvidenceForIntake.mockResolvedValue({ ok: true, evidence: [] });
  serviceMocks.listIntakeLogsForProposal.mockResolvedValue({ ok: true, logs: [] });
  serviceMocks.validatePublicToken.mockResolvedValue({ ok: true, valid: true, intake: { id: "intake_1" } });
  serviceMocks.submitExternalAcceptance.mockResolvedValue({ ok: true, intake: { id: "intake_1", status: "HANDOFF_ACCEPTED" } });
  serviceMocks.ingestProviderAcceptanceSignal.mockResolvedValue({ ok: true, intake: { id: "intake_1" } });
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

describe("proposal acceptance intake routes", () => {
  it("creates intake sessions in proposal scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-intakes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "PUBLIC_TOKEN" })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createIntakeSession).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1",
      actorMembershipId: "membership_1",
      source: "PUBLIC_TOKEN"
    });
  });

  it("lists and reads intake resources in org scope", async () => {
    const listResponse = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-intakes`);
    const getResponse = await fetch(`${baseUrl}/acceptance-intakes/intake_1`);

    expect(listResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(serviceMocks.listIntakesForProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
    expect(serviceMocks.getIntakeById).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      intakeId: "intake_1"
    });
  });

  it("revokes intake sessions through the authenticated route", async () => {
    const response = await fetch(`${baseUrl}/acceptance-intakes/intake_1/revoke`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: "revoked" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.revokeIntakeSession).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      intakeId: "intake_1",
      actorMembershipId: "membership_1",
      note: "revoked"
    });
  });

  it("lists evidence and intake logs", async () => {
    const evidenceResponse = await fetch(`${baseUrl}/acceptance-intakes/intake_1/evidence`);
    const logsResponse = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-intake-logs`);

    expect(evidenceResponse.status).toBe(200);
    expect(logsResponse.status).toBe(200);
  });

  it("validates and submits public acceptance tokens", async () => {
    const validateResponse = await fetch(`${baseUrl}/public/proposal-acceptance/validate-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "token_public_1234567890" })
    });
    const submitResponse = await fetch(`${baseUrl}/public/proposal-acceptance/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: "token_public_1234567890",
        confirmed: true,
        signerName: "Alice Example"
      })
    });

    expect(validateResponse.status).toBe(200);
    expect(submitResponse.status).toBe(200);
  });

  it("returns safe generic errors for invalid public tokens", async () => {
    serviceMocks.submitExternalAcceptance.mockRejectedValueOnce(
      new serviceMocks.ProposalAcceptancePublicTokenError("Invalid or expired acceptance token.")
    );

    const response = await fetch(`${baseUrl}/public/proposal-acceptance/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: "bad_token_bad_token",
        confirmed: true,
        signerName: "Alice Example"
      })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Invalid or expired acceptance token."
    });
  });

  it("ingests provider acceptance signals without auth context", async () => {
    const response = await fetch(`${baseUrl}/payments/providers/STRIPE/acceptance-signals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        proposalLookup: "proposal_1",
        providerReference: "event_1"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.ingestProviderAcceptanceSignal).toHaveBeenCalledWith({
      provider: "STRIPE",
      payload: {
        proposalLookup: "proposal_1",
        providerReference: "event_1"
      },
      headers: expect.any(Object)
    });
  });

  it("returns 403 when authenticated capability checks fail", async () => {
    contextMocks.getProposalAcceptanceIntakeReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-intakes`);
    expect(response.status).toBe(403);
  });
});
