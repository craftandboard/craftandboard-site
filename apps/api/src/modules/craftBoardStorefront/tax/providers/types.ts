import type { StorefrontTaxDestination, StorefrontTaxQuoteResult, TaxQuoteProviderResult } from "../types.js";

export type SupportedTaxQuoteProvider = "SIMULATED_TAX" | "GENERIC_HTTP";

export type TaxQuoteProviderInput = {
  requestId?: string | null;
  destination: StorefrontTaxDestination;
  fallbackEstimate: StorefrontTaxQuoteResult;
};

export interface TaxQuoteProvider {
  provider: SupportedTaxQuoteProvider;
  getQuote(input: TaxQuoteProviderInput): Promise<TaxQuoteProviderResult>;
}
