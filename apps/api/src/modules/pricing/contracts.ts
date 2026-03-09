import type { MaterialCode } from "@craft-and-board/shared";

export const PRICING_ROUNDING_MODES = ["NONE", "NEAREST", "UP"] as const;
export type PricingRoundingMode = (typeof PRICING_ROUNDING_MODES)[number];

export const PRICING_SOURCE_TYPES = ["MANUAL", "CONFIGURATOR", "ORDER", "BATCH", "FORECAST"] as const;
export type PricingSourceType = (typeof PRICING_SOURCE_TYPES)[number];

export type PricingMaterialType = MaterialCode;

