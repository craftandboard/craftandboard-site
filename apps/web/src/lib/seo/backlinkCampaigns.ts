import type { BacklinkAssetEntry, BacklinkPitchAngle } from "./backlinks";
import type { BacklinkRecommendedTargetType } from "./backlinkTargets";

export type BacklinkOutreachCampaign = {
  campaignKey: string;
  campaignLabel: string;
  targetType: BacklinkRecommendedTargetType;
  assetCount: number;
  primaryPitchAngle: BacklinkPitchAngle;
  pageKeys: string[];
  runOrder: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  notes: string | null;
  exportStatus: "READY" | "DEFERRED";
};

function buildCampaign(input: {
  campaignKey: string;
  campaignLabel: string;
  targetType: BacklinkRecommendedTargetType;
  primaryPitchAngle: BacklinkPitchAngle;
  runOrder: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
  assets: BacklinkAssetEntry[];
}) {
  return {
    campaignKey: input.campaignKey,
    campaignLabel: input.campaignLabel,
    targetType: input.targetType,
    assetCount: input.assets.length,
    primaryPitchAngle: input.primaryPitchAngle,
    pageKeys: input.assets.map((asset) => String(asset.pageKey)),
    runOrder: input.runOrder,
    priority: input.priority,
    notes: input.notes,
    exportStatus: input.assets.length > 0 ? "READY" : "DEFERRED"
  } satisfies BacklinkOutreachCampaign;
}

