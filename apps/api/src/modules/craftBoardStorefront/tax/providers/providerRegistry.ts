import { env } from "../../../../lib/env.js";
import { genericHttpTaxQuoteProvider } from "./genericHttpProvider.js";
import { simulatedTaxProvider } from "./simulatedTaxProvider.js";
import type { SupportedTaxQuoteProvider, TaxQuoteProvider } from "./types.js";

const providers: Record<SupportedTaxQuoteProvider, TaxQuoteProvider> = {
  SIMULATED_TAX: simulatedTaxProvider,
  GENERIC_HTTP: genericHttpTaxQuoteProvider
};

export function getTaxQuoteProvider(): TaxQuoteProvider {
  return providers[env.TAX_QUOTE_PROVIDER];
}
