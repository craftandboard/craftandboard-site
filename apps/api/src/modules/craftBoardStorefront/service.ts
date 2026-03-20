import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { env } from "../../lib/env.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { getPaymentProviderAdapter } from "../paymentExecution/providerRegistry.js";
import { createCraftBoardInquiry } from "../craftBoardInquiries/service.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { submitFieldMetriqStorefrontOrder } from "./fieldMetriqClient.js";
import { buildFieldMetriqFulfillmentSubmission } from "./fulfillment/service.js";
import { createStorefrontChangeRequest } from "./changeRequests/service.js";
import { createStorefrontOrderIssue } from "./issues/service.js";
import { sendStorefrontOrderConfirmationEmail } from "./notifications/service.js";
import { getCustomerStorefrontOrderStatus } from "./status/service.js";
import {
  calculateFloatingShelfPrice,
  type FloatingShelfConfiguration
} from "./floatingShelfPricing.js";
import { type FloatingMantelConfiguration } from "./floatingMantelPricing.js";
import {
  type StorefrontOrderDraft
} from "./orderContract.js";
import { getStorefrontProductDefinition } from "./products/registry.js";
import {
  type ConfigurableProductShippingResult,
  type StorefrontCommercialQuote,
  type StorefrontShippingDestination
} from "./shipping/types.js";
import { normalizeShippingDestination } from "./shipping/zones.js";
import { finalizeShippingQuote } from "./shipping/service.js";
import {
  finalizeTaxQuote,
  normalizeTaxDestination
} from "./tax/service.js";
import type { StorefrontTaxQuoteResult } from "./tax/types.js";

type StorefrontOrderAttemptRow = Awaited<ReturnType<typeof getOrderAttemptOrThrow>>;
type StorefrontPricingResult = StorefrontOrderDraft["pricingResult"];

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildPublicUrl(path: string) {
  const base = trimTrailingSlash(env.CRAFT_BOARD_PAYMENT_SUCCESS_BASE_URL);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildFieldMetriqIdempotencyKey(input: {
  attemptId: string;
  confirmationCode: string | null;
}) {
  return input.confirmationCode
    ? `craft-board-paid-order:${input.confirmationCode}`
    : `craft-board-paid-order:${input.attemptId}`;
}

function normalizeRelativePath(value: string | null | undefined, fallback: string) {
  const normalized = normalizeText(value) ?? fallback;
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function sourcePathFromConfiguration(value: Prisma.JsonValue) {
  const sourcePath =
    value && typeof value === "object" && "sourcePath" in value
      ? (value as Record<string, unknown>).sourcePath
      : null;
  return typeof sourcePath === "string" ? sourcePath : null;
}

function orderIntentNeedsReview(
  draft: StorefrontOrderDraft,
  pricing: StorefrontPricingResult,
  shipping: ConfigurableProductShippingResult,
  tax: StorefrontTaxQuoteResult
) {
  const definition = getStorefrontProductDefinition({
    productFamily: draft.productFamily,
    productSlug: draft.productSlug
  });
  const eligibility = definition?.evaluateEligibility(pricing);

  return (
    draft.orderIntent === "REQUEST_REVIEW" ||
    eligibility?.fallbackMode === "REQUEST_REVIEW" ||
    !pricing.instantPriceEligible ||
    shipping.reviewRequired ||
    !shipping.shippingEligible ||
    tax.reviewRequired
  );
}

function pricingMatches(
  submitted: StorefrontOrderDraft["pricingResult"],
  canonical: StorefrontPricingResult
) {
  return (
    submitted.priceState === canonical.priceState &&
    submitted.instantPriceEligible === canonical.instantPriceEligible &&
    submitted.reviewRequired === canonical.reviewRequired &&
    submitted.consultRequired === canonical.consultRequired &&
    submitted.unitPriceCents === canonical.unitPriceCents &&
    submitted.quantityTotalCents === canonical.quantityTotalCents &&
    submitted.estimatedSubtotalCents === canonical.estimatedSubtotalCents &&
    submitted.leadTimeText === canonical.leadTimeText &&
    submitted.shippingProfileHint === canonical.shippingProfileHint
  );
}

function calculateDepositAmounts(totalAmountCents: number) {
  const percentBasisPoints = Math.round(env.CRAFT_BOARD_DEFAULT_DEPOSIT_PERCENT * 100);
  const depositAmountCents = Math.max(
    1,
    Math.min(totalAmountCents, Math.round(totalAmountCents * (percentBasisPoints / 10000)))
  );

  return {
    percentBasisPoints,
    depositAmountCents,
    remainingBalanceAmountCents: Math.max(0, totalAmountCents - depositAmountCents)
  };
}

function normalizeDestinationFromAddress(address: StorefrontOrderDraft["shippingAddress"]): StorefrontShippingDestination {
  return normalizeShippingDestination({
    postalCode: address.postalCode,
    countryCode: address.country,
    stateOrProvinceCode: address.state,
    city: address.city
  });
}

async function calculateCanonicalQuote(input: {
  draft: StorefrontOrderDraft;
  requestId?: string | null;
}): Promise<StorefrontCommercialQuote> {
  const definition = getStorefrontProductDefinition({
    productFamily: input.draft.productFamily,
    productSlug: input.draft.productSlug
  });

  if (!definition) {
    throw new Error("This product is not registered for storefront ordering.");
  }

  const pricing = definition.priceConfiguration(input.draft.configuration as never);
  const shippingEstimate = definition.calculateShipping(
    input.draft.configuration as never,
    normalizeDestinationFromAddress(input.draft.shippingAddress)
  );
  const shipping = await finalizeShippingQuote({
    requestId: input.requestId,
    productFamily: input.draft.productFamily,
    productSlug: input.draft.productSlug,
    destination: normalizeDestinationFromAddress(input.draft.shippingAddress),
    estimate: shippingEstimate
  });
  const tax = await finalizeTaxQuote({
    requestId: input.requestId,
    destination: normalizeTaxDestination({
      postalCode: input.draft.shippingAddress.postalCode,
      countryCode: input.draft.shippingAddress.country,
      stateOrProvinceCode: input.draft.shippingAddress.state,
      city: input.draft.shippingAddress.city,
      shippingAddress1: input.draft.shippingAddress.address1,
      shippingAddress2: input.draft.shippingAddress.address2 ?? null
    }),
    productSubtotalCents: pricing.quantityTotalCents,
    shippingCostCents: shipping.shippingCostCents,
    shippingTaxable: true
  });
  const standardCheckoutEligible =
    pricing.instantPriceEligible &&
    !pricing.reviewRequired &&
    !pricing.consultRequired &&
    shipping.shippingEligible &&
    !shipping.reviewRequired &&
    !shipping.consultRequired &&
    !tax.reviewRequired;
  const estimatedOrderTotalCents =
    pricing.quantityTotalCents + shipping.shippingCostCents + tax.taxAmountCents;
  const depositBaseAmountCents = estimatedOrderTotalCents;
  const deposit = calculateDepositAmounts(depositBaseAmountCents);

  return {
    pricing,
    shipping,
    tax,
    standardCheckoutEligible,
    reviewRequired: !standardCheckoutEligible,
    customerFacingMessages: [
      pricing.customerMessage,
      shipping.customerFacingMessage,
      tax.customerFacingMessage
    ].filter(Boolean),
    commercialTotals: {
      productSubtotalCents: pricing.quantityTotalCents,
      shippingCostCents: shipping.shippingCostCents,
      taxAmountCents: tax.taxAmountCents,
      estimatedOrderTotalCents
    },
    depositBasis: {
      percentBasisPoints: deposit.percentBasisPoints,
      depositBaseAmountCents,
      depositIncludesShipping: true,
      depositIncludesTax: true,
      depositAmountCents: deposit.depositAmountCents,
      remainingBalanceAmountCents: deposit.remainingBalanceAmountCents
    }
  };
}

async function refreshAttemptQuoteBasis(input: {
  attempt: StorefrontOrderAttemptRow;
}) {
  const draft = parseDraftFromAttempt(input.attempt);
  const quote = await calculateCanonicalQuote({
    draft,
    requestId: input.attempt.requestId
  });

  const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: input.attempt.id },
    data: {
      pricingJson: toJsonValue(quote.pricing),
      shippingMode: quote.shipping.shippingMode,
      packagingProfile: quote.shipping.packagingProfile,
      shippingCostCents: quote.shipping.shippingCostCents,
      shippingReviewRequired: quote.shipping.reviewRequired,
      estimatedTransitDays: quote.shipping.estimatedTransitDays,
      destinationZone: quote.shipping.destinationZone,
      shippingBasisVersion: quote.shipping.shippingBasisVersion,
      shippingQuoteSource: quote.shipping.quoteSource,
      shippingCarrierName: quote.shipping.carrierName,
      shippingServiceLevel: quote.shipping.serviceLevel,
      shippingQuoteReference: quote.shipping.quoteReference,
      shippingQuoteExpiresAt: quote.shipping.quoteExpiresAt ? new Date(quote.shipping.quoteExpiresAt) : null,
      shippingQuoteGeneratedAt: new Date(quote.shipping.quoteGeneratedAt),
      shippingFallbackUsed: quote.shipping.fallbackUsed,
      shippingEstimateJson: toJsonValue(quote.shipping),
      shippingWarningsJson: toJsonValue(quote.shipping.shippingWarnings),
      shippingProviderSummaryJson: quote.shipping.rawProviderSummary
        ? toJsonValue(quote.shipping.rawProviderSummary)
        : Prisma.JsonNull,
      taxAmountCents: quote.tax.taxAmountCents,
      taxableSubtotalCents: quote.tax.taxableSubtotalCents,
      taxableShippingCents: quote.tax.taxableShippingCents,
      taxReviewRequired: quote.tax.reviewRequired,
      taxQuoteSource: quote.tax.quoteSource,
      taxRateBasisPoints: quote.tax.taxRateBasisPoints,
      taxBasisVersion: quote.tax.taxBasisVersion,
      taxQuoteGeneratedAt: new Date(quote.tax.quoteGeneratedAt),
      taxQuoteExpiresAt: quote.tax.quoteExpiresAt ? new Date(quote.tax.quoteExpiresAt) : null,
      taxFallbackUsed: quote.tax.fallbackUsed,
      taxJurisdictionSummaryJson: toJsonValue(quote.tax.jurisdictionSummary),
      taxWarningsJson: toJsonValue(quote.tax.taxWarnings),
      taxReasonCodesJson: toJsonValue(quote.tax.taxReasonCodes),
      taxProviderSummaryJson: quote.tax.rawProviderSummary
        ? toJsonValue(quote.tax.rawProviderSummary)
        : Prisma.JsonNull,
      depositPercentBasisPoints: quote.depositBasis.percentBasisPoints,
      depositAmountCents:
        draft.paymentMode === "DEPOSIT_REQUEST" ? quote.depositBasis.depositAmountCents : null,
      remainingBalanceAmountCents:
        draft.paymentMode === "DEPOSIT_REQUEST"
          ? quote.depositBasis.remainingBalanceAmountCents
          : null
    }
  });

  return {
    updated,
    draft,
    quote
  };
}

