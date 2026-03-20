import Link from "next/link";
import type { CraftBoardDashboardData, CraftBoardDashboardPageRow } from "../lib/seo/dashboard";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function renderPageRows(entries: CraftBoardDashboardPageRow[]) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-3 py-2">Page</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Impr.</th>
            <th className="px-3 py-2">Clicks</th>
            <th className="px-3 py-2">Checkout</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.path} className="border-t border-white/10 align-top">
              <td className="px-3 py-3">
                <p className="text-white">{entry.title}</p>
                <p className="mt-1 text-xs text-slate-400">{entry.path}</p>
              </td>
              <td className="px-3 py-3">{entry.pageType}</td>
              <td className="px-3 py-3">{formatNumber(entry.impressions)}</td>
              <td className="px-3 py-3">{formatNumber(entry.clicks)}</td>
              <td className="px-3 py-3">{formatNumber(entry.checkoutStarts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CraftBoardDashboard(input: {
  data: CraftBoardDashboardData;
}) {
  const { data } = input;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Marketing Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Traffic, search, Pinterest, and outreach in one board</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            A contractor-friendly control panel for what is working, where traffic is coming from, and what to do next.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[7, 28, 90].map((days) => (
            <Link
              key={days}
              href={`/admin/craft-board/dashboard?days=${days}`}
              className={`rounded-full border px-4 py-2 text-sm ${
                data.lookbackDays === days
                  ? "border-emerald-300 bg-emerald-300/20 text-emerald-50"
                  : "border-white/10 bg-black/20 text-slate-200 hover:border-emerald-200/30"
              }`}
            >
              Last {days} Days
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Indexable Pages", value: formatNumber(data.kpis.indexablePages) },
          { label: "Search Impressions", value: formatNumber(data.kpis.totalSearchImpressions) },
          { label: "Search Clicks", value: formatNumber(data.kpis.totalSearchClicks) },
          { label: "Average CTR", value: formatPercent(data.kpis.averageCtr) },
          { label: "Pinterest-Ready Pages", value: formatNumber(data.kpis.pinterestReadyPages) },
          { label: "Active Backlink Targets", value: formatNumber(data.kpis.activeBacklinkTargets) },
          { label: "Checkout Starts", value: formatNumber(data.kpis.checkoutStarts) },
          { label: "Top SEO Opportunities", value: formatNumber(data.kpis.topPriorityOpportunities) }
        ].map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Traffic Funnel</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Seen to started order</h3>
          </div>
          <p className="max-w-xl text-right text-xs text-slate-400">{data.funnel.note}</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {[
            { label: "Seen", value: data.funnel.seen },
            { label: "Clicked", value: data.funnel.clicked },
            { label: "Viewed Product", value: data.funnel.viewedProduct },
            { label: "Started Order", value: data.funnel.startedOrder },
            { label: "Converted", value: data.funnel.converted }
          ].map((step, index) => (
            <article key={step.label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
              <p className="mt-2 text-lg font-medium text-white">{step.label}</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-200">{formatNumber(step.value)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Google Search Summary</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Search visibility</h3>
            </div>
            <Link href="/admin/craft-board/seo" className="text-sm text-emerald-200">
              Open SEO Ops
            </Link>
          </div>
          {!data.google.configured ? (
            <div className="mt-4 rounded-[1.25rem] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Google data not connected yet. The rest of the dashboard still works using inventory, readiness, and conversion-side signals.
            </div>
          ) : data.google.errorMessage ? (
            <div className="mt-4 rounded-[1.25rem] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Google data is configured but unavailable right now: {data.google.errorMessage}
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: "Impressions", value: formatNumber(data.google.impressions) },
              { label: "Clicks", value: formatNumber(data.google.clicks) },
              { label: "CTR", value: formatPercent(data.google.averageCtr) },
              {
                label: "Average Position",
                value: data.google.averagePosition === null ? "—" : data.google.averagePosition.toFixed(1)
              }
            ].map((card) => (
              <article key={card.label} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Best-performing pages</p>
              {renderPageRows(data.google.bestPages.slice(0, 5))}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Weak high-impression pages</p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {data.google.weakPages.length === 0 ? (
                  <p className="text-slate-400">No major weak-CTR targets surfaced in the current window.</p>
                ) : (
                  data.google.weakPages.map((page) => (
                    <div key={page.path} className="rounded-[0.9rem] border border-white/10 bg-white/5 p-3">
                      <p className="font-medium text-white">{page.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{page.path}</p>
                      <p className="mt-2 text-xs text-slate-300">
                        {formatNumber(page.impressions)} impressions · {formatPercent(page.ctr)} CTR
                      </p>
                      <p className="mt-2 text-xs text-amber-100">{page.suggestedAction}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Pinterest Summary</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Publishing readiness</h3>
              </div>
              <Link href="/admin/craft-board/seo/pinterest" className="text-sm text-emerald-200">
                Open Pinterest Ops
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { label: "Pin-Ready Pages", value: formatNumber(data.pinterest.readyEntries) },
                { label: "High-Priority Pins", value: formatNumber(data.pinterest.highPriorityEntries) },
                { label: "Refresh Candidates", value: formatNumber(data.pinterest.refreshCandidates) },
                { label: "Board Buckets", value: formatNumber(data.pinterest.boardCount) },
                { label: "Campaign Packets", value: formatNumber(data.pinterest.packetCount) },
                { label: "Export Status", value: data.pinterest.exportReady ? "Ready" : "Needs Setup" }
              ].map((card) => (
                <article key={card.label} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Backlink / Outreach Snapshot</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Authority work in progress</h3>
              </div>
              <Link href="/admin/craft-board/outreach" className="text-sm text-emerald-200">
                Open Outreach Workspace
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                { label: "Linkable Assets", value: formatNumber(data.backlinks.assetCount) },
                { label: "First-Wave Campaigns", value: formatNumber(data.backlinks.firstWaveCampaignCount) },
                { label: "Target Domains Ready", value: formatNumber(data.backlinks.activeTargetCount) },
                { label: "Quick-Win Assets", value: formatNumber(data.backlinks.quickWinCount) },
                { label: "Contacted Targets", value: formatNumber(data.backlinks.contactedTargetCount) },
                { label: "Follow-Ups Due", value: formatNumber(data.backlinks.followUpsDueCount) },
                { label: "Links Won", value: formatNumber(data.backlinks.linksWonCount) }
              ].map((card) => (
                <article key={card.label} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best Campaign To Start</p>
                <p className="mt-3 text-lg font-medium text-white">{data.backlinks.topCampaignLabel ?? "No campaign ready yet"}</p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best Page To Pitch</p>
                <p className="mt-3 text-lg font-medium text-white">{data.backlinks.topAssetPath ?? "No asset ready yet"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/admin/craft-board/seo/backlinks" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
                Backlink Report
              </Link>
              <Link href="/admin/craft-board/outreach" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                Outreach Workspace
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Top Page Performance</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Best pages across the system</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Top SEO Pages</p>
              {renderPageRows(data.topPages.topSeoPages)}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Top Guide Pages</p>
              {renderPageRows(data.topPages.topGuidePages)}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Top Commercial Pages</p>
              {renderPageRows(data.topPages.topCommercialPages)}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Top Pages Driving Checkout</p>
              {renderPageRows(data.topPages.topCheckoutPages)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">SEO Opportunity Snapshot</p>
                <h3 className="mt-2 text-xl font-semibold text-white">What to work on next</h3>
              </div>
              <Link href="/admin/craft-board/seo" className="text-sm text-emerald-200">
                Open full SEO report
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.opportunities.topItems.map((opportunity) => (
                <article key={`${opportunity.path}:${opportunity.opportunityType}`} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{opportunity.path}</p>
                    <p className="text-sm text-emerald-200">{opportunity.priorityScore}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{opportunity.opportunityType}</p>
                  <p className="mt-2 text-sm text-slate-200">{opportunity.recommendationSummary}</p>
                  <p className="mt-2 text-xs text-amber-100">{opportunity.suggestedNextAction}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recommended Next Actions</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Short list for this week</h3>
            <div className="mt-5 space-y-3">
              {data.nextActions.map((action) => (
                <Link
                  key={`${action.sectionLabel}:${action.title}`}
                  href={action.href}
                  className="block rounded-[1rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-200/30"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">{action.sectionLabel}</p>
                  <p className="mt-2 font-medium text-white">{action.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{action.detail}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
