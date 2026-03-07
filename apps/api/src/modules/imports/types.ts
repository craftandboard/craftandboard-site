import type {
  EdgeBandPattern,
  MaterialCode,
  NormalizedOrderInput,
  NormalizedOrderItemInput,
  RawFixtureLineItem,
  RawFixtureOrder
} from "@craft-and-board/shared";

export type {
  EdgeBandPattern,
  MaterialCode,
  NormalizedOrderInput,
  NormalizedOrderItemInput,
  RawFixtureLineItem,
  RawFixtureOrder
};

export interface NormalizationContext {
  sourceFile?: string;
}
