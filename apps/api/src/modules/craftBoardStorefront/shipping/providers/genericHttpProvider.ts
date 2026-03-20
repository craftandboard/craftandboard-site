import { env } from "../../../../lib/env.js";
import type { ShippingQuoteProvider } from "./types.js";

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

export const genericHttpShippingQuoteProvider: ShippingQuoteProvider = {
  provider: "GENERIC_HTTP",

  async getQuote(input) {
    if (!env.SHIPPING_QUOTE_API_BASE_URL || !env.SHIPPING_QUOTE_API_KEY) {
      throw new Error("Shipping quote provider configuration is incomplete.");
    }

    const timeout = timeoutSignal(env.CRAFT_BOARD_SHIPPING_QUOTE_TIMEOUT_MS);

    try {
      const response = await fetch(`${env.SHIPPING_QUOTE_API_BASE_URL.replace(/\/+$/, "")}/quotes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.SHIPPING_QUOTE_API_KEY}`
        },
        body: JSON.stringify({
          requestId: input.requestId ?? null,
          productFamily: input.productFamily,
          productSlug: input.productSlug,
          destination: input.destination,
          fallbackEstimate: input.fallbackEstimate
        }),
        signal: timeout.signal
      });

      const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok || !body) {
        throw new Error(`Shipping quote provider rejected the request with ${response.status}.`);
      }

      return {
        quoteAvailable: body.quoteAvailable === true,
        quoteSource: body.quoteSource === "LIVE_PROVIDER" ? "LIVE_PROVIDER" : "MANUAL_REVIEW",
        shippingMode: typeof body.shippingMode === "string" ? (body.shippingMode as any) : input.fallbackEstimate.shippingMode,
        packagingProfile:
          typeof body.packagingProfile === "string"
            ? (body.packagingProfile as any)
            : input.fallbackEstimate.packagingProfile,
        shippingCostCents: typeof body.shippingCostCents === "number" ? body.shippingCostCents : input.fallbackEstimate.shippingCostCents,
        estimatedTransitDays:
          typeof body.estimatedTransitDays === "number" ? body.estimatedTransitDays : null,
        carrierName: typeof body.carrierName === "string" ? body.carrierName : null,
        serviceLevel: typeof body.serviceLevel === "string" ? body.serviceLevel : null,
        quoteReference: typeof body.quoteReference === "string" ? body.quoteReference : null,
        quoteExpiresAt: typeof body.quoteExpiresAt === "string" ? body.quoteExpiresAt : null,
        quoteWarnings: Array.isArray(body.quoteWarnings)
          ? body.quoteWarnings.filter((value): value is string => typeof value === "string")
          : [],
        rawProviderSummary:
          body.rawProviderSummary && typeof body.rawProviderSummary === "object"
            ? (body.rawProviderSummary as Record<string, unknown>)
            : null,
        fallbackUsed: body.fallbackUsed === true,
        reviewRequired: body.reviewRequired === true,
        reasonCodes: Array.isArray(body.reasonCodes)
          ? body.reasonCodes.filter((value): value is string => typeof value === "string")
          : []
      };
    } finally {
      timeout.clear();
    }
  }
};
