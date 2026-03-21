import { getSeoOverrideSummary } from "./overrideResolver";
import { scoreBacklinkAsset } from "./backlinkScoring";
import type { BacklinkRecommendedTargetType } from "./backlinkTargets";
import type { SeoInventoryEntry } from "./inventory";
import type { SeoOpportunity } from "./opportunities";

export type BacklinkAssetType =
  | "GUIDE"
  | "COMMERCIAL_CATEGORY"
  | "COMMERCIAL_PRODUCT"
  | "PROGRAMMATIC_VARIANT"
  | "PROGRAMMATIC_COMBO"
  | "BRAND_PAGE";

export type BacklinkPitchAngle =
  | "HOW_TO_RESOURCE"
  | "DESIGN_IDEA_RESOURCE"
  | "MATERIAL_EXPLAINER"
  | "PRODUCT_CATEGORY_REFERENCE"
  | "FIREPLACE_STYLE_RESOURCE"
  | "CONTRACTOR_REFERENCE";

export type BacklinkAssetEntry = {
  pageKey: SeoInventoryEntry["pageKey"];
  path: string;
  pageType: SeoInventoryEntry["pageType"];
  productFamily: SeoInventoryEntry["productFamily"];
  topicCluster: SeoInventoryEntry["topicCluster"];
  assetType: BacklinkAssetType;
  backlinkPriorityScore: number;
  authorityGoal: string;
  recommendedTargetType: BacklinkRecommendedTargetType;
  pitchAngle: BacklinkPitchAngle;
  suggestedAnchorThemes: string[];
  exportStatus: "READY" | "DEFERRED";
  notes: string | null;
  sourceSignals: string[];
};

const mustIncludePaths = new Set([
  "/guides/how-to-measure-cabinet-shelves",
  "/guides/install-floating-shelves",
  "/guides/floating-shelf-weight-limits",
  "/guides/best-wood-for-floating-shelves",
  "/guides/floating-mantel-design-ideas",
  "/shop/floating-shelves",
  "/shop/floating-mantels",
  "/shop/floating-shelves/classic-floating-shelf",
  "/shop/floating-mantels/classic-floating-mantel"
]);

function classifyAssetType(entry: SeoInventoryEntry): BacklinkAssetType | null {
  switch (entry.pageType) {
    case "GUIDE_ARTICLE":
    case "GUIDE_INDEX":
      return "GUIDE";
    case "CATEGORY":
      return "COMMERCIAL_CATEGORY";
    case "PRODUCT":
      return "COMMERCIAL_PRODUCT";
    case "VARIANT":
      return "PROGRAMMATIC_VARIANT";
    case "VARIANT_COMBINATION":
      return "PROGRAMMATIC_COMBO";
    case "HOME":
      return "BRAND_PAGE";
    default:
      return null;
  }
}

function resolveTargetType(entry: SeoInventoryEntry): BacklinkRecommendedTargetType {
  if (entry.productFamily === "cabinet-shelves") {
    return entry.pageType === "GUIDE_ARTICLE" ? "DIY_BLOG" : "HOME_IMPROVEMENT_SITE";
  }
  if (entry.productFamily === "floating-mantels" && (entry.topicCluster === "design-ideas" || entry.path.includes("fireplace"))) {
    return "FIREPLACE_DESIGN_SITE";
  }
  if (entry.pageType === "GUIDE_ARTICLE" && (entry.topicCluster === "installation" || entry.topicCluster === "weight-capacity")) {
    return "DIY_BLOG";
  }
  if (entry.pageType === "GUIDE_ARTICLE" && (entry.topicCluster === "materials" || entry.topicCluster === "styling-design")) {
    return "INTERIOR_DESIGN_BLOG";
  }
  if (entry.pageType === "CATEGORY" || entry.pageType === "PRODUCT") {
    return "HOME_IMPROVEMENT_SITE";
  }
  if (entry.pageType === "HOME") {
    return "PRESS_OR_FEATURE";
  }
  return "INTERIOR_DESIGN_BLOG";
}

function resolvePitchAngle(entry: SeoInventoryEntry): BacklinkPitchAngle {
  if (entry.pageType === "GUIDE_ARTICLE" && entry.topicCluster === "installation") {
    return "HOW_TO_RESOURCE";
  }
  if (entry.pageType === "GUIDE_ARTICLE" && entry.topicCluster === "materials") {
    return "MATERIAL_EXPLAINER";
  }
  if (entry.productFamily === "floating-mantels" && (entry.topicCluster === "design-ideas" || entry.path.includes("fireplace"))) {
    return "FIREPLACE_STYLE_RESOURCE";
  }
  if (entry.pageType === "CATEGORY" || entry.pageType === "PRODUCT") {
    return "PRODUCT_CATEGORY_REFERENCE";
  }
  if (entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION") {
    return "DESIGN_IDEA_RESOURCE";
  }
  return "CONTRACTOR_REFERENCE";
}

