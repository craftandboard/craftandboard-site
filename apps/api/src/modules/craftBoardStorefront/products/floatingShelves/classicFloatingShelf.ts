import {
  calculateFloatingShelfPrice,
  type FloatingShelfConfiguration
} from "../../floatingShelfPricing.js";
import {
  mapFloatingShelfOrderToFieldMetriqPayload,
  mapPaidFloatingShelfOrderToFieldMetriqPayload
} from "../../orderContract.js";
import { calculateFloatingShelfShipping } from "../../shipping/shelfShipping.js";
import type { ConfigurableProductDefinition } from "../types.js";

export const classicFloatingShelfDefinition: ConfigurableProductDefinition<FloatingShelfConfiguration> = {
  productFamily: "floating-shelves",
  productSlug: "classic-floating-shelf",
  displayName: "Classic Floating Shelf",
  categorySlug: "floating-shelves",
  liveStatus: "LIVE",
  supportsInstantPricing: true,
  supportsStandardCheckout: true,
  supportsDepositPayment: true,
  supportsReviewFallback: true,
  pdpPath: "/shop/floating-shelves/classic-floating-shelf",
  checkoutPath: "/order/floating-shelves/classic-floating-shelf",
  normalizeConfiguration(input) {
    return input;
  },
  priceConfiguration(input) {
    return calculateFloatingShelfPrice(input);
  },
  evaluateEligibility(pricing) {
    const reasonCodes: string[] = [];

    if (pricing.reviewRequired) {
      reasonCodes.push("REVIEW_REQUIRED");
    }
    if (pricing.consultRequired) {
      reasonCodes.push("CONSULT_REQUIRED");
    }

    return {
      instantPriceEligible: pricing.instantPriceEligible,
      reviewRequired: pricing.reviewRequired,
      consultRequired: pricing.consultRequired,
      reasonCodes,
      customerFacingMessage: pricing.customerMessage,
      allowedCheckoutMode: pricing.instantPriceEligible ? "STANDARD_CHECKOUT" : "REVIEW_ONLY",
      fallbackMode: pricing.instantPriceEligible ? "NONE" : "REQUEST_REVIEW"
    };
  },
  calculateShipping(input, destination) {
    return calculateFloatingShelfShipping(input, destination);
  },
  buildFieldMetriqPayload(input) {
    return mapFloatingShelfOrderToFieldMetriqPayload({
      requestId: input.requestId,
      sourcePath: input.sourcePath,
      draft: input.draft as any,
      canonicalPricing: input.canonicalPricing as any,
      shippingQuote: input.shippingQuote,
      taxQuote: input.taxQuote
    });
  },
  buildPaidFieldMetriqPayload(input) {
    return mapPaidFloatingShelfOrderToFieldMetriqPayload({
      requestId: input.requestId,
      sourcePath: input.sourcePath,
      draft: input.draft as any,
      canonicalPricing: input.canonicalPricing as any,
      shippingQuote: input.shippingQuote,
      taxQuote: input.taxQuote,
      payment: input.payment
    });
  },
  summarizeConfiguration(input) {
    return [
      `${input.width}" width`,
      `${input.depth}" depth`,
      `${input.thickness}" thickness`,
      input.materialLabel,
      input.mountingLabel,
      `Qty ${input.quantity}`
    ];
  }
};
