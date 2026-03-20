import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  changeRequestFindMany: vi.fn(),
  orderIssueFindMany: vi.fn()
}));

const fieldMetriqMocks = vi.hoisted(() => ({
  fetchFieldMetriqStorefrontOrderStatus: vi.fn()
}));

const registryMocks = vi.hoisted(() => ({
  getStorefrontProductDefinition: vi.fn()
}));

const notificationMocks = vi.hoisted(() => ({
  sendStorefrontStatusNotificationIfNeeded: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    craftBoardStorefrontOrderAttempt: {
      findUnique: prismaMocks.findUnique,
      update: prismaMocks.update
    },
    craftBoardChangeRequest: {
      findMany: prismaMocks.changeRequestFindMany
    },
    craftBoardOrderIssue: {
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
vi.mock("../modules/craftBoardStorefront/products/registry.js", () => registryMocks);

import { getCustomerStorefrontOrderStatus } from "../modules/craftBoardStorefront/status/service.js";

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt_123",
    requestId: "cbs_123",
    createdAt: new Date("2026-03-14T19:00:00.000Z"),
    paidAt: new Date("2026-03-14T19:10:00.000Z"),
    paymentStatus: "PAID",
    productFamily: "floating-shelves",
    productSlug: "classic-floating-shelf",
    configurationJson: {
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      width: 72,
      depth: 10,
      thickness: 2,
      quantity: 1
    },
    pricingJson: {
      quantityTotalCents: 120000
    },
    depositAmountCents: 63900,
    shippingCostCents: 7800,
    taxAmountCents: 9984,
    shippingMode: "PARCEL",
    packagingProfile: "long_shelf_box",
    shippingCarrierName: null,
    shippingServiceLevel: null,
    estimatedTransitDays: 4,
    customerStatusToken: "status_tok_123",
    latestCustomerStatusUpdatedAt: null,
    fieldMetriqLastStatusSyncAt: null,
    fieldMetriqSubmissionStatus: "SUCCEEDED",
    fieldMetriqSubmissionReference: "fm_123",
    fieldMetriqOrderReference: null,
    fieldMetriqOrderStatusSnapshotJson: null,
    customerJson: {
      fullName: "Avery Builder"
    },
    ...overrides
  };
}

describe("craft board storefront customer status service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registryMocks.getStorefrontProductDefinition.mockReturnValue({
      displayName: "Classic Floating Shelf",
      summarizeConfiguration: () => ['72" width', '10" depth', '2" thickness', "Qty 1"]
    });
    prismaMocks.update.mockResolvedValue(null);
    prismaMocks.changeRequestFindMany.mockResolvedValue([]);
    prismaMocks.orderIssueFindMany.mockResolvedValue([]);
  });

  it("returns a calm paid-order state when downstream status is not yet synced", async () => {
    prismaMocks.findUnique.mockResolvedValueOnce(
      makeAttempt({
        fieldMetriqSubmissionReference: null,
        fieldMetriqOrderReference: null,
        fieldMetriqSubmissionStatus: "SUBMITTING"
      })
    );

    const payload = await getCustomerStorefrontOrderStatus({ publicToken: "status_tok_123" });

    expect(payload.status.currentStatus).toBe("PAYMENT_RECEIVED");
    expect(payload.status.currentStatusLabel).toBe("Payment Received");
    expect(payload.status.issueReportEligible).toBe(false);
    expect(fieldMetriqMocks.fetchFieldMetriqStorefrontOrderStatus).not.toHaveBeenCalled();
  });

  it("maps downstream production state into a customer-safe production timeline", async () => {
    prismaMocks.findUnique.mockResolvedValueOnce(
      makeAttempt({
        productFamily: "floating-mantels",
        productSlug: "classic-floating-mantel",
        configurationJson: {
          productFamily: "floating-mantels",
          productSlug: "classic-floating-mantel",
          length: 72,
          depth: 10,
          height: 5,
          quantity: 1
        }
      })
    );
    registryMocks.getStorefrontProductDefinition.mockReturnValueOnce({
      displayName: "Classic Floating Mantel",
      summarizeConfiguration: () => ['72" length', '10" depth', '5" height', "Qty 1"]
    });
    fieldMetriqMocks.fetchFieldMetriqStorefrontOrderStatus.mockResolvedValueOnce({
      orderReference: "fm_123",
      rawStatus: "IN_PRODUCTION",
      rawPhase: "BUILD",
      statusLabel: "In Production",
      productionStartedAt: "2026-03-15T12:00:00.000Z",
      preparingToShipAt: null,
      shippedAt: null,
      deliveredAt: null,
      lastUpdatedAt: "2026-03-15T12:00:00.000Z",
      carrierName: null,
      serviceLevel: null,
      trackingNumber: null,
      trackingUrl: null,
      needsAttention: false,
      customerNotes: [],
      raw: {}
    });

    const payload = await getCustomerStorefrontOrderStatus({ publicToken: "status_tok_123" });

    expect(payload.status.currentStatus).toBe("IN_PRODUCTION");
    expect(payload.status.timeline.some((item) => item.statusCode === "IN_PRODUCTION" && item.isCurrent)).toBe(true);
    expect(payload.status.issueReportEligible).toBe(false);
  });

  it("exposes issue reporting and recent issues for delivered orders", async () => {
    prismaMocks.findUnique.mockResolvedValueOnce(
      makeAttempt({
        latestCustomerOrderStatus: "DELIVERED",
        fieldMetriqOrderStatusSnapshotJson: {
          orderReference: "fm_123",
          rawStatus: "DELIVERED",
          rawPhase: "DELIVERED",
          statusLabel: "Delivered",
          productionStartedAt: "2026-03-15T12:00:00.000Z",
          preparingToShipAt: "2026-03-20T12:00:00.000Z",
          shippedAt: "2026-03-21T12:00:00.000Z",
          deliveredAt: "2026-03-24T12:00:00.000Z",
          lastUpdatedAt: "2026-03-24T12:00:00.000Z",
          carrierName: "UPS",
          serviceLevel: "Ground",
          trackingNumber: null,
          trackingUrl: null,
          needsAttention: false,
          customerNotes: [],
          raw: {}
        }
      })
    );
    fieldMetriqMocks.fetchFieldMetriqStorefrontOrderStatus.mockResolvedValueOnce({
      orderReference: "fm_123",
      rawStatus: "DELIVERED",
      rawPhase: "DELIVERED",
      statusLabel: "Delivered",
      productionStartedAt: "2026-03-15T12:00:00.000Z",
      preparingToShipAt: "2026-03-20T12:00:00.000Z",
      shippedAt: "2026-03-21T12:00:00.000Z",
      deliveredAt: "2026-03-24T12:00:00.000Z",
      lastUpdatedAt: "2026-03-24T12:00:00.000Z",
      carrierName: "UPS",
      serviceLevel: "Ground",
      trackingNumber: null,
      trackingUrl: null,
      needsAttention: false,
      customerNotes: [],
      raw: {}
    });
    prismaMocks.orderIssueFindMany.mockResolvedValueOnce([
      {
        id: "issue_123",
        issueType: "SHIPPING_DAMAGE",
        status: "SUBMITTED",
        customerSafeSummary: "Reported shipping damage for the delivered order.",
        createdAt: new Date("2026-03-24T12:30:00.000Z"),
        updatedAt: new Date("2026-03-24T12:30:00.000Z"),
        resolutionCustomerMessage: null
      }
    ]);

    const payload = await getCustomerStorefrontOrderStatus({ publicToken: "status_tok_123" });

    expect(payload.status.currentStatus).toBe("DELIVERED");
    expect(payload.status.issueReportEligible).toBe(true);
    expect(payload.status.issues).toHaveLength(1);
    expect(payload.status.issues[0]?.issueType).toBe("SHIPPING_DAMAGE");
  });

  it("throws a safe unavailable error for an invalid token", async () => {
    prismaMocks.findUnique.mockResolvedValueOnce(null);

    await expect(
      getCustomerStorefrontOrderStatus({ publicToken: "missing_token_123" })
    ).rejects.toThrow("Storefront order status is unavailable.");
  });
});
