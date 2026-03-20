import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  attemptFindUnique: vi.fn(),
  attemptUpdate: vi.fn(),
  changeRequestFindUnique: vi.fn(),
  orderIssueFindUnique: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationCreate: vi.fn(),
  notificationUpdate: vi.fn()
}));

const providerMocks = vi.hoisted(() => ({
  getStorefrontEmailProvider: vi.fn()
}));

const registryMocks = vi.hoisted(() => ({
  getStorefrontProductDefinition: vi.fn()
}));

vi.mock("../lib/env.js", () => ({
  env: {
    CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS: true,
    CRAFT_BOARD_ENABLE_STATUS_UPDATE_EMAILS: true,
    TRANSACTIONAL_EMAIL_PROVIDER: "SIMULATED",
    TRANSACTIONAL_EMAIL_FROM_EMAIL: "orders@craftboard.test",
    TRANSACTIONAL_EMAIL_FROM_NAME: "Craft & Board",
    CRAFT_BOARD_REPLY_TO_EMAIL: "support@craftboard.test",
    CRAFT_BOARD_APP_BASE_URL: "http://localhost:3000"
  }
}));
vi.mock("../lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    craftBoardStorefrontOrderAttempt: {
      findUnique: prismaMocks.attemptFindUnique,
      update: prismaMocks.attemptUpdate
    },
    craftBoardChangeRequest: {
      findUnique: prismaMocks.changeRequestFindUnique
    },
    craftBoardOrderIssue: {
      findUnique: prismaMocks.orderIssueFindUnique
    },
    craftBoardNotificationLog: {
      findFirst: prismaMocks.notificationFindFirst,
      create: prismaMocks.notificationCreate,
      update: prismaMocks.notificationUpdate
    }
  }
}));
vi.mock("../modules/craftBoardStorefront/notifications/providers/providerRegistry.js", () => providerMocks);
vi.mock("../modules/craftBoardStorefront/products/registry.js", () => registryMocks);

import {
  sendStorefrontChangeRequestReceivedEmail,
  sendStorefrontOrderIssueReceivedEmail,
  sendStorefrontOrderConfirmationEmail,
  sendStorefrontStatusNotificationIfNeeded
} from "../modules/craftBoardStorefront/notifications/service.js";

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt_123",
    organizationId: "org_local_craft_board",
    requestId: "cbs_123",
    confirmationCode: "CBS_123",
    customerStatusToken: "status_tok_123",
    productFamily: "floating-shelves",
    productSlug: "classic-floating-shelf",
    paidAt: new Date("2026-03-14T20:00:00.000Z"),
    depositAmountCents: 63900,
    shippingCostCents: 7800,
    taxAmountCents: 9984,
    pricingJson: {
      quantityTotalCents: 120000
    },
    customerJson: {
      fullName: "Avery Builder",
      email: "avery@example.com"
    },
    configurationJson: {
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      width: 72,
      depth: 10,
      thickness: 2,
      quantity: 1
    },
    lastCustomerStatusEmailed: null,
    ...overrides
  };
}

function makeChangeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "change_123",
    requestedByName: "Avery Builder",
    requestedByEmail: "avery@example.com",
    requestType: "UPDATE_SHIPPING_ADDRESS",
    customerSafeSummary: "Requested shipping address update.",
    storefrontOrderAttempt: makeAttempt(),
    ...overrides
  };
}

function makeOrderIssue(overrides: Record<string, unknown> = {}) {
  return {
    id: "issue_123",
    reportedByName: "Avery Builder",
    reportedByEmail: "avery@example.com",
    issueType: "SHIPPING_DAMAGE",
    status: "SUBMITTED",
    customerSafeSummary: "Reported shipping damage for the delivered order.",
    storefrontOrderAttempt: makeAttempt(),
    ...overrides
  };
}

