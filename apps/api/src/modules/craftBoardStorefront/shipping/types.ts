export type StorefrontShippingMode =
  | "PARCEL"
  | "OVERSIZE_PARCEL"
  | "LTL_FREIGHT"
  | "LOCAL_DELIVERY"
  | "PICKUP"
  | "REVIEW_REQUIRED";

export type StorefrontShippingQuoteSource =
  | "LIVE_PROVIDER"
  | "ESTIMATE_RULES"
  | "MANUAL_REVIEW";

export type StorefrontPackagingProfile =
  | "long_shelf_box"
  | "mantel_box"
  | "long_oversize_box"
  | "mantel_crate"
  | "freight_pallet";

export type StorefrontDestinationZone =
  | "LOCAL_WEST"
  | "WEST"
  | "MOUNTAIN"
  | "CENTRAL"
  | "EAST"
  | "REMOTE"
  | "UNSUPPORTED";

export type StorefrontShippingDestination = {
  postalCode: string;
  countryCode: string;
  stateOrProvinceCode: string;
  city?: string | null;
  residentialIndicator?: boolean | null;
};

export type ConfigurableProductShippingResult = {
  productFamily: string;
  productSlug: string;
  shippingEligible: boolean;
  reviewRequired: boolean;
  consultRequired: boolean;
  shippingMode: StorefrontShippingMode;
  packagingProfile: StorefrontPackagingProfile;
  shippingCostCents: number;
  estimatedTransitDays: number | null;
  carrierName: string | null;
  serviceLevel: string | null;
  quoteSource: StorefrontShippingQuoteSource;
  quoteReference: string | null;
  quoteExpiresAt: string | null;
  rawProviderSummary: Record<string, unknown> | null;
  fallbackUsed: boolean;
  shippingWarnings: string[];
  shippingReasonCodes: string[];
  destinationZone: StorefrontDestinationZone;
  shippingBasisVersion: string;
  quoteGeneratedAt: string;
  customerFacingMessage: string;
  destinationSummary: {
    countryCode: string;
    stateOrProvinceCode: string;
    postalCodePrefix: string;
  };
};

export type ShippingQuoteProviderResult = {
  quoteAvailable: boolean;
  quoteSource: StorefrontShippingQuoteSource;
  shippingMode: StorefrontShippingMode;
  packagingProfile: StorefrontPackagingProfile;
  shippingCostCents: number;
  estimatedTransitDays: number | null;
  carrierName: string | null;
  serviceLevel: string | null;
  quoteReference: string | null;
  quoteExpiresAt: string | null;
  quoteWarnings: string[];
  rawProviderSummary: Record<string, unknown> | null;
  fallbackUsed: boolean;
  reviewRequired: boolean;
  reasonCodes: string[];
};

export type StorefrontCommercialQuote = {
  pricing: Record<string, unknown>;
  shipping: ConfigurableProductShippingResult;
  tax: {
    taxEligible: boolean;
    reviewRequired: boolean;
    quoteSource: "LIVE_PROVIDER" | "ESTIMATE_RULES" | "NOT_APPLICABLE" | "MANUAL_REVIEW";
    taxAmountCents: number;
    taxableSubtotalCents: number;
    taxableShippingCents: number;
    jurisdictionSummary: {
      countryCode: string;
      stateOrProvinceCode: string;
      postalCodePrefix: string;
    };
    taxRateBasisPoints: number | null;
    taxWarnings: string[];
    taxReasonCodes: string[];
    taxBasisVersion: string;
    quoteGeneratedAt: string;
    quoteExpiresAt: string | null;
    quoteReference: string | null;
    fallbackUsed: boolean;
    rawProviderSummary: Record<string, unknown> | null;
    customerFacingMessage: string;
  };
  standardCheckoutEligible: boolean;
  reviewRequired: boolean;
  customerFacingMessages: string[];
  commercialTotals: {
    productSubtotalCents: number;
    shippingCostCents: number;
    taxAmountCents: number;
    estimatedOrderTotalCents: number;
  };
  depositBasis: {
    percentBasisPoints: number;
    depositBaseAmountCents: number;
    depositIncludesShipping: boolean;
    depositIncludesTax: boolean;
    depositAmountCents: number;
    remainingBalanceAmountCents: number;
  };
};
