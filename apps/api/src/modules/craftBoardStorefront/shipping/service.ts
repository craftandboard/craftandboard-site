import { env } from "../../../lib/env.js";
import { logger } from "../../../lib/logger.js";
import { getShippingQuoteProvider } from "./providers/providerRegistry.js";
import type {
  ConfigurableProductShippingResult,
  StorefrontDestinationZone,
  StorefrontPackagingProfile,
  StorefrontShippingDestination,
  StorefrontShippingMode
} from "./types.js";
import { normalizeShippingDestination, resolveDestinationZone } from "./zones.js";

const zoneMultipliers: Record<Exclude<StorefrontDestinationZone, "UNSUPPORTED">, number> = {
  LOCAL_WEST: 1,
  WEST: 1.12,
  MOUNTAIN: 1.26,
  CENTRAL: 1.42,
  EAST: 1.68,
  REMOTE: 2.35
};

const transitDaysByZone: Record<Exclude<StorefrontDestinationZone, "UNSUPPORTED">, number> = {
  LOCAL_WEST: 2,
  WEST: 3,
  MOUNTAIN: 4,
  CENTRAL: 5,
  EAST: 7,
  REMOTE: 10
};

const profileBaseCosts: Record<
  StorefrontPackagingProfile,
  Partial<Record<StorefrontShippingMode, number>>
> = {
  long_shelf_box: {
    PARCEL: 4800
  },
  mantel_box: {
    PARCEL: 6200
  },
  long_oversize_box: {
    OVERSIZE_PARCEL: 12800
  },
  mantel_crate: {
    OVERSIZE_PARCEL: 15400,
    LTL_FREIGHT: 26500
  },
  freight_pallet: {
    LTL_FREIGHT: 28500
  }
};

function isoNow() {
  return new Date().toISOString();
}

function buildDestinationSummary(input: StorefrontShippingDestination) {
  const normalized = normalizeShippingDestination(input);
  return {
    countryCode: normalized.countryCode,
    stateOrProvinceCode: normalized.stateOrProvinceCode,
    postalCodePrefix: normalized.postalCode.slice(0, 3)
  };
}

function canAttemptProviderQuote(estimate: ConfigurableProductShippingResult) {
  return (
    estimate.shippingEligible &&
    !estimate.reviewRequired &&
    !estimate.consultRequired &&
    (estimate.shippingMode === "PARCEL" || estimate.shippingMode === "OVERSIZE_PARCEL")
  );
}

function shouldForceManualReview(estimate: ConfigurableProductShippingResult) {
  return (
    estimate.shippingMode === "LTL_FREIGHT" ||
    estimate.shippingMode === "REVIEW_REQUIRED" ||
    estimate.reviewRequired ||
    !estimate.shippingEligible
  );
}

function buildEstimateQuote(
  estimate: ConfigurableProductShippingResult,
  input?: {
    fallbackUsed?: boolean;
    extraWarnings?: string[];
    extraReasonCodes?: string[];
  }
): ConfigurableProductShippingResult {
  return {
    ...estimate,
    quoteSource: estimate.reviewRequired ? "MANUAL_REVIEW" : "ESTIMATE_RULES",
    carrierName: null,
    serviceLevel: null,
    quoteReference: null,
    quoteExpiresAt: null,
    rawProviderSummary: null,
    fallbackUsed: input?.fallbackUsed ?? false,
    shippingWarnings: [...estimate.shippingWarnings, ...(input?.extraWarnings ?? [])],
    shippingReasonCodes: [...estimate.shippingReasonCodes, ...(input?.extraReasonCodes ?? [])],
    quoteGeneratedAt: isoNow(),
    shippingBasisVersion: `${estimate.shippingBasisVersion}${input?.fallbackUsed ? "+fallback" : ""}`
  };
}

