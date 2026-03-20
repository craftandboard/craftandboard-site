import type { CabinetShelfProduct } from "../../content/cabinetShelves";

export const cabinetShelfFractionOptions = [
  { eighths: 0, label: '0"', spoken: "exact inch" },
  { eighths: 1, label: '1/8"', spoken: "one eighth" },
  { eighths: 2, label: '1/4"', spoken: "one quarter" },
  { eighths: 3, label: '3/8"', spoken: "three eighths" },
  { eighths: 4, label: '1/2"', spoken: "one half" },
  { eighths: 5, label: '5/8"', spoken: "five eighths" },
  { eighths: 6, label: '3/4"', spoken: "three quarters" },
  { eighths: 7, label: '7/8"', spoken: "seven eighths" }
] as const;

export type CabinetShelfMeasurement = {
  wholeInches: number;
  eighths: number;
};

export function cabinetShelfMeasurementToDecimal(input: CabinetShelfMeasurement) {
  return input.wholeInches + input.eighths / 8;
}

export function formatCabinetShelfMeasurement(input: CabinetShelfMeasurement) {
  if (input.eighths === 0) {
    return `${input.wholeInches}"`;
  }

  const fraction = cabinetShelfFractionOptions.find((option) => option.eighths === input.eighths)?.label.replace('"', "") ?? `${input.eighths}/8`;
  return `${input.wholeInches} ${fraction}"`;
}

export function subtractOneEighth(input: CabinetShelfMeasurement): CabinetShelfMeasurement {
  const totalEighths = input.wholeInches * 8 + input.eighths;
  const adjusted = Math.max(1, totalEighths - 1);

  return {
    wholeInches: Math.floor(adjusted / 8),
    eighths: adjusted % 8
  };
}

export function validateCabinetShelfMeasurement(input: CabinetShelfMeasurement) {
  return Number.isInteger(input.wholeInches) && input.wholeInches > 0 && Number.isInteger(input.eighths) && input.eighths >= 0 && input.eighths <= 7;
}

export function buildCabinetShelfInquiryHref(input: {
  product: CabinetShelfProduct;
  width: CabinetShelfMeasurement;
  depth: CabinetShelfMeasurement;
  quantity: number;
  openingWidth?: CabinetShelfMeasurement | null;
  notes?: string | null;
}) {
  const params = new URLSearchParams({
    source: "product-page",
    sourcePath: input.product.href,
    productFamily: "cabinet-shelves",
    productSlug: input.product.slug,
    productName: input.product.title,
    widthValue: String(cabinetShelfMeasurementToDecimal(input.width)),
    widthUnit: "in",
    depthValue: String(cabinetShelfMeasurementToDecimal(input.depth)),
    depthUnit: "in",
    thicknessValue: "0.75",
    thicknessUnit: "in",
    quantity: String(input.quantity),
    materialCode: input.product.slug.includes("white") ? "white_melamine" : "maple_melamine",
    materialLabel: input.product.materialLabel,
    mountingCode: "cabinet_replacement",
    mountingLabel: "Replacement cabinet shelf"
  });

  const noteParts = [
    input.notes?.trim() || null,
    input.openingWidth ? `Inside cabinet opening width: ${formatCabinetShelfMeasurement(input.openingWidth)}` : null
  ].filter((item): item is string => Boolean(item));

  if (noteParts.length > 0) {
    params.set("notes", noteParts.join(" | "));
  }

  return `/contact?${params.toString()}`;
}
