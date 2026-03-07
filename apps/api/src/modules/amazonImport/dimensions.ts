import { AmazonImportError } from "./errors.js";

function parseNumberish(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "no adjustment") {
    return 0;
  }

  const numeric = Number(trimmed.replaceAll("\"", ""));
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  throw new AmazonImportError(`Invalid numeric inch value: ${value}`);
}

export function parseFractionAdjustment(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "no adjustment") {
    return 0;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator === 0) {
      throw new AmazonImportError(`Invalid fraction adjustment: ${value}`);
    }

    return numerator / denominator;
  }

  throw new AmazonImportError(`Invalid fraction adjustment: ${value}`);
}

function roundToNearestEighth(value: number): number {
  return Math.round(value * 8) / 8;
}

export function combineIntoDimensionInches(input: {
  whole: number | string | null | undefined;
  fractionOrAdjustment: number | string | null | undefined;
}): number {
  const raw = parseNumberish(input.whole) + parseFractionAdjustment(input.fractionOrAdjustment);
  return Number(roundToNearestEighth(raw).toFixed(3));
}

export function validateShelfDimensionInches(input: {
  widthIn: number;
  depthIn: number;
}) {
  if (input.widthIn < 8 || input.widthIn > 35) {
    throw new AmazonImportError(`Width ${input.widthIn}" is outside the allowed range of 8" to 35".`);
  }

  if (input.depthIn < 8 || input.depthIn > 24) {
    throw new AmazonImportError(`Depth ${input.depthIn}" is outside the allowed range of 8" to 24".`);
  }
}