async function getOrderAttemptOrThrow(attemptId: string) {
  const attempt = await prisma.craftBoardStorefrontOrderAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new Error("Storefront order attempt not found.");
  }

  return attempt;
}

function parseDraftFromAttempt(row: {
  configurationJson: Prisma.JsonValue;
  pricingJson: Prisma.JsonValue;
  customerJson: Prisma.JsonValue;
  shippingJson: Prisma.JsonValue;
  billingJson: Prisma.JsonValue | null;
  paymentMode: "DEPOSIT_REQUEST" | "FULL_PAYMENT_LATER" | "PAY_NOW_PLACEHOLDER";
  orderIntent: "PURCHASE_STANDARD" | "REQUEST_REVIEW";
  instantPriceEligible: boolean;
  consultRequired: boolean;
  customerAcceptedPricingBasis: boolean;
  customerAcceptedLeadTimeBasis: boolean;
  customerAcknowledgedMadeToOrder: boolean;
}) {
  return {
    sourceChannel: "CRAFT_BOARD",
    productFamily: (row.configurationJson as Record<string, unknown>).productFamily as any,
    productSlug: (row.configurationJson as Record<string, unknown>).productSlug as string,
    configuration: row.configurationJson as unknown as StorefrontOrderDraft["configuration"],
    pricingResult: row.pricingJson as unknown as StorefrontOrderDraft["pricingResult"],
    eligibilityResult: {
      instantPriceEligible: row.instantPriceEligible,
      reviewRequired: !row.instantPriceEligible,
      consultRequired: row.consultRequired,
      reasonCodes: row.consultRequired
        ? ["CONSULT_REQUIRED"]
        : row.instantPriceEligible
          ? []
          : ["REVIEW_REQUIRED"],
      customerFacingMessage:
        typeof (row.pricingJson as Record<string, unknown>).customerMessage === "string"
          ? ((row.pricingJson as Record<string, unknown>).customerMessage as string)
          : "Review required before standard checkout.",
      allowedCheckoutMode: row.instantPriceEligible ? "STANDARD_CHECKOUT" : "REVIEW_ONLY",
      fallbackMode: row.instantPriceEligible ? "NONE" : "REQUEST_REVIEW"
    },
    instantPriceEligible: row.instantPriceEligible,
    consultRequired: row.consultRequired,
    customer: row.customerJson as unknown as StorefrontOrderDraft["customer"],
    shippingAddress: row.shippingJson as unknown as StorefrontOrderDraft["shippingAddress"],
    billingSameAsShipping: !row.billingJson,
    billingAddress: row.billingJson as unknown as StorefrontOrderDraft["billingAddress"],
    paymentMode: row.paymentMode,
    orderIntent: row.orderIntent,
    customerAcceptedPricingBasis: row.customerAcceptedPricingBasis,
    customerAcceptedLeadTimeBasis: row.customerAcceptedLeadTimeBasis,
    customerAcknowledgedMadeToOrder: row.customerAcknowledgedMadeToOrder
  } satisfies StorefrontOrderDraft;
}

