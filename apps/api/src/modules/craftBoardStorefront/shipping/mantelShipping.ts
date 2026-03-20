import type { FloatingMantelConfiguration } from "../floatingMantelPricing.js";
import { buildReviewRequiredShippingResult, calculateEstimatedShipping } from "./service.js";
import type { StorefrontShippingDestination } from "./types.js";

export function calculateFloatingMantelShipping(
  configuration: FloatingMantelConfiguration,
  destination: StorefrontShippingDestination
) {
  if (configuration.mountingCode === "CONSULT_REQUIRED") {
    return buildReviewRequiredShippingResult({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "mantel_crate",
      consultRequired: true,
      destination,
      reasonCodes: ["CONSULT_REQUIRED_SUPPORT"],
      warnings: ["Consult-needed concealed support requires a logistics review before standard shipping can be confirmed."],
      customerFacingMessage:
        "This mantel needs support and shipping review before Craft & Board can confirm standard checkout."
    });
  }

  if (configuration.length > 96 || configuration.quantity > 2) {
    return buildReviewRequiredShippingResult({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "freight_pallet",
      shippingMode: "LTL_FREIGHT",
      destination,
      reasonCodes: ["OVERSIZE_MANTEL_REVIEW"],
      warnings: ["Longer mantel spans need a freight review before standard checkout can continue."],
      customerFacingMessage:
        "This mantel configuration needs shipping review before Craft & Board can confirm the logistics plan."
    });
  }

  if (configuration.length > 78 || configuration.depth === 12 || configuration.height === 6) {
    return calculateEstimatedShipping({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "mantel_crate",
      shippingMode: "OVERSIZE_PARCEL",
      quantity: configuration.quantity,
      destination,
      warnings:
        configuration.length > 84
          ? ["Longer mantel spans move through an oversize handling path and may need final scheduling review after order intake."]
          : [],
      customerFacingMessage:
        "Estimated shipping reflects an oversize mantel handling path for this configuration."
    });
  }

  return calculateEstimatedShipping({
    productFamily: configuration.productFamily,
    productSlug: configuration.productSlug,
    packagingProfile: "mantel_box",
    shippingMode: "PARCEL",
    quantity: configuration.quantity,
    destination,
    customerFacingMessage:
      "Estimated shipping is based on a standard mantel packaging profile."
  });
}
