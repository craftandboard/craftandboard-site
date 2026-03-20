import Link from "next/link";
import type { PinterestBoardKey } from "../lib/seo/pinterestBoards";
import type { PinterestPublishingEntry } from "../lib/seo/pinterest";
import type { PinterestPublishingPacket } from "../lib/seo/pinterestPackets";
import type { SeoPageType } from "../lib/seo/inventory";

function matchesFilter<T extends string>(value: T | null | undefined, filter: string | undefined) {
  if (!filter || filter === "all") {
    return true;
  }

  return value === filter;
}

export function CraftBoardSeoPinterestReport(input: {
  entries: PinterestPublishingEntry[];
  allEntries: PinterestPublishingEntry[];
  readyToExport: PinterestPublishingEntry[];
  highPriority: PinterestPublishingEntry[];
  guidePins: PinterestPublishingEntry[];
  productPins: PinterestPublishingEntry[];
  refreshCandidates: PinterestPublishingEntry[];
  packets: PinterestPublishingPacket[];
  boardSummary: Array<{
    boardKey: PinterestBoardKey;
    boardLabel: string;
    count: number;
    shelves: number;
    mantels: number;
    guides: number;
  }>;
  filters: {
    pageType?: string;
    productFamily?: string;
    board?: string;
    priority?: string;
    refresh?: string;
    campaignKey?: string;
  };
}) {
  const filteredEntries = input.entries.filter(
    (entry) =>
      matchesFilter(entry.pageType, input.filters.pageType) &&
      matchesFilter(entry.productFamily, input.filters.productFamily) &&
      matchesFilter(entry.boardKey, input.filters.board) &&
      matchesFilter(entry.publishPriority, input.filters.priority) &&
      (!input.filters.refresh || input.filters.refresh === "all" || (input.filters.refresh === "true" ? entry.isRefreshCandidate : true)) &&
      matchesFilter(entry.campaignKey, input.filters.campaignKey)
  );

  function hrefForFilter(next: Partial<{ pageType: string; productFamily: string; board: string; priority: string; refresh: string; campaignKey: string }>) {
    const params = new URLSearchParams();
    const values = {
      pageType: next.pageType ?? input.filters.pageType,
      productFamily: next.productFamily ?? input.filters.productFamily,
      board: next.board ?? input.filters.board,
      priority: next.priority ?? input.filters.priority,
      refresh: next.refresh ?? input.filters.refresh,
      campaignKey: next.campaignKey ?? input.filters.campaignKey
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `/admin/craft-board/seo/pinterest?${query}` : "/admin/craft-board/seo/pinterest";
  }

  function exportHref(extra?: Partial<{ board: string; productFamily: string; priority: string; pageType: string; refresh: string; campaignKey: string }>) {
    const params = new URLSearchParams();
    const values = {
      board: extra?.board ?? input.filters.board,
      productFamily: extra?.productFamily ?? input.filters.productFamily,
      priority: extra?.priority ?? input.filters.priority,
      pageType: extra?.pageType ?? input.filters.pageType,
      refresh: extra?.refresh ?? input.filters.refresh,
      campaignKey: extra?.campaignKey ?? input.filters.campaignKey
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query
      ? `/admin/craft-board/seo/pinterest/export.csv?${query}`
      : "/admin/craft-board/seo/pinterest/export.csv";
  }

  function renderRows(entries: PinterestPublishingEntry[]) {
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-3 py-2">Pin</th>
              <th className="px-3 py-2">Board</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Cadence</th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Destination</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.pageKey}:${entry.boardKey}`} className="border-t border-white/10 align-top">
                <td className="px-3 py-3">
                  <p className="font-medium text-white">{entry.pinTitle}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.pinDescription}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{entry.pageType}</span>
                    {entry.productFamily ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">
                        {entry.productFamily}
                      </span>
                    ) : null}
                    {entry.keywordHint ? (
                      <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-sky-100">
                        {entry.keywordHint}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p>{entry.boardLabel}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.exportStatus}</p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      entry.publishPriority === "HIGH"
                        ? "border border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                        : entry.publishPriority === "MEDIUM"
                          ? "border border-amber-300/30 bg-amber-400/10 text-amber-100"
                          : "border border-white/10 bg-black/20 text-slate-300"
                    }`}
                  >
                    {entry.publishPriority}
                  </span>
                  {entry.freshnessTag ? (
                    <p className="mt-1 text-xs text-slate-400">{entry.freshnessTag}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <p>{entry.cadence}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.publishStatus}</p>
                </td>
                <td className="px-3 py-3 text-xs">
                  <a href={entry.imageUrl} target="_blank" rel="noreferrer" className="text-emerald-200 underline-offset-4 hover:underline">
                    Open image
                  </a>
                </td>
                <td className="px-3 py-3 text-xs">
                  <p className="break-all text-slate-300">{entry.utmDestinationUrl}</p>
                  {entry.notes ? <p className="mt-2 text-slate-500">{entry.notes}</p> : null}
                </td>
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
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Pinterest Ops</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Pinterest publishing and traffic distribution</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Pin-ready titles, descriptions, boards, vertical image URLs, and UTM-tagged destination links generated from the SEO inventory and override system.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Filters</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            { label: "All Types", href: hrefForFilter({ pageType: "all" }) },
            { label: "Guides", href: hrefForFilter({ pageType: "GUIDE_ARTICLE" as SeoPageType }) },
            { label: "Products", href: hrefForFilter({ pageType: "PRODUCT" as SeoPageType }) },
            { label: "Variants", href: hrefForFilter({ pageType: "VARIANT" as SeoPageType }) },
            { label: "Combos", href: hrefForFilter({ pageType: "VARIANT_COMBINATION" as SeoPageType }) },
            { label: "High Priority", href: hrefForFilter({ priority: "HIGH" }) },
            { label: "Refresh Candidates", href: hrefForFilter({ refresh: "true" }) },
            { label: "Shelves", href: hrefForFilter({ productFamily: "floating-shelves" }) },
            { label: "Mantels", href: hrefForFilter({ productFamily: "floating-mantels" }) }
          ].map((chip) => (
            <Link key={chip.label} href={chip.href} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200 hover:border-emerald-200/30">
              {chip.label}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={hrefForFilter({ board: "all" })} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200 hover:border-emerald-200/30">
            All Boards
          </Link>
          {input.boardSummary.slice(0, 6).map((board) => (
            <Link
              key={board.boardKey}
              href={hrefForFilter({ board: board.boardKey })}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200 hover:border-emerald-200/30"
            >
              {board.boardLabel}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={exportHref()} className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100 hover:border-emerald-200/50">
            Export Current CSV
          </Link>
          <Link href={exportHref({ priority: "HIGH", refresh: "all" })} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200 hover:border-emerald-200/30">
            Export High-Priority
          </Link>
          <Link href={exportHref({ refresh: "true" })} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200 hover:border-emerald-200/30">
            Export Refresh Candidates
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Ready to Export", value: input.readyToExport.length },
          { label: "High-Priority Pins", value: input.highPriority.length },
          { label: "Guide Pins", value: input.guidePins.length },
          { label: "Refresh Candidates", value: input.refreshCandidates.length }
        ].map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Ready to Export</p>
          <Link href={exportHref()} className="text-sm text-emerald-200 underline-offset-4 hover:underline">
            Download CSV
          </Link>
        </div>
        {renderRows(filteredEntries.filter((entry) => entry.exportStatus === "READY").slice(0, 20))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">High-Priority Pins</p>
          {renderRows(input.highPriority.slice(0, 12))}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Campaign / Batch View</p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            {input.packets.map((packet) => (
              <div key={packet.batchKey} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{packet.batchLabel}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {packet.publishWindowLabel} · {packet.publishPriority} · {packet.entryCount} entries
                    </p>
                  </div>
                  <Link
                    href={exportHref({ campaignKey: packet.batchKey })}
                    className="text-xs text-emerald-200 underline-offset-4 hover:underline"
                  >
                    Export Batch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Refresh Candidates</p>
          {renderRows(input.refreshCandidates.slice(0, 12))}
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recently Exported</p>
          <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            Export persistence is not enabled yet, so this view currently reflects live packet/export readiness only. Use the CSV controls to generate current publishing packets.
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Guide Pins</p>
          {renderRows(input.guidePins.slice(0, 12))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Product / Variant Pins</p>
        {renderRows(input.productPins.slice(0, 20))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Pinterest Board Distribution</p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            {input.boardSummary.map((board) => (
              <div key={board.boardKey} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{board.boardLabel}</p>
                  <p>{board.count}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Shelves {board.shelves} · Mantels {board.mantels} · Guides {board.guides}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Exportable Feed / Table</p>
          {renderRows(filteredEntries.slice(0, 30))}
        </div>
      </section>
    </div>
  );
}
