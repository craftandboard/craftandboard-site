import type { StorefrontOrderDraft } from "../orderContract.js";
import type { ConfigurableProductPricingResult } from "../products/types.js";
import type { ConfigurableProductShippingResult } from "../shipping/types.js";
import type { StorefrontTaxQuoteResult } from "../tax/types.js";
import type {
  CraftBoardFulfillmentClass,
  CraftBoardFulfillmentHandoff,
  CraftBoardFulfillmentLogisticsClass,
  CraftBoardFulfillmentPackagingClass,
  CraftBoardFulfillmentProductSnapshot,
  CraftBoardFulfillmentProductionProfile
} from "./types.js";

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

const HANDOFF_VERSION = "cb-fulfillment-handoff-v1";

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

function requirePaidAt(value: Date | null) {
  if (!value) {
    throw new Error("Paid storefront orders require a canonical paid timestamp before fulfillment handoff.");
  }

  return value.toISOString();
}

function toQuantity(configuration: Record<string, unknown>) {
  return typeof configuration.quantity === "number" ? configuration.quantity : 1;
}

function mapProductSnapshot(input: {
  draft: StorefrontOrderDraft;
  productDisplayName: string;
  summary: string[];
  pricing: ConfigurableProductPricingResult;
}): CraftBoardFulfillmentProductSnapshot {
  const configuration = input.draft.configuration as Record<string, unknown>;
  const reviewFlags = [
    input.pricing.reviewRequired ? "PRICING_REVIEW_REQUIRED" : null,
    input.pricing.consultRequired ? "CONSULT_REQUIRED" : null
  ].filter((value): value is string => Boolean(value));

  switch (input.draft.productFamily) {
    case "floating-shelves":
      return {
        productFamily: input.draft.productFamily,
        productSlug: input.draft.productSlug,
        productDisplayName: input.productDisplayName,
        quantity: toQuantity(configuration),
        normalizedConfiguration: {
          width: configuration.width,
          widthUnit: configuration.widthUnit,
          depth: configuration.depth,
          depthUnit: configuration.depthUnit,
          thickness: configuration.thickness,
          thicknessUnit: configuration.thicknessUnit,
          material: {
            code: configuration.materialCode,
            label: configuration.materialLabel
          },
          mounting: {
            code: configuration.mountingCode,
            label: configuration.mountingLabel
          }
        },
        customerFacingSummary: input.summary,
        reviewFlags
      };
    case "floating-mantels":
      return {
        productFamily: input.draft.productFamily,
        productSlug: input.draft.productSlug,
        productDisplayName: input.productDisplayName,
        quantity: toQuantity(configuration),
        normalizedConfiguration: {
          length: configuration.length,
          lengthUnit: configuration.lengthUnit,
          depth: configuration.depth,
          depthUnit: configuration.depthUnit,
          height: configuration.height,
          heightUnit: configuration.heightUnit,
          material: {
            code: configuration.materialCode,
            label: configuration.materialLabel
          },
          mounting: {
            code: configuration.mountingCode,
            label: configuration.mountingLabel
          }
        },
        customerFacingSummary: input.summary,
        reviewFlags
      };
    default:
      throw new Error(`Unsupported product family for fulfillment handoff: ${input.draft.productFamily}`);
  }
}

