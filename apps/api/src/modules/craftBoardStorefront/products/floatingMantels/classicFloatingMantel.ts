import {
  calculateFloatingMantelPrice,
  type FloatingMantelConfiguration
} from "../../floatingMantelPricing.js";
import {
  mapFloatingMantelOrderToFieldMetriqPayload,
  mapPaidFloatingMantelOrderToFieldMetriqPayload
} from "../../orderContract.js";
import { calculateFloatingMantelShipping } from "../../shipping/mantelShipping.js";
import type { ConfigurableProductDefinition } from "../types.js";

export const classicFloatingMantelDefinition: ConfigurableProductDefinition<FloatingMantelConfiguration> = {
  productFamily: "floating-mantels",
  productSlug: "classic-floating-mantel",
  displayName: "Classic Floating Mantel",
  categorySlug: "floating-mantels",
  liveStatus: "LIVE",
  supportsInstantPricing: true,
  supportsStandardCheckout: true,
  supportsDepositPayment: true,
  supportsReviewFallback: true,
  pdpPath: "/shop/floating-mantels/classic-floating-mantel",
  checkoutPath: "/order/floating-mantels/classic-floating-mantel",
  normalizeConfiguration(input) {
    return input;
  },
  priceConfiguration(input) {
    return calculateFloatingMantelPrice(input);
  },
  evaluateEligibility(pricing) {
    const reasonCodes: string[] = [];
    if (pricing.reviewRequired) reasonCodes.push("REVIEW_REQUIRED");
    if (pricing.consultRequired) reasonCodes.push("CONSULT_REQUIRED");

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
    return calculateFloatingMantelShipping(input, destination);
  },
  buildFieldMetriqPayload(input) {
    return mapFloatingMantelOrderToFieldMetriqPayload({
      requestId: input.requestId,
      sourcePath: input.sourcePath,
      draft: input.draft as any,
      canonicalPricing: input.canonicalPricing as any,
      shippingQuote: input.shippingQuote,
      taxQuote: input.taxQuote
    });
  },
  buildPaidFieldMetriqPayload(input) {
    return mapPaidFloatingMantelOrderToFieldMetriqPayload({
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
      `${input.length}" length`,
      `${input.depth}" depth`,
      `${input.height}" height`,
      input.materialLabel,
      input.mountingLabel,
      `Qty ${input.quantity}`
    ];
  }
};
