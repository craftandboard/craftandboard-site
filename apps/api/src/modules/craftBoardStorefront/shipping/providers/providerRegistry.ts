import { env } from "../../../../lib/env.js";
import { genericHttpShippingQuoteProvider } from "./genericHttpProvider.js";
import { simulatedParcelProvider } from "./simulatedParcelProvider.js";
import type { ShippingQuoteProvider, SupportedShippingQuoteProvider } from "./types.js";

const providers: Record<SupportedShippingQuoteProvider, ShippingQuoteProvider> = {
  SIMULATED_PARCEL: simulatedParcelProvider,
  GENERIC_HTTP: genericHttpShippingQuoteProvider
};

export function getShippingQuoteProvider(): ShippingQuoteProvider {
  return providers[env.SHIPPING_QUOTE_PROVIDER];
}