export function deriveFulfillmentRouting(input: {
  productFamily: StorefrontOrderDraft["productFamily"];
  shippingQuote: ConfigurableProductShippingResult;
}) {
  let fulfillmentClass: CraftBoardFulfillmentClass;
  let logisticsClass: CraftBoardFulfillmentLogisticsClass;
  let packagingClass: CraftBoardFulfillmentPackagingClass;
  let productionProfile: CraftBoardFulfillmentProductionProfile;

  switch (input.productFamily) {
    case "floating-shelves":
      productionProfile = "FLOATING_SHELF_STANDARD";
      break;
    case "floating-mantels":
      productionProfile = "FLOATING_MANTEL_STANDARD";
      break;
    default:
      throw new Error(`Unsupported product family for fulfillment routing: ${input.productFamily}`);
  }

  switch (input.shippingQuote.shippingMode) {
    case "PARCEL":
      fulfillmentClass = "STANDARD_PARCEL_BUILD";
      logisticsClass = "PARCEL";
      packagingClass = "BOXED";
      break;
    case "OVERSIZE_PARCEL":
      fulfillmentClass = "OVERSIZE_PARCEL_BUILD";
      logisticsClass = "OVERSIZE_PARCEL";
      packagingClass =
        input.shippingQuote.packagingProfile === "mantel_crate" ? "CRATED" : "BOXED";
      break;
    case "LTL_FREIGHT":
      fulfillmentClass = "FREIGHT_BUILD";
      logisticsClass = "FREIGHT";
      packagingClass =
        input.shippingQuote.packagingProfile === "freight_pallet" ? "PALLETIZED" : "CRATED";
      break;
    default:
      fulfillmentClass = "MANUAL_REVIEW_BUILD";
      logisticsClass = "MANUAL_REVIEW";
      packagingClass =
        input.shippingQuote.packagingProfile === "freight_pallet" ? "PALLETIZED" : "CRATED";
      break;
  }

  const requiresManualLogisticsReview =
    logisticsClass === "FREIGHT" ||
    logisticsClass === "MANUAL_REVIEW" ||
    input.shippingQuote.reviewRequired;
  const requiresManualOpsReview = input.shippingQuote.consultRequired;

  const routingNotes = [
    `${productionProfile} routed through ${fulfillmentClass}.`,
    input.shippingQuote.quoteSource === "LIVE_PROVIDER"
      ? "Carrier-backed shipping quote captured before payment."
      : input.shippingQuote.quoteSource === "ESTIMATE_RULES"
        ? "Estimate-based shipping fallback used before payment."
        : "Shipping requires manual logistics review downstream."
  ];

  return {
    fulfillmentClass,
    intakeOrderType: "ECOMMERCE_STANDARD_PRODUCT" as const,
    logisticsClass,
    packagingClass,
    productionProfile,
    requiresManualLogisticsReview,
    requiresManualOpsReview,
    routingNotes
  };
}

