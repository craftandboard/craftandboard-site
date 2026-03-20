import { CraftBoardSeoReport } from "../../../../components/craft-board-seo-report";
import { getCraftBoardStorefrontSeoAttributionSummary } from "../../../../lib/api";
import { buildSeoExpansionCandidates, getTopSeoExpansionCandidates } from "../../../../lib/seo/expansion";
import { buildSeoHealthReports, getHighOpportunityHealthReports, getLowCtrHealthReports, summarizeAttributionByInventoryPath } from "../../../../lib/seo/health";
import { getSeoInventoryEntries } from "../../../../lib/seo/inventory";
import {
  buildSeoOpportunityQueue,
  getCtrImprovementOpportunities,
  getHighImpactContentRefreshOpportunities,
  getInternalLinkingOpportunities,
  getOrganicConversionOpportunities,
  getQuickWinOpportunities
} from "../../../../lib/seo/opportunities";
import { fetchSearchConsolePageMetrics, fetchSearchConsoleQueryMetrics } from "../../../../lib/seo/searchConsole";

export const dynamic = "force-dynamic";

function parseLookbackDays(value: string | undefined) {
  const days = Number(value);

  if ([7, 28, 90].includes(days)) {
    return days;
  }

  const configured = Number(process.env.CRAFT_BOARD_SEO_REPORTING_LOOKBACK_DAYS ?? 28);
  return [7, 28, 90].includes(configured) ? configured : 28;
}

export default async function CraftBoardSeoPage({
  searchParams
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const lookbackDays = parseLookbackDays(resolvedSearchParams?.days);
  const inventory = getSeoInventoryEntries();
  const [searchConsole, attributionPayload] = await Promise.all([
    fetchSearchConsolePageMetrics({
      inventory,
      lookbackWindowDays: lookbackDays
    }),
    getCraftBoardStorefrontSeoAttributionSummary({
      lookbackDays
    }).catch((error) => {
      console.warn("[web][seo] Failed to fetch storefront SEO attribution summary", {
        error: error instanceof Error ? error.message : String(error)
      });

      return { ok: true as const, lookbackDays, attempts: [] };
    })
  ]);
  const queryMetrics = await fetchSearchConsoleQueryMetrics({
    lookbackWindowDays: lookbackDays
  });

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
  const expansionCandidates = buildSeoExpansionCandidates({
    inventory,
    opportunities,
    queryMetrics
  });

  return (
    <CraftBoardSeoReport
      lookbackDays={lookbackDays}
      inventory={inventory}
      reports={reports}
      searchConsole={searchConsole}
      opportunities={opportunities}
      quickWins={getQuickWinOpportunities(opportunities)}
      highImpactContentRefreshes={getHighImpactContentRefreshOpportunities(opportunities)}
      ctrImprovementTargets={getCtrImprovementOpportunities(opportunities)}
      internalLinkingOpportunities={getInternalLinkingOpportunities(opportunities)}
      organicConversionOpportunities={getOrganicConversionOpportunities(opportunities)}
      highOpportunityPages={getHighOpportunityHealthReports(reports)}
      lowCtrPages={getLowCtrHealthReports(reports)}
      attributionSummary={attributionSummary}
      expansionCandidates={expansionCandidates}
      topExpansionCandidates={getTopSeoExpansionCandidates(expansionCandidates)}
    />
  );
}
