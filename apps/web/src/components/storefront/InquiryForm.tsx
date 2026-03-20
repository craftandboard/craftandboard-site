"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { shelfInquiryConfig } from "../../content/inquiry";
import { createCraftBoardInquiry } from "../../lib/api";
import { InquirySummary } from "./InquirySummary";

type InquiryFormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productFamily: string;
  productSlug: string;
  productName: string;
  widthValue: string;
  widthUnit: string;
  depthValue: string;
  depthUnit: string;
  thicknessValue: string;
  thicknessUnit: string;
  quantity: string;
  materialCode: string;
  materialLabel: string;
  mountingCode: string;
  mountingLabel: string;
  notes: string;
  source: string;
  sourcePath: string;
};

function readSearchValue(params: URLSearchParams, key: string, fallback: string) {
  const value = params.get(key)?.trim();
  return value && value.length > 0 ? value : fallback;
}

function buildInitialState(params: URLSearchParams): InquiryFormState {
  const materialCode = readSearchValue(params, "materialCode", shelfInquiryConfig.materialOptions[0].code);
  const materialLabel =
    params.get("materialLabel")?.trim() ||
    shelfInquiryConfig.materialOptions.find((option) => option.code === materialCode)?.label ||
    shelfInquiryConfig.materialOptions[0].label;
  const mountingCode = readSearchValue(params, "mountingCode", shelfInquiryConfig.mountingOptions[0].code);
  const mountingLabel =
    params.get("mountingLabel")?.trim() ||
    shelfInquiryConfig.mountingOptions.find((option) => option.code === mountingCode)?.label ||
    shelfInquiryConfig.mountingOptions[0].label;

  return {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productFamily: readSearchValue(params, "productFamily", shelfInquiryConfig.productFamily),
    productSlug: readSearchValue(params, "productSlug", shelfInquiryConfig.productSlug),
    productName: readSearchValue(params, "productName", shelfInquiryConfig.productName),
    widthValue: readSearchValue(params, "widthValue", String(shelfInquiryConfig.defaultValues.widthValue)),
    widthUnit: readSearchValue(params, "widthUnit", shelfInquiryConfig.widthUnit),
    depthValue: readSearchValue(params, "depthValue", String(shelfInquiryConfig.defaultValues.depthValue)),
    depthUnit: readSearchValue(params, "depthUnit", shelfInquiryConfig.depthUnit),
    thicknessValue: readSearchValue(params, "thicknessValue", String(shelfInquiryConfig.defaultValues.thicknessValue)),
    thicknessUnit: readSearchValue(params, "thicknessUnit", shelfInquiryConfig.thicknessUnit),
    quantity: readSearchValue(params, "quantity", String(shelfInquiryConfig.defaultValues.quantity)),
    materialCode,
    materialLabel,
    mountingCode,
    mountingLabel,
    notes: "",
    source: readSearchValue(params, "source", "storefront_contact"),
    sourcePath: readSearchValue(params, "sourcePath", "/contact")
  };
}

function validate(form: InquiryFormState) {
  const errors: Partial<Record<keyof InquiryFormState, string>> = {};
  const width = Number(form.widthValue);
  const depth = Number(form.depthValue);
  const thickness = Number(form.thicknessValue);
  const quantity = Number(form.quantity);

  if (!form.customerName.trim()) errors.customerName = "Name is required.";
  if (!form.customerEmail.trim()) {
    errors.customerEmail = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email.";
  }
  if (!form.productFamily.trim()) errors.productFamily = "Product family is required.";
  if (!Number.isFinite(width) || width <= 0) errors.widthValue = "Enter a positive width.";
  if (!Number.isFinite(depth) || depth <= 0) errors.depthValue = "Enter a positive depth.";
  if (!Number.isFinite(thickness) || thickness <= 0) errors.thicknessValue = "Enter a positive thickness.";
  if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = "Quantity must be at least 1.";
  if (!form.materialLabel.trim()) errors.materialLabel = "Material is required.";
  if (!form.mountingLabel.trim()) errors.mountingLabel = "Mounting is required.";

  return errors;
}