export function buildReviewRequiredShippingResult(input: {
  productFamily: string;
  productSlug: string;
  packagingProfile: StorefrontPackagingProfile;
  shippingMode?: StorefrontShippingMode;
  consultRequired?: boolean;
  destination: StorefrontShippingDestination;
  reasonCodes: string[];
  warnings?: string[];
  customerFacingMessage: string;
}): ConfigurableProductShippingResult {
  const normalized = normalizeShippingDestination(input.destination);
  const zone = resolveDestinationZone(normalized);

  return {
    productFamily: input.productFamily,
    productSlug: input.productSlug,
    shippingEligible: false,
    reviewRequired: true,
    consultRequired: input.consultRequired ?? false,
    shippingMode: input.shippingMode ?? "REVIEW_REQUIRED",
    packagingProfile: input.packagingProfile,
    shippingCostCents: 0,
    estimatedTransitDays: null,
    carrierName: null,
    serviceLevel: null,
    quoteSource: "MANUAL_REVIEW",
    quoteReference: null,
    quoteExpiresAt: null,
    rawProviderSummary: null,
    fallbackUsed: false,
    shippingWarnings: input.warnings ?? [],
    shippingReasonCodes: input.reasonCodes,
    destinationZone: zone,
    shippingBasisVersion: "shipping-v2",
    quoteGeneratedAt: isoNow(),
    customerFacingMessage: input.customerFacingMessage,
    destinationSummary: buildDestinationSummary(normalized)
  };
}

export function calculateEstimatedShipping(input: {
  productFamily: string;
  productSlug: string;
  packagingProfile: StorefrontPackagingProfile;
  shippingMode: StorefrontShippingMode;
  quantity: number;
  destination: StorefrontShippingDestination;
  warnings?: string[];
  customerFacingMessage: string;
}): ConfigurableProductShippingResult {
  const normalized = normalizeShippingDestination(input.destination);
  const zone = resolveDestinationZone(normalized);

  if (zone === "UNSUPPORTED") {
    return buildReviewRequiredShippingResult({
      productFamily: input.productFamily,
      productSlug: input.productSlug,
      packagingProfile: input.packagingProfile,
      shippingMode: "REVIEW_REQUIRED",
      destination: normalized,
      reasonCodes: ["UNSUPPORTED_DESTINATION"],
      warnings: ["This destination needs a logistics review before standard checkout can continue."],
      customerFacingMessage:
        "This destination needs logistics review before Craft & Board can confirm standard shipping."
    });
  }

  const baseCost = profileBaseCosts[input.packagingProfile][input.shippingMode];
  if (!baseCost) {
    return buildReviewRequiredShippingResult({
      productFamily: input.productFamily,
      productSlug: input.productSlug,
      packagingProfile: input.packagingProfile,
      shippingMode: "REVIEW_REQUIRED",
      destination: normalized,
      reasonCodes: ["UNSUPPORTED_SHIPPING_MODE"],
      warnings: ["The current packaging profile needs manual shipping review."],
      customerFacingMessage:
        "This configuration needs a shipping review before Craft & Board can confirm the logistics plan."
    });
  }

  const zoneMultiplier = zoneMultipliers[zone];
  const quantityMultiplier = input.quantity <= 1 ? 1 : 1 + (input.quantity - 1) * 0.72;
  const shippingCostCents = Math.round(baseCost * zoneMultiplier * quantityMultiplier);

  return {
    productFamily: input.productFamily,
    productSlug: input.productSlug,
    shippingEligible: true,
    reviewRequired: false,
    consultRequired: false,
    shippingMode: input.shippingMode,
    packagingProfile: input.packagingProfile,
    shippingCostCents,
    estimatedTransitDays: transitDaysByZone[zone],
    carrierName: null,
    serviceLevel: null,
    quoteSource: "ESTIMATE_RULES",
    quoteReference: null,
    quoteExpiresAt: null,
    rawProviderSummary: null,
    fallbackUsed: false,
    shippingWarnings: input.warnings ?? [],
    shippingReasonCodes: [],
    destinationZone: zone,
    shippingBasisVersion: "shipping-v2",
    quoteGeneratedAt: isoNow(),
    customerFacingMessage: input.customerFacingMessage,
    destinationSummary: buildDestinationSummary(normalized)
  };
}