function resolveAnchorThemes(entry: SeoInventoryEntry) {
  if (entry.path === "/guides/how-to-measure-cabinet-shelves") {
    return [
      "how to measure cabinet shelves",
      "cabinet shelf measurement guide",
      "replacement cabinet shelf size guide"
    ];
  }
  if (entry.path === "/guides/install-floating-shelves") {
    return ["floating shelf installation guide", "how to install floating shelves", "floating shelf mounting guide"];
  }
  if (entry.path === "/guides/floating-shelf-weight-limits") {
    return ["floating shelf weight limits", "floating shelf weight capacity", "how much weight can floating shelves hold"];
  }
  if (entry.path === "/guides/best-wood-for-floating-shelves") {
    return ["best wood for floating shelves", "white oak floating shelf guide", "floating shelf wood options"];
  }
  if (entry.path === "/guides/floating-mantel-design-ideas") {
    return ["floating mantel design ideas", "modern fireplace mantel ideas", "floating mantel inspiration"];
  }
  if (entry.path === "/shop/floating-shelves") {
    return ["custom floating shelves", "solid wood floating shelves", "floating shelves for living rooms"];
  }
  if (entry.path === "/shop/floating-shelves/classic-floating-shelf") {
    return ["custom floating shelf", "made-to-order floating shelf", "contractor-grade floating shelf"];
  }
  if (entry.path === "/shop/floating-mantels") {
    return ["custom floating mantels", "wood fireplace mantels", "modern floating mantels"];
  }
  if (entry.path === "/shop/floating-mantels/classic-floating-mantel") {
    return ["custom floating mantel", "made-to-order wood mantel", "floating wood mantel"];
  }

  const base = entry.path.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") ?? entry.path;
  return [base, `craft and board ${base}`, `custom ${base}`];
}

export function buildBacklinkAssetEntries(input: {
  inventory: SeoInventoryEntry[];
  opportunities: SeoOpportunity[];
}) {
  return input.inventory
    .filter((entry) => {
      const assetType = classifyAssetType(entry);
      if (!assetType) {
        return false;
      }

      if (mustIncludePaths.has(entry.path)) {
        return true;
      }

      if (entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION") {
        return input.opportunities.some((opportunity) => opportunity.path === entry.path && opportunity.priorityScore >= 70);
      }

      return ["GUIDE_ARTICLE", "CATEGORY", "PRODUCT", "HOME"].includes(entry.pageType);
    })
    .map((entry) => {
      const assetType = classifyAssetType(entry)!;
      const score = scoreBacklinkAsset({
        entry,
        opportunities: input.opportunities
      });
      const overrideSummary = getSeoOverrideSummary(entry.pageKey);

      return {
        pageKey: entry.pageKey,
        path: entry.path,
        pageType: entry.pageType,
        productFamily: entry.productFamily,
        topicCluster: entry.topicCluster,
        assetType,
        backlinkPriorityScore: score,
        authorityGoal:
          entry.path === "/guides/how-to-measure-cabinet-shelves"
            ? "Earn practical editorial links into the replacement cabinet shelf funnel and route that authority directly into the melamine product pages."
            : assetType === "GUIDE"
            ? "Earn editorial links into the authority layer and route that authority into commercial pages."
            : "Strengthen category and flagship commercial authority for higher-intent searches.",
        recommendedTargetType: resolveTargetType(entry),
        pitchAngle: resolvePitchAngle(entry),
        suggestedAnchorThemes: resolveAnchorThemes(entry),
        exportStatus: score >= 58 || mustIncludePaths.has(entry.path) ? "READY" : "DEFERRED",
        notes:
          overrideSummary.refreshNote ??
          (mustIncludePaths.has(entry.path)
            ? "First-wave campaign asset. Prioritize this page in outreach packet #1."
            : null),
        sourceSignals: [
          `inventory:${entry.pageType}`,
          `priority:${entry.priority}`,
          ...(mustIncludePaths.has(entry.path) ? ["campaign-pack-1:required"] : []),
          ...(overrideSummary.hasOverride ? ["override:active"] : [])
        ]
      } satisfies BacklinkAssetEntry;
    })
    .sort((left, right) => right.backlinkPriorityScore - left.backlinkPriorityScore);
}

export function getQuickWinBacklinkAssets(entries: BacklinkAssetEntry[]) {
  return entries.filter((entry) => entry.exportStatus === "READY").slice(0, 10);
}
