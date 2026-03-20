import type { StorefrontOrderDraft } from "../orderContract.js";
import type { ConfigurableProductPricingResult, ConfigurableProductDefinition } from "../products/types.js";
import type { ConfigurableProductShippingResult } from "../shipping/types.js";
import type { StorefrontTaxQuoteResult } from "../tax/types.js";
import { mapFulfillmentHandoffToFieldMetriqOrderPayload } from "./fieldMetriqMapper.js";
import { mapStorefrontAttemptToFulfillmentHandoff } from "./mapper.js";

type PaidAttemptSnapshot = {
  id: string;
  requestId: string;
  confirmationCode: string | null;
  paidAt: Date | null;
  depositPercentBasisPoints: number | null;
  depositAmountCents: number | null;
  remainingBalanceAmountCents: number | null;
  paymentProvider: string | null;
  paymentProviderSessionId: string | null;
  paymentProviderIntentId: string | null;
  fieldMetriqSubmissionRetryCount: number;
};

export function buildFieldMetriqFulfillmentSubmission(input: {
  attempt: PaidAttemptSnapshot;
  draft: StorefrontOrderDraft;
  definition: ConfigurableProductDefinition;
  pricing: ConfigurableProductPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
}) {
  const handoff = mapStorefrontAttemptToFulfillmentHandoff({
    attempt: input.attempt,
    draft: input.draft,
    productDisplayName: input.definition.displayName,
    configurationSummary: input.definition.summarizeConfiguration(input.draft.configuration as any),
    pricing: input.pricing,
    shippingQuote: input.shippingQuote,
    taxQuote: input.taxQuote
  });

  return {
    handoff,
    fieldMetriqPayload: mapFulfillmentHandoffToFieldMetriqOrderPayload({ handoff })
  };
}
