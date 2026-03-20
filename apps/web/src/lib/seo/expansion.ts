import type { SeoOpportunity } from "./opportunities";
import type { SearchConsoleQueryMetric } from "./searchConsole";
import type { SeoInventoryEntry } from "./inventory";
import { buildSearchConsoleKeywordGapCandidates } from "./seoKeywordGaps";
import {
  getSuggestedExpansionSeedCandidates,
  type SeoExpansionCandidatePageType,
  type SeoExpansionCandidateSeed,
  type SeoExpansionCandidateSource,
  type SeoExpansionCandidateStatus,
  type SeoExpansionDifficultyEstimate
} from "./seoExpansionRules";

export type SeoExpansionCandidate = {
  candidateKey: string;
  slug: string;
  pageType: SeoExpansionCandidatePageType;
  productFamily: SeoInventoryEntry["productFamily"];
  source: SeoExpansionCandidateSource;
  targetKeyword: string;
  keywordCluster: string;
  difficultyEstimate: SeoExpansionDifficultyEstimate;
  priorityScore: number;
  recommendedAction: string;
  status: SeoExpansionCandidateStatus;
  notes: string | null;
};

function generatedPaths(inventory: SeoInventoryEntry[]) {
  return new Set(inventory.map((entry) => entry.path));
}

function generatedPathForCandidate(candidate: SeoExpansionCandidateSeed) {
  if (!candidate.productFamily) {
    return candidate.pageType === "GUIDE" ? `/guides/${candidate.slug}` : null;
  }

  if (candidate.pageType === "GUIDE") {
    return `/guides/${candidate.slug}`;
  }

  return `/${candidate.productFamily}/${candidate.slug}`;
}

function mergeCandidateStatus(candidate: SeoExpansionCandidateSeed, inventory: SeoInventoryEntry[]) {
  const existingPaths = generatedPaths(inventory);
  const path = generatedPathForCandidate(candidate);

  if (path && existingPaths.has(path)) {
    return "GENERATED" as const;
  }

  return candidate.status;
}

function scoreCommercialBoost(candidate: SeoExpansionCandidateSeed, opportunities: SeoOpportunity[]) {
  const nearby = opportunities.find((opportunity) =>
    opportunity.productFamily === candidate.productFamily &&
    opportunity.topicCluster?.includes(candidate.keywordCluster.split("-")[0] ?? "")
  );

  return nearby ? Math.min(12, Math.round(nearby.priorityScore / 10)) : 0;
}

export function buildSeoExpansionCandidates(input: {
  inventory: SeoInventoryEntry[];
  opportunities?: SeoOpportunity[];
  queryMetrics?: SearchConsoleQueryMetric[];
}) {
  const seeds = [
    ...getSuggestedExpansionSeedCandidates(),
    ...buildSearchConsoleKeywordGapCandidates({
      inventory: input.inventory,
      queries: input.queryMetrics ?? []
    })
  ];

  const byKey = new Map<string, SeoExpansionCandidate>();

  for (const seed of seeds) {
    const mergedStatus = mergeCandidateStatus(seed, input.inventory);
    const priorityScore = Math.min(
      100,
      seed.priorityScore + scoreCommercialBoost(seed, input.opportunities ?? []) + (mergedStatus === "GENERATED" ? 6 : 0)
    );

    byKey.set(seed.candidateKey, {
      ...seed,
      priorityScore,
      status: mergedStatus
    });
  }

  return [...byKey.values()].sort((left, right) => right.priorityScore - left.priorityScore);
}

export function getTopSeoExpansionCandidates(candidates: SeoExpansionCandidate[]) {
  return candidates.slice(0, 12);
}