function mapOrderAttempt(row: Awaited<ReturnType<typeof getOrderAttemptOrThrow>>) {
  return {
    id: row.id,
    requestId: row.requestId,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMode: row.paymentMode,
    instantPriceEligible: row.instantPriceEligible,
    consultRequired: row.consultRequired,
    shippingMode: row.shippingMode,
    packagingProfile: row.packagingProfile,
    shippingCostCents: row.shippingCostCents,
    shippingReviewRequired: row.shippingReviewRequired,
    estimatedTransitDays: row.estimatedTransitDays,
    destinationZone: row.destinationZone,
    shippingBasisVersion: row.shippingBasisVersion,
    shippingQuoteSource: row.shippingQuoteSource,
    shippingCarrierName: row.shippingCarrierName,
    shippingServiceLevel: row.shippingServiceLevel,
    shippingQuoteReference: row.shippingQuoteReference,
    shippingQuoteExpiresAt: row.shippingQuoteExpiresAt?.toISOString() ?? null,
    shippingQuoteGeneratedAt: row.shippingQuoteGeneratedAt?.toISOString() ?? null,
    shippingFallbackUsed: row.shippingFallbackUsed,
    taxAmountCents: row.taxAmountCents,
    taxableSubtotalCents: row.taxableSubtotalCents,
    taxableShippingCents: row.taxableShippingCents,
    taxReviewRequired: row.taxReviewRequired,
    taxQuoteSource: row.taxQuoteSource,
    taxRateBasisPoints: row.taxRateBasisPoints,
    taxBasisVersion: row.taxBasisVersion,
    taxQuoteGeneratedAt: row.taxQuoteGeneratedAt?.toISOString() ?? null,
    taxQuoteExpiresAt: row.taxQuoteExpiresAt?.toISOString() ?? null,
    taxFallbackUsed: row.taxFallbackUsed,
    depositPercentBasisPoints: row.depositPercentBasisPoints,
    depositAmountCents: row.depositAmountCents,
    remainingBalanceAmountCents: row.remainingBalanceAmountCents,
    paymentProvider: row.paymentProvider,
    paymentProviderSessionId: row.paymentProviderSessionId,
    paymentProviderIntentId: row.paymentProviderIntentId,
    paymentInitiatedAt: row.paymentInitiatedAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    paymentFailureReason: row.paymentFailureReason,
    confirmationCode: row.confirmationCode,
    fieldMetriqSubmissionStatus: row.fieldMetriqSubmissionStatus,
    fieldMetriqSubmissionAttemptedAt: row.fieldMetriqSubmissionAttemptedAt?.toISOString() ?? null,
    fieldMetriqSubmissionSucceededAt: row.fieldMetriqSubmissionSucceededAt?.toISOString() ?? null,
    fieldMetriqSubmissionReference: row.fieldMetriqSubmissionReference,
    fieldMetriqSubmissionError: row.fieldMetriqSubmissionError,
    fieldMetriqSubmissionRetryCount: row.fieldMetriqSubmissionRetryCount,
    fieldMetriqSubmittedAt: row.fieldMetriqSubmittedAt?.toISOString() ?? null,
    fieldMetriqFulfillmentClass: row.fieldMetriqFulfillmentClass,
    fieldMetriqProductionProfile: row.fieldMetriqProductionProfile,
    customerStatusToken: row.customerStatusToken,
    latestCustomerOrderStatus: row.latestCustomerOrderStatus,
    latestCustomerOrderStatusLabel: row.latestCustomerOrderStatusLabel,
    latestCustomerStatusUpdatedAt: row.latestCustomerStatusUpdatedAt?.toISOString() ?? null,
    fieldMetriqOrderReference: row.fieldMetriqOrderReference,
    fieldMetriqLastStatusSyncAt: row.fieldMetriqLastStatusSyncAt?.toISOString() ?? null,
    orderConfirmationEmailSentAt: row.orderConfirmationEmailSentAt?.toISOString() ?? null,
    paymentReceiptEmailSentAt: row.paymentReceiptEmailSentAt?.toISOString() ?? null,
    lastCustomerStatusEmailed: row.lastCustomerStatusEmailed,
    lastCustomerStatusEmailedAt: row.lastCustomerStatusEmailedAt?.toISOString() ?? null,
    configuration: row.configurationJson as Record<string, unknown>,
    pricing: row.pricingJson as Record<string, unknown>,
    shippingEstimate: (row.shippingEstimateJson as Record<string, unknown> | null) ?? null,
    shippingWarnings: (row.shippingWarningsJson as string[] | null) ?? [],
    taxJurisdictionSummary:
      (row.taxJurisdictionSummaryJson as Record<string, unknown> | null) ?? null,
    taxWarnings: (row.taxWarningsJson as string[] | null) ?? [],
    taxReasonCodes: (row.taxReasonCodesJson as string[] | null) ?? [],
    customer: row.customerJson as Record<string, unknown>,
    shipping: row.shippingJson as Record<string, unknown>
  };
}