export function buildBacklinkOutreachCampaigns(assets: BacklinkAssetEntry[]) {
  const requiredCabinetMeasurementPaths = new Set([
    "/guides/how-to-measure-cabinet-shelves",
    "/shop/cabinet-shelves",
    "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
    "/shop/cabinet-shelves/maple-melamine-cabinet-shelf"
  ]);
  const requiredShelfInstallPaths = new Set([
    "/guides/install-floating-shelves",
    "/guides/floating-shelf-weight-limits",
    "/shop/floating-shelves/classic-floating-shelf",
    "/shop/floating-shelves"
  ]);
  const requiredShelfWoodPaths = new Set([
    "/guides/best-wood-for-floating-shelves",
    "/floating-shelves/white-oak",
    "/floating-shelves/72-inch-white-oak",
    "/shop/floating-shelves/classic-floating-shelf"
  ]);
  const requiredShelfDesignPaths = new Set([
    "/shop/floating-shelves",
    "/floating-shelves/fireplace",
    "/floating-shelves/72-inch",
    "/guides/how-to-style-floating-shelves"
  ]);
  const requiredMantelPaths = new Set([
    "/guides/floating-mantel-design-ideas",
    "/shop/floating-mantels",
    "/shop/floating-mantels/classic-floating-mantel",
    "/floating-mantels/fireplace",
    "/floating-mantels/white-oak"
  ]);
  const requiredFlagshipPaths = new Set([
    "/shop/floating-shelves",
    "/shop/floating-mantels",
    "/shop/floating-shelves/classic-floating-shelf",
    "/shop/floating-mantels/classic-floating-mantel"
  ]);

  const shelfInstall = assets.filter(
    (asset) => requiredShelfInstallPaths.has(asset.path) || asset.pitchAngle === "HOW_TO_RESOURCE"
  );
  const cabinetMeasurement = assets.filter(
    (asset) => requiredCabinetMeasurementPaths.has(asset.path) || asset.path === "/guides/how-to-measure-cabinet-shelves"
  );
  const shelfWood = assets.filter(
    (asset) => requiredShelfWoodPaths.has(asset.path) || asset.pitchAngle === "MATERIAL_EXPLAINER"
  );
  const shelfDesign = assets.filter(
    (asset) =>
      requiredShelfDesignPaths.has(asset.path) ||
      (asset.productFamily === "floating-shelves" && asset.pitchAngle === "DESIGN_IDEA_RESOURCE")
  );
  const mantelDesign = assets.filter(
    (asset) =>
      requiredMantelPaths.has(asset.path) ||
      (asset.productFamily === "floating-mantels" && ["FIREPLACE_STYLE_RESOURCE", "DESIGN_IDEA_RESOURCE"].includes(asset.pitchAngle))
  );
  const flagship = assets.filter(
    (asset) => requiredFlagshipPaths.has(asset.path) || ["COMMERCIAL_CATEGORY", "COMMERCIAL_PRODUCT"].includes(asset.assetType)
  );

  return [
    buildCampaign({
      campaignKey: "cabinet-shelf-measurement-resource-outreach",
      campaignLabel: "Cabinet Shelf Measurement Resource Outreach",
      targetType: "DIY_BLOG",
      primaryPitchAngle: "HOW_TO_RESOURCE",
      runOrder: 1,
      priority: "HIGH",
      notes:
        "Run first for the MVP cabinet-shelf push. Lead with the measurement guide as a practical homeowner resource for replacement cabinet shelves, then support it with the white and maple melamine product pages when a site is open to product references.",
      assets: cabinetMeasurement
    }),
    buildCampaign({
      campaignKey: "floating-shelf-installation-outreach",
      campaignLabel: "Floating Shelf Installation Outreach",
      targetType: "DIY_BLOG",
      primaryPitchAngle: "HOW_TO_RESOURCE",
      runOrder: 2,
      priority: "HIGH",
      notes:
        "Run first. Pitch installation and planning resources to DIY and home-improvement publishers. Lead with the install guide, support it with the weight-limits guide, and use the shelf category or flagship PDP only as secondary reference destinations. Keep anchors practical and instructional rather than commercial.",
      assets: shelfInstall
    }),
    buildCampaign({
      campaignKey: "floating-shelf-wood-material-outreach",
      campaignLabel: "Floating Shelf Wood/Material Outreach",
      targetType: "INTERIOR_DESIGN_BLOG",
      primaryPitchAngle: "MATERIAL_EXPLAINER",
      runOrder: 3,
      priority: "HIGH",
      notes:
        "Run second. Lead with the wood-selection guide and use white-oak commercial pages as supporting examples. Best fit is design blogs, material roundups, and wood-choice explainers where the editorial hook is selection guidance rather than direct product placement.",
      assets: shelfWood
    }),
    buildCampaign({
      campaignKey: "floating-mantel-design-outreach",
      campaignLabel: "Floating Mantel Design Outreach",
      targetType: "FIREPLACE_DESIGN_SITE",
      primaryPitchAngle: "FIREPLACE_STYLE_RESOURCE",
      runOrder: 4,
      priority: "HIGH",
      notes:
        "Run third. Lead with the mantel design guide for editorial value, then support with the mantel category, flagship PDP, and fireplace-specific variant pages. This campaign fits fireplace publications, mantel roundups, and home-style sites focused on feature walls.",
      assets: mantelDesign
    }),
    buildCampaign({
      campaignKey: "floating-shelf-design-outreach",
      campaignLabel: "Floating Shelf Design Inspiration Outreach",
      targetType: "INTERIOR_DESIGN_BLOG",
      primaryPitchAngle: "DESIGN_IDEA_RESOURCE",
      runOrder: 5,
      priority: "MEDIUM",
      notes:
        "Run fourth. Use shelf styling, fireplace shelving, and category-level inspiration pages for roundups and room-idea posts. Favor natural design-language anchors and let the category page carry the commercial handoff instead of leading with product detail pages.",
      assets: shelfDesign
    }),
    buildCampaign({
      campaignKey: "flagship-product-category-authority-outreach",
      campaignLabel: "Flagship Product / Category Authority Outreach",
      targetType: "HOME_IMPROVEMENT_SITE",
      primaryPitchAngle: "PRODUCT_CATEGORY_REFERENCE",
      runOrder: 6,
      priority: "HIGH",
      notes:
        "Run fifth. Use flagship categories and PDPs for commercial authority placements, local partner references, and higher-intent resource lists. Lead with category pages for broader fit; use PDPs when the publisher is comfortable citing a specific product path.",
      assets: flagship
    })
  ]
    .filter((campaign) => campaign.assetCount > 0)
    .sort((left, right) => left.runOrder - right.runOrder);
}
