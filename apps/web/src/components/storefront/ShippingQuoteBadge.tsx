"use client";

import { shippingQuoteSourceLabels } from "../../lib/storefront/shipping/labels";
import type { StorefrontShippingQuoteSource } from "../../lib/storefront/shipping/types";

const toneClasses: Record<StorefrontShippingQuoteSource, string> = {
  LIVE_PROVIDER: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ESTIMATE_RULES: "border-amber-200 bg-amber-50 text-amber-900",
  MANUAL_REVIEW: "border-rose-200 bg-rose-50 text-rose-800"
};

export function ShippingQuoteBadge({
  quoteSource
}: {
  quoteSource: StorefrontShippingQuoteSource;
}) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[quoteSource]}`}>
      {shippingQuoteSourceLabels[quoteSource]}
    </span>
  );
}
