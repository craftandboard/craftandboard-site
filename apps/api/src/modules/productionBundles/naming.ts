import type { MaterialCode } from "@craft-and-board/shared";

export const SUPPORTED_BUNDLE_MATERIALS = [
  "WHITE_MELAMINE",
  "MAPLE_MELAMINE"
] as const satisfies readonly MaterialCode[];

export function isSupportedBundleMaterial(
  materialCode: MaterialCode | null | undefined
): materialCode is (typeof SUPPORTED_BUNDLE_MATERIALS)[number] {
  return Boolean(
    materialCode &&
      SUPPORTED_BUNDLE_MATERIALS.includes(
        materialCode as (typeof SUPPORTED_BUNDLE_MATERIALS)[number]
      )
  );
}

export function materialLabel(materialCode: (typeof SUPPORTED_BUNDLE_MATERIALS)[number]): string {
  switch (materialCode) {
    case "WHITE_MELAMINE":
      return "White Melamine";
    case "MAPLE_MELAMINE":
      return "Maple Melamine";
  }
}

export function productLabel(materialCode: (typeof SUPPORTED_BUNDLE_MATERIALS)[number]): string {
  switch (materialCode) {
    case "WHITE_MELAMINE":
      return "White Shelf";
    case "MAPLE_MELAMINE":
      return "Maple Shelf";
  }
}

export function legacyXmlName(materialCode: (typeof SUPPORTED_BUNDLE_MATERIALS)[number]): string {
  switch (materialCode) {
    case "WHITE_MELAMINE":
      return "CST-White Melamine Shelf - .75 Thick";
    case "MAPLE_MELAMINE":
      return "CST-Maple Melamine Shelf - .75 Thick";
  }
}
