"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CabinetShelfProduct } from "../../content/cabinetShelves";
import {
  buildCabinetShelfInquiryHref,
  cabinetShelfFractionOptions,
  cabinetShelfMeasurementToDecimal,
  formatCabinetShelfMeasurement,
  subtractOneEighth,
  type CabinetShelfMeasurement,
  validateCabinetShelfMeasurement
} from "../../lib/storefront/cabinetShelves";

type CabinetShelfConfiguratorProps = {
  product: CabinetShelfProduct;
};

type CabinetShelfConfiguratorErrors = {
  width?: string;
  depth?: string;
  quantity?: string;
  openingWidth?: string;
};

const defaultWidth: CabinetShelfMeasurement = {
  wholeInches: 23,
  eighths: 7
};

const defaultDepth: CabinetShelfMeasurement = {
  wholeInches: 11,
  eighths: 7
};

function MeasurementFields(input: {
  label: string;
  value: CabinetShelfMeasurement;
  onChange(next: CabinetShelfMeasurement): void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#4f3f33]">{input.label}</p>
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <label className="space-y-2 text-sm text-[#4f3f33]">
          <span>Whole inches</span>
          <input
            type="number"
            min={1}
            step={1}
            value={input.value.wholeInches}
            onChange={(event) =>
              input.onChange({
                ...input.value,
                wholeInches: Math.max(0, Math.floor(Number(event.target.value) || 0))
              })}
            className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
          />
        </label>
        <label className="space-y-2 text-sm text-[#4f3f33]">
          <span>Fraction</span>
          <select
            value={input.value.eighths}
            onChange={(event) =>
              input.onChange({
                ...input.value,
                eighths: Number(event.target.value)
              })}
            className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
          >
            {cabinetShelfFractionOptions.map((option) => (
              <option key={option.eighths} value={option.eighths}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-[#7a6657]">Entered size: {formatCabinetShelfMeasurement(input.value)}</p>
      {input.error ? <p className="text-sm text-rose-700">{input.error}</p> : null}
    </div>
  );
}

export function CabinetShelfConfigurator({ product }: CabinetShelfConfiguratorProps) {
  const router = useRouter();
  const [width, setWidth] = useState<CabinetShelfMeasurement>(defaultWidth);
  const [depth, setDepth] = useState<CabinetShelfMeasurement>(defaultDepth);
  const [openingWidth, setOpeningWidth] = useState<CabinetShelfMeasurement>({
    wholeInches: 24,
    eighths: 0
  });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<CabinetShelfConfiguratorErrors>({});

  const recommendedWidth = useMemo(() => subtractOneEighth(openingWidth), [openingWidth]);
  const widthDecimal = useMemo(() => cabinetShelfMeasurementToDecimal(width), [width]);
  const depthDecimal = useMemo(() => cabinetShelfMeasurementToDecimal(depth), [depth]);
  const inquiryHref = useMemo(
    () =>
      buildCabinetShelfInquiryHref({
        product,
        width,
        depth,
        quantity,
        openingWidth,
        notes
      }),
    [depth, notes, openingWidth, product, quantity, width]
  );

  const summaryNote =
    "Pricing and fit are confirmed from the exact width, depth, quantity, and finish you send. This keeps the order start honest without pretending every cabinet opening is the same.";

  function validate() {
    const nextErrors: CabinetShelfConfiguratorErrors = {};

    if (!validateCabinetShelfMeasurement(width)) {
      nextErrors.width = "Enter a valid shelf width using whole inches and 1/8 inch increments.";
    }
    if (!validateCabinetShelfMeasurement(depth)) {
      nextErrors.depth = "Enter a valid shelf depth using whole inches and 1/8 inch increments.";
    }
    if (!validateCabinetShelfMeasurement(openingWidth)) {
      nextErrors.openingWidth = "Enter a valid inside cabinet opening width.";
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      nextErrors.quantity = "Quantity must be at least 1.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleStartOrder() {
    if (!validate()) {
      return;
    }

    router.push(inquiryHref);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Measurement-First Configurator</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
            Order a replacement shelf without guessing.
          </h2>
          <p className="mt-3 text-base leading-7 text-[#5c4a3d]">
            Enter the shelf width, shelf depth, and quantity in simple 1/8 inch increments. If you measured the cabinet opening instead of the shelf, use the helper below to get the recommended shelf width.
          </p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#dbcab9] bg-[#f8eee2] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8d6b4f]">Fraction Helper</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { title: '1"', body: "One full inch" },
              { title: '1/2"', body: "Half an inch" },
              { title: '1/4"', body: "Quarter inch" },
              { title: '1/8"', body: "Smallest increment we use" }
            ].map((item) => (
              <div key={item.title} className="rounded-[1.25rem] bg-[#fffaf4] p-4 text-sm text-[#4f3f33]">
                <p className="font-medium text-[#281a13]">{item.title}</p>
                <p className="mt-2 leading-6">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[#5c4a3d]">
            We only use 1/8 inch increments to keep measuring simple. You do not need to work in 1/16 inch marks for this MVP cabinet shelf flow.
          </p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8d6b4f]">Cabinet Opening Width Helper</p>
          <p className="mt-3 text-sm leading-6 text-[#5c4a3d]">
            Replacement shelves should usually be a little smaller than the inside cabinet opening so they slide in easily. A simple rule of thumb is to subtract 1/8 inch from the opening width.
          </p>
          <div className="mt-5">
            <MeasurementFields
              label="Inside cabinet opening width"
              value={openingWidth}
              onChange={setOpeningWidth}
              error={errors.openingWidth}
            />
          </div>
          <div className="mt-5 rounded-[1.25rem] bg-[#f8eee2] p-4 text-sm leading-6 text-[#4f3f33]">
            <p className="font-medium text-[#281a13]">Recommended shelf width</p>
            <p className="mt-2">
              Cabinet opening {formatCabinetShelfMeasurement(openingWidth)} → shelf width {formatCabinetShelfMeasurement(recommendedWidth)}
            </p>
            <button
              type="button"
              onClick={() => setWidth(recommendedWidth)}
              className="mt-4 rounded-full border border-[#cdb59e] px-4 py-2 text-sm font-medium text-[#3f2c20] transition hover:bg-white"
            >
              Use Recommended Width
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <MeasurementFields label="Shelf width" value={width} onChange={setWidth} error={errors.width} />
          <MeasurementFields label="Shelf depth" value={depth} onChange={setDepth} error={errors.depth} />

          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Quantity</span>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.quantity ? <span className="text-rose-700">{errors.quantity}</span> : null}
          </label>

          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Notes for your order request</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional cabinet notes, room notes, or questions"
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStartOrder}
            className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5] transition hover:bg-[#4a3529]"
          >
            Start Replacement Shelf Order
          </button>
          <Link
            href="/guides/how-to-measure-cabinet-shelves"
            className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33] transition hover:bg-white"
          >
            Reopen Measurement Guide
          </Link>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Order Summary</p>
          <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">{product.shortTitle}</h3>
          <div className="mt-5 grid gap-3 text-sm text-[#4f3f33]">
            <div className="rounded-2xl bg-[#fff8f0] p-4">Finish: {product.materialLabel}</div>
            <div className="rounded-2xl bg-[#fff8f0] p-4">Width: {formatCabinetShelfMeasurement(width)}</div>
            <div className="rounded-2xl bg-[#fff8f0] p-4">Depth: {formatCabinetShelfMeasurement(depth)}</div>
            <div className="rounded-2xl bg-[#fff8f0] p-4">Quantity: {quantity}</div>
            <div className="rounded-2xl bg-[#fff8f0] p-4">
              Fit note: shelves are made to the width and depth you enter, so double-check the cabinet opening before submitting.
            </div>
            <div className="rounded-2xl bg-[#fff8f0] p-4">Pricing basis: confirmed after Craft & Board reviews your size and quantity.</div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#5b4c40]">{summaryNote}</p>
        </section>

        <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Material Fit</p>
          <p className="mt-3 text-base leading-7 text-[#5c4a3d]">{product.finishDirection}</p>
          <p className="mt-4 text-sm leading-7 text-[#6f5847]">{product.bestFor}</p>
          <p className="mt-4 text-sm leading-7 text-[#6f5847]">
            Entered size: {widthDecimal.toFixed(3).replace(/\.?0+$/, "")}&quot; wide × {depthDecimal.toFixed(3).replace(/\.?0+$/, "")}&quot; deep.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Quick Reminder</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#4f3f33]">
            <p>Measure the inside cabinet width, not just the old shelf.</p>
            <p>Subtract 1/8 inch from the opening width when you need clearance help.</p>
            <p>Stick to 1/8 inch increments only.</p>
            <p>Use the measurement guide if any tape-measure mark still feels unclear.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
