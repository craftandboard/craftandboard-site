import type { FloatingShelfConfiguration, FloatingShelfPricingResult } from "../floatingShelfPricing.js";
import type { FloatingMantelConfiguration, FloatingMantelPricingResult } from "../floatingMantelPricing.js";
import type {
  ConfigurableProductEligibilityResult,
  ConfigurableProductOrderDraft,
  ConfigurableProductPricingResult as SharedPricingResult,
  ProductFamilyCode,
  ProductLiveStatus
} from "../orderContract.js";
import type {
  ConfigurableProductShippingResult,
  StorefrontShippingDestination
} from "../shipping/types.js";
import type { StorefrontTaxQuoteResult } from "../tax/types.js";

export type ConfigurableProductConfiguration = FloatingShelfConfiguration | FloatingMantelConfiguration;
export type ConfigurableProductPricingResult = FloatingShelfPricingResult | FloatingMantelPricingResult;
export type ConfigurableProductCheckoutDraft = ConfigurableProductOrderDraft<
  ConfigurableProductConfiguration,
  SharedPricingResult
>;

export type ConfigurableProductDefinition<
  TConfiguration extends ConfigurableProductConfiguration = ConfigurableProductConfiguration
> = {
  productFamily: ProductFamilyCode;
  productSlug: string;
  displayName: string;
  categorySlug: string;
  liveStatus: ProductLiveStatus;
  supportsInstantPricing: boolean;
  supportsStandardCheckout: boolean;
  supportsDepositPayment: boolean;
  supportsReviewFallback: boolean;
  pdpPath: string;
  checkoutPath: string;
  normalizeConfiguration(input: TConfiguration): TConfiguration;
  priceConfiguration(input: TConfiguration): ConfigurableProductPricingResult;
  evaluateEligibility(
    pricing: ConfigurableProductPricingResult
  ): ConfigurableProductEligibilityResult;
  calculateShipping(
    input: TConfiguration,
    destination: StorefrontShippingDestination
  ): ConfigurableProductShippingResult;
  buildFieldMetriqPayload(input: {
    requestId: string;
    sourcePath?: string | null;
    draft: ConfigurableProductCheckoutDraft;
    canonicalPricing: ConfigurableProductPricingResult;
    shippingQuote: ConfigurableProductShippingResult;
    taxQuote: StorefrontTaxQuoteResult;
  }): Record<string, unknown>;
  buildPaidFieldMetriqPayload(input: {
    requestId: string;
    sourcePath?: string | null;
    draft: ConfigurableProductCheckoutDraft;
    canonicalPricing: ConfigurableProductPricingResult;
    shippingQuote: ConfigurableProductShippingResult;
    taxQuote: StorefrontTaxQuoteResult;
    payment: {
      depositAmountCents: number | null;
      remainingBalanceAmountCents: number | null;
      paidAt: string | null;
      provider: string | null;
      providerSessionId: string | null;
      providerIntentId: string | null;
      confirmationCode: string | null;
    };
  }): Record<string, unknown>;
  summarizeConfiguration(input: TConfiguration): string[];
};
