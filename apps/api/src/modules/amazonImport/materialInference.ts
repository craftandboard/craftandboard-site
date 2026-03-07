import type { MaterialCode } from "@craft-and-board/shared";
import { AmazonImportError } from "./errors.js";

export interface MaterialInferenceResult {
  materialCode: MaterialCode;
  materialLabel: string;
  productLabel: string;
  legacyXmlName: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export function inferMaterial(input: {
  material?: string | null;
  sku: string;
  productTitle: string;
}): MaterialInferenceResult {
  const explicit = normalizeText(input.material);
  const haystack = [explicit, input.sku, input.productTitle].map(normalizeText).join(" ");

  if (
    explicit === "maple_melamine" ||
    haystack.includes("maple melamine shelf") ||
    haystack.includes("(maple)")
  ) {
    return {
      materialCode: "MAPLE_MELAMINE",
      materialLabel: "Maple Melamine",
      productLabel: "Maple Shelf",
      legacyXmlName: "CST-Maple Melamine Shelf - .75 Thick"
    };
  }

  if (
    explicit === "white_melamine" ||
    haystack.includes("white melamine shelf") ||
    haystack.includes("(white)")
  ) {
    return {
      materialCode: "WHITE_MELAMINE",
      materialLabel: "White Melamine",
      productLabel: "White Shelf",
      legacyXmlName: "CST-White Melamine Shelf - .75 Thick"
    };
  }

  throw new AmazonImportError(
    `Unable to infer material from sku/title: sku="${input.sku}" title="${input.productTitle}"`
  );
}
