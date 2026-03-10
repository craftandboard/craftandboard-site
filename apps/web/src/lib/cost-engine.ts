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

export function getAmazonFeePresetSummary(preset: {
  referralFeePct: number;
  closingFeeCents: number | null;
  fulfillmentFeeCents: number | null;
  advertisingAllowancePct: number | null;
  returnReservePct: number | null;
  damageReservePct: number | null;
  miscMarketplacePct: number | null;
}) {
  const parts = [`Referral ${formatPercent(preset.referralFeePct)}`];
  if (preset.closingFeeCents) parts.push(`Closing ${formatMoney(preset.closingFeeCents)}`);
  if (preset.fulfillmentFeeCents) parts.push(`Fulfillment ${formatMoney(preset.fulfillmentFeeCents)}`);
  if (preset.advertisingAllowancePct) parts.push(`Ads ${formatPercent(preset.advertisingAllowancePct)}`);
  if (preset.returnReservePct) parts.push(`Returns ${formatPercent(preset.returnReservePct)}`);
  if (preset.damageReservePct) parts.push(`Damage ${formatPercent(preset.damageReservePct)}`);
  if (preset.miscMarketplacePct) parts.push(`Misc ${formatPercent(preset.miscMarketplacePct)}`);
  return parts.join(" · ");
}

export function getShippingZoneRuleSummary(rule: {
  zoneCode: string;
  baseCostCents: number;
  weightAdderCents: number | null;
  dimensionalAdderCents: number | null;
  bufferPct: number | null;
  bufferCents: number | null;
  marketplaceHandlingCents: number | null;
}) {
  const parts = [`Zone ${rule.zoneCode}`, `Base ${formatMoney(rule.baseCostCents)}`];
  if (rule.weightAdderCents) parts.push(`Weight ${formatMoney(rule.weightAdderCents)}/lb`);
  if (rule.dimensionalAdderCents) parts.push(`Dim ${formatMoney(rule.dimensionalAdderCents)}/lb`);
  if (rule.bufferPct) parts.push(`Buffer ${formatPercent(rule.bufferPct)}`);
  if (rule.bufferCents) parts.push(`Buffer ${formatMoney(rule.bufferCents)}`);
  if (rule.marketplaceHandlingCents) {
    parts.push(`Handling ${formatMoney(rule.marketplaceHandlingCents)}`);
  }
  return parts.join(" · ");
}
