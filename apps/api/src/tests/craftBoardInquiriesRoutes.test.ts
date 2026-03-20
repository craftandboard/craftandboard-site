import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestContextMocks = vi.hoisted(() => ({
  getRequestContext: vi.fn(() => ({
    currentOrganization: {
      id: "org_local_craft_board"
    },
    currentUser: {
      email: "demo@craftboard.local",
      name: "Craft Board Owner"
    }
  })),
  RequestAuthenticationError: class RequestAuthenticationError extends Error {}
}));

const authorizationMocks = vi.hoisted(() => ({
  AuthorizationError: class AuthorizationError extends Error {}
}));

const serviceMocks = vi.hoisted(() => ({
  createCraftBoardInquiry: vi.fn(),
  listCraftBoardInquiries: vi.fn(),
  getCraftBoardInquiryDetail: vi.fn(),
  updateCraftBoardInquiry: vi.fn()
}));

vi.mock("../lib/requestContext.js", () => requestContextMocks);
vi.mock("../lib/authorization.js", () => authorizationMocks);
vi.mock("../modules/craftBoardInquiries/service.js", () => serviceMocks);

import craftBoardInquiriesRouter from "../routes/craftBoardInquiries.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardInquiriesRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  requestContextMocks.getRequestContext.mockReturnValue({
    currentOrganization: {
      id: "org_local_craft_board"
    },
    currentUser: {
      email: "demo@craftboard.local",
      name: "Craft Board Owner"
    }
  });
  serviceMocks.createCraftBoardInquiry.mockResolvedValue({
    ok: true,
    inquiry: { id: "inq_1" }
  });
  serviceMocks.listCraftBoardInquiries.mockResolvedValue({
    ok: true,
    inquiries: []
  });
  serviceMocks.getCraftBoardInquiryDetail.mockResolvedValue({
    ok: true,
    inquiry: {
      id: "inq_1"
    }
  });
  serviceMocks.updateCraftBoardInquiry.mockResolvedValue({
    ok: true,
    inquiry: {
      id: "inq_1",
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

describe("craft board inquiry routes", () => {
  it("creates a public inquiry", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productFamily: "floating-shelves",
        productName: "Classic Floating Shelf",
        customerName: "Alice Example",
        customerEmail: "alice@example.com",
        widthValue: 72,
        depthValue: 10,
        thicknessValue: 2,
        quantity: 1,
        materialLabel: "White Oak",
        mountingLabel: "Standard concealed bracket",
        configurationJson: {
          product: "classic-floating-shelf"
        }
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_local_craft_board",
        productFamily: "floating-shelves",
        customerEmail: "alice@example.com"
      })
    );
  });

  it("lists internal inquiries", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries?status=NEW&q=alice&estimateState=needs-estimate`);

    expect(response.status).toBe(200);
    expect(serviceMocks.listCraftBoardInquiries).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      status: "NEW",
      query: "alice",
      productFamily: undefined,
      assignedToUserId: undefined,
      estimateState: "needs-estimate"
    });
  });

  it("reads inquiry detail", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries/inq_1`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardInquiryDetail).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      id: "inq_1"
    });
  });

  it("updates inquiry status", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries/inq_1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "REVIEWED"
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.updateCraftBoardInquiry).toHaveBeenCalledWith({
      organizationId: "org_local_craft_board",
      actorName: "Craft Board Owner",
      id: "inq_1",
      status: "REVIEWED"
    });
  });

  it("rejects invalid public payloads", async () => {
    const response = await fetch(`${baseUrl}/craft-board/inquiries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productFamily: "floating-shelves"
      })
    });

    expect(response.status).toBe(400);
  });
});