async function createOrderAttempt(input: {
  requestId: string;
  sourcePath?: string | null;
  draft: StorefrontOrderDraft;
  pricing: StorefrontPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  quote: StorefrontCommercialQuote;
}) {
  return prisma.craftBoardStorefrontOrderAttempt.create({
    data: {
      organizationId: LOCAL_ORG_ID,
      requestId: input.requestId,
      sourceChannel: input.draft.sourceChannel,
      productFamily: input.draft.productFamily,
      productSlug: input.draft.productSlug,
      configurationJson: toJsonValue({
        ...input.draft.configuration,
        sourcePath: normalizeText(input.sourcePath)
      }),
      pricingJson: toJsonValue(input.pricing),
      customerJson: toJsonValue(input.draft.customer),
      shippingJson: toJsonValue(input.draft.shippingAddress),
      billingJson: input.draft.billingSameAsShipping
        ? Prisma.JsonNull
        : toJsonValue(input.draft.billingAddress ?? null),
      paymentMode: input.draft.paymentMode,
      orderIntent: input.draft.orderIntent,
      instantPriceEligible: input.pricing.instantPriceEligible,
      consultRequired: input.pricing.consultRequired,
      shippingMode: input.shippingQuote.shippingMode,
      packagingProfile: input.shippingQuote.packagingProfile,
      shippingCostCents: input.shippingQuote.shippingCostCents,
      shippingReviewRequired: input.shippingQuote.reviewRequired,
      estimatedTransitDays: input.shippingQuote.estimatedTransitDays,
      destinationZone: input.shippingQuote.destinationZone,
      shippingBasisVersion: input.shippingQuote.shippingBasisVersion,
      shippingQuoteSource: input.shippingQuote.quoteSource,
      shippingCarrierName: input.shippingQuote.carrierName,
      shippingServiceLevel: input.shippingQuote.serviceLevel,
      shippingQuoteReference: input.shippingQuote.quoteReference,
      shippingQuoteExpiresAt: input.shippingQuote.quoteExpiresAt
        ? new Date(input.shippingQuote.quoteExpiresAt)
        : null,
      shippingQuoteGeneratedAt: new Date(input.shippingQuote.quoteGeneratedAt),
      shippingFallbackUsed: input.shippingQuote.fallbackUsed,
      shippingEstimateJson: toJsonValue(input.shippingQuote),
      shippingWarningsJson: toJsonValue(input.shippingQuote.shippingWarnings),
      shippingProviderSummaryJson: input.shippingQuote.rawProviderSummary
        ? toJsonValue(input.shippingQuote.rawProviderSummary)
        : Prisma.JsonNull,
      customerAcceptedPricingBasis: input.draft.customerAcceptedPricingBasis,
      customerAcceptedLeadTimeBasis: input.draft.customerAcceptedLeadTimeBasis,
      customerAcknowledgedMadeToOrder: input.draft.customerAcknowledgedMadeToOrder,
      depositPercentBasisPoints: input.quote.depositBasis.percentBasisPoints,
      depositAmountCents: input.draft.paymentMode === "DEPOSIT_REQUEST" ? input.quote.depositBasis.depositAmountCents : null,
      remainingBalanceAmountCents:
        input.draft.paymentMode === "DEPOSIT_REQUEST" ? input.quote.depositBasis.remainingBalanceAmountCents : null,
      fieldMetriqSubmissionEnabled: env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION,
      confirmationCode: input.requestId.toUpperCase(),
      customerStatusToken: randomUUID(),
      customerStatusTokenCreatedAt: new Date(),
      latestCustomerOrderStatus:
        input.draft.paymentMode === "DEPOSIT_REQUEST" ? "ORDER_RECEIVED" : "PAYMENT_RECEIVED",
      latestCustomerOrderStatusLabel:
        input.draft.paymentMode === "DEPOSIT_REQUEST" ? "Order Received" : "Payment Received",
      latestCustomerStatusUpdatedAt: new Date()
    }
  });
}

async function captureFallbackInquiry(input: {
  sourcePath?: string | null;
  draft: StorefrontOrderDraft;
  pricing: StorefrontPricingResult;
  shippingQuote: ConfigurableProductShippingResult;
  taxQuote: StorefrontTaxQuoteResult;
  requestId: string;
  reason: "submission-disabled" | "submission-failed" | "review-required";
  fieldMetriqPayload: Record<string, unknown>;
}) {
  const config = input.draft.configuration;
  const definition = getStorefrontProductDefinition({
    productFamily: input.draft.productFamily,
    productSlug: input.draft.productSlug
  });
  const productName = definition?.displayName ?? "Configurable Product";
  const result = await createCraftBoardInquiry({
    source: "storefront_standard_order",
    sourcePath: normalizeText(input.sourcePath) ?? definition?.checkoutPath ?? "/order",
    productFamily: input.draft.productFamily,
    productSlug: input.draft.productSlug,
    productName,
    customerName: input.draft.customer.fullName,
    customerEmail: input.draft.customer.email,
    customerPhone: input.draft.customer.phone,
    widthValue:
      (typeof (config as any).width === "number" ? (config as any).width : (config as any).length) ?? 0,
    widthUnit:
      (typeof (config as any).widthUnit === "string"
        ? (config as any).widthUnit
        : (config as any).lengthUnit) ?? "IN",
    depthValue: (config as any).depth ?? 0,
    depthUnit: (config as any).depthUnit ?? "IN",
    thicknessValue:
      (typeof (config as any).thickness === "number" ? (config as any).thickness : (config as any).height) ?? 0,
    thicknessUnit:
      (typeof (config as any).thicknessUnit === "string"
        ? (config as any).thicknessUnit
        : (config as any).heightUnit) ?? "IN",
    quantity: (config as any).quantity ?? 1,
    materialCode: (config as any).materialCode,
    materialLabel: (config as any).materialLabel,
    mountingCode: (config as any).mountingCode,
    mountingLabel: (config as any).mountingLabel,
    notes: [
      normalizeText(input.draft.notes),
      `Payment mode: ${input.draft.paymentMode}`,
      `Order intent: ${input.draft.orderIntent}`,
      `Fallback reason: ${input.reason}`,
      `Craft & Board request ID: ${input.requestId}`
    ]
      .filter(Boolean)
      .join("\n"),
    configurationJson: {
      storefrontOrderMode: input.reason,
      requestId: input.requestId,
      draft: input.draft,
      pricing: input.pricing,
      shippingQuote: input.shippingQuote,
      taxQuote: input.taxQuote,
      shippingAddress: input.draft.shippingAddress,
      billingAddress: input.draft.billingSameAsShipping
        ? input.draft.shippingAddress
        : input.draft.billingAddress ?? null,
      fieldMetriqPayload: input.fieldMetriqPayload
    }
  });

  return result.inquiry;
}

