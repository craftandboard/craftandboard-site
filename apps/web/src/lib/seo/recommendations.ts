import type { SeoHealthReport } from "./health";
import type { SeoInventoryEntry } from "./inventory";
import type { SearchConsolePageMetric } from "./searchConsole";

export type SeoOpportunityType =
  | "LOW_CTR_HIGH_IMPRESSIONS"
  | "POSITION_11_TO_20_OPPORTUNITY"
  | "HIGH_TRAFFIC_LOW_CONVERSION"
  | "STRONG_GUIDE_WEAK_COMMERCE_LINKING"
  | "MISSING_OR_WEAK_INTERNAL_LINKING"
  | "STALE_CONTENT_REFRESH"
  | "WEAK_TITLE_OR_DESCRIPTION"
  | "THIN_SUPPORTING_CONTENT"
  | "HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY"
  | "INDEXATION_OR_HEALTH_FIX";

export type SeoOpportunityRecommendation = {
  recommendationSummary: string;
  detailedRecommendations: string[];
  suggestedNextAction: string;
  targetKeywordHint: string | null;
  sourceSignals: string[];
};

type RecommendationContext = {
  entry: SeoInventoryEntry;
  report: SeoHealthReport;
  metric: SearchConsolePageMetric | null;
  organicCheckoutStarts: number;
};

function keywordHintFromEntry(entry: SeoInventoryEntry) {
  return entry.title.replace(/\s+\|\s+Craft & Board$/, "").trim() || null;
}

function getPageLabel(entry: SeoInventoryEntry) {
  if (entry.pageType === "GUIDE_ARTICLE") {
    return "guide";
  }
  if (entry.pageType === "PRODUCT") {
    return "product page";
  }
  if (entry.pageType === "CATEGORY") {
    return "category page";
  }
  if (entry.pageType === "VARIANT") {
    return "variant page";
  }
  if (entry.pageType === "VARIANT_COMBINATION") {
    return "combination page";
  }
  if (entry.pageType === "HOME") {
    return "homepage";
  }
  return "page";
}

