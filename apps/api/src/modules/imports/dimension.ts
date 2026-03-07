function parseNumberish(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  throw new Error(`Invalid numeric value: ${value}`);
}

export function parseFraction(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);

    if (denominator === 0) {
      throw new Error(`Invalid fraction with zero denominator: ${value}`);
    }

    return numerator / denominator;
  }

  throw new Error(`Invalid fraction value: ${value}`);
}

function roundInches(value: number): number {
  return Number(value.toFixed(3));
}

export function normalizeDimensionInches(input: {
  whole?: number | string | null;
  fraction?: number | string | null;
  decimal?: number | string | null;
}): number {
  if (input.decimal !== null && input.decimal !== undefined && input.decimal !== "") {
    return roundInches(parseNumberish(input.decimal));
  }

  return roundInches(parseNumberish(input.whole) + parseFraction(input.fraction));
}

export function inchesToMillimeters(valueIn: number): number {
  return Number((valueIn * 25.4).toFixed(1));
}
