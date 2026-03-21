import { getCraftBoardStorefrontSeoAttributionSummary } from "../api";
import { buildBacklinkOutreachCampaigns } from "./backlinkCampaigns";
import { backlinkTargets } from "./backlinkTargets";
import { buildBacklinkAssetEntries, getQuickWinBacklinkAssets } from "./backlinks";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "./health";
import { getSeoInventoryEntries, type SeoInventoryEntry, type SeoPageType } from "./inventory";
import {
  buildSeoOpportunityQueue,
  getCtrImprovementOpportunities,
  getOrganicConversionOpportunities,
  getQuickWinOpportunities,
  type SeoOpportunity
} from "./opportunities";
import {
  generatePinterestEntries,
  getHighPriorityPinterestEntries,
  getReadyToExportPinterestEntries,
  getRefreshCandidatePinterestEntries,
  summarizePinterestBoards
} from "./pinterest";
import { buildPinterestPublishingPackets } from "./pinterestPackets";
import { getCraftBoardOutreachWorkspaceData } from "./outreach";
import { fetchSearchConsolePageMetrics } from "./searchConsole";

export type CraftBoardDashboardPageRow = {
  path: string;
  title: string;
  pageType: SeoPageType;
  productFamily: SeoInventoryEntry["productFamily"];
  impressions: number | null;
  clicks: number | null;
  checkoutStarts: number | null;
};

export type CraftBoardDashboardAction = {
  title: string;
  detail: string;
  href: string;
  sectionLabel: string;
};

export type CraftBoardDashboardData = {
  lookbackDays: number;
  kpis: {
    indexablePages: number;
    totalSearchImpressions: number;
    totalSearchClicks: number;
    averageCtr: number | null;
    pinterestReadyPages: number;
    activeBacklinkTargets: number;
    checkoutStarts: number;
    topPriorityOpportunities: number;
  };
  funnel: {
    seen: number;
    clicked: number;
    viewedProduct: number;
    startedOrder: number;
    converted: number;
    note: string;
  };
  google: {
    configured: boolean;
    errorMessage: string | null;
    impressions: number;
    clicks: number;
    averageCtr: number | null;
    averagePosition: number | null;
    bestPages: CraftBoardDashboardPageRow[];
    weakPages: Array<CraftBoardDashboardPageRow & { ctr: number | null; suggestedAction: string }>;
  };
  pinterest: {
    readyEntries: number;
    highPriorityEntries: number;
    refreshCandidates: number;
    boardCount: number;
    packetCount: number;
    exportReady: boolean;
  };
  backlinks: {
    assetCount: number;
    firstWaveCampaignCount: number;
    activeTargetCount: number;
    contactedTargetCount: number;
    followUpsDueCount: number;
    linksWonCount: number;
    quickWinCount: number;
    topCampaignLabel: string | null;
    topAssetPath: string | null;
  };
  opportunities: {
    topPriorityCount: number;
    topItems: SeoOpportunity[];
  };
  topPages: {
    topSeoPages: CraftBoardDashboardPageRow[];
    topGuidePages: CraftBoardDashboardPageRow[];
    topCommercialPages: CraftBoardDashboardPageRow[];
    topCheckoutPages: CraftBoardDashboardPageRow[];
  };
  nextActions: CraftBoardDashboardAction[];
};

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stripBrandSuffix(value: string) {
  return value.replace(/\s+\|\s+Craft & Board$/, "").trim();
}

function buildPageRows(input: {
  inventory: SeoInventoryEntry[];
  reports: ReturnType<typeof buildSeoHealthReports>;
  attributionSummary: ReturnType<typeof summarizeAttributionByInventoryPath>;
}) {
  const inventoryByPath = new Map(input.inventory.map((entry) => [entry.path, entry]));
  const attributionByPath = new Map(input.attributionSummary.map((row) => [row.path, row]));

  return input.reports.map((report) => {
    const entry = inventoryByPath.get(report.path);
    const attribution = attributionByPath.get(report.path);

    return {
      path: report.path,
      title: stripBrandSuffix(entry?.title ?? report.path),
      pageType: report.pageType,
      productFamily: entry?.productFamily ?? null,
      impressions: report.impressions,
      clicks: report.clicks,
      checkoutStarts: attribution?.checkoutStarts ?? null
    } satisfies CraftBoardDashboardPageRow;
  });
}

function topRowsByMetric(
  rows: CraftBoardDashboardPageRow[],
  filter: (row: CraftBoardDashboardPageRow) => boolean,
  sortValue: (row: CraftBoardDashboardPageRow) => number,
  limit = 5
) {
  return [...rows]
    .filter(filter)
    .sort((left, right) => sortValue(right) - sortValue(left))
    .slice(0, limit);
}

