import { getCraftBoardStorefrontSeoAttributionSummary, type CraftBoardOutreachWorkspaceResponse } from "../api";
import { marketingUrl } from "../site-config";
import { buildBacklinkOutreachCampaigns, type BacklinkOutreachCampaign } from "./backlinkCampaigns";
import { buildBacklinkAssetEntries, type BacklinkAssetEntry, type BacklinkPitchAngle } from "./backlinks";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "./health";
import { getSeoInventoryEntries, type SeoInventoryEntry } from "./inventory";
import { buildSeoOpportunityQueue } from "./opportunities";
import { fetchSearchConsolePageMetrics } from "./searchConsole";

type OutreachTargetRecord = NonNullable<CraftBoardOutreachWorkspaceResponse["selectedTarget"]>;

export type CraftBoardOutreachDraftPacket = {
  targetId: string;
  campaignKey: string;
  primaryAssetPageKey: string;
  secondaryAssetPageKeys: string[];
  pitchAngle: BacklinkPitchAngle;
  pitchSummary: string;
  suggestedSubjectLines: string[];
  suggestedEmailBody: string;
  suggestedFollowUpBody: string | null;
  anchorThemeSuggestions: string[];
  supportLinks: Array<{
    title: string;
    href: string;
    pageKey: string;
  }>;
  callToActionSuggestion: string;
  generatedAt: string;
  generationSource: "TARGET_AND_CAMPAIGN" | "TARGET_AND_ASSET" | "MANUAL_OVERRIDE";
};

function typeAudienceLabel(targetType: string) {
  switch (targetType) {
    case "DIY_BLOG":
      return "DIY readers";
    case "INTERIOR_DESIGN_BLOG":
    case "LIFESTYLE_PINTEREST_CREATOR":
      return "design-focused readers";
    case "FIREPLACE_DESIGN_SITE":
      return "fireplace-focused readers";
    case "CONTRACTOR_RESOURCE":
    case "HOME_IMPROVEMENT_SITE":
      return "project-planning readers";
    case "LOCAL_PARTNER":
      return "local design and build clients";
    default:
      return "your readers";
  }
}

function assetTitle(asset: BacklinkAssetEntry, inventoryByPageKey: Map<string, SeoInventoryEntry>) {
  return inventoryByPageKey.get(asset.pageKey)?.title.replace(/\s+\|\s+Craft & Board$/, "").trim() ?? asset.path;
}

function fallbackCampaignForTarget(
  target: OutreachTargetRecord,
  campaigns: BacklinkOutreachCampaign[]
) {
  const exact = campaigns.find((campaign) => campaign.targetType === target.targetType);
  if (exact) {
    return exact;
  }

  if (target.targetType === "LOCAL_PARTNER") {
    return campaigns.find((campaign) => campaign.campaignKey === "flagship-product-category-authority-outreach") ?? campaigns[0];
  }

  if (target.targetType === "PRESS_OR_FEATURE") {
    return campaigns.find((campaign) => campaign.campaignKey === "floating-shelf-design-outreach") ?? campaigns[0];
  }

  return campaigns[0];
}

function selectCampaign(
  target: OutreachTargetRecord,
  campaigns: BacklinkOutreachCampaign[]
) {
  const preferred = target.preferredCampaignKeys
    .map((campaignKey) => campaigns.find((campaign) => campaign.campaignKey === campaignKey))
    .find(Boolean);

  return preferred ?? fallbackCampaignForTarget(target, campaigns);
}

function scoreAssetForTarget(input: {
  asset: BacklinkAssetEntry;
  target: OutreachTargetRecord;
  campaign: BacklinkOutreachCampaign;
}) {
  let score = input.asset.backlinkPriorityScore;

  if (input.campaign.pageKeys.includes(input.asset.pageKey)) {
    score += 18;
  }
  if (input.asset.recommendedTargetType === input.target.targetType) {
    score += 20;
  }
  if (input.target.preferredAssetTypes.includes(input.asset.assetType)) {
    score += 14;
  }
  if (input.target.targetType === "DIY_BLOG" && input.asset.assetType === "GUIDE") {
    score += 18;
  }
  if (input.target.targetType === "FIREPLACE_DESIGN_SITE" && input.asset.pitchAngle === "FIREPLACE_STYLE_RESOURCE") {
    score += 18;
  }
  if (
    ["INTERIOR_DESIGN_BLOG", "LIFESTYLE_PINTEREST_CREATOR"].includes(input.target.targetType) &&
    ["DESIGN_IDEA_RESOURCE", "MATERIAL_EXPLAINER"].includes(input.asset.pitchAngle)
  ) {
    score += 16;
  }
  if (
    ["CONTRACTOR_RESOURCE", "HOME_IMPROVEMENT_SITE"].includes(input.target.targetType) &&
    ["HOW_TO_RESOURCE", "PRODUCT_CATEGORY_REFERENCE", "CONTRACTOR_REFERENCE"].includes(input.asset.pitchAngle)
  ) {
    score += 16;
  }
  if (input.target.targetType === "LOCAL_PARTNER" && ["COMMERCIAL_CATEGORY", "COMMERCIAL_PRODUCT"].includes(input.asset.assetType)) {
    score += 12;
  }
  if (input.asset.exportStatus === "READY") {
    score += 4;
  }

  return score;
}

