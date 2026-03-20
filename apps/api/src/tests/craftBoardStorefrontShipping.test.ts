import { afterEach, describe, expect, it, vi } from "vitest";

async function loadShippingService(input: {
  liveQuotes: boolean;
  fallbackToEstimate: boolean;
  providerResult?: Record<string, unknown>;
  providerError?: Error;
}) {
  vi.resetModules();

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  const provider = {
    provider: "SIMULATED_PARCEL" as const,
    getQuote: input.providerError
      ? vi.fn().mockRejectedValue(input.providerError)
      : vi.fn().mockResolvedValue(
          input.providerResult ?? {
            quoteAvailable: true,
            quoteSource: "LIVE_PROVIDER",
            shippingMode: "PARCEL",
            packagingProfile: "long_shelf_box",
            shippingCostCents: 6400,
            estimatedTransitDays: 3,
            carrierName: "Simulated Parcel",
            serviceLevel: "Ground",
            quoteReference: "shipq_live_123",
            quoteExpiresAt: "2026-03-14T21:00:00.000Z",
            quoteWarnings: [],
            rawProviderSummary: { provider: "SIMULATED_PARCEL" },
            fallbackUsed: false,
            reviewRequired: false,
            reasonCodes: []
          }
        )
  };

  vi.doMock("../lib/env.js", () => ({
    env: {
      CRAFT_BOARD_ENABLE_LIVE_SHIPPING_QUOTES: input.liveQuotes,
      CRAFT_BOARD_SHIPPING_FALLBACK_TO_ESTIMATE: input.fallbackToEstimate,
      CRAFT_BOARD_ENABLE_FREIGHT_REVIEW_ONLY: true,
      SHIPPING_QUOTE_PROVIDER: "SIMULATED_PARCEL"
    }
  }));
  vi.doMock("../lib/logger.js", () => ({ logger }));
  vi.doMock(
    "../modules/craftBoardStorefront/shipping/providers/providerRegistry.js",
    () => ({
      getShippingQuoteProvider: () => provider
    })
  );

  const service = await import("../modules/craftBoardStorefront/shipping/service.js");
  return { service, provider, logger };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("craft board storefront shipping quote orchestration", () => {
  it("uses estimate rules when live quotes are disabled", async () => {
    const { service, provider } = await loadShippingService({
      liveQuotes: false,
      fallbackToEstimate: true
    });

    const estimate = service.calculateEstimatedShipping({
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      packagingProfile: "long_shelf_box",
      shippingMode: "PARCEL",
      quantity: 1,
      destination: {
        postalCode: "98104",
        countryCode: "US",
        stateOrProvinceCode: "WA"
      },
      customerFacingMessage: "Estimated shipping is based on a standard parcel-ready shelf packaging profile."
    });

    const quote = await service.finalizeShippingQuote({
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      destination: {
        postalCode: "98104",
        countryCode: "US",
        stateOrProvinceCode: "WA"
      },
      estimate
    });

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote.quoteSource).toBe("ESTIMATE_RULES");
    expect(quote.fallbackUsed).toBe(false);
  });

  it("returns a live provider quote for supported parcel cases", async () => {
    const { service, provider } = await loadShippingService({
      liveQuotes: true,
      fallbackToEstimate: true
    });

    const estimate = service.calculateEstimatedShipping({
      productFamily: "floating-mantels",
      productSlug: "classic-floating-mantel",
      packagingProfile: "mantel_box",
      shippingMode: "PARCEL",
      quantity: 1,
      destination: {
        postalCode: "60601",
        countryCode: "US",
        stateOrProvinceCode: "IL"
      },
      customerFacingMessage: "Estimated shipping is based on a standard mantel packaging profile."
    });

    const quote = await service.finalizeShippingQuote({
      requestId: "cbs_test_live",
      productFamily: "floating-mantels",
      productSlug: "classic-floating-mantel",
      destination: {
        postalCode: "60601",
        countryCode: "US",
        stateOrProvinceCode: "IL"
      },
      estimate
    });

    expect(provider.getQuote).toHaveBeenCalledOnce();
    expect(quote.quoteSource).toBe("LIVE_PROVIDER");
    expect(quote.carrierName).toBe("Simulated Parcel");
    expect(quote.quoteReference).toBe("shipq_live_123");
  });

  it("falls back to estimate rules when the provider fails and fallback is enabled", async () => {
    const { service, provider } = await loadShippingService({
      liveQuotes: true,
      fallbackToEstimate: true,
      providerError: new Error("quote timeout")
    });

    const estimate = service.calculateEstimatedShipping({
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      packagingProfile: "long_oversize_box",
      shippingMode: "OVERSIZE_PARCEL",
      quantity: 1,
      destination: {
        postalCode: "10001",
        countryCode: "US",
        stateOrProvinceCode: "NY"
      },
      customerFacingMessage: "Estimated shipping reflects an oversize parcel handling path for this shelf configuration."
    });

    const quote = await service.finalizeShippingQuote({
      requestId: "cbs_test_fallback",
      productFamily: "floating-shelves",
      productSlug: "classic-floating-shelf",
      destination: {
        postalCode: "10001",
        countryCode: "US",
        stateOrProvinceCode: "NY"
      },
      estimate
    });

    expect(provider.getQuote).toHaveBeenCalledOnce();
    expect(quote.quoteSource).toBe("ESTIMATE_RULES");
    expect(quote.fallbackUsed).toBe(true);
    expect(quote.shippingWarnings.some((warning) => warning.includes("estimated shipping fallback"))).toBe(true);
  });

  it("keeps manual-review shipping out of the live quote path", async () => {
    const { service, provider } = await loadShippingService({
      liveQuotes: true,
      fallbackToEstimate: true
    });

    const review = service.buildReviewRequiredShippingResult({
      productFamily: "floating-mantels",
      productSlug: "classic-floating-mantel",
      packagingProfile: "freight_pallet",
      shippingMode: "LTL_FREIGHT",
      destination: {
        postalCode: "99501",
        countryCode: "US",
        stateOrProvinceCode: "AK"
      },
      reasonCodes: ["OVERSIZE_MANTEL_REVIEW"],
      customerFacingMessage:
        "This mantel configuration needs shipping review before Craft & Board can confirm the logistics plan."
    });

    const quote = await service.finalizeShippingQuote({
      productFamily: "floating-mantels",
      productSlug: "classic-floating-mantel",
      destination: {
        postalCode: "99501",
        countryCode: "US",
        stateOrProvinceCode: "AK"
      },
      estimate: review
    });

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote.quoteSource).toBe("MANUAL_REVIEW");
    expect(quote.reviewRequired).toBe(true);
  });
});
