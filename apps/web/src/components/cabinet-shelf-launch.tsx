import Link from "next/link";
import type { CabinetShelfLaunchPacket } from "../lib/seo/cabinetShelfLaunch";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No follow-up date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function CabinetShelfLaunch(input: {
  packet: CabinetShelfLaunchPacket;
}) {
  const { packet } = input;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Cabinet Shelf Launch</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{packet.summary}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Launch Priority</p>
          <p className="mt-2 text-lg font-medium text-white">{packet.launchPriority}</p>
          <p className="mt-1 text-xs text-slate-400">Updated {formatDate(packet.lastUpdated)}</p>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Launch Overview</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">One focused launch folder for the cabinet shelf MVP</h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This launch is built around one education-first asset, two live replacement shelf products, and three traffic channels:
          {` ${packet.overview.channels.join(" • ")}.`} The measurement guide leads, the two melamine PDPs close the commercial handoff, and the category page supports finish comparison.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Lead Asset</p>
            <p className="mt-3 text-lg font-medium text-white">{packet.overview.primaryGuideTitle}</p>
          </article>
          <article className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Included Products</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {packet.overview.includedProducts.map((product) => (
                <p key={product}>{product}</p>
              ))}
            </div>
          </article>
          <article className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Launch Channels</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {packet.overview.channels.map((channel) => (
                <p key={channel}>{channel}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Best Pages to Promote</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {packet.promotedPages.map((page, index) => (
            <article key={page.pageKey} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Priority {index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{page.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{page.path}</p>
              <p className="mt-4 text-sm text-slate-300">{page.whyItMatters}</p>
              <div className="mt-4 rounded-[1rem] border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                {page.recommendedUse}
              </div>
              <a href={page.destinationUrl} className="mt-4 inline-flex text-sm text-emerald-200 underline-offset-4 hover:underline">
                Open destination
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">MVP Messaging Pack</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Simple launch copy for the cabinet shelf funnel</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Brand Summary</p>
              <p className="mt-2">{packet.messaging.brandSummary}</p>
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Problem We Solve</p>
              <p className="mt-2">{packet.messaging.problemSummary}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Talking Points</p>
                <ul className="mt-3 space-y-2">
                  {packet.messaging.talkingPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Customer Value Bullets</p>
                <ul className="mt-3 space-y-2">
                  {packet.messaging.valueBullets.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Campaign Copy Outputs</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pinterest Summary</p>
                <p className="mt-2">{packet.messaging.pinterestSummary}</p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Outreach Summary</p>
                <p className="mt-2">{packet.messaging.outreachSummary}</p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Website Summary</p>
                <p className="mt-2">{packet.messaging.websiteSummary}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Material Positioning</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="font-medium text-white">White Melamine</p>
                <p className="mt-2">{packet.messaging.whiteMelamineSummary}</p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="font-medium text-white">Maple Melamine</p>
                <p className="mt-2">{packet.messaging.mapleMelamineSummary}</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Pinterest Launch Packet</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">First cabinet shelf pins to post</h3>
          </div>
          <Link href="/admin/craft-board/seo/pinterest" className="text-sm text-emerald-200">
            Open Pinterest Ops
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            { label: "Launch Pins", value: packet.pinterest.packetCount },
            { label: "Guide Pins", value: packet.pinterest.groupedPins.find((group) => group.label === "Guide Pins")?.pins.length ?? 0 },
            { label: "Product Pins", value: packet.pinterest.groupedPins.filter((group) => group.label.includes("Melamine")).reduce((sum, group) => sum + group.pins.length, 0) },
            { label: "Category Pins", value: packet.pinterest.groupedPins.find((group) => group.label === "Category Pins")?.pins.length ?? 0 }
          ].map((card) => (
            <article key={card.label} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {packet.pinterest.groupedPins.map((group) => (
            <div key={group.label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">{group.label}</p>
              <div className="mt-4 space-y-3">
                {group.pins.map((pin) => (
                  <div key={pin.launchKey} className="rounded-[0.9rem] border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                    <p className="font-medium text-white">{pin.pinTitle}</p>
                    <p className="mt-1 text-xs text-slate-400">{pin.boardLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                      <a href={pin.imageUrl} className="text-emerald-200 underline-offset-4 hover:underline">
                        Open image
                      </a>
                      <a href={pin.destinationUrl} className="text-emerald-200 underline-offset-4 hover:underline">
                        Open destination
                      </a>
                      <span>{pin.publishPriority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Outreach Launch Packet</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Guide-led outreach for the MVP launch</h3>
          </div>
          <Link href="/admin/craft-board/outreach" className="text-sm text-emerald-200">
            Open Outreach Workspace
          </Link>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-4">
            <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Campaign</p>
              <p className="mt-2 text-lg font-medium text-white">{packet.outreach.campaignLabel}</p>
              <p className="mt-3 text-sm text-slate-300">{packet.recommendedPitchSummary}</p>
            </article>
            <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best First Asset</p>
              {packet.outreach.primaryAsset ? (
                <>
                  <p className="mt-2 text-lg font-medium text-white">{packet.outreach.primaryAsset.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{packet.outreach.primaryAsset.path}</p>
                  <p className="mt-3 text-sm text-slate-300">{packet.outreach.primaryAsset.notes ?? "Lead with this page first in outreach."}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {packet.outreach.primaryAsset.anchorThemes.map((theme) => (
                      <span key={theme} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">
                        {theme}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No outreach asset is available yet.</p>
              )}
            </article>
            <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best First Target Groups</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {packet.outreach.targetGroups.length === 0 ? (
                  <p className="text-slate-400">Seed targets have not been surfaced yet.</p>
                ) : (
                  packet.outreach.targetGroups.map((group) => (
                    <p key={group.label}>
                      {group.label}: {group.count}
                    </p>
                  ))
                )}
              </div>
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Launch-ready targets</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Target</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Tier</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Follow-Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packet.outreach.targets.map((target) => (
                      <tr key={target.id} className="border-t border-white/10 align-top">
                        <td className="px-3 py-3">
                          <p className="font-medium text-white">{target.siteName}</p>
                          <p className="mt-1 text-xs text-slate-400">{target.domain}</p>
                          <p className="mt-2 text-xs text-slate-500">{target.fitNotes}</p>
                        </td>
                        <td className="px-3 py-3">{target.targetType}</td>
                        <td className="px-3 py-3">{target.authorityTier}</td>
                        <td className="px-3 py-3">{target.status}</td>
                        <td className="px-3 py-3">{formatDate(target.nextFollowUpAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Suggested subject lines</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {packet.recommendedSubjectLines.map((subject) => (
                  <p key={subject} className="rounded-[0.85rem] border border-white/10 bg-white/5 px-3 py-2">
                    {subject}
                  </p>
                ))}
              </div>
            </article>

            {packet.outreach.draftPacket ? (
              <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Suggested outreach draft</p>
                <div className="mt-3 rounded-[0.9rem] border border-white/10 bg-white/5 p-4">
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{packet.outreach.draftPacket.suggestedEmailBody}</p>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recommended Weekly Actions</p>
          <div className="mt-4 space-y-3">
            {packet.recommendedWeeklyActions.map((action, index) => (
              <article key={action.title} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
                <p className="mt-2 text-lg font-medium text-white">{action.title}</p>
                <p className="mt-2 text-sm text-slate-300">{action.detail}</p>
                <Link href={action.href} className="mt-3 inline-flex text-sm text-emerald-200">
                  Open
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">System Linkouts</p>
          <p className="mt-2 text-sm text-slate-300">
            Use this launch page as the control sheet, then drop into the deeper ops tools only when you need detail or exports.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {packet.linkouts.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[1rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-200 hover:border-emerald-200/30"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
