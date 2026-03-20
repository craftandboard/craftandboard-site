import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  previewFloatingShelfPrice: vi.fn(),
  getCraftBoardStorefrontQuote: vi.fn(),
  submitCraftBoardStorefrontOrder: vi.fn(),
  createCraftBoardStorefrontPaymentSession: vi.fn(),
  getCraftBoardStorefrontOrderConfirmation: vi.fn(),
  getCustomerStorefrontOrderStatus: vi.fn(),
  createStorefrontChangeRequest: vi.fn(),
  createStorefrontOrderIssue: vi.fn(),
  completeCraftBoardStorefrontTestPayment: vi.fn(),
  cancelCraftBoardStorefrontOrderPayment: vi.fn(),
  handleCraftBoardStorefrontPaymentWebhook: vi.fn()
}));

vi.mock("../modules/craftBoardStorefront/service.js", () => serviceMocks);

import craftBoardStorefrontRouter from "../routes/craftBoardStorefront.js";

let server: any;
let baseUrl = "";

beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use("/", craftBoardStorefrontRouter);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  vi.clearAllMocks();
  serviceMocks.previewFloatingShelfPrice.mockResolvedValue({
    ok: true,
    pricing: {
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      priceState: "instant",
      unitPriceCents: 120000
    }
  });
  serviceMocks.submitCraftBoardStorefrontOrder.mockResolvedValue({
    ok: true,
    mode: "payment-required",
    requestId: "cbs_123",
    attemptId: "attempt_123",
    orderAttempt: {
      id: "attempt_123",
      requestId: "cbs_123",
      status: "RECEIVED",
      paymentStatus: "NOT_STARTED"
    }
  });
  serviceMocks.getCraftBoardStorefrontQuote.mockResolvedValue({
    ok: true,
    quote: {
      pricing: {
        productFamily: "floating-shelves",
        productSlug: "classic-floating-shelf",
        currencyCode: "USD",
        quantityTotalCents: 120000,
        instantPriceEligible: true,
        reviewRequired: false,
        consultRequired: false,
        leadTimeText: "Approximately 3 to 4 weeks"
      },
      shipping: {
        productFamily: "floating-shelves",
        productSlug: "classic-floating-shelf",
        shippingEligible: true,
        reviewRequired: false,
        consultRequired: false,
        shippingMode: "PARCEL",
        packagingProfile: "long_shelf_box",
        shippingCostCents: 7800,
        estimatedTransitDays: 4,
        shippingWarnings: [],
        shippingReasonCodes: [],
        destinationZone: "WEST",
        shippingBasisVersion: "shipping-v1",
        customerFacingMessage: "Estimated shipping is based on a standard parcel-ready shelf packaging profile.",
        destinationSummary: {
          countryCode: "US",
          stateOrProvinceCode: "WA",
          postalCodePrefix: "981"
        }
      },
      standardCheckoutEligible: true,
      reviewRequired: false,
      customerFacingMessages: [],
      commercialTotals: {
        productSubtotalCents: 120000,
        shippingCostCents: 7800,
        estimatedOrderTotalCents: 127800
      },
      depositBasis: {
        percentBasisPoints: 5000,
        depositBaseAmountCents: 127800,
        depositIncludesShipping: true,
        depositAmountCents: 63900,
        remainingBalanceAmountCents: 63900
      }
    }
  });
  serviceMocks.createCraftBoardStorefrontPaymentSession.mockResolvedValue({
    ok: true,
    paymentSession: {
      attemptId: "attempt_123",
      redirectUrl: "https://payments.example.test/checkout/attempt_123",
      simulated: false
    }
  });
  serviceMocks.getCraftBoardStorefrontOrderConfirmation.mockResolvedValue({
    ok: true,
    orderAttempt: {
      id: "attempt_123",
      requestId: "cbs_123"
    },
    confirmation: {
      requestId: "cbs_123",
      confirmationCode: "CBS_123",
      customerStatusToken: "status_tok_123",
      paymentStatus: "PAID"
    }
  });
  serviceMocks.getCustomerStorefrontOrderStatus.mockResolvedValue({
    ok: true,
    status: {
      orderReference: "CBS_123",
      statusTokenSafe: "status_tok_123",
      currentStatus: "ORDER_RECEIVED",
      currentStatusLabel: "Order Received",
      currentStatusDescription: "Your order was accepted and is moving through the initial production review step.",
      lastUpdatedAt: "2026-03-14T20:00:00.000Z",
      orderPlacedAt: "2026-03-14T19:30:00.000Z",
      paidAt: "2026-03-14T19:35:00.000Z",
      amountPaidCents: 63900,
      totalAmountCents: 127800,
      productSummary: {
        productDisplayName: "Classic Floating Shelf",
        summaryLines: ["72 width", "10 depth"],
        quantity: 1
      },
      shippingSummary: {
        shippingMode: "PARCEL",
        packagingProfile: "long_shelf_box",
        carrierName: null,
        serviceLevel: null,
        estimatedTransitDays: 4,
        shippingCostCents: 7800,
        trackingNumber: null,
        trackingUrl: null,
        customerMessage: "The next update will appear here once production scheduling and fulfillment intake are confirmed."
      },
      changeRequestEligible: true,
      changeRequestMessage: "Changes are reviewed before they are applied.",
      changeRequests: [],
      issueReportEligible: false,
      issueReportMessage: "Issue reporting is intended for shipped or delivered orders.",
      issues: [],
      timeline: [],
      supportMessage: null
    }
  });
  serviceMocks.createStorefrontChangeRequest.mockResolvedValue({
    ok: true,
    changeRequest: {
      id: "change_123",
      requestType: "GENERAL_CHANGE_REQUEST",
      requestTypeLabel: "General Change Request",
      customerSafeStatus: "REQUEST_RECEIVED",
      customerSafeStatusLabel: "Request Received",
      customerSafeSummary: "Submitted a general post-purchase change request.",
      createdAt: "2026-03-14T20:00:00.000Z",
      lastUpdatedAt: "2026-03-14T20:00:00.000Z",
      resolutionCustomerMessage: null
    },
    message: "Your request was received."
  });
  serviceMocks.createStorefrontOrderIssue.mockResolvedValue({
    ok: true,
    issue: {
      id: "issue_123",
      issueType: "SHIPPING_DAMAGE",
      issueTypeLabel: "Shipping Damage",
      customerSafeStatus: "ISSUE_RECEIVED",
      customerSafeStatusLabel: "Issue Received",
      customerSafeSummary: "Reported shipping damage for the delivered order.",
      createdAt: "2026-03-14T20:00:00.000Z",
      lastUpdatedAt: "2026-03-14T20:00:00.000Z",
      resolutionCustomerMessage: null
    },
    message: "Your issue report was received."
  });
  serviceMocks.completeCraftBoardStorefrontTestPayment.mockResolvedValue({ ok: true });
  serviceMocks.cancelCraftBoardStorefrontOrderPayment.mockResolvedValue({ ok: true });
  serviceMocks.handleCraftBoardStorefrontPaymentWebhook.mockResolvedValue({
    ok: true,
    handled: true
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

const configuration = {
  productFamily: "floating-shelves",
  productSlug: "classic-floating-shelf",
  width: 72,
  widthUnit: "IN",
  depth: 10,
  depthUnit: "IN",
  thickness: 2,
  thicknessUnit: "IN",
  quantity: 1,
  materialCode: "WHITE_OAK",
  materialLabel: "White Oak",
  mountingCode: "STANDARD_CONCEALED",
  mountingLabel: "Standard concealed bracket"
};

const pricingResult = {
  productFamily: "floating-shelves",
  productSlug: "classic-floating-shelf",
  currencyCode: "USD",
  priceState: "instant",
  instantPriceEligible: true,
  reviewRequired: false,
  consultRequired: false,
  quantity: 1,
  unitPriceCents: 120000,
  totalPriceCents: 120000,
  quantityTotalCents: 120000,
  estimatedSubtotalCents: 120000,
  depositEligible: true,
  shippingProfileHint: "oversize-home-delivery",
  leadTimeText: "Approximately 3 to 4 weeks",
  pricingBasisVersion: "floating-shelf-v1",
  warnings: [],
  customerMessage: "This configuration is within the standard instant-price range.",
  components: [
    { code: "material", label: "Material", amountCents: 30000 },
    { code: "fabrication", label: "Fabrication", amountCents: 30000 },
    { code: "mounting", label: "Mounting hardware", amountCents: 30000 },
    { code: "packaging", label: "Packaging and handling", amountCents: 10000 },
    { code: "margin", label: "Craft & Board build margin", amountCents: 20000 }
  ]
} as const;

const mantelConfiguration = {
  productFamily: "floating-mantels",
  productSlug: "classic-floating-mantel",
  length: 72,
  lengthUnit: "IN",
  depth: 10,
  depthUnit: "IN",
  height: 5,
  heightUnit: "IN",
  quantity: 1,
  materialCode: "WHITE_OAK",
  materialLabel: "White Oak",
  mountingCode: "STANDARD_CONCEALED",
  mountingLabel: "Standard concealed support"
} as const;

const mantelPricingResult = {
  productFamily: "floating-mantels",
  productSlug: "classic-floating-mantel",
  currencyCode: "USD",
  priceState: "instant",
  instantPriceEligible: true,
  reviewRequired: false,
  consultRequired: false,
  quantity: 1,
  unitPriceCents: 164000,
  totalPriceCents: 164000,
  quantityTotalCents: 164000,
  estimatedSubtotalCents: 164000,
  depositEligible: true,
  shippingProfileHint: "oversize-home-delivery",
  leadTimeText: "Approximately 4 to 5 weeks",
  pricingBasisVersion: "floating-mantel-v1",
  warnings: [],
  customerMessage: "This configuration is within the standard instant-price range.",
  components: [
    { code: "material", label: "Material", amountCents: 48000 },
    { code: "fabrication", label: "Fabrication", amountCents: 44000 },
    { code: "mounting", label: "Mounting hardware", amountCents: 22000 },
    { code: "packaging", label: "Packaging and handling", amountCents: 10000 },
    { code: "margin", label: "Craft & Board build margin", amountCents: 40000 }
  ]
} as const;

describe("craft board storefront routes", () => {
  it("previews floating shelf pricing", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/floating-shelves/price`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ configuration })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.previewFloatingShelfPrice).toHaveBeenCalledWith({ configuration });
  });

  it("previews floating mantel pricing", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/floating-mantels/price`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ configuration: mantelConfiguration })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.previewFloatingShelfPrice).toHaveBeenCalledWith({ configuration: mantelConfiguration });
  });

  it("returns a canonical storefront quote with shipping", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/products/quote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        configuration,
        destination: {
          postalCode: "98101",
          countryCode: "US",
          stateOrProvinceCode: "WA"
        }
      })
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardStorefrontQuote).toHaveBeenCalledWith({
      configuration,
      destination: {
        postalCode: "98101",
        countryCode: "US",
        stateOrProvinceCode: "WA"
      }
    });
  });

  it("submits a storefront shelf order draft", async () => {
    const draft = {
      sourceChannel: "CRAFT_BOARD",
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      configuration,
      pricingResult,
      eligibilityResult: {
        instantPriceEligible: true,
        reviewRequired: false,
        consultRequired: false,
        reasonCodes: [],
        customerFacingMessage: "This configuration is within the standard instant-price range.",
        allowedCheckoutMode: "STANDARD_CHECKOUT",
        fallbackMode: "NONE"
      },
      instantPriceEligible: true,
      consultRequired: false,
      customer: {
        fullName: "Alice Example",
        email: "alice@example.com"
      },
      shippingAddress: {
        fullName: "Alice Example",
        address1: "123 Main Street",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US"
      },
      billingSameAsShipping: true,
      notes: "Please confirm grain direction.",
      paymentMode: "DEPOSIT_REQUEST",
      orderIntent: "PURCHASE_STANDARD",
      customerAcceptedPricingBasis: true,
      customerAcceptedLeadTimeBasis: true,
      customerAcknowledgedMadeToOrder: true
    };

    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourcePath: "/order/floating-shelves/classic-floating-shelf",
        draft
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.submitCraftBoardStorefrontOrder).toHaveBeenCalledWith({
      sourcePath: "/order/floating-shelves/classic-floating-shelf",
      draft
    });
  });

  it("submits a storefront mantel order draft", async () => {
    const draft = {
      sourceChannel: "CRAFT_BOARD",
      productFamily: "floating-mantels",
      productSlug: "classic-floating-mantel",
      configuration: mantelConfiguration,
      pricingResult: mantelPricingResult,
      eligibilityResult: {
        instantPriceEligible: true,
        reviewRequired: false,
        consultRequired: false,
        reasonCodes: [],
        customerFacingMessage: "This configuration is within the standard instant-price range.",
        allowedCheckoutMode: "STANDARD_CHECKOUT",
        fallbackMode: "NONE"
      },
      instantPriceEligible: true,
      consultRequired: false,
      customer: {
        fullName: "Alice Example",
        email: "alice@example.com"
      },
      shippingAddress: {
        fullName: "Alice Example",
        address1: "123 Main Street",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US"
      },
      billingSameAsShipping: true,
      notes: "Stone surround is already complete.",
      paymentMode: "DEPOSIT_REQUEST",
      orderIntent: "PURCHASE_STANDARD",
      customerAcceptedPricingBasis: true,
      customerAcceptedLeadTimeBasis: true,
      customerAcknowledgedMadeToOrder: true
    };

    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourcePath: "/order/floating-mantels/classic-floating-mantel",
        draft
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.submitCraftBoardStorefrontOrder).toHaveBeenCalledWith({
      sourcePath: "/order/floating-mantels/classic-floating-mantel",
      draft
    });
  });

  it("creates a storefront payment session", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders/attempt_123/payment-session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        successPath: "/order/payment/success?attemptId=attempt_123",
        cancelPath: "/order/payment/cancelled?attemptId=attempt_123"
      })
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createCraftBoardStorefrontPaymentSession).toHaveBeenCalledWith({
      attemptId: "attempt_123",
      successPath: "/order/payment/success?attemptId=attempt_123",
      cancelPath: "/order/payment/cancelled?attemptId=attempt_123"
    });
  });

  it("returns storefront order confirmation", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders/attempt_123/confirmation`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCraftBoardStorefrontOrderConfirmation).toHaveBeenCalledWith({
      attemptId: "attempt_123"
    });
  });

  it("returns customer-safe storefront order status by public token", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/order-status/status_tok_123`);

    expect(response.status).toBe(200);
    expect(serviceMocks.getCustomerStorefrontOrderStatus).toHaveBeenCalledWith({
      publicToken: "status_tok_123"
    });
  });

  it("creates a storefront change request by status token", async () => {
    const body = {
      requestType: "GENERAL_CHANGE_REQUEST",
      requestedByName: "Alice Example",
      requestedByEmail: "alice@example.com",
      customerMessage: "Please review a finish update.",
      requestedChanges: {
        generalNotes: "Please review a finish update."
      }
    };

    const response = await fetch(`${baseUrl}/public/craft-board/storefront/order-status/status_tok_123/change-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createStorefrontChangeRequest).toHaveBeenCalledWith({
      publicToken: "status_tok_123",
      payload: body
    });
  });

  it("creates a storefront order issue by status token", async () => {
    const body = {
      issueType: "SHIPPING_DAMAGE",
      reportedByName: "Alice Example",
      reportedByEmail: "alice@example.com",
      customerMessage: "The shelf arrived with visible corner damage.",
      issueDetails: {
        damageDescription: "Front left corner is split.",
        packageConditionDescription: "Box arrived crushed on one side."
      }
    };

    const response = await fetch(`${baseUrl}/public/craft-board/storefront/order-status/status_tok_123/issues`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    expect(response.status).toBe(201);
    expect(serviceMocks.createStorefrontOrderIssue).toHaveBeenCalledWith({
      publicToken: "status_tok_123",
      payload: body
    });
  });

  it("completes a test payment in controlled mode", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders/attempt_123/dev-complete-payment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.completeCraftBoardStorefrontTestPayment).toHaveBeenCalledWith({
      attemptId: "attempt_123"
    });
  });

  it("marks payment cancellation", async () => {
    const response = await fetch(`${baseUrl}/public/craft-board/storefront/orders/attempt_123/payment-cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.cancelCraftBoardStorefrontOrderPayment).toHaveBeenCalledWith({
      attemptId: "attempt_123"
    });
  });

  it("accepts storefront payment webhooks", async () => {
    const body = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          client_reference_id: "cbs_123"
        }
      }
    };

    const response = await fetch(`${baseUrl}/public/craft-board/storefront/payments/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", "stripe-signature": "test" },
      body: JSON.stringify(body)
    });

    expect(response.status).toBe(200);
    expect(serviceMocks.handleCraftBoardStorefrontPaymentWebhook).toHaveBeenCalledWith({
      payload: body,
      headers: expect.objectContaining({
        "content-type": "application/json",
        "stripe-signature": "test"
      })
    });
  });
});