describe("craft board storefront notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registryMocks.getStorefrontProductDefinition.mockReturnValue({
      displayName: "Classic Floating Shelf",
      summarizeConfiguration: () => ['72" width', '10" depth', '2" thickness', "Qty 1"]
    });
    prismaMocks.notificationCreate.mockResolvedValue({ id: "notif_123" });
    prismaMocks.notificationUpdate.mockResolvedValue(null);
    prismaMocks.attemptUpdate.mockResolvedValue(null);
    prismaMocks.changeRequestFindUnique.mockResolvedValue(makeChangeRequest());
    prismaMocks.orderIssueFindUnique.mockResolvedValue(makeOrderIssue());
    providerMocks.getStorefrontEmailProvider.mockReturnValue({
      sendEmail: vi.fn().mockResolvedValue({
        sendAccepted: true,
        provider: "SIMULATED",
        providerMessageId: "email_123",
        sendReference: null,
        warnings: [],
        errorCode: null,
        errorMessage: null
      })
    });
  });

  it("sends a confirmation email with the status link and records durable send state", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());
    prismaMocks.notificationFindFirst.mockResolvedValue(null);

    await sendStorefrontOrderConfirmationEmail({ attemptId: "attempt_123" });

    expect(prismaMocks.notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventCode: "ORDER_CONFIRMATION_READY",
          dedupeKey: "attempt:attempt_123:confirmation"
        })
      })
    );
    expect(providerMocks.getStorefrontEmailProvider().sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Craft & Board order confirmed: CBS_123",
        html: expect.stringContaining("/order/status/status_tok_123")
      })
    );
    expect(prismaMocks.attemptUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderConfirmationEmailSentAt: expect.any(Date)
        })
      })
    );
  });

  it("does not resend a duplicate confirmation email when a sent log already exists", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(makeAttempt());
    prismaMocks.notificationFindFirst.mockResolvedValue({ id: "notif_existing", dedupeKey: "attempt:attempt_123:confirmation" });

    await sendStorefrontOrderConfirmationEmail({ attemptId: "attempt_123" });

    expect(prismaMocks.notificationCreate).not.toHaveBeenCalled();
    expect(providerMocks.getStorefrontEmailProvider().sendEmail).not.toHaveBeenCalled();
  });

  it("skips repeating a status update email when the same status was already emailed", async () => {
    prismaMocks.attemptFindUnique.mockResolvedValue(
      makeAttempt({
        lastCustomerStatusEmailed: "IN_PRODUCTION"
      })
    );

    await sendStorefrontStatusNotificationIfNeeded({
      attemptId: "attempt_123",
      currentStatus: "IN_PRODUCTION",
      currentStatusLabel: "In Production",
      currentStatusDescription: "Your order is actively moving through production."
    });

    expect(prismaMocks.notificationCreate).not.toHaveBeenCalled();
    expect(providerMocks.getStorefrontEmailProvider().sendEmail).not.toHaveBeenCalled();
  });

  it("sends a change-request received email with the status link", async () => {
    prismaMocks.notificationFindFirst.mockResolvedValue(null);

    await sendStorefrontChangeRequestReceivedEmail({ changeRequestId: "change_123" });

    expect(prismaMocks.notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventCode: "ORDER_CHANGE_REQUEST_RECEIVED",
          dedupeKey: "change-request:change_123:received"
        })
      })
    );
    expect(providerMocks.getStorefrontEmailProvider().sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Craft & Board change request received: CBS_123",
        html: expect.stringContaining("/order/status/status_tok_123")
      })
    );
  });

  it("sends an order-issue received email with the status link", async () => {
    prismaMocks.notificationFindFirst.mockResolvedValue(null);

    await sendStorefrontOrderIssueReceivedEmail({ issueId: "issue_123" });

    expect(prismaMocks.notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventCode: "ORDER_ISSUE_REPORTED",
          dedupeKey: "order-issue:issue_123:received"
        })
      })
    );
    expect(providerMocks.getStorefrontEmailProvider().sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Craft & Board issue report received: CBS_123",
        html: expect.stringContaining("/order/status/status_tok_123")
      })
    );
  });
});
