import { env } from "../../../lib/env.js";
import { logger } from "../../../lib/logger.js";
import type { StorefrontShippingDestination } from "../shipping/types.js";
import { normalizeShippingDestination } from "../shipping/zones.js";
import { getTaxQuoteProvider } from "./providers/providerRegistry.js";
import type { StorefrontTaxDestination, StorefrontTaxQuoteResult } from "./types.js";

const stateEstimateRates: Record<string, number> = {
  WA: 1020,
  CA: 825,
  ID: 600
};

function isoNow() {
  return new Date().toISOString();
}

function getNexusStates() {
  return new Set(
    env.CRAFT_BOARD_TAX_NEXUS_STATES.split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );
}

export function normalizeTaxDestination(input: StorefrontShippingDestination & {
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
}): StorefrontTaxDestination {
  const normalized = normalizeShippingDestination(input);
  return {
    postalCode: normalized.postalCode,
    countryCode: normalized.countryCode,
    stateOrProvinceCode: normalized.stateOrProvinceCode,
    city: input.city ?? null,
    shippingAddress1: input.shippingAddress1 ?? null,
    shippingAddress2: input.shippingAddress2 ?? null
  };
}

function jurisdictionSummary(input: StorefrontTaxDestination) {
  return {
    countryCode: input.countryCode,
    stateOrProvinceCode: input.stateOrProvinceCode,
    postalCodePrefix: input.postalCode.slice(0, 3)
  };
}

function buildNotApplicableTax(input: {
  destination: StorefrontTaxDestination;
  reasonCodes: string[];
  warning?: string;
  message: string;
}): StorefrontTaxQuoteResult {
  return {
    taxEligible: false,
    reviewRequired: false,
    quoteSource: "NOT_APPLICABLE",
    taxAmountCents: 0,
    taxableSubtotalCents: 0,
    taxableShippingCents: 0,
    jurisdictionSummary: jurisdictionSummary(input.destination),
    taxRateBasisPoints: null,
    taxWarnings: input.warning ? [input.warning] : [],
    taxReasonCodes: input.reasonCodes,
    taxBasisVersion: "tax-v1",
    quoteGeneratedAt: isoNow(),
    quoteExpiresAt: null,
    quoteReference: null,
    fallbackUsed: false,
    rawProviderSummary: null,
    customerFacingMessage: input.message
  };
}

function buildReviewTax(input: {
  destination: StorefrontTaxDestination;
  reasonCodes: string[];
  warning?: string;
  message: string;
}): StorefrontTaxQuoteResult {
  return {
    taxEligible: false,
    reviewRequired: true,
    quoteSource: "MANUAL_REVIEW",
    taxAmountCents: 0,
    taxableSubtotalCents: 0,
    taxableShippingCents: 0,
    jurisdictionSummary: jurisdictionSummary(input.destination),
    taxRateBasisPoints: null,
    taxWarnings: input.warning ? [input.warning] : [],
    taxReasonCodes: input.reasonCodes,
    taxBasisVersion: "tax-v1",
    quoteGeneratedAt: isoNow(),
    quoteExpiresAt: null,
    quoteReference: null,
    fallbackUsed: false,
    rawProviderSummary: null,
    customerFacingMessage: input.message
  };
}

export function calculateEstimatedTax(input: {
  destination: StorefrontTaxDestination;
  productSubtotalCents: number;
  shippingCostCents: number;
  shippingTaxable: boolean;
}): StorefrontTaxQuoteResult {
  const nexusStates = getNexusStates();
  const state = input.destination.stateOrProvinceCode.toUpperCase();

  if (input.destination.countryCode.toUpperCase() !== "US") {
    return buildReviewTax({
      destination: input.destination,
      reasonCodes: ["UNSUPPORTED_TAX_DESTINATION"],
      warning: "This destination needs tax review before standard checkout can continue.",
      message: "Tax review is required before Craft & Board can confirm this destination."
    });
  }

  if (!nexusStates.has(state)) {
    return buildNotApplicableTax({
      destination: input.destination,
      reasonCodes: ["OUTSIDE_NEXUS"],
      message: "Estimated tax is not currently collected for this destination under Craft & Board's configured nexus."
    });
  }

  const rate = stateEstimateRates[state] ?? 850;
  const taxableSubtotalCents = input.productSubtotalCents;
  const taxableShippingCents = input.shippingTaxable ? input.shippingCostCents : 0;
  const taxableBase = taxableSubtotalCents + taxableShippingCents;

  return {
    taxEligible: true,
    reviewRequired: false,
    quoteSource: "ESTIMATE_RULES",
    taxAmountCents: Math.round(taxableBase * (rate / 10000)),
    taxableSubtotalCents,
    taxableShippingCents,
    jurisdictionSummary: jurisdictionSummary(input.destination),
    taxRateBasisPoints: rate,
    taxWarnings: [],
    taxReasonCodes: [],
    taxBasisVersion: "tax-v1",
    quoteGeneratedAt: isoNow(),
    quoteExpiresAt: null,
    quoteReference: null,
    fallbackUsed: false,
    rawProviderSummary: null,
    customerFacingMessage: "Estimated sales tax is based on the current destination and configured tax rules."
  };
}

