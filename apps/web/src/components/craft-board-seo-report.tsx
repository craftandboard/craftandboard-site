import Link from "next/link";
import type { SeoExpansionCandidate } from "../lib/seo/expansion";
import type { SeoHealthReport } from "../lib/seo/health";
import type { SeoInventoryEntry, SeoPageType } from "../lib/seo/inventory";
import type { SeoOpportunity } from "../lib/seo/opportunities";
import type { SearchConsoleSyncResult } from "../lib/seo/searchConsole";

type AttributionSummaryRow = {
  path: string;
  pageType: SeoPageType | "UNMATCHED";
  productFamily: string | null;
  checkoutStarts: number;
  reachedPayment: number;
  paid: number;
};

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildCountByPageType(entries: SeoInventoryEntry[]) {
  return entries.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.pageType] = (accumulator[entry.pageType] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function CraftBoardSeoReport(input: {
  lookbackDays: number;
  inventory: SeoInventoryEntry[];
  reports: SeoHealthReport[];
  searchConsole: SearchConsoleSyncResult;
  opportunities: SeoOpportunity[];
  quickWins: SeoOpportunity[];
  highImpactContentRefreshes: SeoOpportunity[];
  ctrImprovementTargets: SeoOpportunity[];
  internalLinkingOpportunities: SeoOpportunity[];
  organicConversionOpportunities: SeoOpportunity[];
  highOpportunityPages: SeoHealthReport[];
  lowCtrPages: SeoHealthReport[];
  attributionSummary: AttributionSummaryRow[];
  expansionCandidates: SeoExpansionCandidate[];
  topExpansionCandidates: SeoExpansionCandidate[];
}) {
  const countByPageType = buildCountByPageType(input.inventory);
  const totalImpressions = input.searchConsole.metrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const totalClicks = input.searchConsole.metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const averageCtr = average(input.searchConsole.metrics.map((metric) => metric.ctr));
  const averagePosition = average(input.searchConsole.metrics.map((metric) => metric.averagePosition));
  const missingFromSitemap = input.reports.filter((report) => !report.inSitemap);
  const metadataWarnings = input.reports.filter((report) => report.healthWarnings.length > 0);
  const topByImpressions = [...input.reports]
    .filter((report) => (report.impressions ?? 0) > 0)
    .sort((left, right) => (right.impressions ?? 0) - (left.impressions ?? 0))
    .slice(0, 8);
  const topByClicks = [...input.reports]
    .filter((report) => (report.clicks ?? 0) > 0)
    .sort((left, right) => (right.clicks ?? 0) - (left.clicks ?? 0))
    .slice(0, 8);
  const topLandingPages = input.attributionSummary.slice(0, 8);
  const topLandingTypes = Object.entries(
    input.attributionSummary.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.pageType] = (accumulator[row.pageType] ?? 0) + row.checkoutStarts;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const topFamilies = Object.entries(
    input.attributionSummary.reduce<Record<string, number>>((accumulator, row) => {
      if (!row.productFamily) {
        return accumulator;
      }
      accumulator[row.productFamily] = (accumulator[row.productFamily] ?? 0) + row.checkoutStarts;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const topOpportunities = input.opportunities.slice(0, 10);
  const generatedExpansionCount = input.expansionCandidates.filter((candidate) => candidate.status === "GENERATED").length;
  const suggestedExpansionCount = input.expansionCandidates.filter((candidate) => candidate.status === "SUGGESTED").length;
  const approvedExpansionCount = input.expansionCandidates.filter((candidate) => candidate.status === "APPROVED").length;

  function renderOpportunityRows(opportunities: SeoOpportunity[]) {
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-3 py-2">Path</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Impact</th>
              <th className="px-3 py-2">Effort</th>
              <th className="px-3 py-2">Override</th>
              <th className="px-3 py-2">Next action</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opportunity) => (
              <tr key={`${opportunity.path}:${opportunity.opportunityType}`} className="border-t border-white/10">
                <td className="px-3 py-3 align-top">
                  <p>{opportunity.path}</p>
                  <p className="mt-1 text-xs text-slate-400">{opportunity.recommendationSummary}</p>
                  {opportunity.overrideKeywordTargetHint ? (
                    <p className="mt-1 text-xs text-emerald-200">Keyword: {opportunity.overrideKeywordTargetHint}</p>
                  ) : null}
                  {opportunity.overrideRefreshNote ? (
                    <p className="mt-1 text-xs text-slate-400">{opportunity.overrideRefreshNote}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-top">{opportunity.opportunityType}</td>
                <td className="px-3 py-3 align-top">{opportunity.priorityScore}</td>
                <td className="px-3 py-3 align-top">{opportunity.impactScore}</td>
                <td className="px-3 py-3 align-top">{opportunity.effortScore}</td>
                <td className="px-3 py-3 align-top">
                  {opportunity.hasActiveOverride ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                      Optimized
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-300">
                      Default
                    </span>
                  )}
                  {opportunity.overrideLastUpdated ? (
                    <p className="mt-1 text-xs text-slate-400">{opportunity.overrideLastUpdated}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-top">{opportunity.suggestedNextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board SEO Ops</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">SEO observability and search performance</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Inventory, crawl health, Search Console visibility, and organic checkout attribution across product pages, variants, combinations, and guides.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/admin/craft-board/seo/backlinks" className="text-emerald-200 underline-offset-4 hover:underline">
            Open backlink outreach ops
          </Link>
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Lookback Window</p>
            <p className="mt-2 text-sm text-slate-200">Current window: last {input.lookbackDays} days</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[7, 28, 90].map((days) => (
              <Link
                key={days}
                href={`/admin/craft-board/seo?days=${days}`}
                className={`rounded-full border px-4 py-2 text-sm ${
                  input.lookbackDays === days
                    ? "border-emerald-300 bg-emerald-300/20 text-emerald-50"
                    : "border-white/10 bg-black/20 text-slate-200 hover:border-emerald-200/30"
                }`}
              >
                Last {days} Days
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Indexable Pages", value: formatNumber(input.inventory.filter((entry) => entry.isIndexable).length) },
          { label: "Pages In Sitemap", value: formatNumber(input.inventory.filter((entry) => entry.inSitemap).length) },
          { label: "With Structured Data", value: formatNumber(input.inventory.filter((entry) => entry.hasStructuredData).length) },
          { label: "Health Warnings", value: formatNumber(metadataWarnings.length) }
        ].map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Generated Expansion Pages", value: formatNumber(generatedExpansionCount) },
          { label: "Approved Candidates", value: formatNumber(approvedExpansionCount) },
          { label: "Suggested Candidates", value: formatNumber(suggestedExpansionCount) }
        ].map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">SEO Inventory Overview</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Counts by page type</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {Object.entries(countByPageType).map(([pageType, count]) => (
                <div key={pageType} className="flex items-center justify-between">
                  <span>{pageType}</span>
                  <span>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Freshness and indexation summary</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Inventory with freshness timestamp</span>
                <span>{formatNumber(input.inventory.filter((entry) => entry.lastModified).length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unexpected non-indexable pages</span>
                <span>{formatNumber(input.inventory.filter((entry) => !entry.isIndexable).length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inventory missing from sitemap</span>
                <span>{formatNumber(missingFromSitemap.length)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Search Performance Overview</p>
        {!input.searchConsole.configured ? (
          <div className="mt-4 rounded-[1.25rem] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Search Console is not configured. Inventory-only SEO health data is still available.
          </div>
        ) : input.searchConsole.errorMessage ? (
          <div className="mt-4 rounded-[1.25rem] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Search Console sync is configured but unavailable right now: {input.searchConsole.errorMessage}
          </div>
        ) : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Impressions", value: formatNumber(totalImpressions) },
            { label: "Total Clicks", value: formatNumber(totalClicks) },
            { label: "Average CTR", value: formatPercent(averageCtr) },
            { label: "Average Position", value: averagePosition ? averagePosition.toFixed(1) : "—" }
          ].map((card) => (
            <article key={card.label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Top pages by impressions</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {topByImpressions.map((report) => (
                <div key={report.path} className="flex items-center justify-between gap-4">
                  <span className="truncate">{report.path}</span>
                  <span>{formatNumber(report.impressions)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Top pages by clicks</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {topByClicks.map((report) => (
                <div key={report.path} className="flex items-center justify-between gap-4">
                  <span className="truncate">{report.path}</span>
                  <span>{formatNumber(report.clicks)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">High-Opportunity Pages</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Impr.</th>
                  <th className="px-3 py-2">CTR</th>
                  <th className="px-3 py-2">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {input.highOpportunityPages.map((report) => (
                  <tr key={report.path} className="border-t border-white/10">
                    <td className="px-3 py-3">{report.path}</td>
                    <td className="px-3 py-3">{report.pageType}</td>
                    <td className="px-3 py-3">{formatNumber(report.impressions)}</td>
                    <td className="px-3 py-3">{formatPercent(report.ctr ?? null)}</td>
                    <td className="px-3 py-3">{report.averagePosition?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Low-CTR Pages</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Impr.</th>
                  <th className="px-3 py-2">CTR</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {input.lowCtrPages.map((report) => (
                  <tr key={report.path} className="border-t border-white/10">
                    <td className="px-3 py-3">{report.path}</td>
                    <td className="px-3 py-3">{report.pageType}</td>
                    <td className="px-3 py-3">{formatNumber(report.impressions)}</td>
                    <td className="px-3 py-3">{formatPercent(report.ctr ?? null)}</td>
                    <td className="px-3 py-3">{report.optimizationOpportunities[0] ?? "Review snippet quality."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Indexation and Sitemap Health</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Pages needing attention</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {metadataWarnings.slice(0, 10).map((report) => (
                <div key={report.path} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium text-white">{report.path}</p>
                  <p className="mt-1 text-slate-300">{report.healthWarnings.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Sitemap gaps</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {missingFromSitemap.length === 0 ? (
                <p className="text-slate-300">All inventory pages are represented in the sitemap.</p>
              ) : (
                missingFromSitemap.map((report) => (
                  <div key={report.path} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    {report.path}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Organic Conversion Attribution Summary</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Top landing pages by checkout starts</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              {topLandingPages.map((row) => (
                <div key={row.path} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium text-white">{row.path}</p>
                  <p className="mt-1 text-slate-300">
                    {row.pageType} · Starts {row.checkoutStarts} · Payment {row.reachedPayment} · Paid {row.paid}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Top landing page types</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {topLandingTypes.map(([pageType, count]) => (
                <div key={pageType} className="flex items-center justify-between">
                  <span>{pageType}</span>
                  <span>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-medium text-white">Top product families by organic entry</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {topFamilies.map(([family, count]) => (
                <div key={family} className="flex items-center justify-between">
                  <span>{family}</span>
                  <span>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Top Opportunities</p>
        {renderOpportunityRows(topOpportunities)}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Expansion Candidates</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Keyword</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {input.topExpansionCandidates.map((candidate) => (
                <tr key={candidate.candidateKey} className="border-t border-white/10">
                  <td className="px-3 py-3">
                    <p>{candidate.slug}</p>
                    <p className="mt-1 text-xs text-slate-400">{candidate.keywordCluster}</p>
                  </td>
                  <td className="px-3 py-3">{candidate.pageType}</td>
                  <td className="px-3 py-3">{candidate.source}</td>
                  <td className="px-3 py-3">{candidate.targetKeyword}</td>
                  <td className="px-3 py-3">{candidate.priorityScore}</td>
                  <td className="px-3 py-3">{candidate.status}</td>
                  <td className="px-3 py-3">{candidate.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Quick Wins</p>
          {renderOpportunityRows(input.quickWins)}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">High-Impact Content Refreshes</p>
          {renderOpportunityRows(input.highImpactContentRefreshes)}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">CTR Improvement Targets</p>
          {renderOpportunityRows(input.ctrImprovementTargets)}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Internal Linking Opportunities</p>
          {renderOpportunityRows(input.internalLinkingOpportunities)}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Organic Conversion Opportunities</p>
        {renderOpportunityRows(input.organicConversionOpportunities)}
      </section>
    </div>
  );
}
