"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import {
  completeCraftBoardStorefrontTestPayment,
  createCraftBoardStorefrontPaymentSession,
  getCraftBoardStorefrontQuote,
  getFloatingShelfPricing,
  submitCraftBoardStorefrontOrder,
  type CraftBoardStorefrontQuoteResult,
  type FloatingShelfPricingResult
} from "../../lib/api";
import { type FloatingShelfConfig } from "../../lib/storefront/floatingShelf";
import {
  buildFloatingShelfInquiryHref,
  buildFloatingShelfPdpHref,
  type FloatingShelfOrderDraft,
  type StorefrontPaymentMode
} from "../../lib/storefront/order";
import { resolveStorefrontSourcePath } from "../../lib/seo/attribution";
import { ProductCheckoutSummary } from "./ProductCheckoutSummary";

type AddressState = {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

function emptyAddress(): AddressState {
  return {
    fullName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US"
  };
}

export function FloatingShelfCheckout({
  initialConfiguration
}: {
  initialConfiguration: FloatingShelfConfig;
}) {
  const router = useRouter();
  const [pricing, setPricing] = useState<FloatingShelfPricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState<AddressState>(emptyAddress);
  const [quote, setQuote] = useState<CraftBoardStorefrontQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<AddressState>(emptyAddress);
  const [notes, setNotes] = useState(initialConfiguration.customNotes ?? "");
  const [paymentMode, setPaymentMode] = useState<StorefrontPaymentMode>("DEPOSIT_REQUEST");
  const [acceptedPricingBasis, setAcceptedPricingBasis] = useState(false);
  const [acceptedLeadTimeBasis, setAcceptedLeadTimeBasis] = useState(false);
  const [acknowledgedMadeToOrder, setAcknowledgedMadeToOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    setPricingLoading(true);
    setPricingError(null);

    void getFloatingShelfPricing({ configuration: initialConfiguration })
      .then((payload) => {
        if (!active) {
          return;
        }
        setPricing(payload?.pricing ?? null);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }
        setPricingError(caught instanceof Error ? caught.message : "Failed to load pricing.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setPricingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialConfiguration]);

  useEffect(() => {
    if (!shippingAddress.state.trim() || !shippingAddress.postalCode.trim() || !shippingAddress.country.trim()) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);

    void getCraftBoardStorefrontQuote({
      configuration: initialConfiguration,
      destination: {
        postalCode: shippingAddress.postalCode.trim(),
        countryCode: shippingAddress.country.trim(),
        stateOrProvinceCode: shippingAddress.state.trim(),
        city: shippingAddress.city.trim() || null
      }
    })
      .then((payload) => {
        if (!active) {
          return;
        }
        setQuote(payload.quote);
        setPricing(payload.quote.pricing as FloatingShelfPricingResult);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }
        setQuoteError(caught instanceof Error ? caught.message : "Failed to load shipping and tax quote.");
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialConfiguration, shippingAddress.city, shippingAddress.country, shippingAddress.postalCode, shippingAddress.state]);

  const inquiryHref = useMemo(
    () => buildFloatingShelfInquiryHref(initialConfiguration, "/order/floating-shelves/classic-floating-shelf"),
    [initialConfiguration]
  );

  const editHref = useMemo(
    () => buildFloatingShelfPdpHref(initialConfiguration),
    [initialConfiguration]
  );

  function updateAddress(
    setter: Dispatch<SetStateAction<AddressState>>,
    key: keyof AddressState,
    value: string
  ) {
    setter((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!pricing) {
      return "Pricing is still loading.";
    }
    if (!pricing.instantPriceEligible) {
      return "This configuration requires review instead of the standard checkout flow.";
    }
    if (!customerName.trim()) {
      return "Customer name is required.";
    }
    if (!customerEmail.trim() || !isValidEmail(customerEmail)) {
      return "A valid customer email is required.";
    }
    if (!shippingAddress.fullName.trim()) {
      return "Shipping name is required.";
    }
    if (!shippingAddress.address1.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim()) {
      return "Shipping address, city, and state are required.";
    }
    if (!shippingAddress.postalCode.trim() || !shippingAddress.country.trim()) {
      return "Shipping postal code and country are required.";
    }
    if (!quote) {
      return "Enter a supported shipping destination to calculate shipping and tax.";
    }
    if (!quote.standardCheckoutEligible || quote.shipping.reviewRequired || quote.tax.reviewRequired) {
      return "This configuration needs logistics or tax review instead of the standard checkout flow.";
    }
    if (!billingSameAsShipping) {
      if (!billingAddress.fullName.trim() || !billingAddress.address1.trim() || !billingAddress.city.trim()) {
        return "Billing details are required when billing differs from shipping.";
      }
      if (!billingAddress.state.trim() || !billingAddress.postalCode.trim() || !billingAddress.country.trim()) {
        return "Billing state, postal code, and country are required.";
      }
    }
    if (!acceptedPricingBasis || !acceptedLeadTimeBasis || !acknowledgedMadeToOrder) {
      return "Please confirm the order acknowledgments before submitting.";
    }
    return null;
  }

  function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!pricing) {
      return;
    }

    setError(null);

    const draft: FloatingShelfOrderDraft = {
      sourceChannel: "CRAFT_BOARD",
      productFamily: initialConfiguration.productFamily,
      productSlug: initialConfiguration.productSlug,
      configuration: initialConfiguration,
      pricingResult: pricing,
      eligibilityResult: {
        instantPriceEligible: pricing.instantPriceEligible,
        reviewRequired: pricing.reviewRequired,
        consultRequired: pricing.consultRequired,
        reasonCodes: pricing.consultRequired
          ? ["CONSULT_REQUIRED"]
          : pricing.instantPriceEligible
            ? []
            : ["REVIEW_REQUIRED"],
        customerFacingMessage: pricing.customerMessage,
        allowedCheckoutMode: pricing.instantPriceEligible ? "STANDARD_CHECKOUT" : "REVIEW_ONLY",
        fallbackMode: pricing.instantPriceEligible ? "NONE" : "REQUEST_REVIEW"
      },
      instantPriceEligible: pricing.instantPriceEligible,
      consultRequired: pricing.consultRequired,
      customer: {
        fullName: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim() || null
      },
      shippingAddress: {
        ...shippingAddress,
        fullName: shippingAddress.fullName.trim(),
        address1: shippingAddress.address1.trim(),
        address2: shippingAddress.address2.trim() || null,
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country.trim()
      },
      billingSameAsShipping,
      billingAddress: billingSameAsShipping
        ? null
        : {
            ...billingAddress,
            fullName: billingAddress.fullName.trim(),
            address1: billingAddress.address1.trim(),
            address2: billingAddress.address2.trim() || null,
            city: billingAddress.city.trim(),
            state: billingAddress.state.trim(),
            postalCode: billingAddress.postalCode.trim(),
            country: billingAddress.country.trim()
          },
      notes: notes.trim() || null,
      paymentMode,
      orderIntent: "PURCHASE_STANDARD",
      customerAcceptedPricingBasis: acceptedPricingBasis,
      customerAcceptedLeadTimeBasis: acceptedLeadTimeBasis,
      customerAcknowledgedMadeToOrder: acknowledgedMadeToOrder
    };

    startTransition(() => {
      void submitCraftBoardStorefrontOrder({
        sourcePath: resolveStorefrontSourcePath("/order/floating-shelves/classic-floating-shelf"),
        draft
      })
        .then((payload) => {
          if (payload.mode === "payment-required") {
            return createCraftBoardStorefrontPaymentSession(payload.attemptId, {
              successPath: `/order/payment/success?attemptId=${encodeURIComponent(payload.attemptId)}`,
              cancelPath: `/order/payment/cancelled?attemptId=${encodeURIComponent(payload.attemptId)}`
            }).then(async (session) => {
              if (session.paymentSession.simulated) {
                await completeCraftBoardStorefrontTestPayment(payload.attemptId);
              }

              window.location.href = session.paymentSession.simulated
                ? `/order/payment/success?attemptId=${encodeURIComponent(payload.attemptId)}&simulated=1`
                : session.paymentSession.redirectUrl;
            });
          }

          if (payload.mode === "review-required") {
            router.push(inquiryHref);
            return;
          }

          router.push(`/order/confirmation?attemptId=${encodeURIComponent(payload.attemptId)}`);
        })
        .catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Failed to submit order.");
        });
    });
  }

  if (pricingLoading) {
    return (
      <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 text-sm text-[#5c4a3d]">
        Loading your pricing basis...
      </div>
    );
  }

  if (pricingError || !pricing) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-6 text-sm text-[#8a4b45]">
        {pricingError ?? "Pricing is unavailable right now."}
      </div>
    );
  }

  if (!pricing.instantPriceEligible) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Review Needed</p>
          <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
            This shelf needs the review path instead of standard checkout.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5c4a3d]">
            Craft & Board can price this shelf directionally, but the current configuration needs install or span review before a standard purchase submission moves into production review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={inquiryHref} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
              Request Review
            </Link>
            <Link href={editHref} className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
              Edit Configuration
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductCheckoutSummary
        productTitle="Classic Floating Shelf"
        configurationLines={[
          `Width: ${initialConfiguration.width} in`,
          `Depth: ${initialConfiguration.depth} in`,
          `Thickness: ${initialConfiguration.thickness} in`,
          `Material: ${initialConfiguration.materialLabel}`,
          `Mounting: ${initialConfiguration.mountingLabel}`,
          `Quantity: ${initialConfiguration.quantity}`
        ]}
        editHref={editHref}
        quote={quote}
      />

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">3. Customer Information</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Full name</span>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Email</span>
            <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33] md:col-span-2">
            <span>Phone</span>
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3" />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">4. Shipping Information</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {([
            ["fullName", "Shipping name"],
            ["address1", "Address line 1"],
            ["address2", "Address line 2"],
            ["city", "City"],
            ["state", "State"],
            ["postalCode", "Postal code"],
            ["country", "Country"]
          ] as const).map(([key, label]) => (
            <label key={key} className="space-y-2 text-sm text-[#4f3f33]">
              <span>{label}</span>
              <input
                value={shippingAddress[key]}
                onChange={(event) => updateAddress(setShippingAddress, key, event.target.value)}
                className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
              />
            </label>
          ))}
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-[#4f3f33]">
          <input
            type="checkbox"
            checked={billingSameAsShipping}
            onChange={(event) => setBillingSameAsShipping(event.target.checked)}
          />
          <span>Billing address matches shipping</span>
        </label>

        {!billingSameAsShipping ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {([
              ["fullName", "Billing name"],
              ["address1", "Billing address line 1"],
              ["address2", "Billing address line 2"],
              ["city", "Billing city"],
              ["state", "Billing state"],
              ["postalCode", "Billing postal code"],
              ["country", "Billing country"]
            ] as const).map(([key, label]) => (
              <label key={key} className="space-y-2 text-sm text-[#4f3f33]">
                <span>{label}</span>
                <input
                  value={billingAddress[key]}
                  onChange={(event) => updateAddress(setBillingAddress, key, event.target.value)}
                  className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
                />
              </label>
            ))}
          </div>
        ) : null}

        {quoteLoading ? (
          <div className="mt-5 rounded-2xl border border-[#dbcab9] bg-[#fff8f0] p-4 text-sm text-[#5c4a3d]">
            Updating shipping and tax quote...
          </div>
        ) : null}
        {quoteError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-[#fff4f2] p-4 text-sm text-[#8a4b45]">
            {quoteError}
          </div>
        ) : null}
        {quote?.shipping.reviewRequired ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
            {quote.shipping.customerFacingMessage}
          </div>
        ) : null}
        {quote?.tax.reviewRequired ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
            {quote.tax.customerFacingMessage}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">5. Payment Mode</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setPaymentMode("DEPOSIT_REQUEST")}
            className={`rounded-[1.5rem] border p-5 text-left ${paymentMode === "DEPOSIT_REQUEST" ? "border-[#2b1d16] bg-[#fff3e8]" : "border-[#dbcab9] bg-white"}`}
          >
            <p className="font-medium text-[#281a13]">Deposit Request</p>
            <p className="mt-2 text-sm text-[#5c4a3d]">
              Deposit is calculated from the subtotal, shipping, and tax basis shown above.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("FULL_PAYMENT_LATER")}
            className={`rounded-[1.5rem] border p-5 text-left ${paymentMode === "FULL_PAYMENT_LATER" ? "border-[#2b1d16] bg-[#fff3e8]" : "border-[#dbcab9] bg-white"}`}
          >
            <p className="font-medium text-[#281a13]">Review Before Charge</p>
            <p className="mt-2 text-sm text-[#5c4a3d]">
              Submit the structured order and keep final payment collection in the follow-up workflow.
            </p>
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">6. Final Review</p>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional project notes, delivery details, or install context"
          className="mt-5 w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3 text-sm text-[#4f3f33]"
        />

        <div className="mt-5 space-y-3 text-sm text-[#4f3f33]">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={acknowledgedMadeToOrder} onChange={(event) => setAcknowledgedMadeToOrder(event.target.checked)} />
            <span>I understand this is a made-to-order product built to the configuration selected here.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={acceptedPricingBasis} onChange={(event) => setAcceptedPricingBasis(event.target.checked)} />
            <span>I acknowledge the dimensions, material, mounting, and pricing basis shown above.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={acceptedLeadTimeBasis} onChange={(event) => setAcceptedLeadTimeBasis(event.target.checked)} />
            <span>I acknowledge the lead-time guidance and understand unusual site conditions may still require follow-up.</span>
          </label>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-[#fff4f2] p-4 text-sm text-[#8a4b45]">
            {error}
          </div>
        ) : null}
        {quote && !quote.standardCheckoutEligible ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-[#fff4e8] p-4 text-sm text-[#6c4e28]">
            {quote.shipping.customerFacingMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5] disabled:opacity-60"
          >
            {isSubmitting ? "Submitting Order..." : "Submit Order"}
          </button>
          <Link href={inquiryHref} className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
            Need Review Instead
          </Link>
        </div>
      </section>
    </div>
  );
}
