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

export function getCostReadinessLabel(options: {
  acceptanceCompleted?: boolean;
  needsNewLink?: boolean;
}) {
  if (options.acceptanceCompleted) {
    return "Acceptance completed";
  }
  if (options.needsNewLink) {
    return "Needs new link";
  }
  return "Ready";
}

export function getPackagingRuleSummary(rule: {
  boxCostCents: number | null;
  bubbleWrapCostCents: number | null;
  foamCostCents?: number | null;
  cornerProtectorCostCents?: number | null;
  tapeCostCents: number | null;
  labelCostCents: number | null;
  insertFlyerCostCents: number | null;
  shrinkWrapCostCents: number | null;
  otherPackagingCostCents: number | null;
  packingMinutes?: number | null;
  packagingOverheadCents?: number | null;
}) {
  const parts = [
    `Box ${formatMoney(rule.boxCostCents)}`,
    `Bubble ${formatMoney(rule.bubbleWrapCostCents)}`,
    `Foam ${formatMoney(rule.foamCostCents)}`,
    `Corners ${formatMoney(rule.cornerProtectorCostCents)}`,
    `Tape ${formatMoney(rule.tapeCostCents)}`,
    `Label ${formatMoney(rule.labelCostCents)}`
  ];
  if (rule.packingMinutes !== null && rule.packingMinutes !== undefined) {
    parts.push(`${rule.packingMinutes} min pack`);
  }
  if (rule.packagingOverheadCents) {
    parts.push(`Overhead ${formatMoney(rule.packagingOverheadCents)}`);
  }
  return parts.join(" · ");
}

export function getShippingRuleSummary(rule: {
  baseCostCents: number;
  costPerPoundCents: number | null;
  costPerCubicInchCents: number | null;
  dimensionalRateCents?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
  marketplaceHandlingCents?: number | null;
  flatOverride: number | null;
}) {
  const parts = [
    rule.flatOverride ? `Flat ${formatMoney(rule.flatOverride)}` : `Base ${formatMoney(rule.baseCostCents)}`
  ];
  if (rule.costPerPoundCents) {
    parts.push(`${formatMoney(rule.costPerPoundCents)}/lb`);
  }
  if (rule.costPerCubicInchCents) {
    parts.push(`${formatMoney(rule.costPerCubicInchCents)}/cu in`);
  }
  if (rule.dimensionalRateCents) {
    parts.push(`Dim ${formatMoney(rule.dimensionalRateCents)}`);
  }
  if (rule.shippingBufferPct) {
    parts.push(`Buffer ${formatPercent(rule.shippingBufferPct)}`);
  }
  if (rule.shippingBufferCents) {
    parts.push(`Buffer ${formatMoney(rule.shippingBufferCents)}`);
  }
  if (rule.marketplaceHandlingCents) {
    parts.push(`Handling ${formatMoney(rule.marketplaceHandlingCents)}`);
  }
  return parts.join(" · ");
}
