import type { SearchConsoleQueryMetric } from "./searchConsole";
import type { SeoInventoryEntry } from "./inventory";
import type { SeoExpansionCandidateSeed } from "./seoExpansionRules";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function existingSlugs(inventory: SeoInventoryEntry[]) {
  return new Set(
    inventory
      .filter((entry) => entry.path !== "/")
      .map((entry) => entry.path.split("/").filter(Boolean).at(-1) ?? "")
      .filter(Boolean)
  );
}

function inferFamily(query: string) {
  const normalized = query.toLowerCase();
  if (normalized.includes("mantel")) {
    return "floating-mantels" as const;
  }
  if (normalized.includes("shelf")) {
    return "floating-shelves" as const;
  }
  return null;
}

function inferCandidate(query: string) {
  const normalized = query.toLowerCase();

  const dimensionMatch = normalized.match(/\b(36|42|48|60|72|84)\s*(inch|in)\b/);
  const hasWhiteOak = normalized.includes("white oak");
  const hasWalnut = normalized.includes("walnut");
  const hasMaple = normalized.includes("maple");
  const hasOffice = normalized.includes("office");
  const hasBathroom = normalized.includes("bathroom");
  const hasModern = normalized.includes("modern");
  const hasRustic = normalized.includes("rustic");

  const dimensionSlug = dimensionMatch ? `${dimensionMatch[1]}-inch` : null;
  const materialSlug = hasWhiteOak ? "white-oak" : hasWalnut ? "walnut" : hasMaple ? "maple" : null;
  const useCaseSlug = hasOffice
    ? "office"
    : hasBathroom
      ? "bathroom"
      : hasModern
        ? "modern"
        : hasRustic
          ? "rustic"
          : null;

  if (dimensionSlug && materialSlug) {
    return {
      slug: `${dimensionSlug}-${materialSlug}`,
      pageType: "VARIANT_COMBO" as const,
      keywordCluster: "dimension-material"
    };
  }

  if (dimensionSlug) {
    return {
      slug: dimensionSlug,
      pageType: "DIMENSION" as const,
      keywordCluster: "dimensions"
    };
  }

  if (materialSlug) {
    return {
      slug: materialSlug,
      pageType: "MATERIAL" as const,
      keywordCluster: "materials"
    };
  }

  if (useCaseSlug) {
    return {
      slug: useCaseSlug,
      pageType: "USE_CASE" as const,
      keywordCluster: "use-cases"
    };
  }

  return null;
}

export function buildSearchConsoleKeywordGapCandidates(input: {
  inventory: SeoInventoryEntry[];
  queries: SearchConsoleQueryMetric[];
}) {
  const knownSlugs = existingSlugs(input.inventory);
  const suggestions: SeoExpansionCandidateSeed[] = [];

  for (const queryMetric of input.queries) {
    const family = inferFamily(queryMetric.query);
    const candidate = inferCandidate(queryMetric.query);

    if (!family || !candidate || knownSlugs.has(candidate.slug)) {
      continue;
    }

    const candidateKey = `query:${family}:${candidate.slug}`;
    if (suggestions.some((item) => item.candidateKey === candidateKey)) {
      continue;
    }

    suggestions.push({
      candidateKey,
      slug: candidate.slug,
      pageType: candidate.pageType,
      productFamily: family,
      source: "SEARCH_CONSOLE_QUERY",
      targetKeyword: queryMetric.query,
      keywordCluster: candidate.keywordCluster,
      difficultyEstimate:
        queryMetric.averagePosition <= 15 ? "LOW" : queryMetric.averagePosition <= 30 ? "MEDIUM" : "HIGH",
      priorityScore: Math.round(queryMetric.impressions * 0.2 + queryMetric.clicks * 2 + Math.max(0, 40 - queryMetric.averagePosition)),
      recommendedAction:
        candidate.pageType === "VARIANT_COMBO"
          ? "Review and approve a new combination landing page if the query stays distinct from existing variants."
          : "Review and approve a new programmatic landing page if the query aligns with real product intent.",
      status: "SUGGESTED",
      notes: `Detected from Search Console query gap for ${family}. Normalized slug candidate: ${slugify(candidate.slug)}.`
    });
  }

  return suggestions.sort((left, right) => right.priorityScore - left.priorityScore);
}
