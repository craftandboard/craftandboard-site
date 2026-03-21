"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "../../lib/mvp";
import { getCraftBoardStorefrontOrderStatus } from "../../lib/api";

type StatusPayload = Awaited<ReturnType<typeof getCraftBoardStorefrontOrderStatus>>["status"];

export function StorefrontOrderStatusPage({ publicToken }: { publicToken: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getCraftBoardStorefrontOrderStatus(publicToken)
      .then((payload) => {
        if (!active) return;
        setStatus(payload.status);
      })
      .catch(() => {
        if (!active) return;
        setError("Order status is unavailable.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [publicToken]);

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#5c4a3d]">
        Loading your order status...
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">
        {error ?? "Order status is unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Order Status</p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl text-[#281a13]">
          {status.currentStatusLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">
          {status.currentStatusDescription}
        </p>
        {status.lastUpdatedAt ? (
          <p className="mt-4 text-sm text-[#8d6b4f]">
            Last updated {new Date(status.lastUpdatedAt).toLocaleString()}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Order Summary</p>
          <p className="mt-3">Order reference: {status.orderReference}</p>
          <p className="mt-2">Order placed: {new Date(status.orderPlacedAt).toLocaleDateString()}</p>
          {status.paidAt ? (
            <p className="mt-2">Payment received: {new Date(status.paidAt).toLocaleDateString()}</p>
          ) : null}
          {status.amountPaidCents !== null ? (
            <p className="mt-2">Amount paid now: {formatCurrency(status.amountPaidCents, "USD")}</p>
          ) : null}
          <p className="mt-2">Order total basis: {formatCurrency(status.totalAmountCents, "USD")}</p>
        </article>

        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Product Summary</p>
          <p className="mt-3">{status.productSummary.productDisplayName}</p>
          {status.productSummary.summaryLines.map((line) => (
            <p className="mt-2" key={line}>
              {line}
            </p>
          ))}
          <p className="mt-2">Quantity: {status.productSummary.quantity}</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Status Timeline</p>
        <div className="mt-6 space-y-4">
          {status.timeline.map((item) => (
            <div
              key={item.statusCode}
              className={`rounded-[1.5rem] border p-4 ${
                item.isCurrent
                  ? "border-[#8d6b4f] bg-[#f6eadc]"
                  : item.isComplete
                    ? "border-[#dbcab9] bg-[#f9f0e7]"
                    : "border-[#e7ddd1] bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-[#281a13]">{item.statusLabel}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
                  {item.isCurrent ? "Current" : item.isComplete ? "Complete" : "Upcoming"}
                </p>
              </div>
              <p className="mt-2 text-sm text-[#5c4a3d]">{item.description}</p>
              {item.occurredAt ? (
                <p className="mt-2 text-xs text-[#8d6b4f]">
                  {new Date(item.occurredAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Shipping Summary</p>
          {status.shippingSummary.shippingMode ? (
            <p className="mt-3">Shipping mode: {status.shippingSummary.shippingMode.replaceAll("_", " ")}</p>
          ) : null}
          {status.shippingSummary.carrierName ? (
            <p className="mt-2">Carrier: {status.shippingSummary.carrierName}</p>
          ) : null}
          {status.shippingSummary.serviceLevel ? (
            <p className="mt-2">Service: {status.shippingSummary.serviceLevel}</p>
          ) : null}
          {status.shippingSummary.shippingCostCents !== null ? (
            <p className="mt-2">
              Shipping basis: {formatCurrency(status.shippingSummary.shippingCostCents, "USD")}
            </p>
          ) : null}
          {status.shippingSummary.estimatedTransitDays ? (
            <p className="mt-2">
              Estimated transit: {status.shippingSummary.estimatedTransitDays} business days
            </p>
          ) : null}
          {status.shippingSummary.trackingNumber ? (
            <p className="mt-2">Tracking number: {status.shippingSummary.trackingNumber}</p>
          ) : null}
          {status.shippingSummary.trackingUrl ? (
            <p className="mt-2">
              <a
                href={status.shippingSummary.trackingUrl}
                className="text-[#6f5037] underline"
                target="_blank"
                rel="noreferrer"
              >
                View tracking
              </a>
            </p>
          ) : null}
          {status.shippingSummary.customerMessage ? (
            <p className="mt-3 text-[#5c4a3d]">{status.shippingSummary.customerMessage}</p>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">What Happens Next</p>
          <p className="mt-3">{status.supportMessage ?? status.currentStatusDescription}</p>
          <p className="mt-3 text-[#5c4a3d]">
            Questions about this order can be sent by replying to your confirmation email.
          </p>
          <p className="mt-4">
            <Link href="/shop" className="text-[#6f5037] underline">
              Return to the storefront
            </Link>
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Request a Change</p>
          <p className="mt-3">{status.changeRequestMessage}</p>
          {status.changeRequestEligible ? (
            <p className="mt-4">
              <Link
                href={`/order/status/${encodeURIComponent(publicToken)}/request-change`}
                className="inline-flex rounded-full border border-[#8d6b4f] px-4 py-2 text-sm font-medium text-[#6f5037] transition hover:bg-[#f6eadc]"
              >
                Request a Change
              </Link>
            </p>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Recent Change Requests</p>
          {status.changeRequests.length === 0 ? (
            <p className="mt-3">No change requests have been submitted for this order.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {status.changeRequests.map((request) => (
                <div key={request.id} className="rounded-[1.25rem] border border-[#dbcab9] bg-[#fffaf4] p-4">
                  <p className="font-medium text-[#281a13]">{request.requestTypeLabel}</p>
                  <p className="mt-1 text-[#5c4a3d]">{request.customerSafeStatusLabel}</p>
                  <p className="mt-2 text-[#5c4a3d]">{request.customerSafeSummary}</p>
                  <p className="mt-2 text-xs text-[#8d6b4f]">
                    Updated {new Date(request.lastUpdatedAt).toLocaleString()}
                  </p>
                  {request.resolutionCustomerMessage ? (
                    <p className="mt-2 text-[#5c4a3d]">{request.resolutionCustomerMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Report an Issue</p>
          <p className="mt-3">{status.issueReportMessage}</p>
          {status.issueReportEligible ? (
            <p className="mt-4">
              <Link
                href={`/order/status/${encodeURIComponent(publicToken)}/report-issue`}
                className="inline-flex rounded-full border border-[#8d6b4f] px-4 py-2 text-sm font-medium text-[#6f5037] transition hover:bg-[#f6eadc]"
              >
                Report an Issue
              </Link>
            </p>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d6b4f]">Recent Issues</p>
          {status.issues.length === 0 ? (
            <p className="mt-3">No issue reports have been submitted for this order.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {status.issues.map((issue) => (
                <div key={issue.id} className="rounded-[1.25rem] border border-[#dbcab9] bg-[#fffaf4] p-4">
                  <p className="font-medium text-[#281a13]">{issue.issueTypeLabel}</p>
                  <p className="mt-1 text-[#5c4a3d]">{issue.customerSafeStatusLabel}</p>
                  <p className="mt-2 text-[#5c4a3d]">{issue.customerSafeSummary}</p>
                  <p className="mt-2 text-xs text-[#8d6b4f]">
                    Updated {new Date(issue.lastUpdatedAt).toLocaleString()}
                  </p>
                  {issue.resolutionCustomerMessage ? (
                    <p className="mt-2 text-[#5c4a3d]">{issue.resolutionCustomerMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
