import type { SeoOpportunityType } from "./recommendations";

export type SeoImpactScore = "LOW" | "MEDIUM" | "HIGH";
export type SeoEffortScore = "LOW" | "MEDIUM" | "HIGH";

type ScoreInput = {
  opportunityType: SeoOpportunityType;
  pageType: string;
  impressions: number | null;
  ctr: number | null;
  averagePosition: number | null;
  organicCheckoutStarts: number | null;
  healthWarningCount: number;
  productFamily: string | null;
  topicCluster: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCommercialWeight(input: ScoreInput) {
  let score = 0;

  if (["PRODUCT", "VARIANT", "VARIANT_COMBINATION", "CATEGORY"].includes(input.pageType)) {
    score += 18;
  }
  if ((input.organicCheckoutStarts ?? 0) > 0) {
    score += Math.min(20, (input.organicCheckoutStarts ?? 0) * 4);
  }
  if (input.pageType === "GUIDE_ARTICLE") {
    score += 8;
  }

  return score;
}

function getMetricWeight(input: ScoreInput) {
  let score = 0;
  score += Math.min(30, Math.round((input.impressions ?? 0) / 40));

  if (input.ctr !== null && input.impressions !== null && input.impressions >= 50 && input.ctr < 0.03) {
    score += 14;
  }

  if (input.averagePosition !== null && input.averagePosition >= 11 && input.averagePosition <= 20) {
    score += 16;
  }

  return score;
}

function getHealthWeight(input: ScoreInput) {
  let score = Math.min(20, input.healthWarningCount * 4);

  if (input.opportunityType === "INDEXATION_OR_HEALTH_FIX") {
    score += 14;
  }

  if (input.opportunityType === "MISSING_OR_WEAK_INTERNAL_LINKING") {
    score += 8;
  }

  return score;
}

function getOpportunityBonus(input: ScoreInput) {
  switch (input.opportunityType) {
    case "LOW_CTR_HIGH_IMPRESSIONS":
      return 18;
    case "POSITION_11_TO_20_OPPORTUNITY":
      return 17;
    case "HIGH_TRAFFIC_LOW_CONVERSION":
      return 16;
    case "STRONG_GUIDE_WEAK_COMMERCE_LINKING":
      return 14;
    case "HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY":
      return 15;
    case "INDEXATION_OR_HEALTH_FIX":
      return 16;
    case "STALE_CONTENT_REFRESH":
      return 10;
    case "THIN_SUPPORTING_CONTENT":
      return 11;
    case "WEAK_TITLE_OR_DESCRIPTION":
      return 12;
    default:
      return 9;
  }
}

export function scoreSeoOpportunity(input: ScoreInput) {
  const baseScore =
    getCommercialWeight(input) +
    getMetricWeight(input) +
    getHealthWeight(input) +
    getOpportunityBonus(input);

  return clamp(baseScore, 1, 100);
}

export function getImpactScore(input: {
  opportunityType: SeoOpportunityType;
  impressions: number | null;
  organicCheckoutStarts: number | null;
  priorityScore: number;
}): SeoImpactScore {
  if (input.priorityScore >= 75 || (input.impressions ?? 0) >= 250 || (input.organicCheckoutStarts ?? 0) >= 3) {
    return "HIGH";
  }
  if (input.priorityScore >= 45 || (input.impressions ?? 0) >= 75) {
    return "MEDIUM";
  }
  return "LOW";
}

export function getEffortScore(opportunityType: SeoOpportunityType): SeoEffortScore {
  switch (opportunityType) {
    case "LOW_CTR_HIGH_IMPRESSIONS":
    case "WEAK_TITLE_OR_DESCRIPTION":
    case "MISSING_OR_WEAK_INTERNAL_LINKING":
    case "INDEXATION_OR_HEALTH_FIX":
      return "LOW";
    case "POSITION_11_TO_20_OPPORTUNITY":
    case "HIGH_TRAFFIC_LOW_CONVERSION":
    case "STRONG_GUIDE_WEAK_COMMERCE_LINKING":
    case "HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY":
      return "MEDIUM";
    case "STALE_CONTENT_REFRESH":
    case "THIN_SUPPORTING_CONTENT":
      return "HIGH";
    default:
      return "MEDIUM";
  }
}