async function submitPaidAttemptToFieldMetriq(input: {
  attempt: StorefrontOrderAttemptRow;
}) {
  if (input.attempt.fieldMetriqSubmissionStatus === "SUCCEEDED") {
    return {
      submissionReference: input.attempt.fieldMetriqSubmissionReference ?? input.attempt.requestId,
      fulfillmentClass: input.attempt.fieldMetriqFulfillmentClass,
      productionProfile: input.attempt.fieldMetriqProductionProfile
    };
  }

  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: input.attempt.id },
      data: {
        fieldMetriqSubmissionStatus: "DISABLED"
      }
    });
    return {
      submissionReference: null,
      fulfillmentClass: input.attempt.fieldMetriqFulfillmentClass,
      productionProfile: input.attempt.fieldMetriqProductionProfile
    };
  }

  const { updated: refreshedAttempt, draft, quote } = await refreshAttemptQuoteBasis({
    attempt: input.attempt
  });
  const definition = getStorefrontProductDefinition({
    productFamily: draft.productFamily,
    productSlug: draft.productSlug
  });

  if (!definition) {
    throw new Error("This storefront product is not registered for paid submission.");
  }

  const { handoff, fieldMetriqPayload } = buildFieldMetriqFulfillmentSubmission({
    attempt: {
      id: refreshedAttempt.id,
      requestId: refreshedAttempt.requestId,
      confirmationCode: refreshedAttempt.confirmationCode,
      paidAt: refreshedAttempt.paidAt,
      depositPercentBasisPoints: refreshedAttempt.depositPercentBasisPoints,
      depositAmountCents: refreshedAttempt.depositAmountCents,
      remainingBalanceAmountCents: refreshedAttempt.remainingBalanceAmountCents,
      paymentProvider: refreshedAttempt.paymentProvider,
      paymentProviderSessionId: refreshedAttempt.paymentProviderSessionId,
      paymentProviderIntentId: refreshedAttempt.paymentProviderIntentId,
      fieldMetriqSubmissionRetryCount: refreshedAttempt.fieldMetriqSubmissionRetryCount
    },
    draft,
    definition,
    pricing: quote.pricing as any,
    shippingQuote: quote.shipping,
    taxQuote: quote.tax
  });

  logger.info("Craft & Board fulfillment handoff prepared", {
    attemptId: refreshedAttempt.id,
    requestId: refreshedAttempt.requestId,
    fulfillmentClass: handoff.fulfillmentRoutingSnapshot.fulfillmentClass,
    productionProfile: handoff.fulfillmentRoutingSnapshot.productionProfile,
    quoteSource: handoff.shippingSnapshot.shippingQuoteSource
  });

  await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: refreshedAttempt.id },
    data: {
      fieldMetriqSubmissionAttemptedAt: new Date(),
      fieldMetriqSubmissionStatus: "SUBMITTING",
      fieldMetriqSubmissionRetryCount: {
        increment: 1
      },
      fieldMetriqSubmissionError: null,
      fieldMetriqFulfillmentClass: handoff.fulfillmentRoutingSnapshot.fulfillmentClass,
      fieldMetriqProductionProfile: handoff.fulfillmentRoutingSnapshot.productionProfile
    }
  });

  const submission = await submitFieldMetriqStorefrontOrder({
    payload: fieldMetriqPayload,
    requestId: refreshedAttempt.requestId,
    idempotencyKey: buildFieldMetriqIdempotencyKey({
      attemptId: refreshedAttempt.id,
      confirmationCode: refreshedAttempt.confirmationCode
    })
  });

  const submissionReference =
    typeof submission.body?.reference === "string"
      ? submission.body.reference
      : typeof submission.body?.orderId === "string"
        ? submission.body.orderId
        : refreshedAttempt.requestId;

  await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: refreshedAttempt.id },
    data: {
      fieldMetriqSubmittedAt: new Date(),
      fieldMetriqSubmissionStatus: "SUCCEEDED",
      fieldMetriqSubmissionSucceededAt: new Date(),
      fieldMetriqSubmissionReference: submissionReference,
      fieldMetriqSubmissionError: null,
      fieldMetriqOrderReference: submissionReference,
      fieldMetriqFulfillmentClass: handoff.fulfillmentRoutingSnapshot.fulfillmentClass,
      fieldMetriqProductionProfile: handoff.fulfillmentRoutingSnapshot.productionProfile,
      latestCustomerOrderStatus: "ORDER_RECEIVED",
      latestCustomerOrderStatusLabel: "Order Received",
      latestCustomerStatusUpdatedAt: new Date(),
      status: "LIVE_SUBMITTED"
    }
  });

  return {
    submissionReference,
    fulfillmentClass: handoff.fulfillmentRoutingSnapshot.fulfillmentClass,
    productionProfile: handoff.fulfillmentRoutingSnapshot.productionProfile
  };
}

