import { USABLE_HEIGHT_IN, USABLE_WIDTH_IN } from "../nesting/constants.js";

const WASTE_FACTOR = 1.12;

export function areaSqInForPart(input: { widthIn: number; depthIn: number }) {
  return Number((input.widthIn * input.depthIn).toFixed(3));
}

export function areaSqFtFromSqIn(areaSqIn: number) {
  return Number((areaSqIn / 144).toFixed(3));
}

export function estimatedSheetCountForArea(totalAreaSqIn: number) {
  const usableSheetAreaSqIn = USABLE_WIDTH_IN * USABLE_HEIGHT_IN;

  if (totalAreaSqIn <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((totalAreaSqIn * WASTE_FACTOR) / usableSheetAreaSqIn));
}
