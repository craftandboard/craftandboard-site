"use client";

import Link from "next/link";
import { formatCurrency } from "../../lib/mvp";
import type { CraftBoardStorefrontQuoteResult } from "../../lib/api";
import {
  packagingProfileLabels,
  shippingModeLabels
} from "../../lib/storefront/shipping/labels";
import { taxQuoteSourceLabels } from "../../lib/storefront/tax/labels";
import { ShippingQuoteBadge } from "./ShippingQuoteBadge";
import { TaxQuoteBadge } from "./TaxQuoteBadge";

export function ProductCheckoutSummary({
  productTitle,
  configurationLines,
  editHref,
  quote
}: {
  productTitle: string;
  configurationLines: string[];
  editHref: string;
  quote: CraftBoardStorefrontQuoteResult | null;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">1. Product Summary</p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
          {productTitle}
        </h1>
        <div className="mt-5 grid gap-3 text-sm text-[#4f3f33]">
          {configurationLines.map((line) => (
            <div key={line} className="rounded-2xl bg-[#fff3e8] p-4">
              {line}
            </div>
          ))}
        </div>
        <Link href={editHref} className="mt-5 inline-flex text-sm font-medium text-[#6b4a31] underline underline-offset-4">
          Edit configuration
        </Link>
      </article>

      <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">2. Price + Shipping Summary</p>
        {quote ? (
          <>
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <ShippingQuoteBadge quoteSource={quote.shipping.quoteSource} />
                <TaxQuoteBadge quoteSource={quote.tax.quoteSource} />
              </div>
            </div>
            <p className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
              {formatCurrency(quote.commercialTotals.estimatedOrderTotalCents, quote.pricing.currencyCode)}
            </p>
            <div className="mt-5 space-y-2 text-sm text-[#4f3f33]">
              <p>Product subtotal: {formatCurrency(quote.commercialTotals.productSubtotalCents, quote.pricing.currencyCode)}</p>
              <p>
                {quote.shipping.quoteSource === "LIVE_PROVIDER" ? "Shipping quote" : "Estimated shipping"}:{" "}
                {formatCurrency(quote.commercialTotals.shippingCostCents, quote.pricing.currencyCode)}
              </p>
              <p>
                {taxQuoteSourceLabels[quote.tax.quoteSource]}:{" "}
                {formatCurrency(quote.commercialTotals.taxAmountCents, quote.pricing.currencyCode)}
              </p>
              <p>Deposit due now: {formatCurrency(quote.depositBasis.depositAmountCents, quote.pricing.currencyCode)}</p>
              <p>Estimated remaining balance: {formatCurrency(quote.depositBasis.remainingBalanceAmountCents, quote.pricing.currencyCode)}</p>
              <p>Lead time: {quote.pricing.leadTimeText}</p>
              <p>Shipping mode: {shippingModeLabels[quote.shipping.shippingMode]}</p>
              <p>Packaging profile: {packagingProfileLabels[quote.shipping.packagingProfile]}</p>
              {quote.shipping.carrierName ? <p>Carrier: {quote.shipping.carrierName}</p> : null}
              {quote.shipping.serviceLevel ? <p>Service level: {quote.shipping.serviceLevel}</p> : null}
              {quote.shipping.estimatedTransitDays ? (
                <p>Estimated transit: {quote.shipping.estimatedTransitDays} business days</p>
              ) : null}
              {quote.shipping.quoteExpiresAt ? (
                <p>Quote valid until: {new Date(quote.shipping.quoteExpiresAt).toLocaleString()}</p>
              ) : null}
              {quote.shipping.fallbackUsed ? (
                <p>Craft & Board used a controlled estimate fallback because a live carrier quote was unavailable.</p>
              ) : null}
              {quote.tax.fallbackUsed ? (
                <p>Craft & Board used a controlled estimate fallback because a live tax quote was unavailable.</p>
              ) : null}
              {quote.tax.quoteExpiresAt ? (
                <p>Tax quote valid until: {new Date(quote.tax.quoteExpiresAt).toLocaleString()}</p>
              ) : null}
              <p>{quote.tax.customerFacingMessage}</p>
              <p>{quote.shipping.customerFacingMessage}</p>
            </div>
            {quote.shipping.shippingWarnings.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
                {quote.shipping.shippingWarnings.map((warning) => (
                  <p key={warning} className="mt-1 first:mt-0">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
            {quote.tax.taxWarnings.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
                {quote.tax.taxWarnings.map((warning) => (
                  <p key={warning} className="mt-1 first:mt-0">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#ccb6a0] bg-[#fff8f0] p-4 text-sm text-[#5c4a3d]">
            Enter state and postal code to calculate estimated shipping and deposit basis.
          </div>
        )}
      </article>
    </section>
  );
}