async function markOrderAttemptPaid(input: {
  attemptId: string;
  providerSessionId?: string | null;
  providerIntentId?: string | null;
}) {
  const attempt = await getOrderAttemptOrThrow(input.attemptId);

  if (attempt.paymentStatus === "PAID") {
    try {
      await sendStorefrontOrderConfirmationEmail({ attemptId: attempt.id });
    } catch (error) {
      logger.warn("Craft & Board storefront confirmation email send failed after duplicate payment callback", {
        attemptId: attempt.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      ok: true,
      orderAttempt: mapOrderAttempt(attempt),
      submissionReference: attempt.fieldMetriqSubmissionReference ?? null
    };
  }

  const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: attempt.id },
    data: {
      paymentStatus: "PAID",
      status: "LIVE_SUBMITTED",
      paymentProviderSessionId: input.providerSessionId ?? attempt.paymentProviderSessionId,
      paymentProviderIntentId: input.providerIntentId ?? attempt.paymentProviderIntentId,
      paidAt: attempt.paidAt ?? new Date(),
      paymentFailureReason: null
    }
  });

  let submissionReference: string | null = null;
  try {
    const submission = await submitPaidAttemptToFieldMetriq({ attempt: updated });
    submissionReference = submission.submissionReference;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Craft & Board paid storefront handoff to FieldMetriq failed", {
      attemptId: attempt.id,
      error: message
    });
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        fieldMetriqSubmissionAttemptedAt: new Date(),
        fieldMetriqSubmissionStatus: "RETRY_PENDING",
        fieldMetriqSubmissionError: message.slice(0, 1000)
      }
    });
  }

  const finalAttempt = await getOrderAttemptOrThrow(attempt.id);
  try {
    await sendStorefrontOrderConfirmationEmail({ attemptId: finalAttempt.id });
  } catch (error) {
    logger.warn("Craft & Board storefront confirmation email send failed", {
      attemptId: finalAttempt.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    ok: true,
    orderAttempt: mapOrderAttempt(finalAttempt),
    submissionReference
  };
}

export async function previewFloatingShelfPrice(input: {
  configuration: FloatingShelfConfiguration | FloatingMantelConfiguration;
}) {
  const definition = getStorefrontProductDefinition({
    productFamily: input.configuration.productFamily,
    productSlug: input.configuration.productSlug
  });

  return {
    ok: true,
    pricing:
      (definition?.priceConfiguration(input.configuration as never) as any) ??
      calculateFloatingShelfPrice(input.configuration as FloatingShelfConfiguration)
  };
}

export async function getCraftBoardStorefrontQuote(input: {
  configuration: FloatingShelfConfiguration | FloatingMantelConfiguration;
  destination: StorefrontShippingDestination;
}) {
  const definition = getStorefrontProductDefinition({
    productFamily: input.configuration.productFamily,
    productSlug: input.configuration.productSlug
  });

  if (!definition) {
    throw new Error("This product is not registered for storefront quoting.");
  }

  const pricing = definition.priceConfiguration(input.configuration as never);
  const shippingEstimate = definition.calculateShipping(input.configuration as never, input.destination);
  const shipping = await finalizeShippingQuote({
    productFamily: input.configuration.productFamily,
    productSlug: input.configuration.productSlug,
    destination: input.destination,
    estimate: shippingEstimate
  });
  const tax = await finalizeTaxQuote({
    destination: normalizeTaxDestination({
      postalCode: input.destination.postalCode,
      countryCode: input.destination.countryCode,
      stateOrProvinceCode: input.destination.stateOrProvinceCode,
      city: input.destination.city ?? null
    }),
    productSubtotalCents: pricing.quantityTotalCents,
    shippingCostCents: shipping.shippingCostCents,
    shippingTaxable: true
  });
  const standardCheckoutEligible =
    pricing.instantPriceEligible &&
    !pricing.reviewRequired &&
    !pricing.consultRequired &&
    shipping.shippingEligible &&
    !shipping.reviewRequired &&
    !shipping.consultRequired &&
    !tax.reviewRequired;
  const estimatedOrderTotalCents =
    pricing.quantityTotalCents + shipping.shippingCostCents + tax.taxAmountCents;
  const deposit = calculateDepositAmounts(estimatedOrderTotalCents);

  return {
    ok: true,
    quote: {
      pricing,
      shipping,
      tax,
      standardCheckoutEligible,
      reviewRequired: !standardCheckoutEligible,
      customerFacingMessages: [
        pricing.customerMessage,
        shipping.customerFacingMessage,
        tax.customerFacingMessage
      ].filter(Boolean),
      commercialTotals: {
        productSubtotalCents: pricing.quantityTotalCents,
        shippingCostCents: shipping.shippingCostCents,
        taxAmountCents: tax.taxAmountCents,
        estimatedOrderTotalCents
      },
      depositBasis: {
        percentBasisPoints: deposit.percentBasisPoints,
        depositBaseAmountCents: estimatedOrderTotalCents,
        depositIncludesShipping: true,
        depositIncludesTax: true,
        depositAmountCents: deposit.depositAmountCents,
        remainingBalanceAmountCents: deposit.remainingBalanceAmountCents
      }
    }
  };
}

export async function submitCraftBoardStorefrontOrder(input: {
  sourcePath?: string | null;
  draft: StorefrontOrderDraft;
}) {
  const definition = getStorefrontProductDefinition({
    productFamily: input.draft.productFamily,
    productSlug: input.draft.productSlug
  });

  if (!definition) {
    throw new Error("This product is not registered for storefront ordering.");
  }

  const requestId = `cbs_${randomUUID()}`;
  const canonicalPricing = definition.priceConfiguration(input.draft.configuration as never);
  const quote = await calculateCanonicalQuote({
    draft: input.draft,
    requestId
  });
  const shippingQuote = quote.shipping;

  if (!pricingMatches(input.draft.pricingResult, canonicalPricing)) {
    throw new Error("Pricing changed. Review the configuration again before submitting the order.");
  }

  const fieldMetriqPayload = definition.buildFieldMetriqPayload({
    requestId,
    sourcePath: input.sourcePath,
    draft: input.draft as any,
    canonicalPricing,
    shippingQuote,
    taxQuote: quote.tax
  });

  const attempt = await createOrderAttempt({
    requestId,
    sourcePath: input.sourcePath,
    draft: input.draft,
    pricing: canonicalPricing,
    shippingQuote,
    quote
  });

  if (orderIntentNeedsReview(input.draft, canonicalPricing, shippingQuote, quote.tax)) {
    const inquiry = await captureFallbackInquiry({
      sourcePath: input.sourcePath,
      draft: input.draft,
      pricing: canonicalPricing,
      shippingQuote,
      taxQuote: quote.tax,
      requestId,
      reason: "review-required",
      fieldMetriqPayload
    });

    const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "REVIEW_REQUIRED",
        fieldMetriqSubmissionStatus: "REVIEW_REQUIRED",
        fallbackReason: "review-required",
        resolvedInquiryId: inquiry.id
      }
    });

    return {
      ok: true,
      requestId,
      attemptId: attempt.id,
      mode: "review-required" as const,
      pricing: canonicalPricing,
      quote,
      inquiry,
      orderAttempt: mapOrderAttempt(updated),
      submissionReference: null,
      message:
        "This configuration needs review before standard checkout can continue, so Craft & Board routed it into the review path."
    };
  }

  if (input.draft.paymentMode === "DEPOSIT_REQUEST") {
    const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        depositPercentBasisPoints: quote.depositBasis.percentBasisPoints,
        depositAmountCents: quote.depositBasis.depositAmountCents,
        remainingBalanceAmountCents: quote.depositBasis.remainingBalanceAmountCents
      }
    });

    return {
      ok: true,
      requestId,
      attemptId: attempt.id,
      mode: "payment-required" as const,
      pricing: canonicalPricing,
      quote,
      orderAttempt: mapOrderAttempt(updated),
      submissionReference: null,
      message: "Checkout details were captured. Continue into deposit payment to complete the order handoff."
    };
  }

  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    const inquiry = await captureFallbackInquiry({
      sourcePath: input.sourcePath,
      draft: input.draft,
      pricing: canonicalPricing,
      shippingQuote,
      taxQuote: quote.tax,
      requestId,
      reason: "submission-disabled",
      fieldMetriqPayload
    });

    const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FALLBACK_CAPTURED",
        fieldMetriqSubmissionStatus: "DISABLED",
        fallbackReason: "submission-disabled",
        resolvedInquiryId: inquiry.id
      }
    });

    return {
      ok: true,
      requestId,
      attemptId: attempt.id,
      mode: "fallback-captured" as const,
      pricing: canonicalPricing,
      quote,
      inquiry,
      orderAttempt: mapOrderAttempt(updated),
      submissionReference: null,
      message:
        "Live FieldMetriq submission is disabled right now, so Craft & Board saved the checkout attempt for direct follow-up."
    };
  }

  try {
    const submission = await submitFieldMetriqStorefrontOrder({
      payload: fieldMetriqPayload,
      requestId,
      idempotencyKey: `craft-board-order:${requestId}`
    });

    const submissionReference =
      typeof submission.body?.reference === "string"
        ? submission.body.reference
        : typeof submission.body?.orderId === "string"
          ? submission.body.orderId
          : requestId;

    const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "LIVE_SUBMITTED",
        fieldMetriqSubmissionAttemptedAt: new Date(),
        fieldMetriqSubmittedAt: new Date(),
        fieldMetriqSubmissionStatus: "SUCCEEDED",
        fieldMetriqSubmissionReference: submissionReference
      }
    });

    return {
      ok: true,
      requestId,
      attemptId: attempt.id,
      mode: "live-submitted" as const,
      pricing: canonicalPricing,
      quote,
      orderAttempt: mapOrderAttempt(updated),
      submissionReference,
      message:
        "Craft & Board submitted the order into FieldMetriq. The next step depends on the payment mode you selected."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Craft & Board storefront order fell back after FieldMetriq submission failure", {
      requestId,
      error: message
    });

    const inquiry = await captureFallbackInquiry({
      sourcePath: input.sourcePath,
      draft: input.draft,
      pricing: canonicalPricing,
      shippingQuote,
      taxQuote: quote.tax,
      requestId,
      reason: "submission-failed",
      fieldMetriqPayload
    });

    const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FALLBACK_CAPTURED",
        fieldMetriqSubmissionAttemptedAt: new Date(),
        fieldMetriqSubmissionStatus: "FAILED",
        fieldMetriqSubmissionError: message.slice(0, 1000),
        fallbackReason: "submission-failed",
        resolvedInquiryId: inquiry.id
      }
    });

    return {
      ok: true,
      requestId,
      attemptId: attempt.id,
      mode: "fallback-captured" as const,
      pricing: canonicalPricing,
      quote,
      inquiry,
      orderAttempt: mapOrderAttempt(updated),
      submissionReference: null,
      message:
        "Live FieldMetriq submission was unavailable, so Craft & Board preserved the priced checkout attempt for manual follow-up."
    };
  }
}

