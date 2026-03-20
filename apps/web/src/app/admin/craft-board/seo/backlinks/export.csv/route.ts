import { getCraftBoardStorefrontSeoAttributionSummary } from "../../../../../../lib/api";
import { buildBacklinkOutreachCampaigns } from "../../../../../../lib/seo/backlinkCampaigns";
import { buildBacklinkAssetEntries } from "../../../../../../lib/seo/backlinks";
import { backlinkTargets } from "../../../../../../lib/seo/backlinkTargets";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "../../../../../../lib/seo/health";
import { getSeoInventoryEntries } from "../../../../../../lib/seo/inventory";
import { buildSeoOpportunityQueue } from "../../../../../../lib/seo/opportunities";
import { fetchSearchConsolePageMetrics } from "../../../../../../lib/seo/searchConsole";

function csvCell(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "assets";
  const inventory = getSeoInventoryEntries();
  const [searchConsole, attributionPayload] = await Promise.all([
    fetchSearchConsolePageMetrics({
      inventory,
      lookbackWindowDays: 28
    }),
    getCraftBoardStorefrontSeoAttributionSummary({
      lookbackDays: 28
    }).catch(() => ({ ok: true as const, lookbackDays: 28, attempts: [] }))
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

  let csv = "";

  if (scope === "campaigns") {
    csv = [
      ["Run Order", "Campaign Key", "Campaign Label", "Target Type", "Priority", "Asset Count", "Primary Pitch Angle", "Notes", "Export Status"].join(","),
      ...campaigns.map((campaign) =>
        [
          campaign.runOrder,
          campaign.campaignKey,
          campaign.campaignLabel,
          campaign.targetType,
          campaign.priority,
          campaign.assetCount,
          campaign.primaryPitchAngle,
          campaign.notes,
          campaign.exportStatus
        ]
          .map(csvCell)
          .join(",")
      )
    ].join("\n");
  } else if (scope === "targets") {
    csv = [
      [
        "Domain",
        "Site Name",
        "Target Type",
        "Authority Tier",
        "Topic Cluster",
        "Status",
        "Fit Notes",
        "Preferred Asset Types",
        "Preferred Campaign Keys",
        "Notes"
      ].join(","),
      ...backlinkTargets.map((target) =>
        [
          target.domain,
          target.siteName,
          target.targetType,
          target.authorityTier,
          target.topicCluster,
          target.status,
          target.fitNotes,
          target.preferredAssetTypes.join(" | "),
          target.preferredCampaignKeys.join(" | "),
          target.notes
        ]
          .map(csvCell)
          .join(",")
      )
    ].join("\n");
  } else if (scope === "packet") {
    csv = [
      [
        "Run Order",
        "Campaign Key",
        "Campaign Label",
        "Campaign Notes",
        "Path",
        "Page Type",
        "Target Type",
        "Pitch Angle",
        "Anchor Themes",
        "Asset Notes",
        "Export Status"
      ].join(","),
      ...campaigns.flatMap((campaign) =>
        assets
          .filter((asset) => campaign.pageKeys.includes(String(asset.pageKey)))
          .map((asset) =>
            [
              campaign.runOrder,
              campaign.campaignKey,
              campaign.campaignLabel,
              campaign.notes,
              asset.path,
              asset.pageType,
              asset.recommendedTargetType,
              asset.pitchAngle,
              asset.suggestedAnchorThemes.join(" | "),
              asset.notes,
              asset.exportStatus
            ]
              .map(csvCell)
              .join(",")
          )
      )
    ].join("\n");
  } else {
    csv = [
      [
        "Path",
        "Page Type",
        "Product Family",
        "Topic Cluster",
        "Backlink Priority",
        "Recommended Target Type",
        "Pitch Angle",
        "Suggested Anchor Themes",
        "Export Status",
        "Source Signals",
        "Notes"
      ].join(","),
      ...assets.map((asset) =>
        [
          asset.path,
          asset.pageType,
          asset.productFamily,
          asset.topicCluster,
          asset.backlinkPriorityScore,
          asset.recommendedTargetType,
          asset.pitchAngle,
          asset.suggestedAnchorThemes.join(" | "),
          asset.exportStatus,
          asset.sourceSignals.join(" | "),
          asset.notes
        ]
          .map(csvCell)
          .join(",")
      )
    ].join("\n");
  }

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="craft-board-backlinks-export.csv"',
      "Cache-Control": "no-store"
    }
  });
}
