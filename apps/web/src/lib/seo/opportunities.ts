import type { SeoHealthReport } from "./health";
import type { SeoInventoryEntry } from "./inventory";
import { getSeoOverrideSummary } from "./overrideResolver";
import { getSeoRecommendationsForOpportunity, type SeoOpportunityType } from "./recommendations";
import { getEffortScore, getImpactScore, scoreSeoOpportunity, type SeoEffortScore, type SeoImpactScore } from "./scoring";
import type { SearchConsolePageMetric } from "./searchConsole";

export type SeoOpportunity = {
  pageKey: SeoInventoryEntry["pageKey"];
  path: string;
  pageType: SeoInventoryEntry["pageType"];
  productFamily: SeoInventoryEntry["productFamily"];
  topicCluster: SeoInventoryEntry["topicCluster"];
  opportunityType: SeoOpportunityType;
  priorityScore: number;
  impactScore: SeoImpactScore;
  effortScore: SeoEffortScore;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  averagePosition: number | null;
  organicCheckoutStarts: number | null;
  healthWarnings: string[];
  recommendationSummary: string;
  detailedRecommendations: string[];
  sourceSignals: string[];
  suggestedNextAction: string;
  targetKeywordHint: string | null;
  hasActiveOverride: boolean;
  overrideKeywordTargetHint: string | null;
  overrideRefreshNote: string | null;
  overrideLastUpdated: string | null;
  lastEvaluatedAt: string;
};

type AttributionRow = {
  path: string;
  pageType: SeoInventoryEntry["pageType"] | "UNMATCHED";
  productFamily: string | null;
  checkoutStarts: number;
  reachedPayment: number;
  paid: number;
};