function pickAssets(input: {
  target: OutreachTargetRecord;
  campaign: BacklinkOutreachCampaign;
  assets: BacklinkAssetEntry[];
}) {
  const sorted = [...input.assets]
    .filter((asset) => asset.exportStatus === "READY")
    .sort((left, right) =>
      scoreAssetForTarget({ asset: right, target: input.target, campaign: input.campaign }) -
      scoreAssetForTarget({ asset: left, target: input.target, campaign: input.campaign })
    );

  const primary = sorted[0] ?? null;
  const secondary = sorted
    .filter((asset) => asset.pageKey !== primary?.pageKey)
    .slice(0, 2);

  return {
    primary,
    secondary
  };
}

function pitchSummary(input: {
  target: OutreachTargetRecord;
  campaign: BacklinkOutreachCampaign;
  primaryAsset: BacklinkAssetEntry;
  primaryTitle: string;
}) {
  const targetLabel = typeAudienceLabel(input.target.targetType);

  switch (input.primaryAsset.pitchAngle) {
    case "HOW_TO_RESOURCE":
      return `Lead with ${input.primaryTitle} as a practical install and planning resource for ${targetLabel}. Keep the note useful and skip product pricing language.`;
    case "MATERIAL_EXPLAINER":
      return `Lead with ${input.primaryTitle} as a wood-selection and material-direction resource for ${targetLabel}. Use craftsmanship and decision help, not a hard sell.`;
    case "FIREPLACE_STYLE_RESOURCE":
      return `Lead with ${input.primaryTitle} as a fireplace and mantel design resource for ${targetLabel}. Keep the emphasis on inspiration and planning instead of product specs first.`;
    case "PRODUCT_CATEGORY_REFERENCE":
      return `Lead with ${input.primaryTitle} as a clean category or product reference for ${targetLabel}. Use the category path first unless the contact clearly prefers a specific product page.`;
    case "DESIGN_IDEA_RESOURCE":
      return `Lead with ${input.primaryTitle} as a design and styling resource for ${targetLabel}. Use natural room-idea language and keep the commercial handoff secondary.`;
    default:
      return input.campaign.notes ?? `Lead with ${input.primaryTitle} and keep the note helpful, relevant, and easy to skim.`;
  }
}

function buildSubjectLines(input: {
  assetTitle: string;
  target: OutreachTargetRecord;
  pitchAngle: BacklinkPitchAngle;
}) {
  const shortTitle = input.assetTitle.replace(/\s+\|\s+Craft & Board$/, "").trim();
  const subjects = new Set<string>();
  const lowerTitle = shortTitle.toLowerCase();

  subjects.add(`${shortTitle} for your readers`);
  subjects.add(`Resource for your ${input.target.topicCluster.replace(/-/g, " ")} content`);

  if (input.pitchAngle === "HOW_TO_RESOURCE") {
    if (lowerTitle.includes("cabinet shelf")) {
      subjects.add("Cabinet shelf measurement guide for your readers");
      subjects.add("Helpful cabinet shelf sizing resource");
    } else {
      subjects.add(`${shortTitle} guide for your readers`);
      subjects.add(`Practical ${lowerTitle} resource`);
    }
  } else if (input.pitchAngle === "MATERIAL_EXPLAINER") {
    subjects.add(`${shortTitle} resource`);
    subjects.add(`${shortTitle} guide you might like`);
  } else if (input.pitchAngle === "FIREPLACE_STYLE_RESOURCE") {
    subjects.add(`${shortTitle} resource`);
    subjects.add(`${shortTitle} ideas your readers may like`);
  } else if (input.pitchAngle === "DESIGN_IDEA_RESOURCE") {
    subjects.add(`${shortTitle} idea resource`);
    subjects.add(`${shortTitle} page you might find useful`);
  } else {
    subjects.add(`Craft & Board page that may help your ${typeAudienceLabel(input.target.targetType)}`);
  }

  return [...subjects].slice(0, 5);
}

