"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import {
  createCraftBoardStorefrontChangeRequest,
  getCraftBoardStorefrontOrderStatus
} from "../../lib/api";

type StatusPayload = Awaited<ReturnType<typeof getCraftBoardStorefrontOrderStatus>>["status"];

const requestTypeOptions = [
  { value: "UPDATE_DIMENSIONS", label: "Update Dimensions" },
  { value: "UPDATE_MATERIAL_OR_FINISH", label: "Update Material or Finish" },
  { value: "UPDATE_MOUNTING", label: "Update Mounting" },
  { value: "UPDATE_SHIPPING_ADDRESS", label: "Update Shipping Address" },
  { value: "HOLD_ORDER", label: "Hold Order" },
  { value: "CANCEL_REQUEST", label: "Cancel Request" },
  { value: "GENERAL_CHANGE_REQUEST", label: "General Change Request" }
] as const;

export function StorefrontChangeRequestPage({ publicToken }: { publicToken: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<(typeof requestTypeOptions)[number]["value"]>("GENERAL_CHANGE_REQUEST");
  const [requestedByName, setRequestedByName] = useState("");
  const [requestedByEmail, setRequestedByEmail] = useState("");
  const [requestedByPhone, setRequestedByPhone] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [detailText, setDetailText] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    let active = true;
    void getCraftBoardStorefrontOrderStatus(publicToken)
      .then((payload) => {
        if (!active) return;
        setStatus(payload.status);
      })
      .catch(() => {
        if (!active) return;
        setError("Order change request is unavailable.");
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
      const payload = await createCraftBoardStorefrontChangeRequest(publicToken, {
        requestType,
        requestedByName,
        requestedByEmail,
        requestedByPhone: requestedByPhone || null,
        customerMessage,
        requestedChanges: {
          proposedDimensions:
            requestType === "UPDATE_DIMENSIONS"
              ? { unit: "IN", width: null, depth: null, thickness: null, length: null, height: null }
              : null,
          requestedMaterialOrFinish:
            requestType === "UPDATE_MATERIAL_OR_FINISH" ? detailText || null : null,
          requestedMounting: requestType === "UPDATE_MOUNTING" ? detailText || null : null,
          requestedShippingAddress:
            requestType === "UPDATE_SHIPPING_ADDRESS"
              ? {
                  fullName: requestedByName,
                  address1,
                  city,
                  state: stateValue,
                  postalCode,
                  country
                }
              : null,
          holdReason: requestType === "HOLD_ORDER" ? detailText || null : null,
          cancelReason: requestType === "CANCEL_REQUEST" ? detailText || null : null,
          generalNotes: requestType === "GENERAL_CHANGE_REQUEST" ? detailText || null : null
        }
      });
      setSuccessMessage(payload.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit the change request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#5c4a3d]">Loading change request form...</div>;
  }

  if (error && !status) {
    return <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">{error}</div>;
  }

  if (!status) {
    return <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">Order change request is unavailable.</div>;
  }

  if (!status.changeRequestEligible) {
    return (
      <div className="space-y-4 rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8 text-sm text-[#5c4a3d]">
        <p>{status.changeRequestMessage}</p>
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
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Request a Change</p>
        <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl text-[#281a13]">
          Review Required
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">
          Submit the change you need and Craft & Board will review it before anything about the order is updated.
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
          <span className="text-sm font-medium text-[#281a13]">Request type</span>
          <select
            value={requestType}
            onChange={(event) => setRequestType(event.target.value as typeof requestType)}
            className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]"
          >
            {requestTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Name</span>
            <input value={requestedByName} onChange={(event) => setRequestedByName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Email</span>
            <input value={requestedByEmail} onChange={(event) => setRequestedByEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-[#281a13]">Phone</span>
          <input value={requestedByPhone} onChange={(event) => setRequestedByPhone(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-[#281a13]">Describe the change you need</span>
          <textarea value={customerMessage} onChange={(event) => setCustomerMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
        </label>

        {requestType === "UPDATE_SHIPPING_ADDRESS" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-[#281a13]">Requested shipping address</span>
              <input value={address1} onChange={(event) => setAddress1(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">State</span>
              <input value={stateValue} onChange={(event) => setStateValue(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">Postal code</span>
              <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#281a13]">Country</span>
              <input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-[#281a13]">Requested update details</span>
            <textarea value={detailText} onChange={(event) => setDetailText(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#dbcab9] bg-white px-4 py-3 text-sm text-[#281a13]" />
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
            {submitting ? "Submitting..." : "Submit Change Request"}
          </button>
          <Link href={`/order/status/${encodeURIComponent(publicToken)}`} className="text-sm text-[#6f5037] underline">
            Back to order status
          </Link>
        </div>
      </form>
    </div>
  );
}
