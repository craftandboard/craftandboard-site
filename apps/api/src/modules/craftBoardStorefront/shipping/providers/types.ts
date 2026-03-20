import type {
  ConfigurableProductShippingResult,
  ShippingQuoteProviderResult,
  StorefrontShippingDestination
} from "../types.js";

export type SupportedShippingQuoteProvider = "SIMULATED_PARCEL" | "GENERIC_HTTP";

export type ShippingQuoteProviderInput = {
  requestId?: string | null;
  productFamily: string;
  productSlug: string;
  destination: StorefrontShippingDestination;
  fallbackEstimate: ConfigurableProductShippingResult;
};

export interface ShippingQuoteProvider {
  provider: SupportedShippingQuoteProvider;
  getQuote(input: ShippingQuoteProviderInput): Promise<ShippingQuoteProviderResult>;
}
