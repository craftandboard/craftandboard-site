import { CraftBoardSeoBacklinksReport } from "../../../../../components/craft-board-seo-backlinks-report";
import { buildBacklinkOutreachCampaigns } from "../../../../../lib/seo/backlinkCampaigns";
import { buildBacklinkAssetEntries, getQuickWinBacklinkAssets } from "../../../../../lib/seo/backlinks";
import { backlinkTargets } from "../../../../../lib/seo/backlinkTargets";
import { getCraftBoardStorefrontSeoAttributionSummary } from "../../../../../lib/api";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "../../../../../lib/seo/health";
import { getSeoInventoryEntries } from "../../../../../lib/seo/inventory";
import { buildSeoOpportunityQueue } from "../../../../../lib/seo/opportunities";
import { fetchSearchConsolePageMetrics } from "../../../../../lib/seo/searchConsole";

export const dynamic = "force-dynamic";

export default async function CraftBoardSeoBacklinksPage() {
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

  return (
    <CraftBoardSeoBacklinksReport
      assets={assets}
      quickWins={getQuickWinBacklinkAssets(assets)}
      campaigns={buildBacklinkOutreachCampaigns(assets)}
      targets={backlinkTargets}
    />
  );
}