export function mapStorefrontAttemptToFulfillmentHandoff(input: {
  attempt: PaidAttemptSnapshot;
  draft: StorefrontOrderDraft;
  productDisplayName: string;
  configurationSummary: string[];
  pricing: ConfigurableProductPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
  submittedAt?: Date;
}) {
  const paidAt = requirePaidAt(input.attempt.paidAt);
  const submittedAt = (input.submittedAt ?? new Date()).toISOString();
  const routing = deriveFulfillmentRouting({
    productFamily: input.draft.productFamily,
    shippingQuote: input.shippingQuote
  });

  return {
    sourceMetadata: {
      sourceSystem: "Craft & Board",
      sourceChannel: "storefront",
      sourceFlow: "storefront_standard_paid_order",
      storefrontOrderAttemptId: input.attempt.id,
      storefrontOrderAttemptReference: input.attempt.confirmationCode,
      requestId: input.attempt.requestId,
      paidAt,
      submittedAt,
      handoffVersion: HANDOFF_VERSION
    },
    customerSnapshot: {
      customerName: input.draft.customer.fullName.trim(),
      customerEmail: input.draft.customer.email.trim(),
      customerPhone: normalizeText(input.draft.customer.phone),
      shippingName: input.draft.shippingAddress.fullName.trim(),
      shippingAddress1: input.draft.shippingAddress.address1.trim(),
      shippingAddress2: normalizeText(input.draft.shippingAddress.address2),
      shippingCity: input.draft.shippingAddress.city.trim(),
      shippingStateOrProvince: input.draft.shippingAddress.state.trim(),
      shippingPostalCode: input.draft.shippingAddress.postalCode.trim(),
      shippingCountry: input.draft.shippingAddress.country.trim()
    },
    commercialSnapshot: {
      currencyCode: input.pricing.currencyCode,
      subtotalAmountCents: input.pricing.quantityTotalCents,
      shippingAmountCents: input.shippingQuote.shippingCostCents,
      taxAmountCents: input.taxQuote.taxAmountCents,
      totalAmountCents:
        input.pricing.quantityTotalCents +
        input.shippingQuote.shippingCostCents +
        input.taxQuote.taxAmountCents,
      depositAmountPaidCents: input.attempt.depositAmountCents ?? 0,
      remainingBalanceAmountCents: input.attempt.remainingBalanceAmountCents ?? 0,
      paymentMode: input.draft.paymentMode,
      pricingBasisVersion: input.pricing.pricingBasisVersion ?? null,
      shippingBasisVersion: input.shippingQuote.shippingBasisVersion ?? null,
      taxBasisVersion: input.taxQuote.taxBasisVersion ?? null
    },
    productSnapshot: mapProductSnapshot({
      draft: input.draft,
      productDisplayName: input.productDisplayName,
      summary: input.configurationSummary,
      pricing: input.pricing
    }),
    shippingSnapshot: {
      shippingMode: input.shippingQuote.shippingMode,
      packagingProfile: input.shippingQuote.packagingProfile,
      shippingQuoteSource: input.shippingQuote.quoteSource,
      shippingCostCents: input.shippingQuote.shippingCostCents,
      carrierName: input.shippingQuote.carrierName,
      serviceLevel: input.shippingQuote.serviceLevel,
      quoteReference: input.shippingQuote.quoteReference,
      quoteExpiresAt: input.shippingQuote.quoteExpiresAt,
      estimatedTransitDays: input.shippingQuote.estimatedTransitDays,
      shippingWarnings: input.shippingQuote.shippingWarnings,
      destinationSummary: input.shippingQuote.destinationSummary,
      freightReviewRequired:
        input.shippingQuote.shippingMode === "LTL_FREIGHT" || input.shippingQuote.reviewRequired,
      localDeliveryEligible: null
    },
    taxSnapshot: {
      taxQuoteSource: input.taxQuote.quoteSource,
      taxAmountCents: input.taxQuote.taxAmountCents,
      taxableSubtotalCents: input.taxQuote.taxableSubtotalCents,
      taxableShippingCents: input.taxQuote.taxableShippingCents,
      taxRateBasisPoints: input.taxQuote.taxRateBasisPoints,
      jurisdictionSummary: input.taxQuote.jurisdictionSummary,
      taxWarnings: input.taxQuote.taxWarnings,
      taxReasonCodes: input.taxQuote.taxReasonCodes,
      taxQuoteGeneratedAt: input.taxQuote.quoteGeneratedAt
    },
    paymentSnapshot: {
      paymentStatus: "paid",
      paymentProvider: input.attempt.paymentProvider,
      paymentProviderSessionId: input.attempt.paymentProviderSessionId,
      paymentProviderIntentId: input.attempt.paymentProviderIntentId,
      paymentReference:
        input.attempt.paymentProviderIntentId ??
        input.attempt.paymentProviderSessionId ??
        input.attempt.confirmationCode,
      depositPercentBasisPoints: input.attempt.depositPercentBasisPoints,
      paidAt
    },
    fulfillmentRoutingSnapshot: routing,
    traceMetadata: {
      confirmationCode: input.attempt.confirmationCode,
      fieldMetriqSubmissionRetryCount: input.attempt.fieldMetriqSubmissionRetryCount,
      quoteReference: input.shippingQuote.quoteReference,
      taxQuoteReference: input.taxQuote.quoteReference
    }
  } satisfies CraftBoardFulfillmentHandoff;
}
