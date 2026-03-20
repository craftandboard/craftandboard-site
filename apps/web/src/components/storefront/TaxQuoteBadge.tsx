"use client";

import { taxQuoteSourceLabels } from "../../lib/storefront/tax/labels";
import type { StorefrontTaxQuoteSource } from "../../lib/storefront/tax/types";

const toneClasses: Record<StorefrontTaxQuoteSource, string> = {
  LIVE_PROVIDER: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ESTIMATE_RULES: "border-amber-200 bg-amber-50 text-amber-900",
  NOT_APPLICABLE: "border-slate-200 bg-slate-50 text-slate-700",
  MANUAL_REVIEW: "border-rose-200 bg-rose-50 text-rose-800"
};

export function TaxQuoteBadge({
  quoteSource
}: {
  quoteSource: StorefrontTaxQuoteSource;
}) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[quoteSource]}`}>
      {taxQuoteSourceLabels[quoteSource]}
    </span>
  );
}
