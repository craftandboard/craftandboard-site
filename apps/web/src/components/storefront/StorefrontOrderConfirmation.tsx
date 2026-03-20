"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cancelCraftBoardStorefrontPayment,
  getCraftBoardStorefrontOrderConfirmation,
  type CraftBoardStorefrontOrderAttemptSummary
} from "../../lib/api";
import { formatCurrency, humanizeToken } from "../../lib/mvp";
import {
  packagingProfileLabels,
  shippingModeLabels,
  shippingQuoteSourceLabels
} from "../../lib/storefront/shipping/labels";
import { taxQuoteSourceLabels } from "../../lib/storefront/tax/labels";

type ConfirmationState = {
  requestId: string;
  confirmationCode: string | null;
  customerStatusToken: string | null;
  paymentMode: "DEPOSIT_REQUEST" | "FULL_PAYMENT_LATER" | "PAY_NOW_PLACEHOLDER";
  paymentStatus:
    | "NOT_STARTED"
    | "SESSION_CREATED"
    | "PAYMENT_IN_PROGRESS"
    | "PAID"
    | "PAYMENT_FAILED"
    | "CANCELLED"
    | "EXPIRED";
  shippingMode:
    | "PARCEL"
    | "OVERSIZE_PARCEL"
    | "LTL_FREIGHT"
    | "LOCAL_DELIVERY"
    | "PICKUP"
    | "REVIEW_REQUIRED"
    | null;
  packagingProfile:
    | "long_shelf_box"
    | "mantel_box"
    | "long_oversize_box"
    | "mantel_crate"
    | "freight_pallet"
    | null;
  shippingCostCents: number | null;
  shippingReviewRequired: boolean;
  estimatedTransitDays: number | null;
  destinationZone: string | null;
  shippingQuoteSource: "LIVE_PROVIDER" | "ESTIMATE_RULES" | "MANUAL_REVIEW" | null;
  shippingCarrierName: string | null;
  shippingServiceLevel: string | null;
  shippingQuoteReference: string | null;
  shippingQuoteExpiresAt: string | null;
  shippingQuoteGeneratedAt: string | null;
  shippingFallbackUsed: boolean;
  taxAmountCents: number | null;
  taxReviewRequired: boolean;
  taxQuoteSource: "LIVE_PROVIDER" | "ESTIMATE_RULES" | "NOT_APPLICABLE" | "MANUAL_REVIEW" | null;
  taxRateBasisPoints: number | null;
  taxQuoteGeneratedAt: string | null;
  taxQuoteExpiresAt: string | null;
  taxFallbackUsed: boolean;
  depositAmountCents: number | null;
  remainingBalanceAmountCents: number | null;
  paidAt: string | null;
  submissionReference: string | null;
  fieldMetriqSubmissionStatus:
    | "NOT_ATTEMPTED"
    | "SUBMITTING"
    | "RETRY_PENDING"
    | "DISABLED"
    | "SUCCEEDED"
    | "FAILED"
    | "SKIPPED"
    | "REVIEW_REQUIRED";
  fieldMetriqSubmissionError: string | null;
  fieldMetriqSubmissionRetryCount: number;
  fieldMetriqFulfillmentClass:
    | "STANDARD_PARCEL_BUILD"
    | "OVERSIZE_PARCEL_BUILD"
    | "FREIGHT_BUILD"
    | "MANUAL_REVIEW_BUILD"
    | null;
  fieldMetriqProductionProfile:
    | "FLOATING_SHELF_STANDARD"
    | "FLOATING_MANTEL_STANDARD"
    | null;
  orderConfirmationEmailSentAt: string | null;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function productSummary(configuration: Record<string, unknown>) {
  const primaryDimension =
    typeof configuration.width === "number"
      ? `${configuration.width}w`
      : typeof configuration.length === "number"
        ? `${configuration.length}l`
        : null;
  const depth = configuration.depth;
  const thickness =
    typeof configuration.thickness === "number"
      ? `${configuration.thickness}t`
      : typeof configuration.height === "number"
        ? `${configuration.height}h`
        : null;
  const material = configuration.materialLabel;
  const quantity = configuration.quantity;

  return [
    primaryDimension,
    typeof depth === "number" ? `${depth}d` : null,
    thickness,
    typeof material === "string" ? material : null,
    typeof quantity === "number" ? `qty ${quantity}` : null
  ]
    .filter(Boolean)
    .join(" / ");
}

function productTitle(configuration: Record<string, unknown>) {
  if (configuration.productSlug === "classic-floating-mantel") {
    return "Classic Floating Mantel";
  }
  return "Classic Floating Shelf";
}

function productCollectionHref(configuration: Record<string, unknown>) {
  if (configuration.productSlug === "classic-floating-mantel") {
    return "/shop/floating-mantels";
  }
  return "/shop/floating-shelves";
}

export function StorefrontOrderConfirmation({
  searchParams,
  variant = "standard"
}: {
  searchParams?: Record<string, string | string[] | undefined>;
  variant?: "standard" | "payment-success" | "payment-cancelled";
}) {
  const attemptId = readSearchParam(searchParams, "attemptId");
  const simulated = readSearchParam(searchParams, "simulated") === "1";
  const [attempt, setAttempt] = useState<CraftBoardStorefrontOrderAttemptSummary | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [loading, setLoading] = useState(Boolean(attemptId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      setError("Order attempt reference is missing.");
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void getCraftBoardStorefrontOrderConfirmation(attemptId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setAttempt(payload.orderAttempt);
        setConfirmation(payload.confirmation);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Failed to load confirmation.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  useEffect(() => {
    if (variant !== "payment-cancelled" || !attemptId || !attempt) {
      return;
    }
    if (attempt.paymentStatus === "CANCELLED") {
      return;
    }

    let active = true;

    void cancelCraftBoardStorefrontPayment(attemptId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setAttempt(payload.orderAttempt);
      })
      .catch(() => {
        // Keep the page readable even if the cancellation sync fails.
      });

    return () => {
      active = false;
    };
  }, [attempt, attemptId, variant]);

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#5c4a3d]">
        Loading your order confirmation...
      </div>
    );
  }

  if (error || !attempt || !confirmation) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">
        {error ?? "Order confirmation is unavailable right now."}
      </div>
    );
  }

  const pricing = attempt.pricing as {
    currencyCode?: "USD";
    quantityTotalCents?: number;
    leadTimeText?: string;
  };
  const estimatedOrderTotalCents =
    (pricing.quantityTotalCents ?? 0) +
    (confirmation.shippingCostCents ?? 0) +
    (confirmation.taxAmountCents ?? 0);
  const customer = attempt.customer as { fullName?: string };
  const headline =
    variant === "payment-success"
      ? `${customer.fullName ?? "Customer"}, your deposit payment was received.`
      : variant === "payment-cancelled"
        ? `${customer.fullName ?? "Customer"}, your payment was not completed yet.`
        : `${customer.fullName ?? "Customer"}, your order was received.`;
  const body =
    variant === "payment-success"
      ? "Craft & Board verified the deposit payment and moved the paid custom order into the next handoff step. Final balance timing and scheduling follow separately."
      : variant === "payment-cancelled"
        ? "Your order details are still saved, but the deposit payment was not completed. You can return to the product page and start the payment step again when you are ready."
        : "Craft & Board captured the order details and the next step now depends on the payment mode attached to this standard order.";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">
          {variant === "payment-success"
            ? "Payment Confirmation"
            : variant === "payment-cancelled"
              ? "Payment Cancelled"
              : "Order Confirmation"}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl text-[#281a13]">
          {headline}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">{body}</p>
        {simulated ? (
          <p className="mt-4 text-sm text-[#8d6b4f]">
            This confirmation used the controlled non-production payment path.
          </p>
        ) : null}
        {confirmation.orderConfirmationEmailSentAt ? (
          <p className="mt-4 text-sm text-[#8d6b4f]">
            Craft & Board emailed your order details and status link to the address on file.
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Reference</p>
          <p className="mt-3">Request ID: {confirmation.requestId}</p>
          <p className="mt-2">Confirmation code: {confirmation.confirmationCode ?? "Pending"}</p>
          <p className="mt-2">Payment mode: {humanizeToken(confirmation.paymentMode)}</p>
          <p className="mt-2">Payment status: {humanizeToken(confirmation.paymentStatus)}</p>
          <p className="mt-2">
            Downstream intake: {humanizeToken(confirmation.fieldMetriqSubmissionStatus)}
          </p>
          {confirmation.submissionReference ? (
            <p className="mt-2">FieldMetriq reference: {confirmation.submissionReference}</p>
          ) : null}
          {confirmation.fieldMetriqFulfillmentClass ? (
            <p className="mt-2">
              Fulfillment class: {humanizeToken(confirmation.fieldMetriqFulfillmentClass)}
            </p>
          ) : null}
          {confirmation.fieldMetriqProductionProfile ? (
            <p className="mt-2">
              Production profile: {humanizeToken(confirmation.fieldMetriqProductionProfile)}
            </p>
          ) : null}
          {confirmation.fieldMetriqSubmissionRetryCount > 0 ? (
            <p className="mt-2">
              Submission attempts: {confirmation.fieldMetriqSubmissionRetryCount}
            </p>
          ) : null}
          {confirmation.fieldMetriqSubmissionStatus === "RETRY_PENDING" ? (
            <p className="mt-2">
              Payment was received. Craft & Board is retrying the downstream order intake sync.
            </p>
          ) : null}
          {confirmation.customerStatusToken ? (
            <p className="mt-4">
              <Link
                href={`/order/status/${encodeURIComponent(confirmation.customerStatusToken)}`}
                className="inline-flex rounded-full border border-[#8d6b4f] px-4 py-2 text-sm font-medium text-[#6f5037] transition hover:bg-[#f6eadc]"
              >
                View Order Status
              </Link>
            </p>
          ) : null}
        </article>
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Order Summary</p>
          <p className="mt-3">{productTitle(attempt.configuration)}</p>
          <p className="mt-2">{productSummary(attempt.configuration)}</p>
          <p className="mt-2">
            Estimated order total: {formatCurrency(estimatedOrderTotalCents, pricing.currencyCode ?? "USD")}
          </p>
          {confirmation.shippingCostCents !== null ? (
            <p className="mt-2">
              {confirmation.shippingQuoteSource === "LIVE_PROVIDER" ? "Shipping quote" : "Estimated shipping"}:{" "}
              {formatCurrency(confirmation.shippingCostCents, pricing.currencyCode ?? "USD")}
            </p>
          ) : null}
          {confirmation.taxAmountCents !== null ? (
            <p className="mt-2">
              {confirmation.taxQuoteSource ? taxQuoteSourceLabels[confirmation.taxQuoteSource] : "Estimated tax"}:{" "}
              {formatCurrency(confirmation.taxAmountCents, pricing.currencyCode ?? "USD")}
            </p>
          ) : null}
          {confirmation.shippingQuoteSource ? (
            <p className="mt-2">Quote basis: {shippingQuoteSourceLabels[confirmation.shippingQuoteSource]}</p>
          ) : null}
          {confirmation.taxQuoteSource ? (
            <p className="mt-2">Tax basis: {taxQuoteSourceLabels[confirmation.taxQuoteSource]}</p>
          ) : null}
          {confirmation.shippingMode ? (
            <p className="mt-2">Shipping mode: {shippingModeLabels[confirmation.shippingMode]}</p>
          ) : null}
          {confirmation.packagingProfile ? (
            <p className="mt-2">Packaging profile: {packagingProfileLabels[confirmation.packagingProfile]}</p>
          ) : null}
          {confirmation.shippingCarrierName ? (
            <p className="mt-2">Carrier: {confirmation.shippingCarrierName}</p>
          ) : null}
          {confirmation.shippingServiceLevel ? (
            <p className="mt-2">Service level: {confirmation.shippingServiceLevel}</p>
          ) : null}
          {confirmation.shippingQuoteReference ? (
            <p className="mt-2">Quote reference: {confirmation.shippingQuoteReference}</p>
          ) : null}
          <p className="mt-2">Lead time: {pricing.leadTimeText ?? "To be confirmed"}</p>
          {confirmation.depositAmountCents ? (
            <p className="mt-2">
              Deposit paid now: {formatCurrency(confirmation.depositAmountCents, pricing.currencyCode ?? "USD")}
            </p>
          ) : null}
          {confirmation.remainingBalanceAmountCents !== null ? (
            <p className="mt-2">
              Estimated remaining balance:{" "}
              {formatCurrency(confirmation.remainingBalanceAmountCents, pricing.currencyCode ?? "USD")}
            </p>
          ) : null}
          {confirmation.estimatedTransitDays ? (
            <p className="mt-2">Estimated transit: {confirmation.estimatedTransitDays} business days</p>
          ) : null}
          {confirmation.shippingQuoteGeneratedAt ? (
            <p className="mt-2">Quote generated: {new Date(confirmation.shippingQuoteGeneratedAt).toLocaleString()}</p>
          ) : null}
          {confirmation.taxQuoteGeneratedAt ? (
            <p className="mt-2">Tax quote generated: {new Date(confirmation.taxQuoteGeneratedAt).toLocaleString()}</p>
          ) : null}
          {confirmation.shippingFallbackUsed ? (
            <p className="mt-2">Craft & Board used the estimate fallback because a live carrier quote was unavailable.</p>
          ) : null}
          {confirmation.taxFallbackUsed ? (
            <p className="mt-2">Craft & Board used the estimate fallback because a live tax quote was unavailable.</p>
          ) : null}
          {confirmation.fieldMetriqSubmissionError &&
          confirmation.fieldMetriqSubmissionStatus === "RETRY_PENDING" ? (
            <p className="mt-2">
              Downstream intake is retrying while the team finishes order processing.
            </p>
          ) : null}
        </article>
      </section>

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm leading-7 text-[#5c4a3d]">
        <p>
          {variant === "payment-success"
            ? "Next, Craft & Board reviews the paid order handoff, confirms any final project details, and prepares the order for downstream operations."
            : variant === "payment-cancelled"
              ? "No payment was collected. Returning to the product page will let you review the configuration again and restart the deposit step when ready."
              : "Deposit-mode orders move into payment before the downstream order handoff is considered complete. Review-before-charge orders stay in structured intake until the team confirms the next payment step."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={productCollectionHref(attempt.configuration)} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
            Back to Collection
          </Link>
          <Link href="/gallery" className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
            View Gallery
          </Link>
        </div>
      </section>
    </div>
  );
}
