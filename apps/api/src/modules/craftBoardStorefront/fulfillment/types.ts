import type { StorefrontOrderDraft } from "../orderContract.js";
import type { ConfigurableProductShippingResult } from "../shipping/types.js";
import type { StorefrontTaxQuoteResult } from "../tax/types.js";

export type CraftBoardFulfillmentClass =
  | "STANDARD_PARCEL_BUILD"
  | "OVERSIZE_PARCEL_BUILD"
  | "FREIGHT_BUILD"
  | "MANUAL_REVIEW_BUILD";

export type CraftBoardFulfillmentIntakeOrderType = "ECOMMERCE_STANDARD_PRODUCT";
export type CraftBoardFulfillmentLogisticsClass =
  | "PARCEL"
  | "OVERSIZE_PARCEL"
  | "FREIGHT"
  | "MANUAL_REVIEW";
export type CraftBoardFulfillmentPackagingClass = "BOXED" | "CRATED" | "PALLETIZED";
export type CraftBoardFulfillmentProductionProfile =
  | "FLOATING_SHELF_STANDARD"
  | "FLOATING_MANTEL_STANDARD";

export type CraftBoardFulfillmentProductSnapshot = {
  productFamily: StorefrontOrderDraft["productFamily"];
  productSlug: string;
  productDisplayName: string;
  quantity: number;
  normalizedConfiguration: Record<string, unknown>;
  customerFacingSummary: string[];
  reviewFlags: string[];
};

export type CraftBoardFulfillmentHandoff = {
  sourceMetadata: {
    sourceSystem: "Craft & Board";
    sourceChannel: "storefront";
    sourceFlow: "storefront_standard_paid_order";
    storefrontOrderAttemptId: string;
    storefrontOrderAttemptReference: string | null;
    requestId: string;
    paidAt: string;
    submittedAt: string;
    handoffVersion: string;
  };
  customerSnapshot: {
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    shippingName: string;
    shippingAddress1: string;
    shippingAddress2: string | null;
    shippingCity: string;
    shippingStateOrProvince: string;
    shippingPostalCode: string;
    shippingCountry: string;
  };
  commercialSnapshot: {
    currencyCode: string;
    subtotalAmountCents: number;
    shippingAmountCents: number;
    taxAmountCents: number;
    totalAmountCents: number;
    depositAmountPaidCents: number;
    remainingBalanceAmountCents: number;
    paymentMode: StorefrontOrderDraft["paymentMode"];
    pricingBasisVersion: string | null;
    shippingBasisVersion: string | null;
    taxBasisVersion: string | null;
  };
  productSnapshot: CraftBoardFulfillmentProductSnapshot;
  shippingSnapshot: {
    shippingMode: ConfigurableProductShippingResult["shippingMode"];
    packagingProfile: ConfigurableProductShippingResult["packagingProfile"];
    shippingQuoteSource: ConfigurableProductShippingResult["quoteSource"];
    shippingCostCents: number;
    carrierName: string | null;
    serviceLevel: string | null;
    quoteReference: string | null;
    quoteExpiresAt: string | null;
    estimatedTransitDays: number | null;
    shippingWarnings: string[];
    destinationSummary: ConfigurableProductShippingResult["destinationSummary"];
    freightReviewRequired: boolean;
    localDeliveryEligible: boolean | null;
  };
  taxSnapshot: {
    taxQuoteSource: StorefrontTaxQuoteResult["quoteSource"];
    taxAmountCents: number;
    taxableSubtotalCents: number;
    taxableShippingCents: number;
    taxRateBasisPoints: number | null;
    jurisdictionSummary: StorefrontTaxQuoteResult["jurisdictionSummary"];
    taxWarnings: string[];
    taxReasonCodes: string[];
    taxQuoteGeneratedAt: string | null;
  };
  paymentSnapshot: {
    paymentStatus: "paid";
    paymentProvider: string | null;
    paymentProviderSessionId: string | null;
    paymentProviderIntentId: string | null;
    paymentReference: string | null;
    depositPercentBasisPoints: number | null;
    paidAt: string;
  };
  fulfillmentRoutingSnapshot: {
    fulfillmentClass: CraftBoardFulfillmentClass;
    intakeOrderType: CraftBoardFulfillmentIntakeOrderType;
    logisticsClass: CraftBoardFulfillmentLogisticsClass;
    packagingClass: CraftBoardFulfillmentPackagingClass;
    productionProfile: CraftBoardFulfillmentProductionProfile;
    requiresManualLogisticsReview: boolean;
    requiresManualOpsReview: boolean;
    routingNotes: string[];
  };
  traceMetadata: {
    confirmationCode: string | null;
    fieldMetriqSubmissionRetryCount: number;
    quoteReference: string | null;
    taxQuoteReference: string | null;
  };
};

export type FieldMetriqFulfillmentIntakePayload = {
  requestId: string;
  source: "CRAFT_BOARD";
  sourceFlow: "storefront_standard_paid_order";
  handoffVersion: string;
  storefrontAttempt: {
    id: string;
    requestId: string;
    reference: string | null;
    paidAt: string;
    submittedAt: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  shippingDestination: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  };
  commercialSummary: CraftBoardFulfillmentHandoff["commercialSnapshot"];
  product: CraftBoardFulfillmentHandoff["productSnapshot"];
  shipping: CraftBoardFulfillmentHandoff["shippingSnapshot"];
  tax: CraftBoardFulfillmentHandoff["taxSnapshot"];
  payment: CraftBoardFulfillmentHandoff["paymentSnapshot"];
  fulfillmentRouting: CraftBoardFulfillmentHandoff["fulfillmentRoutingSnapshot"];
  traceMetadata: CraftBoardFulfillmentHandoff["traceMetadata"];
};
