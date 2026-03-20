import type { FloatingShelfConfiguration, FloatingShelfPricingResult } from "./floatingShelfPricing.js";
import type { FloatingMantelConfiguration, FloatingMantelPricingResult } from "./floatingMantelPricing.js";
import type { ConfigurableProductShippingResult } from "./shipping/types.js";
import type { StorefrontTaxQuoteResult } from "./tax/types.js";

export type ProductFamilyCode =
  | "floating-shelves"
  | "floating-mantels"
  | "closet-shelving-systems"
  | "cabinet-modules"
  | "mudroom-bench-systems"
  | "window-seat-systems";

export type ProductLiveStatus = "LIVE" | "COMING_SOON" | "INTERNAL_ONLY";

export type StorefrontPaymentMode =
  | "DEPOSIT_REQUEST"
  | "FULL_PAYMENT_LATER"
  | "PAY_NOW_PLACEHOLDER";

export type StorefrontOrderIntent =
  | "PURCHASE_STANDARD"
  | "REQUEST_REVIEW";

export type StorefrontContact = {
  fullName: string;
  email: string;
  phone?: string | null;
};

export type StorefrontAddress = {
  fullName: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type ConfigurableProductEligibilityResult = {
  instantPriceEligible: boolean;
  reviewRequired: boolean;
  consultRequired: boolean;
  reasonCodes: string[];
  customerFacingMessage: string;
  allowedCheckoutMode: "STANDARD_CHECKOUT" | "REVIEW_ONLY";
  fallbackMode: "REQUEST_REVIEW" | "NONE";
};

export type ConfigurableProductOrderDraft<
  TConfiguration = Record<string, unknown>,
  TPricingResult = ConfigurableProductPricingResult
> = {
  sourceChannel: "CRAFT_BOARD";
  productFamily: ProductFamilyCode;
  productSlug: string;
  configuration: TConfiguration;
  pricingResult: TPricingResult;
  eligibilityResult: ConfigurableProductEligibilityResult;
  instantPriceEligible: boolean;
  consultRequired: boolean;
  customer: StorefrontContact;
  shippingAddress: StorefrontAddress;
  billingSameAsShipping: boolean;
  billingAddress?: StorefrontAddress | null;
  notes?: string | null;
  paymentMode: StorefrontPaymentMode;
  orderIntent: StorefrontOrderIntent;
  customerAcceptedPricingBasis: boolean;
  customerAcceptedLeadTimeBasis: boolean;
  customerAcknowledgedMadeToOrder: boolean;
};

export type FloatingShelfOrderDraft = ConfigurableProductOrderDraft<FloatingShelfConfiguration>;
export type FloatingMantelOrderDraft = ConfigurableProductOrderDraft<FloatingMantelConfiguration>;
export type ConfigurableProductConfiguration = FloatingShelfConfiguration | FloatingMantelConfiguration;
export type ConfigurableProductPricingResult = FloatingShelfPricingResult | FloatingMantelPricingResult;
export type StorefrontOrderDraft = ConfigurableProductOrderDraft<
  ConfigurableProductConfiguration,
  ConfigurableProductPricingResult
>;

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

export function buildBaseStorefrontFieldMetriqPayload(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: StorefrontOrderDraft;
  canonicalPricing: ConfigurableProductPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
  productName: string;
}) {
  return {
    requestId: input.requestId,
    source: "CRAFT_BOARD",
    sourceFlow: "storefront_standard_order",
    storefrontContext: {
      sourcePath: normalizeText(input.sourcePath),
      sourceChannel: input.draft.sourceChannel,
      productFamily: input.draft.productFamily,
      productSlug: input.draft.productSlug,
      submittedAt: new Date().toISOString()
    },
    orderIntent: input.draft.orderIntent,
    paymentMode: input.draft.paymentMode,
    instantPriceEligible: input.canonicalPricing.instantPriceEligible,
    consultRequired: input.canonicalPricing.consultRequired,
    eligibility: input.draft.eligibilityResult,
    customerAcceptedPricingBasis: input.draft.customerAcceptedPricingBasis,
    customerAcceptedLeadTimeBasis: input.draft.customerAcceptedLeadTimeBasis,
    customerAcknowledgedMadeToOrder: input.draft.customerAcknowledgedMadeToOrder,
    customer: {
      name: input.draft.customer.fullName.trim(),
      email: input.draft.customer.email.trim(),
      phone: normalizeText(input.draft.customer.phone)
    },
    shipping: {
      name: input.draft.shippingAddress.fullName.trim(),
      address1: input.draft.shippingAddress.address1.trim(),
      address2: normalizeText(input.draft.shippingAddress.address2),
      city: input.draft.shippingAddress.city.trim(),
      state: input.draft.shippingAddress.state.trim(),
      postalCode: input.draft.shippingAddress.postalCode.trim(),
      country: input.draft.shippingAddress.country.trim(),
      mode: input.shippingQuote.shippingMode,
      packagingProfile: input.shippingQuote.packagingProfile,
      shippingCostCents: input.shippingQuote.shippingCostCents,
      quoteSource: input.shippingQuote.quoteSource,
      carrierName: input.shippingQuote.carrierName,
      serviceLevel: input.shippingQuote.serviceLevel,
      quoteReference: input.shippingQuote.quoteReference,
      quoteExpiresAt: input.shippingQuote.quoteExpiresAt,
      quoteGeneratedAt: input.shippingQuote.quoteGeneratedAt,
      fallbackUsed: input.shippingQuote.fallbackUsed,
      destinationZone: input.shippingQuote.destinationZone,
      estimatedTransitDays: input.shippingQuote.estimatedTransitDays,
      shippingWarnings: input.shippingQuote.shippingWarnings,
      shippingReviewRequired: input.shippingQuote.reviewRequired,
      shippingBasisVersion: input.shippingQuote.shippingBasisVersion,
      rawProviderSummary: input.shippingQuote.rawProviderSummary
    },
    billing: input.draft.billingSameAsShipping
      ? null
      : {
          name: input.draft.billingAddress?.fullName?.trim() ?? null,
          address1: input.draft.billingAddress?.address1?.trim() ?? null,
          address2: normalizeText(input.draft.billingAddress?.address2),
          city: input.draft.billingAddress?.city?.trim() ?? null,
          state: input.draft.billingAddress?.state?.trim() ?? null,
          postalCode: input.draft.billingAddress?.postalCode?.trim() ?? null,
          country: input.draft.billingAddress?.country?.trim() ?? null
        },
    lineItems: [
      {
        productFamily: input.draft.productFamily,
        productSlug: input.draft.productSlug,
        productName: input.productName,
        quantity:
          typeof (input.draft.configuration as Record<string, unknown>).quantity === "number"
            ? ((input.draft.configuration as Record<string, unknown>).quantity as number)
            : 1,
        configurationSnapshot: input.draft.configuration,
        pricingSnapshot: {
          currencyCode: input.canonicalPricing.currencyCode,
          priceState: input.canonicalPricing.priceState,
          instantPriceEligible: input.canonicalPricing.instantPriceEligible,
          reviewRequired: input.canonicalPricing.reviewRequired,
          consultRequired: input.canonicalPricing.consultRequired,
          unitPriceCents: input.canonicalPricing.unitPriceCents,
          lineTotalCents: input.canonicalPricing.quantityTotalCents,
          subtotalCents: input.canonicalPricing.estimatedSubtotalCents,
          leadTimeText: input.canonicalPricing.leadTimeText,
          shippingProfileHint: input.canonicalPricing.shippingProfileHint,
          warnings: input.canonicalPricing.warnings,
          components: input.canonicalPricing.components
        }
      }
    ],
    shippingEstimate: {
      mode: input.shippingQuote.shippingMode,
      packagingProfile: input.shippingQuote.packagingProfile,
      shippingCostCents: input.shippingQuote.shippingCostCents,
      quoteSource: input.shippingQuote.quoteSource,
      carrierName: input.shippingQuote.carrierName,
      serviceLevel: input.shippingQuote.serviceLevel,
      quoteReference: input.shippingQuote.quoteReference,
      quoteExpiresAt: input.shippingQuote.quoteExpiresAt,
      quoteGeneratedAt: input.shippingQuote.quoteGeneratedAt,
      fallbackUsed: input.shippingQuote.fallbackUsed,
      destinationZone: input.shippingQuote.destinationZone,
      estimatedTransitDays: input.shippingQuote.estimatedTransitDays,
      shippingWarnings: input.shippingQuote.shippingWarnings,
      reviewRequired: input.shippingQuote.reviewRequired,
      consultRequired: input.shippingQuote.consultRequired,
      customerFacingMessage: input.shippingQuote.customerFacingMessage
    },
    taxEstimate: {
      taxAmountCents: input.taxQuote.taxAmountCents,
      taxableSubtotalCents: input.taxQuote.taxableSubtotalCents,
      taxableShippingCents: input.taxQuote.taxableShippingCents,
      quoteSource: input.taxQuote.quoteSource,
      taxRateBasisPoints: input.taxQuote.taxRateBasisPoints,
      quoteReference: input.taxQuote.quoteReference,
      quoteExpiresAt: input.taxQuote.quoteExpiresAt,
      quoteGeneratedAt: input.taxQuote.quoteGeneratedAt,
      fallbackUsed: input.taxQuote.fallbackUsed,
      jurisdictionSummary: input.taxQuote.jurisdictionSummary,
      taxWarnings: input.taxQuote.taxWarnings,
      taxReasonCodes: input.taxQuote.taxReasonCodes,
      reviewRequired: input.taxQuote.reviewRequired,
      customerFacingMessage: input.taxQuote.customerFacingMessage
    },
    commercialSummary: {
      productSubtotalCents: input.canonicalPricing.quantityTotalCents,
      shippingCostCents: input.shippingQuote.shippingCostCents,
      taxAmountCents: input.taxQuote.taxAmountCents,
      estimatedOrderTotalCents:
        input.canonicalPricing.quantityTotalCents +
        input.shippingQuote.shippingCostCents +
        input.taxQuote.taxAmountCents
    },
    customerNotes: normalizeText(input.draft.notes)
  } satisfies Record<string, unknown>;
}

