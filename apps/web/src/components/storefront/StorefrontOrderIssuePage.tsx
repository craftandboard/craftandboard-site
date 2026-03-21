"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import {
  createCraftBoardStorefrontOrderIssue,
  getCraftBoardStorefrontOrderStatus
} from "../../lib/api";

type StatusPayload = Awaited<ReturnType<typeof getCraftBoardStorefrontOrderStatus>>["status"];

const issueTypeOptions = [
  { value: "SHIPPING_DAMAGE", label: "Shipping Damage" },
  { value: "MISSING_PARTS_OR_HARDWARE", label: "Missing Parts or Hardware" },
  { value: "WRONG_ITEM_RECEIVED", label: "Wrong Item Received" },
  { value: "FINISH_OR_QUALITY_ISSUE", label: "Finish or Quality Issue" },
  { value: "DELIVERY_PROBLEM", label: "Delivery Problem" },
  { value: "RETURN_REQUEST", label: "Return Request" },
  { value: "GENERAL_ORDER_ISSUE", label: "General Order Issue" }
] as const;

export function StorefrontOrderIssuePage({ publicToken }: { publicToken: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<(typeof issueTypeOptions)[number]["value"]>("SHIPPING_DAMAGE");
  const [reportedByName, setReportedByName] = useState("");
  const [reportedByEmail, setReportedByEmail] = useState("");
  const [reportedByPhone, setReportedByPhone] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [detailText, setDetailText] = useState("");
  const [expectedItemDetails, setExpectedItemDetails] = useState("");
  const [receivedItemDetails, setReceivedItemDetails] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [packageConditionDescription, setPackageConditionDescription] = useState("");

  useEffect(() => {
    let active = true;
    void getCraftBoardStorefrontOrderStatus(publicToken)
      .then((payload) => {
        if (!active) return;
        setStatus(payload.status);
      })
      .catch(() => {
        if (!active) return;
        setError("Order issue reporting is unavailable.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [publicToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = await createCraftBoardStorefrontOrderIssue(publicToken, {
        issueType,
        reportedByName,
        reportedByEmail,
        reportedByPhone: reportedByPhone || null,
        customerMessage,
        issueDetails: {
          damageDescription: issueType === "SHIPPING_DAMAGE" ? damageDescription || detailText || null : null,
          packageConditionDescription: issueType === "SHIPPING_DAMAGE" ? packageConditionDescription || null : null,
          missingItems: issueType === "MISSING_PARTS_OR_HARDWARE" ? detailText || null : null,
          expectedItemDetails: issueType === "WRONG_ITEM_RECEIVED" ? expectedItemDetails || null : null,
          receivedItemDetails: issueType === "WRONG_ITEM_RECEIVED" ? receivedItemDetails || null : null,
          qualityIssueDescription: issueType === "FINISH_OR_QUALITY_ISSUE" ? detailText || null : null,
          deliveryProblemDescription: issueType === "DELIVERY_PROBLEM" ? detailText || null : null,
          returnReason: issueType === "RETURN_REQUEST" ? detailText || null : null,
          generalNotes: issueType === "GENERAL_ORDER_ISSUE" ? detailText || null : null,
          customerAttachmentSummary: {
            attachmentCount: 0,
            note: "Attachment upload is not yet available in this customer flow."
          }
        }
      });
      setSuccessMessage(payload.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit the issue report.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#5c4a3d]">Loading issue report form...</div>;
  }

  if (error && !status) {
    return <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">{error}</div>;
  }

  if (!status) {
    return <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">Order issue reporting is unavailable.</div>;
  }

  if (!status.issueReportEligible) {
    return (
      <div className="space-y-4 rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8 text-sm text-[#5c4a3d]">
        <p>{status.issueReportMessage}</p>
        <p>
          <Link href={`/order/status/${encodeURIComponent(publicToken)}`} className="text-[#6f5037] underline">
            Return to order status
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Report an Issue</p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl text-[#281a13]">
          Reviewed Support Intake
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">
          Share what arrived, what went wrong, and any relevant context. Craft & Board will review the issue before confirming a resolution.
        </p>
      </section>

      {successMessage ? (
        <section className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6 text-sm text-[#4f3f33]">
          <p>{successMessage}</p>
          <p className="mt-3">
            <Link href={`/order/status/${encodeURIComponent(publicToken)}`} className="text-[#6f5037] underline">
              Return to order status
            </Link>
          </p>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
        <label className="block">
          <span className="text-sm font-medium text-[#281a13]">Issue type</span>
          <select
            value={issueType}
            onChange={(event) => setIssueType(event.target.value as typeof issueType)}
            className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]"
          >
            {issueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Name</span>
            <input value={reportedByName} onChange={(event) => setReportedByName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Email</span>
            <input value={reportedByEmail} onChange={(event) => setReportedByEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-[#281a13]">Phone</span>
          <input value={reportedByPhone} onChange={(event) => setReportedByPhone(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#281a13]">Describe what happened</span>
          <textarea value={customerMessage} onChange={(event) => setCustomerMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
        </label>

        {issueType === "SHIPPING_DAMAGE" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">Damage description</span>
              <textarea value={damageDescription} onChange={(event) => setDamageDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">Package condition</span>
              <textarea value={packageConditionDescription} onChange={(event) => setPackageConditionDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
          </div>
        ) : issueType === "WRONG_ITEM_RECEIVED" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">What you expected</span>
              <textarea value={expectedItemDetails} onChange={(event) => setExpectedItemDetails(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">What you received</span>
              <textarea value={receivedItemDetails} onChange={(event) => setReceivedItemDetails(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Issue details</span>
            <textarea value={detailText} onChange={(event) => setDetailText(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
          </label>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-[#fff4f2] p-4 text-sm text-[#8a4b45]">{error}</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex rounded-full bg-[#6f5037] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#5b402b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Submit Issue Report"}
          </button>
          <Link href={`/order/status/${encodeURIComponent(publicToken)}`} className="text-sm text-[#6f5037] underline">
            Back to order status
          </Link>
        </div>
      </form>
    </div>
  );
}