export async function finalizeShippingQuote(input: {
  requestId?: string | null;
  productFamily: string;
  productSlug: string;
  destination: StorefrontShippingDestination;
  estimate: ConfigurableProductShippingResult;
}): Promise<ConfigurableProductShippingResult> {
  if (shouldForceManualReview(input.estimate)) {
    return {
      ...input.estimate,
      quoteSource: "MANUAL_REVIEW",
      quoteGeneratedAt: isoNow()
    };
  }

  if (!env.CRAFT_BOARD_ENABLE_LIVE_SHIPPING_QUOTES || !canAttemptProviderQuote(input.estimate)) {
    return buildEstimateQuote(input.estimate);
  }

  const provider = getShippingQuoteProvider();
  const startedAt = Date.now();

  try {
    const providerQuote = await provider.getQuote({
      requestId: input.requestId,
      productFamily: input.productFamily,
      productSlug: input.productSlug,
      destination: input.destination,
      fallbackEstimate: input.estimate
    });

    logger.info("Craft & Board shipping quote provider completed", {
      requestId: input.requestId ?? null,
      provider: provider.provider,
      productSlug: input.productSlug,
      quoteSource: providerQuote.quoteSource,
      durationMs: Date.now() - startedAt
    });

    if (!providerQuote.quoteAvailable || providerQuote.reviewRequired) {
      if (env.CRAFT_BOARD_SHIPPING_FALLBACK_TO_ESTIMATE) {
        return buildEstimateQuote(input.estimate, {
          fallbackUsed: true,
          extraWarnings: [
            "Live shipping quotes were unavailable for this destination, so Craft & Board used an estimated shipping fallback."
          ],
          extraReasonCodes: providerQuote.reasonCodes
        });
      }

      return buildReviewRequiredShippingResult({
        productFamily: input.productFamily,
        productSlug: input.productSlug,
        packagingProfile: providerQuote.packagingProfile,
        shippingMode: "REVIEW_REQUIRED",
        destination: input.destination,
        reasonCodes: providerQuote.reasonCodes.length ? providerQuote.reasonCodes : ["LIVE_QUOTE_UNAVAILABLE"],
        warnings: providerQuote.quoteWarnings,
        customerFacingMessage:
          "Shipping needs logistics review before Craft & Board can confirm this order."
      });
    }

    return {
      ...input.estimate,
      shippingMode: providerQuote.shippingMode,
      packagingProfile: providerQuote.packagingProfile,
      shippingCostCents: providerQuote.shippingCostCents,
      estimatedTransitDays: providerQuote.estimatedTransitDays,
      carrierName: providerQuote.carrierName,
      serviceLevel: providerQuote.serviceLevel,
      quoteSource: providerQuote.quoteSource,
      quoteReference: providerQuote.quoteReference,
      quoteExpiresAt: providerQuote.quoteExpiresAt,
      rawProviderSummary: providerQuote.rawProviderSummary,
      fallbackUsed: providerQuote.fallbackUsed,
      shippingWarnings: [...input.estimate.shippingWarnings, ...providerQuote.quoteWarnings],
      shippingReasonCodes: providerQuote.reasonCodes,
      quoteGeneratedAt: isoNow(),
      shippingBasisVersion: `${input.estimate.shippingBasisVersion}+${provider.provider.toLowerCase()}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Craft & Board shipping quote provider failed", {
      requestId: input.requestId ?? null,
      provider: provider.provider,
      productSlug: input.productSlug,
      durationMs: Date.now() - startedAt,
      error: message
    });

    if (env.CRAFT_BOARD_SHIPPING_FALLBACK_TO_ESTIMATE) {
      return buildEstimateQuote(input.estimate, {
        fallbackUsed: true,
        extraWarnings: [
          "Live shipping quotes were unavailable, so Craft & Board used an estimated shipping fallback."
        ],
        extraReasonCodes: ["LIVE_QUOTE_FAILED"]
      });
    }

    return buildReviewRequiredShippingResult({
      productFamily: input.productFamily,
      productSlug: input.productSlug,
      packagingProfile: input.estimate.packagingProfile,
      shippingMode: "REVIEW_REQUIRED",
      destination: input.destination,
      reasonCodes: ["LIVE_QUOTE_FAILED"],
      warnings: ["A live shipping quote could not be confirmed for this order."],
      customerFacingMessage:
        "Shipping needs logistics review before Craft & Board can confirm this order."
    });
  }
}
