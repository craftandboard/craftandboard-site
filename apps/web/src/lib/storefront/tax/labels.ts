import type { StorefrontTaxQuoteSource } from "./types";

export const taxQuoteSourceLabels: Record<StorefrontTaxQuoteSource, string> = {
  LIVE_PROVIDER: "Live Tax Quote",
  ESTIMATE_RULES: "Estimated Tax",
  NOT_APPLICABLE: "Tax Not Applicable",
  MANUAL_REVIEW: "Tax Review Required"
};