export function mapFloatingShelfOrderToFieldMetriqPayload(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: FloatingShelfOrderDraft;
  canonicalPricing: FloatingShelfPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
}) {
  return buildBaseStorefrontFieldMetriqPayload({
    ...input,
    productName: "Classic Floating Shelf"
  });
}

export function mapPaidFloatingShelfOrderToFieldMetriqPayload(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: FloatingShelfOrderDraft;
  canonicalPricing: FloatingShelfPricingResult;
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
}) {
  const base = mapFloatingShelfOrderToFieldMetriqPayload(input);

  return {
    ...base,
    sourceFlow: "storefront_standard_paid_order",
    payment: {
      mode: input.draft.paymentMode,
      status: "paid",
      depositAmountCents: input.payment.depositAmountCents,
      remainingBalanceAmountCents: input.payment.remainingBalanceAmountCents,
      paidAt: input.payment.paidAt,
      provider: input.payment.provider,
      providerSessionId: input.payment.providerSessionId,
      providerIntentId: input.payment.providerIntentId,
      confirmationCode: input.payment.confirmationCode
    }
  } satisfies Record<string, unknown>;
}

export function mapFloatingMantelOrderToFieldMetriqPayload(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: FloatingMantelOrderDraft;
  canonicalPricing: FloatingMantelPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
}) {
  return buildBaseStorefrontFieldMetriqPayload({
    ...input,
    productName: "Classic Floating Mantel"
  });
}

export function mapPaidFloatingMantelOrderToFieldMetriqPayload(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: FloatingMantelOrderDraft;
  canonicalPricing: FloatingMantelPricingResult;
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
}) {
  const base = mapFloatingMantelOrderToFieldMetriqPayload(input);

  return {
    ...base,
    sourceFlow: "storefront_standard_paid_order",
    payment: {
      mode: input.draft.paymentMode,
      status: "paid",
      depositAmountCents: input.payment.depositAmountCents,
      remainingBalanceAmountCents: input.payment.remainingBalanceAmountCents,
      paidAt: input.payment.paidAt,
      provider: input.payment.provider,
      providerSessionId: input.payment.providerSessionId,
      providerIntentId: input.payment.providerIntentId,
      confirmationCode: input.payment.confirmationCode
    }
  } satisfies Record<string, unknown>;
}
