import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMocks = vi.hoisted(() => ({
  getProposalAcceptanceReviewReadContext: vi.fn(() => ({
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
  ProposalAcceptanceReviewTokenError: class ProposalAcceptanceReviewTokenError extends Error {},
  getPublicProposalSnapshot: vi.fn(),
  getPublicReviewContext: vi.fn(),
  listReviewLogsForProposal: vi.fn(),
  recordSnapshotViewed: vi.fn()
}));

vi.mock("../modules/proposalAcceptanceReview/contextAdapter.js", () => contextMocks);
vi.mock("../modules/proposalAcceptanceReview/service.js", () => serviceMocks);
vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);

import proposalAcceptanceReviewRouter from "../routes/proposalAcceptanceReview.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", proposalAcceptanceReviewRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();

  contextMocks.getProposalAcceptanceReviewReadContext.mockReturnValue({
    currentOrganization: { id: "org_local_craft_board" },
    membership: { id: "membership_1" }
  });

  serviceMocks.getPublicProposalSnapshot.mockResolvedValue({
    ok: true,
    review: {
      reviewAllowed: true,
      intakeStatus: "OPEN",
      blockedReasons: [],
      nextActions: ["confirm_acceptance"],
      proposal: {
        title: "Kitchen Proposal"
      }
    }
  });
  serviceMocks.getPublicReviewContext.mockResolvedValue({
    ok: true,
    review: {
      reviewAllowed: true,
      intakeStatus: "OPEN",
      blockedReasons: [],
      nextActions: ["confirm_acceptance"],
      proposal: {
        title: "Kitchen Proposal"
      }
    }
  });
  serviceMocks.recordSnapshotViewed.mockResolvedValue({ ok: true });
  serviceMocks.listReviewLogsForProposal.mockResolvedValue({ ok: true, logs: [] });
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

describe("proposal acceptance review routes", () => {
  it("returns public review snapshots for valid tokens", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "review_token_1234567890" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.getPublicProposalSnapshot).toHaveBeenCalledWith({
      token: "review_token_1234567890"
    });
  });

  it("returns public review context for valid tokens", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/review-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "review_token_1234567890" })
    });

    expect(response.status).toBe(200);
  });

  it("records viewed events through the public route", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/viewed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "review_token_1234567890" })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.recordSnapshotViewed).toHaveBeenCalledWith({
      token: "review_token_1234567890"
    });
  });

  it("returns safe generic errors for invalid public tokens", async () => {
    serviceMocks.getPublicProposalSnapshot.mockRejectedValueOnce(
      new serviceMocks.ProposalAcceptanceReviewTokenError("Invalid or expired acceptance token.")
    );

    const response = await fetch(`${baseUrl}/public/proposal-acceptance/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "review_token_1234567890" })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      code: "INVALID",
      error: "This acceptance link is not available."
    });
  });

  it("does not leak internal data on public payloads", async () => {
    const response = await fetch(`${baseUrl}/public/proposal-acceptance/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "review_token_1234567890" })
    });
    const payload = await response.json();

    expect(payload.review.proposal.id).toBeUndefined();
    expect(payload.review.proposal.metadata).toBeUndefined();
  });

  it("enforces capability checks on internal review log routes", async () => {
    contextMocks.getProposalAcceptanceReviewReadContext.mockImplementationOnce(() => {
      throw new authorizationMocks.AuthorizationError("Forbidden.");
    });

    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-review-logs`);
    expect(response.status).toBe(403);
  });

  it("lists review logs in org scope", async () => {
    const response = await fetch(`${baseUrl}/proposals/proposal_1/acceptance-review-logs`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listReviewLogsForProposal).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      proposalId: "proposal_1"
    });
  });
});
