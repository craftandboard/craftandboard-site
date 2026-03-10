import { formatCurrency } from "./mvp";

export function formatCostLabel(code: string | null | undefined) {
  if (!code) {
    return "Not selected";
  }
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not set";
  }
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function formatMoney(cents: number | null | undefined) {
  return formatCurrency(cents ?? 0);
}

export function getEdgeBandPatternLabel(pattern: string) {
  switch (pattern) {
    case "NONE":
      return "No edge band";
    case "LONG_EDGES":
      return "Long edges only";
    case "SHORT_EDGES":
      return "Short edges only";
    case "ALL_FOUR":
      return "All four edges";
    default:
      return formatCostLabel(pattern);
  }
}
