import Link from "next/link";
import type { BacklinkAssetEntry } from "../lib/seo/backlinks";
import type { BacklinkOutreachCampaign } from "../lib/seo/backlinkCampaigns";
import type { BacklinkTarget } from "../lib/seo/backlinkTargets";

export function CraftBoardSeoBacklinksReport(input: {
  assets: BacklinkAssetEntry[];
  quickWins: BacklinkAssetEntry[];
  campaigns: BacklinkOutreachCampaign[];
  targets: BacklinkTarget[];
}) {
  const firstWaveCampaigns = [...input.campaigns].sort((left, right) => left.runOrder - right.runOrder);
  const featuredAssets = input.assets.filter((entry) =>
    [
      "/guides/how-to-measure-cabinet-shelves",
      "/shop/cabinet-shelves",
      "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
      "/shop/cabinet-shelves/maple-melamine-cabinet-shelf",
      "/guides/install-floating-shelves",
      "/guides/floating-shelf-weight-limits",
      "/guides/best-wood-for-floating-shelves",
      "/guides/floating-mantel-design-ideas",
      "/shop/floating-shelves",
      "/shop/floating-mantels",
      "/shop/floating-shelves/classic-floating-shelf",
      "/shop/floating-mantels/classic-floating-mantel"
    ].includes(entry.path)
  );
  const targetCountsByType = input.targets.reduce<Record<string, number>>((accumulator, target) => {
    accumulator[target.targetType] = (accumulator[target.targetType] ?? 0) + 1;
    return accumulator;
  }, {});

  function renderAssetRows(entries: BacklinkAssetEntry[]) {
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Pitch</th>
              <th className="px-3 py-2">Anchors</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.path} className="border-t border-white/10 align-top">
                <td className="px-3 py-3">
                  <p>{entry.path}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.authorityGoal}</p>
                </td>
                <td className="px-3 py-3">{entry.assetType}</td>
                <td className="px-3 py-3">{entry.backlinkPriorityScore}</td>
                <td className="px-3 py-3">{entry.recommendedTargetType}</td>
                <td className="px-3 py-3">{entry.pitchAngle}</td>
                <td className="px-3 py-3 text-xs">{entry.suggestedAnchorThemes.join(", ")}</td>
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
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Backlink Ops</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Linkable assets and outreach campaigns</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Editorial-style guides, flagship categories, and selective commercial pages grouped into campaign-ready backlink outreach lists.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=assets" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
            Export Assets CSV
          </Link>
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=campaigns" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
            Export Campaigns CSV
          </Link>
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=targets" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
            Export Targets CSV
          </Link>
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=packet" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
            Export Outreach Packet CSV
          </Link>
          <Link href="/admin/craft-board/outreach" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
            Open Outreach Workspace
          </Link>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-400/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-200">Campaign Pack #1</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">First-wave run order and execution focus</h3>
        <div className="mt-4 grid gap-4 xl:grid-cols-5">
          {firstWaveCampaigns.map((campaign) => (
            <article key={campaign.campaignKey} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Run {campaign.runOrder}</p>
              <p className="mt-2 font-medium text-white">{campaign.campaignLabel}</p>
              <p className="mt-2 text-xs text-slate-400">
                {campaign.targetType} · {campaign.primaryPitchAngle} · {campaign.priority}
              </p>
              <p className="mt-3 text-xs text-slate-300">{campaign.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Top Linkable Assets", value: input.assets.length },
          { label: "Campaign Buckets", value: input.campaigns.length },
          { label: "Outreach Targets", value: input.targets.length },
          { label: "Quick-Win Assets", value: input.quickWins.length }
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
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Top Linkable Assets</p>
            <p className="mt-2 text-sm text-slate-300">These are the highest-scoring pages across the full backlink ops model.</p>
          </div>
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=assets" className="text-xs text-emerald-200">
            Export asset list
          </Link>
        </div>
        {renderAssetRows(input.assets.slice(0, 16))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">First-Wave Assets</p>
            <p className="mt-2 text-sm text-slate-300">The required pack #1 guides, categories, and flagship PDPs that should anchor the first outreach pushes.</p>
          </div>
          <Link href="/admin/craft-board/seo/backlinks/export.csv?scope=packet" className="text-xs text-emerald-200">
            Export outreach packet
          </Link>
        </div>
        {renderAssetRows(featuredAssets)}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Campaign Buckets</p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            {firstWaveCampaigns.map((campaign) => (
              <div key={campaign.campaignKey} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">
                    {campaign.runOrder}. {campaign.campaignLabel}
                  </p>
                  <p>{campaign.assetCount}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {campaign.targetType} · {campaign.primaryPitchAngle} · {campaign.priority} · {campaign.exportStatus}
                </p>
                <p className="mt-3 text-xs text-slate-300">{campaign.notes}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Seeded Target Groups</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(targetCountsByType)
              .sort((left, right) => right[1] - left[1])
              .map(([targetType, count]) => (
                <div key={targetType} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">{targetType}</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{count}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Outreach Targets</p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            {input.targets.map((target) => (
              <div key={target.id} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{target.siteName}</p>
                  <p>{target.authorityTier}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">{target.domain} · {target.targetType} · {target.status}</p>
                <p className="mt-2 text-xs text-slate-300">{target.fitNotes}</p>
                <p className="mt-2 text-[11px] text-slate-400">Campaigns: {target.preferredCampaignKeys.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Quick-Win Outreach Opportunities</p>
          {renderAssetRows(input.quickWins)}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Top Linkable Assets</p>
        <p className="mt-2 text-sm text-slate-300">Use the exports above to pull the full asset list, campaign notes, or the combined packet for immediate outreach work.</p>
      </section>
    </div>
  );
}
