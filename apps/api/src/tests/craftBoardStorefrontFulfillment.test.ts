import { describe, expect, it } from "vitest";
import { mapFulfillmentHandoffToFieldMetriqOrderPayload } from "../modules/craftBoardStorefront/fulfillment/fieldMetriqMapper.js";
import {
  deriveFulfillmentRouting,
  mapStorefrontAttemptToFulfillmentHandoff
} from "../modules/craftBoardStorefront/fulfillment/mapper.js";

describe("craft board storefront fulfillment handoff", () => {
  it("maps a paid floating shelf order into a normalized fulfillment contract", () => {
    const handoff = mapStorefrontAttemptToFulfillmentHandoff({
      attempt: {
        id: "attempt_shelf_1",
        requestId: "cbs_shelf_1",
        confirmationCode: "CBS_SHELF_1",
        paidAt: new Date("2026-03-14T19:30:00.000Z"),
        depositPercentBasisPoints: 5000,
        depositAmountCents: 68900,
        remainingBalanceAmountCents: 68900,
        paymentProvider: "STRIPE",
        paymentProviderSessionId: "cs_test_shelf",
        paymentProviderIntentId: "pi_test_shelf",
        fieldMetriqSubmissionRetryCount: 1
      },
      draft: {
        sourceChannel: "CRAFT_BOARD",
        productFamily: "floating-shelves",
        productSlug: "classic-floating-shelf",
        configuration: {
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
        },
        pricingResult: {} as never,
        eligibilityResult: {
          instantPriceEligible: true,
          reviewRequired: false,
          consultRequired: false,
          reasonCodes: [],
          customerFacingMessage: "Standard checkout eligible.",
          allowedCheckoutMode: "STANDARD_CHECKOUT",
          fallbackMode: "NONE"
        },
        instantPriceEligible: true,
        consultRequired: false,
        customer: {
          fullName: "Avery Builder",
          email: "avery@example.com",
          phone: "206-555-0142"
        },
        shippingAddress: {
          fullName: "Avery Builder",
          address1: "100 Main St",
          city: "Seattle",
          state: "WA",
          postalCode: "98104",
          country: "US"
        },
        billingSameAsShipping: true,
        paymentMode: "DEPOSIT_REQUEST",
        orderIntent: "PURCHASE_STANDARD",
        customerAcceptedPricingBasis: true,
        customerAcceptedLeadTimeBasis: true,
        customerAcknowledgedMadeToOrder: true
      },
      productDisplayName: "Classic Floating Shelf",
      configurationSummary: ['72" width', '10" depth', '2" thickness', "White Oak", "Standard concealed bracket", "Qty 1"],
      pricing: {
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
        shippingProfileHint: "parcel-ready",
        leadTimeText: "Approximately 3 to 4 weeks",
        pricingBasisVersion: "floating-shelf-v1",
        warnings: [],
        customerMessage: "Standard checkout eligible.",
        components: []
      },
      shippingQuote: {
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
        destinationSummary: {
          countryCode: "US",
          stateOrProvinceCode: "WA",
          postalCodePrefix: "981"
        },
        shippingBasisVersion: "shipping-v2",
        customerFacingMessage: "Quoted shipping is available.",
        quoteSource: "LIVE_PROVIDER",
        carrierName: "Simulated Parcel",
        serviceLevel: "Ground",
        quoteReference: "ship_live_1",
        quoteExpiresAt: "2026-03-14T21:00:00.000Z",
        rawProviderSummary: null,
        fallbackUsed: false,
        quoteGeneratedAt: "2026-03-14T19:20:00.000Z"
      },
      taxQuote: {
        taxEligible: true,
        reviewRequired: false,
        quoteSource: "ESTIMATE_RULES",
        taxAmountCents: 9984,
        taxableSubtotalCents: 120000,
        taxableShippingCents: 7800,
        jurisdictionSummary: {
          countryCode: "US",
          stateOrProvinceCode: "WA",
          postalCodePrefix: "981"
        },
        taxRateBasisPoints: 780,
        taxWarnings: [],
        taxReasonCodes: [],
        taxBasisVersion: "tax-v1",
        quoteGeneratedAt: "2026-03-14T19:20:10.000Z",
        quoteExpiresAt: null,
        quoteReference: "tax_1",
        rawProviderSummary: null,
        fallbackUsed: true,
        customerFacingMessage: "Estimated tax."
      }
    });

    expect(handoff.fulfillmentRoutingSnapshot.fulfillmentClass).toBe("STANDARD_PARCEL_BUILD");
    expect(handoff.fulfillmentRoutingSnapshot.productionProfile).toBe("FLOATING_SHELF_STANDARD");
    expect(handoff.productSnapshot.normalizedConfiguration).toMatchObject({
      width: 72,
      depth: 10,
      thickness: 2
    });
    expect(handoff.commercialSnapshot.totalAmountCents).toBe(137784);
  });

  it("maps the normalized handoff into the FieldMetriq intake payload", () => {
    const routing = deriveFulfillmentRouting({
      productFamily: "floating-mantels",
      shippingQuote: {
        productFamily: "floating-mantels",
        productSlug: "classic-floating-mantel",
        shippingEligible: true,
        reviewRequired: false,
        consultRequired: false,
        shippingMode: "OVERSIZE_PARCEL",
        packagingProfile: "mantel_crate",
        shippingCostCents: 14500,
        estimatedTransitDays: 5,
        shippingWarnings: ["Oversize handling applies."],
        shippingReasonCodes: [],
        destinationZone: "CENTRAL",
        destinationSummary: {
          countryCode: "US",
          stateOrProvinceCode: "TX",
          postalCodePrefix: "752"
        },
        shippingBasisVersion: "shipping-v2",
        customerFacingMessage: "Oversize parcel quote.",
        quoteSource: "ESTIMATE_RULES",
        carrierName: null,
        serviceLevel: null,
        quoteReference: null,
        quoteExpiresAt: null,
        rawProviderSummary: null,
        fallbackUsed: false,
        quoteGeneratedAt: "2026-03-14T19:22:00.000Z"
      }
    });

    const payload = mapFulfillmentHandoffToFieldMetriqOrderPayload({
      handoff: {
        sourceMetadata: {
          sourceSystem: "Craft & Board",
          sourceChannel: "storefront",
          sourceFlow: "storefront_standard_paid_order",
          storefrontOrderAttemptId: "attempt_mantel_1",
          storefrontOrderAttemptReference: "CBS_MANTEL_1",
          requestId: "cbs_mantel_1",
          paidAt: "2026-03-14T20:00:00.000Z",
          submittedAt: "2026-03-14T20:00:05.000Z",
          handoffVersion: "cb-fulfillment-handoff-v1"
        },
        customerSnapshot: {
          customerName: "Jordan Mason",
          customerEmail: "jordan@example.com",
          customerPhone: null,
          shippingName: "Jordan Mason",
          shippingAddress1: "500 Market St",
          shippingAddress2: null,
          shippingCity: "Dallas",
          shippingStateOrProvince: "TX",
          shippingPostalCode: "75201",
          shippingCountry: "US"
        },
        commercialSnapshot: {
          currencyCode: "USD",
          subtotalAmountCents: 164000,
          shippingAmountCents: 14500,
          taxAmountCents: 12565,
          totalAmountCents: 191065,
          depositAmountPaidCents: 95533,
          remainingBalanceAmountCents: 95532,
          paymentMode: "DEPOSIT_REQUEST",
          pricingBasisVersion: "floating-mantel-v1",
          shippingBasisVersion: "shipping-v2",
          taxBasisVersion: "tax-v1"
        },
        productSnapshot: {
          productFamily: "floating-mantels",
          productSlug: "classic-floating-mantel",
          productDisplayName: "Classic Floating Mantel",
          quantity: 1,
          normalizedConfiguration: {
            length: 72,
            depth: 10,
            height: 5
          },
          customerFacingSummary: ['72" length', '10" depth', '5" height'],
          reviewFlags: []
        },
        shippingSnapshot: {
          shippingMode: "OVERSIZE_PARCEL",
          packagingProfile: "mantel_crate",
          shippingQuoteSource: "ESTIMATE_RULES",
          shippingCostCents: 14500,
          carrierName: null,
          serviceLevel: null,
          quoteReference: null,
          quoteExpiresAt: null,
          estimatedTransitDays: 5,
          shippingWarnings: ["Oversize handling applies."],
          destinationSummary: {
            countryCode: "US",
            stateOrProvinceCode: "TX",
            postalCodePrefix: "752"
          },
          freightReviewRequired: false,
          localDeliveryEligible: null
        },
        taxSnapshot: {
          taxQuoteSource: "ESTIMATE_RULES",
          taxAmountCents: 12565,
          taxableSubtotalCents: 164000,
          taxableShippingCents: 14500,
          taxRateBasisPoints: 700,
          jurisdictionSummary: {
            countryCode: "US",
            stateOrProvinceCode: "TX",
            postalCodePrefix: "752"
          },
          taxWarnings: [],
          taxReasonCodes: [],
          taxQuoteGeneratedAt: "2026-03-14T19:22:03.000Z"
        },
        paymentSnapshot: {
          paymentStatus: "paid",
          paymentProvider: "STRIPE",
          paymentProviderSessionId: "cs_test_mantel",
          paymentProviderIntentId: "pi_test_mantel",
          paymentReference: "pi_test_mantel",
          depositPercentBasisPoints: 5000,
          paidAt: "2026-03-14T20:00:00.000Z"
        },
        fulfillmentRoutingSnapshot: routing,
        traceMetadata: {
          confirmationCode: "CBS_MANTEL_1",
          fieldMetriqSubmissionRetryCount: 0,
          quoteReference: null,
          taxQuoteReference: "tax_2"
        }
      }
    });

    expect(payload.fulfillmentRouting.fulfillmentClass).toBe("OVERSIZE_PARCEL_BUILD");
    expect(payload.fulfillmentRouting.packagingClass).toBe("CRATED");
    expect(payload.product.productFamily).toBe("floating-mantels");
    expect(payload.payment.paymentStatus).toBe("paid");
  });
});
