import { afterEach, describe, expect, it, vi } from "vitest";

async function loadTaxService(input: {
  liveQuotes: boolean;
  fallbackToEstimate: boolean;
  nexusStates: string;
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
    provider: "SIMULATED_TAX" as const,
    getQuote: input.providerError
      ? vi.fn().mockRejectedValue(input.providerError)
      : vi.fn().mockResolvedValue(
          input.providerResult ?? {
            quoteAvailable: true,
            quoteSource: "LIVE_PROVIDER",
            taxAmountCents: 11890,
            taxableSubtotalCents: 120000,
            taxableShippingCents: 7800,
            jurisdictionSummary: {
              countryCode: "US",
              stateOrProvinceCode: "WA",
              postalCodePrefix: "981"
            },
            taxRateBasisPoints: 930,
            quoteReference: "taxq_live_123",
            quoteExpiresAt: "2026-03-14T21:00:00.000Z",
            warnings: [],
            reviewRequired: false,
            reasonCodes: [],
            fallbackUsed: false,
            rawProviderSummary: { provider: "SIMULATED_TAX" }
          }
        )
  };

  vi.doMock("../lib/env.js", () => ({
    env: {
      CRAFT_BOARD_ENABLE_LIVE_TAX_QUOTES: input.liveQuotes,
      CRAFT_BOARD_TAX_FALLBACK_TO_ESTIMATE: input.fallbackToEstimate,
      CRAFT_BOARD_TAX_NEXUS_STATES: input.nexusStates,
      TAX_QUOTE_PROVIDER: "SIMULATED_TAX"
    }
  }));
  vi.doMock("../lib/logger.js", () => ({ logger }));
  vi.doMock("../modules/craftBoardStorefront/tax/providers/providerRegistry.js", () => ({
    getTaxQuoteProvider: () => provider
  }));

  const service = await import("../modules/craftBoardStorefront/tax/service.js");
  return { service, provider, logger };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("craft board storefront tax quote orchestration", () => {
  it("uses estimate rules when live tax quotes are disabled", async () => {
    const { service, provider } = await loadTaxService({
      liveQuotes: false,
      fallbackToEstimate: true,
      nexusStates: "WA,CA"
    });

    const quote = await service.finalizeTaxQuote({
      destination: {
        postalCode: "98104",
        countryCode: "US",
        stateOrProvinceCode: "WA"
      },
      productSubtotalCents: 120000,
      shippingCostCents: 7800,
      shippingTaxable: true
    });

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote.quoteSource).toBe("ESTIMATE_RULES");
    expect(quote.taxAmountCents).toBeGreaterThan(0);
  });

  it("returns not-applicable tax outside nexus states", async () => {
    const { service, provider } = await loadTaxService({
      liveQuotes: true,
      fallbackToEstimate: true,
      nexusStates: "WA"
    });

    const quote = await service.finalizeTaxQuote({
      destination: {
        postalCode: "97204",
        countryCode: "US",
        stateOrProvinceCode: "OR"
      },
      productSubtotalCents: 120000,
      shippingCostCents: 7800,
      shippingTaxable: true
    });

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote.quoteSource).toBe("NOT_APPLICABLE");
    expect(quote.taxAmountCents).toBe(0);
  });

  it("falls back to estimated tax when provider fails and fallback is enabled", async () => {
    const { service, provider } = await loadTaxService({
      liveQuotes: true,
      fallbackToEstimate: true,
      nexusStates: "WA",
      providerError: new Error("tax timeout")
    });

    const quote = await service.finalizeTaxQuote({
      destination: {
        postalCode: "98104",
        countryCode: "US",
        stateOrProvinceCode: "WA"
      },
      productSubtotalCents: 120000,
      shippingCostCents: 7800,
      shippingTaxable: true
    });

    expect(provider.getQuote).toHaveBeenCalledOnce();
    expect(quote.quoteSource).toBe("ESTIMATE_RULES");
    expect(quote.fallbackUsed).toBe(true);
    expect(quote.taxWarnings.some((warning) => warning.includes("estimated tax fallback"))).toBe(true);
  });

  it("requires manual review for unsupported non-us destinations", async () => {
    const { service, provider } = await loadTaxService({
      liveQuotes: true,
      fallbackToEstimate: true,
      nexusStates: "WA"
    });

    const quote = await service.finalizeTaxQuote({
      destination: {
        postalCode: "V6B1A1",
        countryCode: "CA",
        stateOrProvinceCode: "BC"
      },
      productSubtotalCents: 120000,
      shippingCostCents: 7800,
      shippingTaxable: true
    });

    expect(provider.getQuote).not.toHaveBeenCalled();
    expect(quote.quoteSource).toBe("MANUAL_REVIEW");
    expect(quote.reviewRequired).toBe(true);
  });
});