function daysSince(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function hasThinSupportingContent(entry: SeoInventoryEntry, report: SeoHealthReport) {
  return (
    ["VARIANT", "VARIANT_COMBINATION", "STATIC_PAGE"].includes(entry.pageType) &&
    report.internalLinkSupportLevel === "LOW" &&
    (report.averagePosition ?? 99) > 10
  );
}

function getOpportunityTypes(input: {
  entry: SeoInventoryEntry;
  report: SeoHealthReport;
  attribution: AttributionRow | null;
}) {
  const types = new Set<SeoOpportunityType>();
  const impressions = input.report.impressions ?? 0;
  const ctr = input.report.ctr ?? null;
  const position = input.report.averagePosition ?? null;
  const checkoutStarts = input.attribution?.checkoutStarts ?? 0;

  if (
    input.report.healthWarnings.some((warning) =>
      ["Missing from sitemap", "Unexpectedly non-indexable public page", "Missing structured data"].includes(warning)
    )
  ) {
    types.add("INDEXATION_OR_HEALTH_FIX");
  }

  if (!input.report.titleLengthOk || !input.report.descriptionLengthOk) {
    types.add("WEAK_TITLE_OR_DESCRIPTION");
  }

  if (input.report.internalLinkSupportLevel === "LOW") {
    types.add("MISSING_OR_WEAK_INTERNAL_LINKING");
  }

  if (impressions >= 100 && ctr !== null && ctr < 0.03) {
    types.add("LOW_CTR_HIGH_IMPRESSIONS");
  }

  if (impressions >= 75 && position !== null && position >= 11 && position <= 20) {
    types.add("POSITION_11_TO_20_OPPORTUNITY");
  }

  if (impressions >= 120 && checkoutStarts === 0) {
    types.add("HIGH_TRAFFIC_LOW_CONVERSION");
  }

  if (input.entry.pageType === "GUIDE_ARTICLE" && impressions >= 100 && checkoutStarts === 0) {
    types.add("STRONG_GUIDE_WEAK_COMMERCE_LINKING");
  }

  if (hasThinSupportingContent(input.entry, input.report)) {
    types.add("THIN_SUPPORTING_CONTENT");
  }

  const ageDays = daysSince(input.entry.lastModified);
  if (ageDays !== null && ageDays >= 180 && ["GUIDE_ARTICLE", "VARIANT", "VARIANT_COMBINATION"].includes(input.entry.pageType)) {
    types.add("STALE_CONTENT_REFRESH");
  }

  if (
    ["PRODUCT", "CATEGORY", "VARIANT", "VARIANT_COMBINATION"].includes(input.entry.pageType) &&
    impressions < 50 &&
    (checkoutStarts > 0 || input.entry.priority >= 0.8)
  ) {
    types.add("HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY");
  }

  return [...types];
}

export function buildSeoOpportunityQueue(input: {
  inventory: SeoInventoryEntry[];
  reports: SeoHealthReport[];
  metrics: SearchConsolePageMetric[];
  attributionSummary: AttributionRow[];
}) {
  const reportByPath = new Map(input.reports.map((report) => [report.path, report]));
  const metricByPath = new Map(input.metrics.map((metric) => [metric.matchedPath, metric]));
  const attributionByPath = new Map(input.attributionSummary.map((row) => [row.path, row]));
  const lastEvaluatedAt = new Date().toISOString();
  const opportunities: SeoOpportunity[] = [];

  for (const entry of input.inventory) {
    const report = reportByPath.get(entry.path);

    if (!report) {
      continue;
    }

    const metric = metricByPath.get(entry.path) ?? null;
    const attribution = attributionByPath.get(entry.path) ?? null;
    const opportunityTypes = getOpportunityTypes({
      entry,
      report,
      attribution
    });

    for (const opportunityType of opportunityTypes) {
      const overrideSummary = getSeoOverrideSummary(entry.pageKey);
      const priorityScore = scoreSeoOpportunity({
        opportunityType,
        pageType: entry.pageType,
        impressions: report.impressions,
        ctr: report.ctr,
        averagePosition: report.averagePosition,
        organicCheckoutStarts: attribution?.checkoutStarts ?? 0,
        healthWarningCount: report.healthWarnings.length,
        productFamily: entry.productFamily,
        topicCluster: entry.topicCluster
      });
      const recommendations = getSeoRecommendationsForOpportunity(opportunityType, {
        entry,
        report,
        metric,
        organicCheckoutStarts: attribution?.checkoutStarts ?? 0
      });

      opportunities.push({
        pageKey: entry.pageKey,
        path: entry.path,
        pageType: entry.pageType,
        productFamily: entry.productFamily,
        topicCluster: entry.topicCluster,
        opportunityType,
        priorityScore,
        impactScore: getImpactScore({
          opportunityType,
          impressions: report.impressions,
          organicCheckoutStarts: attribution?.checkoutStarts ?? 0,
          priorityScore
        }),
        effortScore: getEffortScore(opportunityType),
        impressions: report.impressions,
        clicks: report.clicks,
        ctr: report.ctr,
        averagePosition: report.averagePosition,
        organicCheckoutStarts: attribution?.checkoutStarts ?? 0,
        healthWarnings: report.healthWarnings,
        recommendationSummary: recommendations.recommendationSummary,
        detailedRecommendations: recommendations.detailedRecommendations,
        sourceSignals: recommendations.sourceSignals,
        suggestedNextAction: recommendations.suggestedNextAction,
        targetKeywordHint: recommendations.targetKeywordHint,
        hasActiveOverride: overrideSummary.hasOverride,
        overrideKeywordTargetHint: overrideSummary.keywordTargetHint,
        overrideRefreshNote: overrideSummary.refreshNote,
        overrideLastUpdated: overrideSummary.lastUpdated,
        lastEvaluatedAt
      });
    }
  }

  return opportunities.sort((left, right) => right.priorityScore - left.priorityScore);
}

export function getQuickWinOpportunities(opportunities: SeoOpportunity[]) {
  return opportunities
    .filter((opportunity) => opportunity.effortScore === "LOW" && opportunity.impactScore !== "LOW")
    .slice(0, 10);
}

export function getHighImpactContentRefreshOpportunities(opportunities: SeoOpportunity[]) {
  return opportunities
    .filter((opportunity) =>
      ["STALE_CONTENT_REFRESH", "THIN_SUPPORTING_CONTENT", "POSITION_11_TO_20_OPPORTUNITY"].includes(opportunity.opportunityType)
    )
    .slice(0, 10);
}

export function getCtrImprovementOpportunities(opportunities: SeoOpportunity[]) {
  return opportunities
    .filter((opportunity) => opportunity.opportunityType === "LOW_CTR_HIGH_IMPRESSIONS")
    .slice(0, 10);
}

export function getInternalLinkingOpportunities(opportunities: SeoOpportunity[]) {
  return opportunities
    .filter((opportunity) =>
      ["MISSING_OR_WEAK_INTERNAL_LINKING", "STRONG_GUIDE_WEAK_COMMERCE_LINKING"].includes(opportunity.opportunityType)
    )
    .slice(0, 10);
}

export function getOrganicConversionOpportunities(opportunities: SeoOpportunity[]) {
  return opportunities
    .filter((opportunity) =>
      ["HIGH_TRAFFIC_LOW_CONVERSION", "HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY"].includes(opportunity.opportunityType)
    )
    .slice(0, 10);
}