function buildEmailBody(input: {
  target: OutreachTargetRecord;
  assetTitle: string;
  assetUrl: string;
  pitchSummary: string;
  anchorThemeSuggestions: string[];
}) {
  const audienceLabel = typeAudienceLabel(input.target.targetType);
  const firstAnchor = input.anchorThemeSuggestions[0] ?? input.assetTitle.toLowerCase();

  return `Hi ${input.target.primaryContactName ?? "there"},

I came across ${input.target.siteName} while looking at sites that cover ${input.target.topicCluster.replace(/-/g, " ")} well for ${audienceLabel}.

I thought this Craft & Board page might be a useful resource if you are updating or planning related content: ${input.assetTitle}
${input.assetUrl}

It is a good fit because it gives readers a cleaner starting point around ${firstAnchor}, and it can support a practical or design-led reference without forcing a hard product pitch.

If it feels useful for a current or future piece, I would be glad to send over the best supporting links as well.

Thanks,
Craft & Board`;
}

function buildFollowUpBody(input: {
  target: OutreachTargetRecord;
  assetTitle: string;
  assetUrl: string;
}) {
  return `Hi ${input.target.primaryContactName ?? "there"},

Following up in case this was useful for your queue. The page I sent over was ${input.assetTitle}:
${input.assetUrl}

If it is a fit for an upcoming article or roundup, happy to send the supporting links too.

Thanks,
Craft & Board`;
}

export async function buildCraftBoardOutreachDraftPacket(input: {
  target: OutreachTargetRecord;
  lookbackDays?: number;
}): Promise<CraftBoardOutreachDraftPacket | null> {
  const inventory = getSeoInventoryEntries();
  const [searchConsole, attributionPayload] = await Promise.all([
    fetchSearchConsolePageMetrics({
      inventory,
      lookbackWindowDays: input.lookbackDays ?? 28
    }),
    getCraftBoardStorefrontSeoAttributionSummary({
      lookbackDays: input.lookbackDays ?? 28
    }).catch(() => ({ ok: true as const, lookbackDays: input.lookbackDays ?? 28, attempts: [] }))
  ]);

  const reports = buildSeoHealthReports({
    inventory,
    metrics: searchConsole.metrics.filter((metric) => metric.status === "MATCHED")
  });
  const attributionSummary = summarizeAttributionByInventoryPath(attributionPayload?.attempts ?? []);
  const opportunities = buildSeoOpportunityQueue({
    inventory,
    reports,
    metrics: searchConsole.metrics.filter((metric) => metric.status === "MATCHED"),
    attributionSummary
  });
  const assets = buildBacklinkAssetEntries({
    inventory,
    opportunities
  });
  const campaigns = buildBacklinkOutreachCampaigns(assets);
  const campaign = selectCampaign(input.target, campaigns);

  if (!campaign) {
    return null;
  }

  const campaignAssets = assets.filter(
    (asset) =>
      campaign.pageKeys.includes(asset.pageKey) ||
      asset.recommendedTargetType === input.target.targetType
  );
  const selected = pickAssets({
    target: input.target,
    campaign,
    assets: campaignAssets.length > 0 ? campaignAssets : assets
  });

  if (!selected.primary) {
    return null;
  }

  const inventoryByPageKey = new Map(inventory.map((entry) => [entry.pageKey, entry]));
  const primaryTitle = assetTitle(selected.primary, inventoryByPageKey);
  const primaryUrl = marketingUrl(selected.primary.path);
  const secondaryLinks = selected.secondary.map((asset) => ({
    title: assetTitle(asset, inventoryByPageKey),
    href: marketingUrl(asset.path),
    pageKey: asset.pageKey
  }));
  const supportLinks = [
    {
      title: primaryTitle,
      href: primaryUrl,
      pageKey: selected.primary.pageKey
    },
    ...secondaryLinks
  ];
  const summary = pitchSummary({
    target: input.target,
    campaign,
    primaryAsset: selected.primary,
    primaryTitle
  });

  return {
    targetId: input.target.id,
    campaignKey: campaign.campaignKey,
    primaryAssetPageKey: selected.primary.pageKey,
    secondaryAssetPageKeys: selected.secondary.map((asset) => asset.pageKey),
    pitchAngle: selected.primary.pitchAngle,
    pitchSummary: summary,
    suggestedSubjectLines: buildSubjectLines({
      assetTitle: primaryTitle,
      target: input.target,
      pitchAngle: selected.primary.pitchAngle
    }),
    suggestedEmailBody: buildEmailBody({
      target: input.target,
      assetTitle: primaryTitle,
      assetUrl: primaryUrl,
      pitchSummary: summary,
      anchorThemeSuggestions: selected.primary.suggestedAnchorThemes
    }),
    suggestedFollowUpBody: buildFollowUpBody({
      target: input.target,
      assetTitle: primaryTitle,
      assetUrl: primaryUrl
    }),
    anchorThemeSuggestions: selected.primary.suggestedAnchorThemes.slice(0, 4),
    supportLinks,
    callToActionSuggestion: "Ask whether this page would be useful for a current or upcoming article, roundup, or resource page.",
    generatedAt: new Date().toISOString(),
    generationSource: "TARGET_AND_CAMPAIGN"
  };
}
