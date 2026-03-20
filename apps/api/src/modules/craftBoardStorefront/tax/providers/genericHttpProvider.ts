import { env } from "../../../../lib/env.js";
import type { TaxQuoteProvider } from "./types.js";

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

export const genericHttpTaxQuoteProvider: TaxQuoteProvider = {
  provider: "GENERIC_HTTP",

  async getQuote(input) {
    if (!env.TAX_QUOTE_API_BASE_URL || !env.TAX_QUOTE_API_KEY) {
      throw new Error("Tax quote provider configuration is incomplete.");
    }

    const timeout = timeoutSignal(env.CRAFT_BOARD_TAX_TIMEOUT_MS);

    try {
      const response = await fetch(`${env.TAX_QUOTE_API_BASE_URL.replace(/\/+$/, "")}/quotes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.TAX_QUOTE_API_KEY}`
        },
        body: JSON.stringify(input),
        signal: timeout.signal
      });
      const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok || !body) {
        throw new Error(`Tax quote provider rejected the request with ${response.status}.`);
      }

      return {
        quoteAvailable: body.quoteAvailable === true,
        quoteSource:
          body.quoteSource === "LIVE_PROVIDER"
            ? "LIVE_PROVIDER"
            : body.quoteSource === "NOT_APPLICABLE"
              ? "NOT_APPLICABLE"
              : "MANUAL_REVIEW",
        taxAmountCents: typeof body.taxAmountCents === "number" ? body.taxAmountCents : 0,
        taxableSubtotalCents:
          typeof body.taxableSubtotalCents === "number" ? body.taxableSubtotalCents : 0,
        taxableShippingCents:
          typeof body.taxableShippingCents === "number" ? body.taxableShippingCents : 0,
        jurisdictionSummary:
          body.jurisdictionSummary && typeof body.jurisdictionSummary === "object"
            ? (body.jurisdictionSummary as any)
            : input.fallbackEstimate.jurisdictionSummary,
        taxRateBasisPoints:
          typeof body.taxRateBasisPoints === "number" ? body.taxRateBasisPoints : null,
        quoteReference: typeof body.quoteReference === "string" ? body.quoteReference : null,
        quoteExpiresAt: typeof body.quoteExpiresAt === "string" ? body.quoteExpiresAt : null,
        warnings: Array.isArray(body.warnings)
          ? body.warnings.filter((v): v is string => typeof v === "string")
          : [],
        reviewRequired: body.reviewRequired === true,
        reasonCodes: Array.isArray(body.reasonCodes)
          ? body.reasonCodes.filter((v): v is string => typeof v === "string")
          : [],
        fallbackUsed: body.fallbackUsed === true,
        rawProviderSummary:
          body.rawProviderSummary && typeof body.rawProviderSummary === "object"
            ? (body.rawProviderSummary as Record<string, unknown>)
            : null
      };
    } finally {
      timeout.clear();
    }
  }
};
