import { CraftBoardSeoPinterestReport } from "../../../../../components/craft-board-seo-pinterest-report";
import { getCraftBoardStorefrontSeoAttributionSummary } from "../../../../../lib/api";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "../../../../../lib/seo/health";
import { getSeoInventoryEntries } from "../../../../../lib/seo/inventory";
import {
  generatePinterestEntries,
  getReadyToExportPinterestEntries,
  getGuidePinterestEntries,
  getHighPriorityPinterestEntries,
  getProductAndVariantPinterestEntries,
  getRefreshCandidatePinterestEntries,
  summarizePinterestBoards
} from "../../../../../lib/seo/pinterest";
import { filterPinterestEntries } from "../../../../../lib/seo/pinterestExport";
import { buildPinterestPublishingPackets } from "../../../../../lib/seo/pinterestPackets";
import { buildSeoOpportunityQueue } from "../../../../../lib/seo/opportunities";
import { fetchSearchConsolePageMetrics } from "../../../../../lib/seo/searchConsole";

export const dynamic = "force-dynamic";

function parseLookbackDays(value: string | undefined) {
  const days = Number(value);
  return [7, 28, 90].includes(days) ? days : 28;
}

export default async function CraftBoardSeoPinterestPage({
  searchParams
}: {
    searchParams?: Promise<{
      days?: string;
      pageType?: string;
      productFamily?: string;
      board?: string;
      priority?: string;
      refresh?: string;
      campaignKey?: string;
    }>;
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
    }).catch(() => ({ ok: true as const, lookbackDays, attempts: [] }))
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
  const entries = generatePinterestEntries({
    inventory,
    opportunities
  });
  const filteredEntries = filterPinterestEntries(entries, {
    pageType: resolvedSearchParams?.pageType,
    productFamily: resolvedSearchParams?.productFamily,
    board: resolvedSearchParams?.board,
    priority: resolvedSearchParams?.priority,
    refresh: resolvedSearchParams?.refresh,
    campaignKey: resolvedSearchParams?.campaignKey
  });
  const packets = buildPinterestPublishingPackets(entries);

  return (
    <CraftBoardSeoPinterestReport
      entries={filteredEntries}
      allEntries={entries}
      readyToExport={getReadyToExportPinterestEntries(entries)}
      highPriority={getHighPriorityPinterestEntries(entries)}
      guidePins={getGuidePinterestEntries(entries)}
      productPins={getProductAndVariantPinterestEntries(entries)}
      refreshCandidates={getRefreshCandidatePinterestEntries(entries)}
      packets={packets}
      boardSummary={summarizePinterestBoards(entries)}
      filters={{
        pageType: resolvedSearchParams?.pageType,
        productFamily: resolvedSearchParams?.productFamily,
        board: resolvedSearchParams?.board,
        priority: resolvedSearchParams?.priority,
        refresh: resolvedSearchParams?.refresh,
        campaignKey: resolvedSearchParams?.campaignKey
      }}
    />
  );
}
