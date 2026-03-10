import { stripeAdapter } from "./providers/stripeAdapter.js";
import type { PaymentProviderAdapter, SupportedPaymentProvider } from "./providers/types.js";

const providerRegistry: Record<SupportedPaymentProvider, PaymentProviderAdapter> = {
  STRIPE: stripeAdapter
};

export class UnknownPaymentProviderError extends Error {}

export function getPaymentProviderAdapter(provider: string): PaymentProviderAdapter {
  const normalized = provider.trim().toUpperCase() as SupportedPaymentProvider;
  const adapter = providerRegistry[normalized];

  if (!adapter) {
    throw new UnknownPaymentProviderError(`Unknown payment provider ${provider}.`);
  }

  return adapter;
}
