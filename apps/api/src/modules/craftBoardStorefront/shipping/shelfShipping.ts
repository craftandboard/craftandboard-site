import type { FloatingShelfConfiguration } from "../floatingShelfPricing.js";
import { buildReviewRequiredShippingResult, calculateEstimatedShipping } from "./service.js";
import type { StorefrontShippingDestination } from "./types.js";

export function calculateFloatingShelfShipping(
  configuration: FloatingShelfConfiguration,
  destination: StorefrontShippingDestination
) {
  if (configuration.mountingCode === "CONSULT_REQUIRED") {
    return buildReviewRequiredShippingResult({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "freight_pallet",
      consultRequired: true,
      destination,
      reasonCodes: ["CONSULT_REQUIRED_MOUNTING"],
      warnings: ["Consult-needed mounting requires a logistics review before standard shipping can be confirmed."],
      customerFacingMessage:
        "This shelf needs installation and shipping review before Craft & Board can confirm standard checkout."
    });
  }

  if (configuration.width > 96 || configuration.quantity > 3) {
    return buildReviewRequiredShippingResult({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "freight_pallet",
      shippingMode: "LTL_FREIGHT",
      destination,
      reasonCodes: ["OVERSIZE_FREIGHT_REVIEW"],
      warnings: ["Longer or higher-quantity shelf runs need a freight review before standard checkout."],
      customerFacingMessage:
        "This shelf configuration needs shipping review before Craft & Board can confirm the logistics plan."
    });
  }

  if (configuration.width > 72 || configuration.depth === 12 || configuration.thickness === 2.5 || configuration.quantity > 1) {
    return calculateEstimatedShipping({
      productFamily: configuration.productFamily,
      productSlug: configuration.productSlug,
      packagingProfile: "long_oversize_box",
      shippingMode: "OVERSIZE_PARCEL",
      quantity: configuration.quantity,
      destination,
      warnings:
        configuration.width > 84
          ? ["Long spans ship through an oversize handling path and may still need a final logistics review after order intake."]
          : [],
      customerFacingMessage:
        "Estimated shipping reflects an oversize parcel handling path for this shelf configuration."
    });
  }

  return calculateEstimatedShipping({
    productFamily: configuration.productFamily,
    productSlug: configuration.productSlug,
    packagingProfile: "long_shelf_box",
    shippingMode: "PARCEL",
    quantity: configuration.quantity,
    destination,
    customerFacingMessage:
      "Estimated shipping is based on a standard parcel-ready shelf packaging profile."
  });
}
