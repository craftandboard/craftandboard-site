"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getFloatingMantelPricing,
  type FloatingMantelPricingResult
} from "../../lib/api";
import {
  floatingMantelDefaultConfig,
  floatingMantelDepthOptions,
  floatingMantelHeightOptions,
  floatingMantelMaterialOptions,
  floatingMantelMountingOptions,
  getFloatingMantelMaterialLabel,
  getFloatingMantelMountingLabel
} from "../../lib/storefront/floatingMantel";
import { parseFloatingMantelConfigFromSearchParams } from "../../lib/storefront/order";
import { getStorefrontProductByFamily } from "../../lib/storefront/products/registry";
import type { ConfigurableProductDefinition } from "../../lib/storefront/products/types";
import { InquirySummary } from "./InquirySummary";
import { FloatingShelfPriceCard } from "./FloatingShelfPriceCard";

export function FloatingMantelConfigurator() {
  const searchParams = useSearchParams();
  const initialConfig = useMemo(
    () => parseFloatingMantelConfigFromSearchParams(searchParams),
    [searchParams]
  );

  const [length, setLength] = useState<number>(initialConfig.length);
  const [depth, setDepth] = useState(initialConfig.depth);
  const [height, setHeight] = useState(initialConfig.height);
  const [quantity, setQuantity] = useState<number>(initialConfig.quantity);
  const [materialCode, setMaterialCode] = useState(initialConfig.materialCode);
  const [mountingCode, setMountingCode] = useState(initialConfig.mountingCode);
  const [customNotes, setCustomNotes] = useState(initialConfig.customNotes ?? "");
  const [pricing, setPricing] = useState<FloatingMantelPricingResult | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  const configuration = useMemo(() => {
    const materialLabel = getFloatingMantelMaterialLabel(materialCode);
    const mountingLabel = getFloatingMantelMountingLabel(mountingCode);

    return {
      ...floatingMantelDefaultConfig,
      length,
      depth,
      height,
      quantity,
      materialCode,
      materialLabel,
      mountingCode,
      mountingLabel,
      customNotes: customNotes.trim() || null
    };
  }, [customNotes, depth, height, length, materialCode, mountingCode, quantity]);

  const product = useMemo(
    () =>
      getStorefrontProductByFamily({
        productFamily: configuration.productFamily,
        productSlug: configuration.productSlug
      }) as ConfigurableProductDefinition<typeof configuration> | undefined,
    [configuration.productFamily, configuration.productSlug]
  );

  useEffect(() => {
    let active = true;
    setPricingLoading(true);
    setPricingError(null);

    void getFloatingMantelPricing({ configuration })
      .then((payload) => {
        if (!active) return;
        setPricing(payload.pricing);
      })
      .catch((caught) => {
        if (!active) return;
        setPricingError(caught instanceof Error ? caught.message : "Failed to calculate pricing.");
      })
      .finally(() => {
        if (!active) return;
        setPricingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [configuration]);

  const inquiryHref = useMemo(
    () => product?.buildInquiryHref(configuration, "/shop/floating-mantels/classic-floating-mantel") ?? "/contact",
    [configuration, product]
  );
  const checkoutHref = useMemo(
    () => product?.buildCheckoutHref(configuration) ?? "/shop",
    [configuration, product]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Configuration</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
            Configure a standard mantel and move directly into order.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#5c4a3d]">
            Standard mantel spans price instantly and can continue into checkout and deposit payment. Longer lengths, consult-needed support, and large section combinations stay on the review path.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Length</span>
            <input
              type="number"
              min={1}
              max={180}
              step="0.125"
              value={length}
              onChange={(event) => setLength(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Depth</span>
            <select
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value) as typeof depth)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {floatingMantelDepthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Height</span>
            <select
              value={height}
              onChange={(event) => setHeight(Number(event.target.value) as typeof height)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {floatingMantelHeightOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Material</span>
            <select
              value={materialCode}
              onChange={(event) => setMaterialCode(event.target.value as typeof materialCode)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {floatingMantelMaterialOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Support</span>
            <select
              value={mountingCode}
              onChange={(event) => setMountingCode(event.target.value as typeof mountingCode)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {floatingMantelMountingOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Quantity</span>
            <input
              type="number"
              min={1}
              max={6}
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33] sm:col-span-2">
            <span>Project notes</span>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
              placeholder="Optional fireplace wall, surround, or install notes"
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
        </div>
      </section>

      {pricingError ? (
        <div className="rounded-[2rem] border border-rose-200 bg-[#fff4f2] p-5 text-sm text-[#8a4b45]">
          {pricingError}
        </div>
      ) : null}

      <FloatingShelfPriceCard pricing={pricing as any} loading={pricingLoading} />

      <InquirySummary
        summary={{
          productName: product?.displayName ?? "Classic Floating Mantel",
          widthValue: configuration.length,
          widthUnit: configuration.lengthUnit,
          depthValue: configuration.depth,
          depthUnit: configuration.depthUnit,
          thicknessValue: configuration.height,
          thicknessUnit: configuration.heightUnit,
          quantity: configuration.quantity,
          materialLabel: configuration.materialLabel,
          mountingLabel: configuration.mountingLabel,
          note:
            pricing?.instantPriceEligible
              ? "This mantel can continue into the structured order flow."
              : "This mantel needs the review path instead of standard checkout."
        }}
      />

      <div className="flex flex-wrap gap-3">
        {pricing?.instantPriceEligible ? (
          <Link href={checkoutHref} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
            Continue to Order
          </Link>
        ) : (
          <Link href={inquiryHref} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
            Request Review
          </Link>
        )}
        <Link
          href={inquiryHref}
          className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]"
        >
          Keep the Review Path Available
        </Link>
      </div>
    </div>
  );
}