export async function createCraftBoardStorefrontPaymentSession(input: {
  attemptId: string;
  successPath?: string | null;
  cancelPath?: string | null;
}) {
  const attempt = await getOrderAttemptOrThrow(input.attemptId);

  if (attempt.paymentMode !== "DEPOSIT_REQUEST") {
    throw new Error("This storefront order attempt is not configured for deposit payment.");
  }
  if (!attempt.instantPriceEligible || attempt.consultRequired || attempt.shippingReviewRequired || attempt.taxReviewRequired) {
    throw new Error("This storefront order attempt is not eligible for the standard deposit payment flow.");
  }
  if (attempt.paymentStatus === "PAID") {
    throw new Error("This storefront order attempt is already paid.");
  }

  const { updated: refreshedAttempt, quote } = await refreshAttemptQuoteBasis({ attempt });

  if (!quote.standardCheckoutEligible || quote.shipping.reviewRequired || quote.tax.reviewRequired) {
    throw new Error("This storefront order attempt now requires logistics or tax review before payment can continue.");
  }

  const pricing = quote.pricing as StorefrontOrderDraft["pricingResult"];
  const shippingCostCents = quote.shipping.shippingCostCents;
  const deposit = quote.depositBasis;
  const adapter = getPaymentProviderAdapter("STRIPE");
  const successPath = normalizeRelativePath(
    input.successPath,
    `/order/payment/success?attemptId=${encodeURIComponent(attempt.id)}`
  );
  const cancelPath = normalizeRelativePath(
    input.cancelPath,
    `/order/payment/cancelled?attemptId=${encodeURIComponent(attempt.id)}`
  );
  const providerSession = await adapter.createExecutionSession({
    executionId: attempt.id,
    organizationId: refreshedAttempt.organizationId,
    proposalId: refreshedAttempt.id,
    provider: "STRIPE",
    mode: "HOSTED_CHECKOUT",
    amountCents: deposit.depositAmountCents,
    currency: pricing.currencyCode,
    externalReference: refreshedAttempt.requestId,
    metadata: {
      storefrontOrderAttemptId: refreshedAttempt.id,
      requestId: refreshedAttempt.requestId,
      shippingQuoteSource: quote.shipping.quoteSource,
      shippingQuoteReference: quote.shipping.quoteReference,
      taxQuoteSource: quote.tax.quoteSource,
      taxQuoteReference: quote.tax.quoteReference,
      successUrl: buildPublicUrl(successPath),
      cancelUrl: buildPublicUrl(cancelPath)
    }
  });

  const redirectUrl =
    env.CRAFT_BOARD_ENABLE_LIVE_PAYMENTS && providerSession.providerUrl
      ? providerSession.providerUrl
      : buildPublicUrl(`${successPath}${successPath.includes("?") ? "&" : "?"}simulated=1`);

  const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: refreshedAttempt.id },
    data: {
      paymentStatus: env.CRAFT_BOARD_ENABLE_LIVE_PAYMENTS ? "PAYMENT_IN_PROGRESS" : "SESSION_CREATED",
      depositPercentBasisPoints: deposit.percentBasisPoints,
      depositAmountCents: deposit.depositAmountCents,
      remainingBalanceAmountCents: deposit.remainingBalanceAmountCents,
      paymentProvider: "STRIPE",
      paymentProviderSessionId: providerSession.providerSessionId,
      paymentProviderIntentId: providerSession.providerPaymentIntentId,
      paymentInitiatedAt: new Date()
    }
  });

  return {
    ok: true,
    paymentSession: {
      attemptId: updated.id,
      redirectUrl,
      simulated: !env.CRAFT_BOARD_ENABLE_LIVE_PAYMENTS,
      paymentProvider: "STRIPE" as const,
      shippingCostCents: updated.shippingCostCents,
      shippingQuoteSource: updated.shippingQuoteSource,
      taxAmountCents: updated.taxAmountCents,
      taxQuoteSource: updated.taxQuoteSource,
      depositAmountCents: updated.depositAmountCents,
      remainingBalanceAmountCents: updated.remainingBalanceAmountCents,
      confirmationCode: updated.confirmationCode,
      successUrl: buildPublicUrl(successPath),
      cancelUrl: buildPublicUrl(cancelPath)
    }
  };
}

