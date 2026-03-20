export type StorefrontTaxQuoteSource =
  | "LIVE_PROVIDER"
  | "ESTIMATE_RULES"
  | "NOT_APPLICABLE"
  | "MANUAL_REVIEW";

export type StorefrontTaxDestination = {
  countryCode: string;
  stateOrProvinceCode: string;
  postalCode: string;
  city?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
};

export type StorefrontTaxQuoteResult = {
  taxEligible: boolean;
  reviewRequired: boolean;
  quoteSource: StorefrontTaxQuoteSource;
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

export type TaxQuoteProviderResult = {
  quoteAvailable: boolean;
  quoteSource: StorefrontTaxQuoteSource;
  taxAmountCents: number;
  taxableSubtotalCents: number;
  taxableShippingCents: number;
  jurisdictionSummary: StorefrontTaxQuoteResult["jurisdictionSummary"];
  taxRateBasisPoints: number | null;
  quoteReference: string | null;
  quoteExpiresAt: string | null;
  warnings: string[];
  reviewRequired: boolean;
  reasonCodes: string[];
  fallbackUsed: boolean;
  rawProviderSummary: Record<string, unknown> | null;
};
