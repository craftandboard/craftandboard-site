import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  attemptFindUnique: vi.fn(),
  orderIssueCreate: vi.fn(),
  orderIssueUpdate: vi.fn(),
  orderIssueFindUniqueOrThrow: vi.fn(),
  orderIssueFindMany: vi.fn()
}));

const fieldMetriqMocks = vi.hoisted(() => ({
  submitFieldMetriqStorefrontOrderIssue: vi.fn()
}));

const notificationMocks = vi.hoisted(() => ({
  sendStorefrontOrderIssueReceivedEmail: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    craftBoardStorefrontOrderAttempt: {
      findUnique: prismaMocks.attemptFindUnique
    },
    craftBoardOrderIssue: {
      create: prismaMocks.orderIssueCreate,
      update: prismaMocks.orderIssueUpdate,
      findUniqueOrThrow: prismaMocks.orderIssueFindUniqueOrThrow,
      findMany: prismaMocks.orderIssueFindMany
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

import { createStorefrontOrderIssue } from "../modules/craftBoardStorefront/issues/service.js";

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt_123",
    organizationId: "org_local_craft_board",
    requestId: "cbs_123",
    confirmationCode: "CBS_123",
    customerStatusToken: "status_tok_123",
    latestCustomerOrderStatus: "DELIVERED",
    latestCustomerOrderStatusLabel: "Delivered",
    fieldMetriqSubmissionEnabled: true,
    ...overrides
  };
}

describe("craft board storefront order issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.orderIssueCreate.mockResolvedValue({
      id: "issue_123"
    });
    prismaMocks.orderIssueUpdate.mockResolvedValue(null);
    prismaMocks.orderIssueFindUniqueOrThrow.mockResolvedValue({
      id: "issue_123",
      issueType: "SHIPPING_DAMAGE",
      status: "SUBMITTED",
      customerSafeSummary: "Reported shipping damage for the delivered order.",
      createdAt: new Date("2026-03-14T20:00:00.000Z"),
      updatedAt: new Date("2026-03-14T20:00:00.000Z"),
      resolutionCustomerMessage: null
    });
    fieldMetriqMocks.submitFieldMetriqStorefrontOrderIssue.mockResolvedValue({
      body: { reference: "fm_issue_123" }
    });
    notificationMocks.sendStorefrontOrderIssueReceivedEmail.mockResolvedValue(undefined);
  });

  it("creates and submits an order issue downstream", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());

    const payload = await createStorefrontOrderIssue({
      publicToken: "status_tok_123",
      payload: {
        issueType: "SHIPPING_DAMAGE",
        reportedByName: "Avery Builder",
        reportedByEmail: "avery@example.com",
        customerMessage: "The shelf arrived with damage.",
        issueDetails: {
          damageDescription: "Front left corner is split.",
          packageConditionDescription: "Outer box was crushed."
        }
      }
    });

    expect(prismaMocks.orderIssueCreate).toHaveBeenCalled();
    expect(fieldMetriqMocks.submitFieldMetriqStorefrontOrderIssue).toHaveBeenCalled();
    expect(notificationMocks.sendStorefrontOrderIssueReceivedEmail).toHaveBeenCalledWith({
      issueId: "issue_123"
    });
    expect(payload.issue.customerSafeStatus).toBe("ISSUE_RECEIVED");
  });

  it("blocks issue reporting before shipment", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(
      makeAttempt({
        latestCustomerOrderStatus: "IN_PRODUCTION"
      })
    );

    await expect(
      createStorefrontOrderIssue({
        publicToken: "status_tok_123",
        payload: {
          issueType: "RETURN_REQUEST",
          reportedByName: "Avery Builder",
          reportedByEmail: "avery@example.com",
          customerMessage: "I need to return this order.",
          issueDetails: {
            returnReason: "No longer needed."
          }
        }
      })
    ).rejects.toThrow("Issue reporting is available after shipment or delivery");
  });

  it("marks the issue retry-pending when downstream handoff fails", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());
    fieldMetriqMocks.submitFieldMetriqStorefrontOrderIssue.mockRejectedValue(
      new Error("FieldMetriq unavailable")
    );

    const payload = await createStorefrontOrderIssue({
      publicToken: "status_tok_123",
      payload: {
        issueType: "DELIVERY_PROBLEM",
        reportedByName: "Avery Builder",
        reportedByEmail: "avery@example.com",
        customerMessage: "The order was marked delivered but never arrived.",
        issueDetails: {
          deliveryProblemDescription: "Marked delivered, not at the property."
        }
      }
    });

    expect(prismaMocks.orderIssueUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fieldMetriqSubmissionStatus: "RETRY_PENDING",
          fieldMetriqSubmissionError: "FieldMetriq unavailable"
        })
      })
    );
    expect(notificationMocks.sendStorefrontOrderIssueReceivedEmail).toHaveBeenCalledWith({
      issueId: "issue_123"
    });
    expect(payload.ok).toBe(true);
  });
});
