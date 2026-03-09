import type { EdgeBandPattern, MaterialCode } from "@craft-and-board/shared";

export type DerivedEdgeBandPattern =
  | "NONE"
  | "ONE_LONG_EDGE"
  | "TWO_LONG_EDGES"
  | "TWO_SHORT_EDGES"
  | "ALL_FOUR";

export const EDGE_BANDING_DEFAULTS = {
  perEdgeWasteIn: 1,
  setupAllowanceFtPerMaterialGroup: 6
} as const;

export function normalizeDerivedEdgeBandPattern(input: {
  sourceEdgeBandText?: string | null;
  edgeBandPattern?: EdgeBandPattern | string | null;
}): DerivedEdgeBandPattern {
  const normalizedSource = (input.sourceEdgeBandText ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (!normalizedSource) {
    return input.edgeBandPattern === "ALL_FOUR" ? "ALL_FOUR" : "NONE";
  }

  if (normalizedSource.includes("NONE") || normalizedSource.includes("NO_EDGE")) {
    return "NONE";
  }
  if (
    normalizedSource.includes("FRONT_ONLY") ||
    normalizedSource.includes("ONE_LONG_EDGE") ||
    normalizedSource.includes("SINGLE_LONG_EDGE")
  ) {
    return "ONE_LONG_EDGE";
  }
  if (
    normalizedSource.includes("TWO_LONG_EDGES") ||
    normalizedSource.includes("LONG_SIDES") ||
    normalizedSource.includes("LONG_EDGES") ||
    normalizedSource.includes("ON_LONG_SIDE")
  ) {
    return "TWO_LONG_EDGES";
  }
  if (
    normalizedSource.includes("TWO_SHORT_EDGES") ||
    normalizedSource.includes("SHORT_SIDES") ||
    normalizedSource.includes("SHORT_EDGES") ||
    normalizedSource.includes("ON_SHORT_SIDE")
  ) {
    return "TWO_SHORT_EDGES";
  }
  if (normalizedSource.includes("ALL_FOUR") || normalizedSource.includes("ALL_4")) {
    return "ALL_FOUR";
  }

  return input.edgeBandPattern === "ALL_FOUR" ? "ALL_FOUR" : "NONE";
}

export function mapEdgeBandMaterial(input: {
  materialCode?: MaterialCode | null;
}):
  | {
      key: string;
      label: string;
      colorLabel: string;
    }
  | null {
  switch (input.materialCode) {
    case "WHITE_MELAMINE":
      return {
        key: "EDGE_WHITE_MELAMINE",
        label: "White Melamine Edge Band",
        colorLabel: "White"
      };
    case "MAPLE_MELAMINE":
      return {
        key: "EDGE_MAPLE_MELAMINE",
        label: "Maple Melamine Edge Band",
        colorLabel: "Maple"
      };
    case "BIRCH_18":
      return {
        key: "EDGE_BIRCH_18",
        label: "Birch 18 Edge Band",
        colorLabel: "Birch"
      };
    case "WALNUT_18":
      return {
        key: "EDGE_WALNUT_18",
        label: "Walnut 18 Edge Band",
        colorLabel: "Walnut"
      };
    case "MAPLE_18":
      return {
        key: "EDGE_MAPLE_18",
        label: "Maple 18 Edge Band",
        colorLabel: "Maple"
      };
    case "MDF_18":
      return {
        key: "EDGE_MDF_18",
        label: "MDF 18 Edge Band",
        colorLabel: "MDF"
      };
    default:
      return null;
  }
}

export function estimatePartEdgeBand(input: {
  partId: string;
  orderId?: string;
  jobId?: string;
  materialCode?: MaterialCode | null;
  labelCode: string;
  widthIn?: number | null;
  depthIn?: number | null;
  source: "CONFIGURATOR" | "AMAZON";
  sourceEdgeBandText?: string | null;
  edgeBandPattern?: EdgeBandPattern | string | null;
  perEdgeWasteIn?: number;
}) {
  const widthIn = input.widthIn ?? 0;
  const depthIn = input.depthIn ?? 0;

  if (!Number.isFinite(widthIn) || !Number.isFinite(depthIn) || widthIn <= 0 || depthIn <= 0) {
    return {
      ok: false as const,
      partId: input.partId,
      labelCode: input.labelCode,
      reason: "Invalid source dimensions."
    };
  }

  const pattern = normalizeDerivedEdgeBandPattern({
    sourceEdgeBandText: input.sourceEdgeBandText,
    edgeBandPattern: input.edgeBandPattern
  });
  const edgeBandMaterial = mapEdgeBandMaterial({ materialCode: input.materialCode });

  if (!edgeBandMaterial && pattern !== "NONE") {
    return {
      ok: false as const,
      partId: input.partId,
      labelCode: input.labelCode,
      reason: "Panel material does not have an edge band material mapping."
    };
  }

  const edgeLengths: number[] = (() => {
    switch (pattern) {
      case "NONE":
        return [];
      case "ONE_LONG_EDGE":
        return [widthIn];
      case "TWO_LONG_EDGES":
        return [widthIn, widthIn];
      case "TWO_SHORT_EDGES":
        return [depthIn, depthIn];
      case "ALL_FOUR":
        return [widthIn, widthIn, depthIn, depthIn];
    }
  })();

  const rawLinearIn = Number(edgeLengths.reduce((sum, value) => sum + value, 0).toFixed(3));
  const perEdgeWasteIn = input.perEdgeWasteIn ?? EDGE_BANDING_DEFAULTS.perEdgeWasteIn;
  const wasteLinearIn = Number((edgeLengths.length * perEdgeWasteIn).toFixed(3));
  const adjustedLinearIn = Number((rawLinearIn + wasteLinearIn).toFixed(3));

  return {
    ok: true as const,
    partId: input.partId,
    orderId: input.orderId,
    jobId: input.jobId,
    labelCode: input.labelCode,
    materialCode: input.materialCode ?? undefined,
    source: input.source,
    derivedPattern: pattern,
    edgeBandMaterialKey: edgeBandMaterial?.key,
    edgeBandMaterialLabel: edgeBandMaterial?.label,
    edgeBandColorLabel: edgeBandMaterial?.colorLabel,
    bandedEdgeCount: edgeLengths.length,
    rawLinearIn,
    wasteLinearIn,
    adjustedLinearIn,
    rawLinearFt: Number((rawLinearIn / 12).toFixed(3)),
    adjustedLinearFt: Number((adjustedLinearIn / 12).toFixed(3)),
    sourceEdgeBandText: input.sourceEdgeBandText ?? undefined
  };
}