export function getSeoRecommendationsForOpportunity(
  opportunityType: SeoOpportunityType,
  context: RecommendationContext
): SeoOpportunityRecommendation {
  const pageLabel = getPageLabel(context.entry);
  const keywordHint = keywordHintFromEntry(context.entry);
  const sourceSignals = [
    ...(context.report.healthWarnings.length > 0 ? context.report.healthWarnings : []),
    ...(context.metric
      ? [
          `${context.metric.impressions} impressions`,
          `${(context.metric.ctr * 100).toFixed(1)}% CTR`,
          `avg. position ${context.metric.averagePosition.toFixed(1)}`
        ]
      : []),
    ...(context.organicCheckoutStarts > 0 ? [`${context.organicCheckoutStarts} organic checkout starts`] : [])
  ];

  if (opportunityType === "LOW_CTR_HIGH_IMPRESSIONS") {
    return {
      recommendationSummary: `Rewrite the search snippet for this ${pageLabel} to convert visibility into more clicks.`,
      detailedRecommendations: context.entry.pageType === "PRODUCT"
        ? [
            "Tighten the product title around the strongest commercial phrase while keeping the material or custom-build angle visible.",
            "Rewrite the meta description so it leads with configurability, made-to-order quality, and the primary use case.",
            "Keep the flagship PDP link prominence high from nearby categories and guides so the new snippet has stronger support."
          ]
        : context.entry.pageType === "GUIDE_ARTICLE"
          ? [
              "Rewrite the guide title to match the highest-intent phrasing more directly without sounding generic.",
              "Refresh the meta description so it promises a practical answer plus a path into the relevant product or variant pages.",
              "Keep the CTA and related product links visible high enough on the guide to reinforce commercial relevance."
            ]
          : [
              "Refine the title so the exact long-tail phrase is clearer and more compelling in the SERP.",
              "Rewrite the meta description to emphasize the material, size, or room-use intent behind the page.",
              "Reinforce the page with stronger links from the matching guide, category, and PDP cluster."
            ],
      suggestedNextAction: "Rewrite title and meta description",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "POSITION_11_TO_20_OPPORTUNITY") {
    return {
      recommendationSummary: `Strengthen this ${pageLabel} so it can move from page-two visibility into stronger first-page rankings.`,
      detailedRecommendations: context.entry.pageType === "GUIDE_ARTICLE"
        ? [
            "Refresh the intro and at least one supporting section to better answer the exact search intent.",
            "Strengthen contextual links into the most relevant product and variant pages so the guide passes more authority into commerce paths.",
            "Review FAQ coverage to ensure the guide answers the secondary questions searchers expect."
          ]
        : [
            "Expand the supporting copy so the page is more distinct from neighboring variants or categories.",
            "Add or strengthen related guide, variant, and flagship product links around the target cluster.",
            "Tighten the title and description so the page lines up more precisely with the ranking phrase."
          ],
      suggestedNextAction: "Refresh supporting copy and internal links",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "HIGH_TRAFFIC_LOW_CONVERSION") {
    return {
      recommendationSummary: `This ${pageLabel} attracts attention but is not moving enough readers deeper into the configurator path.`,
      detailedRecommendations: context.entry.pageType === "GUIDE_ARTICLE"
        ? [
            "Move the primary product CTA higher in the guide so readers do not have to finish the full article before finding the commerce path.",
            "Strengthen related product and variant blocks with more commercially direct anchor text.",
            "Align the guide summary and CTA language more tightly with the product family the guide is meant to support."
          ]
        : [
            "Review CTA placement and product-path clarity so the next click is obvious from the page body.",
            "Strengthen commerce-oriented internal links to the flagship product or category path.",
            "Reduce ambiguity in the intro copy so visitors understand what to configure next."
          ],
      suggestedNextAction: "Strengthen CTA and commerce-linking path",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "STRONG_GUIDE_WEAK_COMMERCE_LINKING") {
    return {
      recommendationSummary: "This guide is doing educational work but needs a stronger handoff into product and variant pages.",
      detailedRecommendations: [
        "Add a more commercially direct product CTA block higher in the guide.",
        "Strengthen related variant links so the guide routes into dimension, material, or use-case landing pages more explicitly.",
        "Review anchor text so the guide links use natural but higher-intent phrases connected to the live product family."
      ],
      suggestedNextAction: "Upgrade guide-to-product linking",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "MISSING_OR_WEAK_INTERNAL_LINKING") {
    return {
      recommendationSummary: `This ${pageLabel} needs stronger supporting links from the rest of the shelf-and-mantel cluster.`,
      detailedRecommendations: context.entry.pageType === "PRODUCT"
        ? [
            "Add or strengthen links to the top-performing guides that answer pre-purchase questions.",
            "Expose the most important size, material, and use-case variant pages close to the conversion path.",
            "Keep one clear category back-link so the PDP remains discoverable from the family hub."
          ]
        : [
            "Increase links from the most relevant guides, categories, and adjacent variants.",
            "Keep the flagship product link and category link visible inside the main related-content module.",
            "Review whether the page belongs in a stronger keyword cluster grouping."
          ],
      suggestedNextAction: "Strengthen internal linking",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "STALE_CONTENT_REFRESH") {
    return {
      recommendationSummary: `This ${pageLabel} should be refreshed so the content stays competitive and current.`,
      detailedRecommendations: [
        "Update the intro and at least one supporting section with sharper, more current phrasing.",
        "Review whether the CTA and related links still reflect the strongest commerce path.",
        "Refresh any dated positioning so the content reads maintained rather than set-and-forget."
      ],
      suggestedNextAction: "Refresh core page content",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "WEAK_TITLE_OR_DESCRIPTION") {
    return {
      recommendationSummary: `The metadata for this ${pageLabel} should be tightened before larger content work.`,
      detailedRecommendations: [
        "Bring the title into a stronger length and keyword-intent range.",
        "Rewrite the description so it promises a clearer value proposition and next step.",
        "Keep the metadata aligned with the page's actual product family and search intent."
      ],
      suggestedNextAction: "Fix title and description",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "THIN_SUPPORTING_CONTENT") {
    return {
      recommendationSummary: `This ${pageLabel} likely needs richer supporting copy to compete better for its target phrase.`,
      detailedRecommendations: [
        "Expand the intro or supporting block so the page answers the use case more specifically.",
        "Differentiate the page more clearly from neighboring variants or combinations.",
        "Add one stronger context block that connects the search phrase to the actual configured product path."
      ],
      suggestedNextAction: "Enrich supporting content",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  if (opportunityType === "HIGH_COMMERCIAL_PRIORITY_LOW_VISIBILITY") {
    return {
      recommendationSummary: `This ${pageLabel} matters commercially but is not yet earning enough search visibility.`,
      detailedRecommendations: [
        "Prioritize internal links from guides, category pages, and adjacent variants into this page.",
        "Review title and description wording so the page matches the strongest commercial search phrasing.",
        "If the page is a product or variant path, reinforce it near the top of the category architecture."
      ],
      suggestedNextAction: "Increase visibility for a commercially important page",
      targetKeywordHint: keywordHint,
      sourceSignals
    };
  }

  return {
    recommendationSummary: `Resolve the technical or health issues affecting this ${pageLabel} before broader optimization work.`,
    detailedRecommendations: [
      "Fix the sitemap, indexability, metadata, or structured-data issue first.",
      "Recheck the page in the SEO health report after the fix ships.",
      "Only after the health issue is resolved should copy or CTR optimization move ahead."
    ],
    suggestedNextAction: "Fix technical SEO health issues",
    targetKeywordHint: keywordHint,
    sourceSignals
  };
}
