"use client";

import type { FloatingShelfPricingResult } from "../../lib/api";
import { formatCurrency, humanizeToken } from "../../lib/mvp";

export function FloatingShelfPriceCard({
  pricing,
  loading
}: {
  pricing: FloatingShelfPricingResult | null;
  loading?: boolean;
}) {
  if (loading && !pricing) {
    return (
      <aside className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#5b4c40]">
        Calculating product price...
      </aside>
    );
  }

  if (!pricing) {
    return null;
  }

  const highlightTone =
    pricing.priceState === "instant"
      ? "border-emerald-200 bg-[#f3f0e8]"
      : pricing.priceState === "estimate"
        ? "border-amber-200 bg-[#fff8f0]"
        : "border-[#dbcab9] bg-[#fff8f0]";

  return (
    <aside className={`rounded-[2rem] border p-6 ${highlightTone}`}>
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Live Pricing</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[#6c5848]">
            {pricing.priceState === "instant"
              ? "Instant product pricing"
              : pricing.priceState === "estimate"
                ? "Estimated project pricing"
                : "Review-first pricing"}
          </p>
          <p className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl text-[#241811]">
            {formatCurrency(pricing.quantityTotalCents, pricing.currencyCode)}
          </p>
          <p className="mt-1 text-sm text-[#6c5848]">
            {formatCurrency(pricing.unitPriceCents, pricing.currencyCode)} each
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Lead Time</p>
          <p className="mt-1">{pricing.leadTimeText}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#5b4c40]">{pricing.customerMessage}</p>

      <div className="mt-5 grid gap-3 text-sm text-[#4f3f33] sm:grid-cols-2">
        {pricing.components.map((component) => (
          <div key={component.code} className="rounded-2xl bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">
              {humanizeToken(component.code)}
            </p>
            <p className="mt-1">{formatCurrency(component.amountCents, pricing.currencyCode)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm text-[#4f3f33]">
        <p>Shipping profile: {humanizeToken(pricing.shippingProfileHint)}</p>
        <p className="mt-1">
          {pricing.instantPriceEligible
            ? "This configuration can continue into the standard order-start path."
            : "This configuration stays on a review-first path before a live order is confirmed."}
        </p>
      </div>

      {pricing.warnings.length ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
          {pricing.warnings.map((warning) => (
            <p key={warning} className="mt-1 first:mt-0">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
