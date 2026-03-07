import type { EdgeBandPattern, MaterialCode } from "@craft-and-board/shared";

export interface SkuNormalizationResult {
  materialCode: MaterialCode;
  materialLabel: string;
  productLabel: string;
  edgeBandPattern: EdgeBandPattern;
  edgeBandLabel: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function toEdgeBandLabel(pattern: EdgeBandPattern): string {
  switch (pattern) {
    case "ALL_FOUR":
      return "All four sides";
  }
}

export function normalizeEdgeBandPattern(
  input: string | null | undefined
): EdgeBandPattern {
  return "ALL_FOUR";
}

export function normalizeSkuMaterial(input: {
  sku: string;
  title: string;
  material?: string;
  edgeBandPattern?: string | null;
}): SkuNormalizationResult {
  const haystack = [input.sku, input.title, input.material ?? ""]
    .map(normalizeText)
    .join(" ");

  if (haystack.includes("maple melamine")) {
    const edgeBandPattern = normalizeEdgeBandPattern(input.edgeBandPattern);

    return {
      materialCode: "MAPLE_MELAMINE",
      materialLabel: "Maple Melamine",
      productLabel: "Maple Shelf",
      edgeBandPattern,
      edgeBandLabel: toEdgeBandLabel(edgeBandPattern)
    };
  }

  const edgeBandPattern = normalizeEdgeBandPattern(input.edgeBandPattern);

  return {
    materialCode: "WHITE_MELAMINE",
    materialLabel: "White Melamine",
    productLabel: "White Shelf",
    edgeBandPattern,
    edgeBandLabel: toEdgeBandLabel(edgeBandPattern)
  };
}