export function InquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(() => buildInitialState(searchParams));
  const [errors, setErrors] = useState<Partial<Record<keyof InquiryFormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(
    () => ({
      productName: form.productName,
      widthValue: Number(form.widthValue) || 0,
      widthUnit: form.widthUnit,
      depthValue: Number(form.depthValue) || 0,
      depthUnit: form.depthUnit,
      thicknessValue: Number(form.thicknessValue) || 0,
      thicknessUnit: form.thicknessUnit,
      quantity: Number(form.quantity) || 0,
      materialLabel: form.materialLabel,
      mountingLabel: form.mountingLabel,
      note: shelfInquiryConfig.helperCopy.summaryNote
    }),
    [form]
  );

  function updateField<K extends keyof InquiryFormState>(key: K, value: InquiryFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleMaterialChange(code: string) {
    const option = shelfInquiryConfig.materialOptions.find((entry) => entry.code === code);
    updateField("materialCode", code);
    updateField("materialLabel", option?.label ?? "");
  }

  function handleMountingChange(code: string) {
    const option = shelfInquiryConfig.mountingOptions.find((entry) => entry.code === code);
    updateField("mountingCode", code);
    updateField("mountingLabel", option?.label ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const configurationJson = {
            source: form.source,
            sourcePath: form.sourcePath,
            productFamily: form.productFamily,
            productSlug: form.productSlug,
            productName: form.productName,
            widthValue: Number(form.widthValue),
            widthUnit: form.widthUnit,
            depthValue: Number(form.depthValue),
            depthUnit: form.depthUnit,
            thicknessValue: Number(form.thicknessValue),
            thicknessUnit: form.thicknessUnit,
            quantity: Number(form.quantity),
            materialCode: form.materialCode,
            materialLabel: form.materialLabel,
            mountingCode: form.mountingCode,
            mountingLabel: form.mountingLabel,
            notes: form.notes
          };

          await createCraftBoardInquiry({
            source: form.source,
            sourcePath: form.sourcePath,
            productFamily: form.productFamily,
            productSlug: form.productSlug,
            productName: form.productName,
            customerName: form.customerName,
            customerEmail: form.customerEmail,
            customerPhone: form.customerPhone || null,
            widthValue: Number(form.widthValue),
            widthUnit: form.widthUnit,
            depthValue: Number(form.depthValue),
            depthUnit: form.depthUnit,
            thicknessValue: Number(form.thicknessValue),
            thicknessUnit: form.thicknessUnit,
            quantity: Number(form.quantity),
            materialCode: form.materialCode || null,
            materialLabel: form.materialLabel,
            mountingCode: form.mountingCode || null,
            mountingLabel: form.mountingLabel,
            notes: form.notes || null,
            configurationJson
          });

          router.push("/quote/thank-you");
        } catch (caught) {
          setServerError(caught instanceof Error ? caught.message : "Failed to submit your inquiry.");
        }
      })();
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Structured Inquiry</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#241811]">
            {shelfInquiryConfig.helperCopy.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[#5c4a3d]">{shelfInquiryConfig.helperCopy.body}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Name</span>
            <input
              value={form.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.customerName ? <span className="text-rose-700">{errors.customerName}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Email</span>
            <input
              value={form.customerEmail}
              onChange={(event) => updateField("customerEmail", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.customerEmail ? <span className="text-rose-700">{errors.customerEmail}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Phone</span>
            <input
              value={form.customerPhone}
              onChange={(event) => updateField("customerPhone", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Product Family</span>
            <input
              value={form.productFamily}
              onChange={(event) => updateField("productFamily", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.productFamily ? <span className="text-rose-700">{errors.productFamily}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Product Name</span>
            <input
              value={form.productName}
              onChange={(event) => updateField("productName", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Quantity</span>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.quantity ? <span className="text-rose-700">{errors.quantity}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Width</span>
            <input
              type="number"
              min={1}
              step="0.125"
              value={form.widthValue}
              onChange={(event) => updateField("widthValue", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.widthValue ? <span className="text-rose-700">{errors.widthValue}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Depth</span>
            <input
              type="number"
              min={1}
              step="0.125"
              value={form.depthValue}
              onChange={(event) => updateField("depthValue", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.depthValue ? <span className="text-rose-700">{errors.depthValue}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Thickness</span>
            <input
              type="number"
              min={0.125}
              step="0.125"
              value={form.thicknessValue}
              onChange={(event) => updateField("thicknessValue", event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            />
            {errors.thicknessValue ? <span className="text-rose-700">{errors.thicknessValue}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Material</span>
            <select
              value={form.materialCode}
              onChange={(event) => handleMaterialChange(event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {shelfInquiryConfig.materialOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.materialLabel ? <span className="text-rose-700">{errors.materialLabel}</span> : null}
          </label>
          <label className="space-y-2 text-sm text-[#4f3f33]">
            <span>Mounting</span>
            <select
              value={form.mountingCode}
              onChange={(event) => handleMountingChange(event.target.value)}
              className="w-full rounded-2xl border border-[#d7c4b1] bg-white px-4 py-3"
            >
              {shelfInquiryConfig.mountingOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.mountingLabel ? <span className="text-rose-700">{errors.mountingLabel}</span> : null}
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm text-[#4f3f33]">
          <span>Project Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={5}
            className="w-full rounded-[1.5rem] border border-[#d7c4b1] bg-white px-4 py-3"
          />
        </label>

        {serverError ? (
          <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {serverError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 rounded-full bg-[#2b1d16] px-6 py-3 text-sm font-medium text-[#f7efe5] disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      <InquirySummary summary={summary} />
    </div>
  );
}