export async function completeCraftBoardStorefrontTestPayment(input: {
  attemptId: string;
}) {
  if (env.CRAFT_BOARD_ENABLE_LIVE_PAYMENTS) {
    throw new Error("Test payment completion is disabled while live payments are enabled.");
  }

  return markOrderAttemptPaid({ attemptId: input.attemptId });
}

export async function getCraftBoardStorefrontOrderConfirmation(input: {
  attemptId: string;
}) {
  const attempt = await getOrderAttemptOrThrow(input.attemptId);

  return {
    ok: true,
    orderAttempt: mapOrderAttempt(attempt),
    confirmation: {
      requestId: attempt.requestId,
      confirmationCode: attempt.confirmationCode,
      customerStatusToken: attempt.customerStatusToken,
      paymentMode: attempt.paymentMode,
      paymentStatus: attempt.paymentStatus,
      shippingMode: attempt.shippingMode,
      packagingProfile: attempt.packagingProfile,
      shippingCostCents: attempt.shippingCostCents,
      shippingReviewRequired: attempt.shippingReviewRequired,
      estimatedTransitDays: attempt.estimatedTransitDays,
      destinationZone: attempt.destinationZone,
      shippingQuoteSource: attempt.shippingQuoteSource,
      shippingCarrierName: attempt.shippingCarrierName,
      shippingServiceLevel: attempt.shippingServiceLevel,
      shippingQuoteReference: attempt.shippingQuoteReference,
      shippingQuoteExpiresAt: attempt.shippingQuoteExpiresAt?.toISOString() ?? null,
      shippingQuoteGeneratedAt: attempt.shippingQuoteGeneratedAt?.toISOString() ?? null,
      shippingFallbackUsed: attempt.shippingFallbackUsed,
      taxAmountCents: attempt.taxAmountCents,
      taxableSubtotalCents: attempt.taxableSubtotalCents,
      taxableShippingCents: attempt.taxableShippingCents,
      taxReviewRequired: attempt.taxReviewRequired,
      taxQuoteSource: attempt.taxQuoteSource,
      taxRateBasisPoints: attempt.taxRateBasisPoints,
      taxBasisVersion: attempt.taxBasisVersion,
      taxQuoteGeneratedAt: attempt.taxQuoteGeneratedAt?.toISOString() ?? null,
      taxQuoteExpiresAt: attempt.taxQuoteExpiresAt?.toISOString() ?? null,
      taxFallbackUsed: attempt.taxFallbackUsed,
      taxJurisdictionSummary:
        (attempt.taxJurisdictionSummaryJson as Record<string, unknown> | null) ?? null,
      taxWarnings: (attempt.taxWarningsJson as string[] | null) ?? [],
      depositAmountCents: attempt.depositAmountCents,
      remainingBalanceAmountCents: attempt.remainingBalanceAmountCents,
      paidAt: attempt.paidAt?.toISOString() ?? null,
      submissionReference: attempt.fieldMetriqSubmissionReference,
      fieldMetriqSubmissionStatus: attempt.fieldMetriqSubmissionStatus,
      fieldMetriqSubmissionError: attempt.fieldMetriqSubmissionError,
      fieldMetriqSubmissionRetryCount: attempt.fieldMetriqSubmissionRetryCount,
      fieldMetriqFulfillmentClass: attempt.fieldMetriqFulfillmentClass,
      fieldMetriqProductionProfile: attempt.fieldMetriqProductionProfile,
      orderConfirmationEmailSentAt: attempt.orderConfirmationEmailSentAt?.toISOString() ?? null
    }
  };
}

export { getCustomerStorefrontOrderStatus };
export { createStorefrontChangeRequest };
export { createStorefrontOrderIssue };

export async function cancelCraftBoardStorefrontOrderPayment(input: {
  attemptId: string;
}) {
  const attempt = await getOrderAttemptOrThrow(input.attemptId);
  const updated = await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: attempt.id },
    data: {
      paymentStatus: "CANCELLED",
      paymentFailureReason: "customer-cancelled",
      cancelledAt: attempt.cancelledAt ?? new Date()
    }
  });

  return {
    ok: true,
    orderAttempt: mapOrderAttempt(updated)
  };
}

export async function handleCraftBoardStorefrontPaymentWebhook(input: {
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
}) {
  const adapter = getPaymentProviderAdapter("STRIPE");
  const mapped = await adapter.mapIncomingEvent({
    payload: input.payload,
    headers: input.headers
  });
  const canonical = await adapter.normalizeEventToCanonical(mapped);

  const attempt = canonical.externalReference
    ? await prisma.craftBoardStorefrontOrderAttempt.findFirst({
        where: { requestId: canonical.externalReference }
      })
    : canonical.providerSessionId
      ? await prisma.craftBoardStorefrontOrderAttempt.findFirst({
          where: { paymentProviderSessionId: canonical.providerSessionId }
        })
      : null;

  if (!attempt) {
    return { ok: true, handled: false };
  }

  if (canonical.paymentStatus === "SUCCEEDED" || canonical.executionStatus === "COMPLETED") {
    await markOrderAttemptPaid({
      attemptId: attempt.id,
      providerSessionId: canonical.providerSessionId ?? attempt.paymentProviderSessionId,
      providerIntentId: canonical.providerPaymentIntentId ?? attempt.paymentProviderIntentId
    });
    return { ok: true, handled: true };
  }

  if (canonical.paymentStatus === "FAILED") {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        paymentStatus: "PAYMENT_FAILED",
        paymentFailureReason: canonical.eventType
      }
    });
    return { ok: true, handled: true };
  }

  if (canonical.paymentStatus === "CANCELED" || canonical.executionStatus === "CANCELED") {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        paymentStatus: "CANCELLED",
        cancelledAt: attempt.cancelledAt ?? new Date()
      }
    });
    return { ok: true, handled: true };
  }

  if (canonical.executionStatus === "EXPIRED") {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        paymentStatus: "EXPIRED"
      }
    });
    return { ok: true, handled: true };
  }

  return { ok: true, handled: false };
}
