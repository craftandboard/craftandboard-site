export function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

export function percentToMultiplier(percent: number) {
  return percent / 100;
}

export function inchesToFeet(inches: number) {
  return inches / 12;
}

export function squareInchesToSquareFeet(squareInches: number) {
  return squareInches / 144;
}

export function clampCurrency(value: number) {
  return Math.max(0, Math.round(value));
}

export function minutesToHours(minutes: number) {
  return minutes / 60;
}
