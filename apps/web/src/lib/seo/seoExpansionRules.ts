import type {
  ProductSeoVariantComboConfig,
  ProductSeoVariantConfig,
  SeoProductFamily
} from "./productSeoConfig";

export type SeoExpansionCandidatePageType =
  | "VARIANT"
  | "VARIANT_COMBO"
  | "GUIDE"
  | "USE_CASE"
  | "MATERIAL"
  | "DIMENSION";

export type SeoExpansionCandidateSource =
  | "SEARCH_CONSOLE_QUERY"
  | "KEYWORD_CLUSTER"
  | "VARIANT_RULE"
  | "GUIDE_RULE"
  | "MANUAL";

export type SeoExpansionCandidateStatus = "SUGGESTED" | "APPROVED" | "GENERATED" | "REJECTED";
export type SeoExpansionDifficultyEstimate = "LOW" | "MEDIUM" | "HIGH";

export type SeoExpansionCandidateSeed = {
  candidateKey: string;
  slug: string;
  pageType: SeoExpansionCandidatePageType;
  productFamily: SeoProductFamily | null;
  source: SeoExpansionCandidateSource;
  targetKeyword: string;
  keywordCluster: string;
  difficultyEstimate: SeoExpansionDifficultyEstimate;
  priorityScore: number;
  recommendedAction: string;
  status: SeoExpansionCandidateStatus;
  notes: string | null;
};

const approvedVariantConfigs: Record<SeoProductFamily, ProductSeoVariantConfig[]> = {
  "cabinet-shelves": [],
  "floating-shelves": [
    {
      slug: "36-inch",
      kind: "dimension",
      label: "36 Inch Floating Shelf",
      title: "36 Inch Floating Shelf | Custom Solid Wood Shelves | Craft & Board",
      description: "Custom 36 inch floating shelves built to order in solid hardwood for tighter wall spans, compact kitchens, and smaller design-led rooms.",
      intro: "A 36 inch floating shelf is a useful custom size when the wall needs a cleaner short span than stock shelving usually offers.",
      guidanceTitle: "Where a 36 inch shelf works best",
      guidanceBody: "Use this span in bathrooms, compact kitchens, office nooks, and smaller accent walls where exact proportion matters more than maximum length.",
      ctaLabel: "Configure a 36 Inch Shelf"
    },
    {
      slug: "office",
      kind: "use-case",
      label: "Floating Shelves for Offices",
      title: "Floating Shelves for Offices | Custom Wood Office Shelving | Craft & Board",
      description: "Custom floating shelves for offices with tailored sizing, concealed mounting, and hardwood finishes for cleaner workspaces and study walls.",
      intro: "Office floating shelves need to balance storage, styling, and visual calm, which is why made-to-order width and depth often outperform stock shelving.",
      guidanceTitle: "Planning floating shelves for offices",
      guidanceBody: "Use custom shelves to align with desks, millwork, and display needs so the office feels integrated instead of assembled from mismatched parts.",
      ctaLabel: "Configure Office Shelves"
    },
    {
      slug: "bathroom",
      kind: "use-case",
      label: "Floating Shelves for Bathrooms",
      title: "Floating Shelves for Bathrooms | Custom Wood Bathroom Shelves | Craft & Board",
      description: "Custom floating shelves for bathrooms with tailored sizing, hardwood material direction, and concealed support for cleaner open storage.",
      intro: "Bathroom floating shelves work best when the width, depth, and wood tone are planned around tile lines, vanities, and the tighter scale of the room.",
      guidanceTitle: "Using floating shelves in bathrooms",
      guidanceBody: "Custom shelf sizing helps bathroom storage feel intentional, especially where wall space is limited and the shelf needs to align tightly with a vanity or niche.",
      ctaLabel: "Configure Bathroom Shelves"
    }
  ],
  "floating-mantels": [
    {
      slug: "modern",
      kind: "use-case",
      label: "Modern Floating Mantels",
      title: "Modern Floating Mantels | Custom Wood Mantels | Craft & Board",
      description: "Explore modern floating mantels with clean spans, tailored profile depth, and premium wood direction for more architectural fireplace walls.",
      intro: "A modern floating mantel usually succeeds through restraint: cleaner lines, tighter proportion, and a material direction that supports the fireplace wall without clutter.",
      guidanceTitle: "What makes a floating mantel feel modern",
      guidanceBody: "Focus on a clean span, a disciplined section profile, and a wood tone that supports plaster, stone, or minimal built-ins without overpowering the room.",
      ctaLabel: "Configure a Modern Mantel"
    },
    {
      slug: "rustic",
      kind: "use-case",
      label: "Rustic Floating Mantels",
      title: "Rustic Floating Mantels | Custom Wood Mantels | Craft & Board",
      description: "Custom rustic floating mantels with tailored span, warm wood tone, and concealed support for more grounded fireplace-wall designs.",
      intro: "A rustic floating mantel works best when the wood tone, profile weight, and fireplace context feel substantial without sliding into a generic faux-beam look.",
      guidanceTitle: "Planning a rustic mantel with cleaner execution",
      guidanceBody: "Use a made-to-order span and warmer wood direction when the room wants more texture and visual weight but still needs a refined concealed-support path.",
      ctaLabel: "Configure a Rustic Mantel"
    }
  ]
};