export async function buildCraftBoardDashboardData(input?: {
  lookbackDays?: number;
}): Promise<CraftBoardDashboardData> {
  const lookbackDays = input?.lookbackDays && [7, 28, 90].includes(input.lookbackDays) ? input.lookbackDays : 28;
  const inventory = getSeoInventoryEntries();

  const [searchConsole, attributionPayload] = await Promise.all([
    fetchSearchConsolePageMetrics({
      inventory,
      lookbackWindowDays: lookbackDays
    }),
    getCraftBoardStorefrontSeoAttributionSummary({
      lookbackDays
    }).catch((error) => {
      console.warn("[web][dashboard] Failed to fetch storefront SEO attribution summary", {
        error: error instanceof Error ? error.message : String(error)
      });

      return { ok: true as const, lookbackDays, attempts: [] };
    })
  ]);

  const matchedMetrics = searchConsole.metrics.filter((metric) => metric.status === "MATCHED");
  const reports = buildSeoHealthReports({
    inventory,
    metrics: matchedMetrics
  });
  const attributionSummary = summarizeAttributionByInventoryPath(attributionPayload?.attempts ?? []);
  const opportunities = buildSeoOpportunityQueue({
    inventory,
    reports,
    metrics: matchedMetrics,
    attributionSummary
  });
  const pinterestEntries = generatePinterestEntries({
    inventory,
    opportunities
  });
  const pinterestPackets = buildPinterestPublishingPackets(pinterestEntries);
  const backlinkAssets = buildBacklinkAssetEntries({
    inventory,
    opportunities
  });
  const backlinkCampaigns = buildBacklinkOutreachCampaigns(backlinkAssets);
  const outreachWorkspace = await getCraftBoardOutreachWorkspaceData();
  const pageRows = buildPageRows({
    inventory,
    reports,
    attributionSummary
  });

  const totalSearchImpressions = matchedMetrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const totalSearchClicks = matchedMetrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const averageCtr = average(matchedMetrics.map((metric) => metric.ctr));
  const averagePosition = average(matchedMetrics.map((metric) => metric.averagePosition));
  const pinterestReadyEntries = getReadyToExportPinterestEntries(pinterestEntries);
  const pinterestHighPriority = getHighPriorityPinterestEntries(pinterestEntries);
  const pinterestRefreshCandidates = getRefreshCandidatePinterestEntries(pinterestEntries);
  const boardSummary = summarizePinterestBoards(pinterestEntries);
  const checkoutStarts = attributionSummary.reduce((sum, row) => sum + row.checkoutStarts, 0);
  const paidOrders = attributionSummary.reduce((sum, row) => sum + row.paid, 0);
  const commercialClicks = pageRows
    .filter((row) => ["CATEGORY", "PRODUCT", "VARIANT", "VARIANT_COMBINATION"].includes(row.pageType))
    .reduce((sum, row) => sum + (row.clicks ?? 0), 0);
  const topCtrTargets = getCtrImprovementOpportunities(opportunities).slice(0, 5);
  const topConversionTargets = getOrganicConversionOpportunities(opportunities).slice(0, 5);
  const quickWinAssets = getQuickWinBacklinkAssets(backlinkAssets);

  const nextActions: CraftBoardDashboardAction[] = [];

  if (!searchConsole.configured) {
    nextActions.push({
      title: "Connect Google search data",
      detail: "Search Console is not connected yet, so the dashboard can only show inventory and conversion-side SEO signals.",
      href: "/admin/craft-board/seo",
      sectionLabel: "Google Search"
    });
  } else if (topCtrTargets[0]) {
    nextActions.push({
      title: topCtrTargets[0].suggestedNextAction,
      detail: `${topCtrTargets[0].path} is earning impressions but underperforming on click-through.`,
      href: "/admin/craft-board/seo",
      sectionLabel: "SEO Opportunity"
    });
  }

  if (pinterestPackets[0]) {
    nextActions.push({
      title: `Export ${pinterestPackets[0].batchLabel}`,
      detail: `${pinterestPackets[0].entryCount} pins are already grouped and ready for manual publishing work.`,
      href: "/admin/craft-board/seo/pinterest",
      sectionLabel: "Pinterest"
    });
  }

  if (backlinkCampaigns[0]) {
    nextActions.push({
      title: `Run ${outreachWorkspace?.campaignProgress[0]?.campaignKey ?? backlinkCampaigns[0].campaignLabel}`,
      detail:
        outreachWorkspace?.followUpsDue[0]
          ? `${outreachWorkspace.followUpsDue[0].siteName} already needs a follow-up, so the outreach workspace is ready for active execution.`
          : backlinkCampaigns[0].notes ?? "This is the top outreach campaign currently ready to run.",
      href: "/admin/craft-board/outreach",
      sectionLabel: "Outreach"
    });
  }

  if (topConversionTargets[0]) {
    nextActions.push({
      title: topConversionTargets[0].suggestedNextAction,
      detail: `${topConversionTargets[0].path} has commercial value but still has more room to pull people into checkout.`,
      href: "/admin/craft-board/seo",
      sectionLabel: "Conversions"
    });
  }

  if (pinterestRefreshCandidates[0]) {
    nextActions.push({
      title: `Refresh ${pinterestRefreshCandidates[0].pinTitle}`,
      detail: `${pinterestRefreshCandidates[0].boardLabel} has refresh-ready content that can be re-exported without creating new assets.`,
      href: "/admin/craft-board/seo/pinterest",
      sectionLabel: "Pinterest Refresh"
    });
  }

  return {
    lookbackDays,
    kpis: {
      indexablePages: inventory.filter((entry) => entry.isIndexable).length,
      totalSearchImpressions,
      totalSearchClicks,
      averageCtr,
      pinterestReadyPages: pinterestReadyEntries.length,
      activeBacklinkTargets: outreachWorkspace?.summary.totalTargets ?? backlinkTargets.length,
      checkoutStarts,
      topPriorityOpportunities: opportunities.filter((opportunity) => opportunity.priorityScore >= 80).length
    },
    funnel: {
      seen: totalSearchImpressions,
      clicked: totalSearchClicks,
      viewedProduct: commercialClicks,
      startedOrder: checkoutStarts,
      converted: paidOrders,
      note: searchConsole.configured
        ? "This funnel is search-led today. Pinterest publishing readiness is tracked separately until live Pinterest click data is connected."
        : "Google search data is not connected yet, so this funnel uses the available attribution and page-performance signals."
    },
    google: {
      configured: searchConsole.configured,
      errorMessage: searchConsole.errorMessage ?? null,
      impressions: totalSearchImpressions,
      clicks: totalSearchClicks,
      averageCtr,
      averagePosition,
      bestPages: topRowsByMetric(pageRows, (row) => (row.impressions ?? 0) > 0, (row) => row.impressions ?? 0),
      weakPages: topCtrTargets.map((opportunity) => {
        const row = pageRows.find((entry) => entry.path === opportunity.path);
        return {
          path: opportunity.path,
          title: row?.title ?? opportunity.path,
          pageType: opportunity.pageType,
          productFamily: opportunity.productFamily,
          impressions: opportunity.impressions,
          clicks: opportunity.clicks,
          checkoutStarts: opportunity.organicCheckoutStarts,
          ctr: opportunity.ctr,
          suggestedAction: opportunity.suggestedNextAction
        };
      })
    },
    pinterest: {
      readyEntries: pinterestReadyEntries.length,
      highPriorityEntries: pinterestHighPriority.length,
      refreshCandidates: pinterestRefreshCandidates.length,
      boardCount: boardSummary.length,
      packetCount: pinterestPackets.length,
      exportReady: pinterestReadyEntries.length > 0
    },
    backlinks: {
      assetCount: backlinkAssets.length,
      firstWaveCampaignCount: backlinkCampaigns.length,
      activeTargetCount: outreachWorkspace?.summary.totalTargets ?? backlinkTargets.length,
      contactedTargetCount: outreachWorkspace?.summary.contactedTargets ?? 0,
      followUpsDueCount: outreachWorkspace?.summary.followUpsDue ?? 0,
      linksWonCount: outreachWorkspace?.summary.linksWon ?? 0,
      quickWinCount: quickWinAssets.length,
      topCampaignLabel: outreachWorkspace?.campaignProgress[0]?.campaignKey ?? backlinkCampaigns[0]?.campaignLabel ?? null,
      topAssetPath: backlinkAssets[0]?.path ?? null
    },
    opportunities: {
      topPriorityCount: opportunities.filter((opportunity) => opportunity.priorityScore >= 80).length,
      topItems: opportunities.slice(0, 6)
    },
    topPages: {
      topSeoPages: topRowsByMetric(pageRows, (row) => (row.impressions ?? 0) > 0, (row) => row.impressions ?? 0, 6),
      topGuidePages: topRowsByMetric(pageRows, (row) => row.pageType === "GUIDE_ARTICLE", (row) => row.impressions ?? 0, 6),
      topCommercialPages: topRowsByMetric(
        pageRows,
        (row) => ["CATEGORY", "PRODUCT", "VARIANT", "VARIANT_COMBINATION"].includes(row.pageType),
        (row) => (row.impressions ?? 0) + (row.checkoutStarts ?? 0) * 25,
        6
      ),
      topCheckoutPages: topRowsByMetric(pageRows, (row) => (row.checkoutStarts ?? 0) > 0, (row) => row.checkoutStarts ?? 0, 6)
    },
    nextActions: nextActions.slice(0, 5)
  };
}
