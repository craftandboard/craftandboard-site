import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  attemptFindUnique: vi.fn(),
  changeRequestCreate: vi.fn(),
  changeRequestUpdate: vi.fn(),
  changeRequestFindUniqueOrThrow: vi.fn(),
  changeRequestFindMany: vi.fn()
}));

const fieldMetriqMocks = vi.hoisted(() => ({
  submitFieldMetriqStorefrontChangeRequest: vi.fn()
}));

const notificationMocks = vi.hoisted(() => ({
  sendStorefrontChangeRequestReceivedEmail: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    craftBoardStorefrontOrderAttempt: {
      findUnique: prismaMocks.attemptFindUnique
    },
    craftBoardChangeRequest: {
      create: prismaMocks.changeRequestCreate,
      update: prismaMocks.changeRequestUpdate,
      findUniqueOrThrow: prismaMocks.changeRequestFindUniqueOrThrow,
      findMany: prismaMocks.changeRequestFindMany
    }
  }
}));
vi.mock("../lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));
vi.mock("../modules/craftBoardStorefront/fieldMetriqClient.js", () => fieldMetriqMocks);
vi.mock("../modules/craftBoardStorefront/notifications/service.js", () => notificationMocks);

import { createStorefrontChangeRequest } from "../modules/craftBoardStorefront/changeRequests/service.js";

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt_123",
    organizationId: "org_local_craft_board",
    requestId: "cbs_123",
    confirmationCode: "CBS_123",
    customerStatusToken: "status_tok_123",
    latestCustomerOrderStatus: "ORDER_RECEIVED",
    latestCustomerOrderStatusLabel: "Order Received",
    fieldMetriqSubmissionEnabled: true,
    ...overrides
  };
}

describe("craft board storefront change requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.changeRequestCreate.mockResolvedValue({
      id: "change_123"
    });
    prismaMocks.changeRequestUpdate.mockResolvedValue(null);
    prismaMocks.changeRequestFindUniqueOrThrow.mockResolvedValue({
      id: "change_123",
      requestType: "GENERAL_CHANGE_REQUEST",
      status: "SUBMITTED",
      customerSafeSummary: "Submitted a general post-purchase change request.",
      createdAt: new Date("2026-03-14T20:00:00.000Z"),
      updatedAt: new Date("2026-03-14T20:00:00.000Z"),
      resolutionCustomerMessage: null
    });
    fieldMetriqMocks.submitFieldMetriqStorefrontChangeRequest.mockResolvedValue({
      body: { reference: "fm_change_123" }
    });
    notificationMocks.sendStorefrontChangeRequestReceivedEmail.mockResolvedValue(undefined);
  });

  it("creates and submits a change request downstream", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());

    const payload = await createStorefrontChangeRequest({
      publicToken: "status_tok_123",
      payload: {
        requestType: "GENERAL_CHANGE_REQUEST",
        requestedByName: "Avery Builder",
        requestedByEmail: "avery@example.com",
        customerMessage: "Please review a finish update.",
        requestedChanges: {
          generalNotes: "Please review a finish update."
        }
      }
    });

    expect(prismaMocks.changeRequestCreate).toHaveBeenCalled();
    expect(fieldMetriqMocks.submitFieldMetriqStorefrontChangeRequest).toHaveBeenCalled();
    expect(notificationMocks.sendStorefrontChangeRequestReceivedEmail).toHaveBeenCalledWith({
      changeRequestId: "change_123"
    });
    expect(payload.changeRequest.customerSafeStatus).toBe("REQUEST_RECEIVED");
  });

  it("blocks the standard change-request path for shipped orders", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(
      makeAttempt({
        latestCustomerOrderStatus: "SHIPPED"
      })
    );

    await expect(
      createStorefrontChangeRequest({
        publicToken: "status_tok_123",
        payload: {
          requestType: "GENERAL_CHANGE_REQUEST",
          requestedByName: "Avery Builder",
          requestedByEmail: "avery@example.com",
          customerMessage: "Please stop shipment.",
          requestedChanges: {
            generalNotes: "Please stop shipment."
          }
        }
      })
    ).rejects.toThrow("This order is already in shipment or delivered");
  });

  it("marks the request retry-pending when downstream handoff fails", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());
    fieldMetriqMocks.submitFieldMetriqStorefrontChangeRequest.mockRejectedValue(
      new Error("FieldMetriq unavailable")
    );

    const payload = await createStorefrontChangeRequest({
      publicToken: "status_tok_123",
      payload: {
        requestType: "UPDATE_SHIPPING_ADDRESS",
        requestedByName: "Avery Builder",
        requestedByEmail: "avery@example.com",
        customerMessage: "Please update the shipping destination.",
        requestedChanges: {
          requestedShippingAddress: {
            fullName: "Avery Builder",
            address1: "42 Example Ave",
            city: "Seattle",
            state: "WA",
            postalCode: "98101",
            country: "US"
          }
        }
      }
    });

    expect(prismaMocks.changeRequestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fieldMetriqSubmissionStatus: "RETRY_PENDING",
          fieldMetriqSubmissionError: "FieldMetriq unavailable"
        })
      })
    );
    expect(notificationMocks.sendStorefrontChangeRequestReceivedEmail).toHaveBeenCalledWith({
      changeRequestId: "change_123"
    });
    expect(payload.ok).toBe(true);
  });
});
