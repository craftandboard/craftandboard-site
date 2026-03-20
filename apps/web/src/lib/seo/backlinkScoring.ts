import type { SeoInventoryEntry } from "./inventory";
import type { SeoOpportunity } from "./opportunities";

export function scoreBacklinkAsset(input: {
  entry: SeoInventoryEntry;
  opportunities: SeoOpportunity[];
}) {
  const relatedOpportunities = input.opportunities.filter((opportunity) => opportunity.path === input.entry.path);
  const highestOpportunity = relatedOpportunities[0]?.priorityScore ?? 0;
  const overrideBoost = relatedOpportunities.some((opportunity) => opportunity.hasActiveOverride) ? 8 : 0;
  const guideBoost = input.entry.pageType === "GUIDE_ARTICLE" ? 18 : 0;
  const categoryBoost = input.entry.pageType === "CATEGORY" ? 14 : 0;
  const productBoost = input.entry.pageType === "PRODUCT" ? 12 : 0;
  const variantPenalty = input.entry.pageType === "VARIANT" ? -6 : 0;
  const comboPenalty = input.entry.pageType === "VARIANT_COMBINATION" ? -10 : 0;

  return Math.max(
    0,
    Math.min(100, Math.round(input.entry.priority * 50 + highestOpportunity * 0.45 + overrideBoost + guideBoost + categoryBoost + productBoost + variantPenalty + comboPenalty))
  );
}