function buildEstimateFallback(
  estimate: StorefrontTaxQuoteResult,
  input?: { warning?: string; reasonCode?: string }
): StorefrontTaxQuoteResult {
  return {
    ...estimate,
    quoteSource: estimate.quoteSource === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "ESTIMATE_RULES",
    fallbackUsed: input?.reasonCode ? true : estimate.fallbackUsed,
    taxWarnings: input?.warning ? [...estimate.taxWarnings, input.warning] : estimate.taxWarnings,
    taxReasonCodes: input?.reasonCode ? [...estimate.taxReasonCodes, input.reasonCode] : estimate.taxReasonCodes,
    quoteGeneratedAt: isoNow(),
    taxBasisVersion: `${estimate.taxBasisVersion}${input?.reasonCode ? "+fallback" : ""}`
  };
}

export async function finalizeTaxQuote(input: {
  requestId?: string | null;
  destination: StorefrontTaxDestination;
  productSubtotalCents: number;
  shippingCostCents: number;
  shippingTaxable: boolean;
}): Promise<StorefrontTaxQuoteResult> {
  const estimate = calculateEstimatedTax(input);

  if (estimate.reviewRequired || estimate.quoteSource === "NOT_APPLICABLE") {
    return estimate;
  }

  if (!env.CRAFT_BOARD_ENABLE_LIVE_TAX_QUOTES) {
    return buildEstimateFallback(estimate);
  }

  const provider = getTaxQuoteProvider();
  const startedAt = Date.now();

  try {
    const result = await provider.getQuote({
      requestId: input.requestId,
      destination: input.destination,
      fallbackEstimate: estimate
    });

    logger.info("Craft & Board tax quote provider completed", {
      requestId: input.requestId ?? null,
      provider: provider.provider,
      quoteSource: result.quoteSource,
      durationMs: Date.now() - startedAt
    });

    if (!result.quoteAvailable || result.reviewRequired) {
      if (env.CRAFT_BOARD_TAX_FALLBACK_TO_ESTIMATE) {
        return buildEstimateFallback(estimate, {
          warning: "Live tax quotes were unavailable, so Craft & Board used an estimated tax fallback.",
          reasonCode: "LIVE_TAX_QUOTE_UNAVAILABLE"
        });
      }

      return buildReviewTax({
        destination: input.destination,
        reasonCodes: result.reasonCodes.length ? result.reasonCodes : ["LIVE_TAX_QUOTE_UNAVAILABLE"],
        warning: "A live tax quote could not be confirmed for this destination.",
        message: "Tax review is required before Craft & Board can confirm this destination."
      });
    }

    return {
      taxEligible: true,
      reviewRequired: false,
      quoteSource: result.quoteSource,
      taxAmountCents: result.taxAmountCents,
      taxableSubtotalCents: result.taxableSubtotalCents,
      taxableShippingCents: result.taxableShippingCents,
      jurisdictionSummary: result.jurisdictionSummary,
      taxRateBasisPoints: result.taxRateBasisPoints,
      taxWarnings: result.warnings,
      taxReasonCodes: result.reasonCodes,
      taxBasisVersion: `tax-v1+${provider.provider.toLowerCase()}`,
      quoteGeneratedAt: isoNow(),
      quoteExpiresAt: result.quoteExpiresAt,
      quoteReference: result.quoteReference,
      fallbackUsed: result.fallbackUsed,
      rawProviderSummary: result.rawProviderSummary,
      customerFacingMessage: "Sales tax was calculated from the current destination quote basis."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("Craft & Board tax quote provider failed", {
      requestId: input.requestId ?? null,
      provider: provider.provider,
      durationMs: Date.now() - startedAt,
      error: message
    });

    if (env.CRAFT_BOARD_TAX_FALLBACK_TO_ESTIMATE) {
      return buildEstimateFallback(estimate, {
        warning: "Live tax quotes were unavailable, so Craft & Board used an estimated tax fallback.",
        reasonCode: "LIVE_TAX_QUOTE_FAILED"
      });
    }

    return buildReviewTax({
      destination: input.destination,
      reasonCodes: ["LIVE_TAX_QUOTE_FAILED"],
      warning: "A live tax quote could not be confirmed for this destination.",
      message: "Tax review is required before Craft & Board can confirm this destination."
    });
  }
}
