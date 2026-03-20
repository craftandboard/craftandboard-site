import { randomUUID } from "node:crypto";
import type { ShippingQuoteProvider } from "./types.js";

export const simulatedParcelProvider: ShippingQuoteProvider = {
  provider: "SIMULATED_PARCEL",

  async getQuote(input) {
    const uplift =
      input.fallbackEstimate.shippingMode === "OVERSIZE_PARCEL"
        ? 1.08
        : 1.03;
    const shippingCostCents = Math.max(
      1,
      Math.round(input.fallbackEstimate.shippingCostCents * uplift)
    );

    return {
      quoteAvailable: true,
      quoteSource: "LIVE_PROVIDER",
      shippingMode: input.fallbackEstimate.shippingMode,
      packagingProfile: input.fallbackEstimate.packagingProfile,
      shippingCostCents,
      estimatedTransitDays:
        input.fallbackEstimate.estimatedTransitDays === null
          ? null
          : Math.max(1, input.fallbackEstimate.estimatedTransitDays - 1),
      carrierName: "Simulated Parcel",
      serviceLevel:
        input.fallbackEstimate.shippingMode === "OVERSIZE_PARCEL"
          ? "Oversize Ground"
          : "Ground",
      quoteReference: `shipq_${randomUUID()}`,
      quoteExpiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      quoteWarnings: [],
      rawProviderSummary: {
        provider: "SIMULATED_PARCEL",
        destinationZone: input.fallbackEstimate.destinationZone
      },
      fallbackUsed: false,
      reviewRequired: false,
      reasonCodes: []
    };
  }
};
