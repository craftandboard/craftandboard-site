import { randomUUID } from "node:crypto";
import type { TaxQuoteProvider } from "./types.js";

export const simulatedTaxProvider: TaxQuoteProvider = {
  provider: "SIMULATED_TAX",

  async getQuote(input) {
    const estimate = input.fallbackEstimate;
    const rate = estimate.taxRateBasisPoints ?? 0;
    const adjustedRate = Math.max(0, rate + 15);
    const taxableBase = estimate.taxableSubtotalCents + estimate.taxableShippingCents;
    const taxAmountCents = Math.round(taxableBase * (adjustedRate / 10000));

    return {
      quoteAvailable: true,
      quoteSource: "LIVE_PROVIDER",
      taxAmountCents,
      taxableSubtotalCents: estimate.taxableSubtotalCents,
      taxableShippingCents: estimate.taxableShippingCents,
      jurisdictionSummary: estimate.jurisdictionSummary,
      taxRateBasisPoints: adjustedRate,
      quoteReference: `taxq_${randomUUID()}`,
      quoteExpiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      warnings: [],
      reviewRequired: false,
      reasonCodes: [],
      fallbackUsed: false,
      rawProviderSummary: {
        provider: "SIMULATED_TAX",
        jurisdiction: estimate.jurisdictionSummary
      }
    };
  }
};