const approvedComboConfigs: Record<SeoProductFamily, ProductSeoVariantComboConfig[]> = {
  "cabinet-shelves": [],
  "floating-shelves": [
    {
      slug: "36-inch-white-oak",
      kind: "dimension-material",
      label: "36 Inch White Oak Floating Shelf",
      title: "36 Inch White Oak Floating Shelf | Craft & Board",
      description: "Custom 36 inch white oak floating shelves with made-to-order sizing, concealed mounting, and a warm hardwood direction for tighter spaces.",
      intro: "A 36 inch white oak floating shelf is a strong fit for bathrooms, office nooks, and smaller walls that still need a premium wood direction.",
      guidanceTitle: "Why 36 inch and white oak work together",
      guidanceBody: "This combination brings a compact, high-utility shelf span together with one of the most versatile material directions in the current shelf line.",
      ctaLabel: "Configure a 36 Inch White Oak Shelf",
      componentSlugs: {
        dimension: "36-inch",
        material: "white-oak"
      }
    }
  ],
  "floating-mantels": []
};

const suggestedManualSeeds: SeoExpansionCandidateSeed[] = [
  {
    candidateKey: "manual:guide:floating-shelf-spacing-guide",
    slug: "floating-shelf-spacing-guide",
    pageType: "GUIDE",
    productFamily: "floating-shelves",
    source: "GUIDE_RULE",
    targetKeyword: "floating shelf spacing guide",
    keywordCluster: "installation",
    difficultyEstimate: "MEDIUM",
    priorityScore: 79,
    recommendedAction: "Draft an installation-focused guide covering vertical spacing and alignment rules.",
    status: "SUGGESTED",
    notes: "Fits the existing installation cluster and would support product/variant pages with practical pre-purchase planning content."
  },
  {
    candidateKey: "manual:guide:mantel-height-guide",
    slug: "mantel-height-guide",
    pageType: "GUIDE",
    productFamily: "floating-mantels",
    source: "GUIDE_RULE",
    targetKeyword: "mantel height guide",
    keywordCluster: "installation",
    difficultyEstimate: "MEDIUM",
    priorityScore: 77,
    recommendedAction: "Add a fireplace-planning guide around mantel height, surround proportion, and placement.",
    status: "SUGGESTED",
    notes: "Supports mantel conversion paths with a highly practical fireplace question before purchase."
  }
];

export const expansionDimensionRules = ["36-inch", "42-inch"] as const;
export const expansionShelfUseCaseRules = ["office", "bathroom"] as const;
export const expansionMantelUseCaseRules = ["modern", "rustic"] as const;

export function getApprovedExpansionVariantsForFamily(family: SeoProductFamily) {
  return approvedVariantConfigs[family];
}

export function getApprovedExpansionCombosForFamily(family: SeoProductFamily) {
  return approvedComboConfigs[family];
}

export function getSuggestedExpansionSeedCandidates() {
  const approvedSeeds: SeoExpansionCandidateSeed[] = [
    ...approvedVariantConfigs["floating-shelves"].map((variant) => ({
      candidateKey: `approved:floating-shelves:${variant.slug}`,
      slug: variant.slug,
      pageType: (variant.kind === "dimension" ? "DIMENSION" : variant.kind === "material" ? "MATERIAL" : "USE_CASE") as SeoExpansionCandidatePageType,
      productFamily: "floating-shelves" as const,
      source: "VARIANT_RULE" as const,
      targetKeyword: variant.title.replace(/\s+\|\s+Craft & Board$/, ""),
      keywordCluster: variant.kind === "dimension" ? "dimensions" : variant.kind === "material" ? "materials" : "use-cases",
      difficultyEstimate: "LOW" as const,
      priorityScore: 88,
      recommendedAction: "Approved and merged into the programmatic SEO generator.",
      status: "APPROVED" as const,
      notes: "Controlled expansion candidate approved for generation."
    })),
    ...approvedVariantConfigs["floating-mantels"].map((variant) => ({
      candidateKey: `approved:floating-mantels:${variant.slug}`,
      slug: variant.slug,
      pageType: (variant.kind === "dimension" ? "DIMENSION" : variant.kind === "material" ? "MATERIAL" : "USE_CASE") as SeoExpansionCandidatePageType,
      productFamily: "floating-mantels" as const,
      source: "VARIANT_RULE" as const,
      targetKeyword: variant.title.replace(/\s+\|\s+Craft & Board$/, ""),
      keywordCluster: variant.kind === "dimension" ? "dimensions" : variant.kind === "material" ? "materials" : "use-cases",
      difficultyEstimate: "LOW" as const,
      priorityScore: 86,
      recommendedAction: "Approved and merged into the programmatic SEO generator.",
      status: "APPROVED" as const,
      notes: "Controlled mantel expansion candidate approved for generation."
    })),
    ...approvedComboConfigs["floating-shelves"].map((combo) => ({
      candidateKey: `approved-combo:floating-shelves:${combo.slug}`,
      slug: combo.slug,
      pageType: "VARIANT_COMBO" as const,
      productFamily: "floating-shelves" as const,
      source: "VARIANT_RULE" as const,
      targetKeyword: combo.title.replace(/\s+\|\s+Craft & Board$/, ""),
      keywordCluster: "dimension-material",
      difficultyEstimate: "LOW" as const,
      priorityScore: 84,
      recommendedAction: "Approved and merged into the programmatic combo generator.",
      status: "APPROVED" as const,
      notes: "High-intent expansion combo approved for generation."
    }))
  ];

  return [...approvedSeeds, ...suggestedManualSeeds];
}
