import { getCraftBoardStorefrontSeoAttributionSummary } from "../../../../../../lib/api";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "../../../../../../lib/seo/health";
import { getSeoInventoryEntries } from "../../../../../../lib/seo/inventory";
import { generatePinterestEntries } from "../../../../../../lib/seo/pinterest";
import { buildPinterestCsv, filterPinterestEntries } from "../../../../../../lib/seo/pinterestExport";
import { buildSeoOpportunityQueue } from "../../../../../../lib/seo/opportunities";
import { fetchSearchConsolePageMetrics } from "../../../../../../lib/seo/searchConsole";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
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
  const entries = generatePinterestEntries({
    inventory,
    opportunities
  });
  const filtered = filterPinterestEntries(entries, {
    board: url.searchParams.get("board") ?? undefined,
    productFamily: url.searchParams.get("productFamily") ?? undefined,
    priority: url.searchParams.get("priority") ?? undefined,
    pageType: url.searchParams.get("pageType") ?? undefined,
    refresh: url.searchParams.get("refresh") ?? undefined,
    campaignKey: url.searchParams.get("campaignKey") ?? undefined
  });

  return new Response(buildPinterestCsv(filtered), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="craft-board-pinterest-export.csv"',
      "Cache-Control": "no-store"
    }
  });
}
