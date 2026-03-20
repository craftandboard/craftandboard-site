import Link from "next/link";
import type { CraftBoardOutreachWorkspaceResponse } from "../lib/api";
import type { CraftBoardOutreachDraftPacket } from "../lib/seo/outreachDrafts";
import { createOutreachTargetAction, logOutreachActivityAction, updateOutreachTargetAction } from "../app/admin/craft-board/outreach/actions";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function statusBadge(status: string) {
  const active = ["WON", "RESPONDED", "CONTACTED"].includes(status);
  const warning = ["FOLLOW_UP_DUE", "DEFERRED"].includes(status);
  const danger = ["REJECTED"].includes(status);

  const className = active
    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
    : warning
      ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
      : danger
        ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
        : "border-white/10 bg-black/20 text-slate-300";

  return <span className={`rounded-full border px-2 py-1 text-xs ${className}`}>{status.replace(/_/g, " ")}</span>;
}

export function CraftBoardOutreachWorkspace(input: {
  workspace: CraftBoardOutreachWorkspaceResponse;
  filters: {
    status?: string;
    targetType?: string;
    campaignKey?: string;
    authorityTier?: string;
  };
}) {
  const { workspace, filters } = input;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board Outreach Workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Targets, follow-ups, and wins in one place</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Run backlink campaigns like a contractor punch-list: qualify sites, log contact attempts, set follow-ups, and track wins.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/craft-board/seo/backlinks" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
            Backlink Ops
          </Link>
          <Link href="/admin/craft-board/dashboard" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
            Marketing Dashboard
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Targets", value: workspace.summary.totalTargets },
          { label: "Qualified", value: workspace.summary.qualifiedTargets },
          { label: "Contacted", value: workspace.summary.contactedTargets },
          { label: "Follow-Ups Due", value: workspace.summary.followUpsDue },
          { label: "Links Won", value: workspace.summary.linksWon },
          { label: "Rejected", value: workspace.summary.rejectedTargets },
          { label: "Active Campaigns", value: workspace.summary.activeCampaigns }
        ].map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Active Targets</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Current outreach queue</h3>
            </div>
            <form method="GET" className="flex flex-wrap gap-2 text-sm">
              <select name="status" defaultValue={filters.status ?? ""} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-slate-200">
                <option value="">All Statuses</option>
                {["PROSPECT", "QUALIFIED", "CONTACTED", "FOLLOW_UP_DUE", "RESPONDED", "WON", "REJECTED", "DEFERRED"].map((status) => (
                  <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select name="targetType" defaultValue={filters.targetType ?? ""} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-slate-200">
                <option value="">All Types</option>
                {[
                  "INTERIOR_DESIGN_BLOG",
                  "DIY_BLOG",
                  "HOME_IMPROVEMENT_SITE",
                  "CONTRACTOR_RESOURCE",
                  "FIREPLACE_DESIGN_SITE",
                  "LIFESTYLE_PINTEREST_CREATOR",
                  "LOCAL_PARTNER",
                  "PRESS_OR_FEATURE"
                ].map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select name="authorityTier" defaultValue={filters.authorityTier ?? ""} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-slate-200">
                <option value="">All Tiers</option>
                {["HIGH", "MEDIUM", "NICHE"].map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
              <input
                type="text"
                name="campaignKey"
                defaultValue={filters.campaignKey ?? ""}
                placeholder="Campaign key"
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-slate-200 placeholder:text-slate-500"
              />
              <button type="submit" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                Filter
              </button>
            </form>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Top Campaign</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last Contact</th>
                  <th className="px-3 py-2">Next Follow-Up</th>
                  <th className="px-3 py-2">Quick Update</th>
                </tr>
              </thead>
              <tbody>
                {workspace.targets.map((target) => (
                  <tr key={target.id} className="border-t border-white/10 align-top">
                    <td className="px-3 py-3">
                      <Link href={`/admin/craft-board/outreach/${target.id}`} className="font-medium text-white hover:underline">
                        {target.siteName}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{target.domain}</p>
                      <p className="mt-2 text-xs text-slate-300">{target.latestActivityNote ?? target.fitNotes}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{target.targetType}</p>
                      <p className="mt-1 text-xs text-slate-400">{target.authorityTier}</p>
                    </td>
                    <td className="px-3 py-3">{target.topCampaignKey ?? "—"}</td>
                    <td className="px-3 py-3">
                      {statusBadge(target.status)}
                      {target.followUpDue ? <p className="mt-2 text-xs text-amber-100">Follow-up due</p> : null}
                    </td>
                    <td className="px-3 py-3">{formatDate(target.lastContactedAt)}</td>
                    <td className="px-3 py-3">{formatDate(target.nextFollowUpAt)}</td>
                    <td className="px-3 py-3">
                      <form action={updateOutreachTargetAction} className="space-y-2">
                        <input type="hidden" name="targetId" value={target.id} />
                        <input type="hidden" name="returnPath" value="/admin/craft-board/outreach" />
                        <input type="hidden" name="siteName" value={target.siteName} />
                        <input type="hidden" name="domain" value={target.domain} />
                        <input type="hidden" name="targetType" value={target.targetType} />
                        <input type="hidden" name="authorityTier" value={target.authorityTier} />
                        <input type="hidden" name="topicCluster" value={target.topicCluster} />
                        <input type="hidden" name="fitNotes" value={target.fitNotes} />
                        <input type="hidden" name="preferredAssetTypes" value={target.preferredAssetTypes.join(", ")} />
                        <input type="hidden" name="preferredCampaignKeys" value={target.preferredCampaignKeys.join(", ")} />
                        <input type="hidden" name="notes" value={target.notes ?? ""} />
                        <select name="status" defaultValue={target.status} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
                          {["PROSPECT", "QUALIFIED", "CONTACTED", "FOLLOW_UP_DUE", "RESPONDED", "WON", "REJECTED", "DEFERRED"].map((status) => (
                            <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          name="nextFollowUpAt"
                          defaultValue={target.nextFollowUpAt?.slice(0, 10) ?? ""}
                          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200"
                        />
                        <button type="submit" className="w-full rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Add Target</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Manual outreach target</h3>
            <form action={createOutreachTargetAction} className="mt-4 space-y-3">
              <input name="siteName" required placeholder="Site name" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <input name="domain" required placeholder="Domain" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="targetType" required placeholder="Target type" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
                <input name="authorityTier" required placeholder="Authority tier" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              </div>
              <input name="topicCluster" required placeholder="Topic cluster" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <textarea name="fitNotes" required rows={3} placeholder="Why this target fits" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <input name="preferredCampaignKeys" placeholder="Preferred campaigns, comma separated" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <input name="preferredAssetTypes" placeholder="Preferred asset types, comma separated" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="primaryContactName" placeholder="Contact name" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
                <input name="primaryContactEmail" placeholder="Contact email" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              </div>
              <input name="contactMethod" placeholder="Contact method" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500" />
              <button type="submit" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Create Target
              </button>
            </form>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Follow-Ups Due</p>
            <div className="mt-4 space-y-3">
              {workspace.followUpsDue.length === 0 ? (
                <p className="text-sm text-slate-400">No overdue follow-ups right now.</p>
              ) : (
                workspace.followUpsDue.map((target) => (
                  <Link key={target.id} href={`/admin/craft-board/outreach/${target.id}`} className="block rounded-[1rem] border border-white/10 bg-black/20 p-4">
                    <p className="font-medium text-white">{target.siteName}</p>
                    <p className="mt-1 text-xs text-slate-400">{target.domain}</p>
                    <p className="mt-2 text-xs text-amber-100">Next follow-up: {formatDate(target.nextFollowUpAt)}</p>
                    <p className="mt-2 text-xs text-slate-300">{target.notes ?? target.campaignKey ?? "Review last outreach note."}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Campaign Progress</p>
          <div className="mt-4 space-y-3">
            {workspace.campaignProgress.map((campaign) => (
              <article key={campaign.campaignKey} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{campaign.campaignKey}</p>
                  <p className="text-sm text-emerald-200">{campaign.assignedCount} targets</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Contacted {campaign.contactedCount} · Follow-up due {campaign.followUpDueCount} · Won {campaign.wonCount} · Rejected {campaign.rejectedCount}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recent Activity</p>
          <div className="mt-4 space-y-3">
            {workspace.recentActivities.map((activity) => (
              <Link key={activity.id} href={`/admin/craft-board/outreach/${activity.target.id}`} className="block rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{activity.target.siteName}</p>
                  <p className="text-xs text-slate-400">{formatDate(activity.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-emerald-200">{activity.activityType.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm text-slate-300">{activity.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function CraftBoardOutreachTargetDetail(input: {
  workspace: CraftBoardOutreachWorkspaceResponse;
  draftPacket: CraftBoardOutreachDraftPacket | null;
}) {
  const target = input.workspace.selectedTarget;

  if (!target) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Outreach Target Detail</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{target.siteName}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{target.domain}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/craft-board/outreach" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-slate-200">
            Back to Workspace
          </Link>
          <Link href="/admin/craft-board/seo/backlinks" className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-emerald-100">
            Backlink Ops
          </Link>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Target Detail</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Edit target and next step</h3>
            </div>
            {statusBadge(target.status)}
          </div>
          <form action={updateOutreachTargetAction} className="mt-5 space-y-3">
            <input type="hidden" name="targetId" value={target.id} />
            <input type="hidden" name="returnPath" value={`/admin/craft-board/outreach/${target.id}`} />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="siteName" defaultValue={target.siteName} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input name="domain" defaultValue={target.domain} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="targetType" defaultValue={target.targetType} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input name="authorityTier" defaultValue={target.authorityTier} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            </div>
            <input name="topicCluster" defaultValue={target.topicCluster} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            <textarea name="fitNotes" defaultValue={target.fitNotes} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            <input name="preferredCampaignKeys" defaultValue={target.preferredCampaignKeys.join(", ")} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            <input name="preferredAssetTypes" defaultValue={target.preferredAssetTypes.join(", ")} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="primaryContactName" defaultValue={target.primaryContactName ?? ""} placeholder="Contact name" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input name="primaryContactEmail" defaultValue={target.primaryContactEmail ?? ""} placeholder="Contact email" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="contactMethod" defaultValue={target.contactMethod ?? ""} placeholder="Contact method" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input type="date" name="nextFollowUpAt" defaultValue={target.nextFollowUpAt?.slice(0, 10) ?? ""} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            </div>
            <select name="status" defaultValue={target.status} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
              {["PROSPECT", "QUALIFIED", "CONTACTED", "FOLLOW_UP_DUE", "RESPONDED", "WON", "REJECTED", "DEFERRED"].map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
              ))}
            </select>
            <textarea name="notes" defaultValue={target.notes ?? ""} rows={4} placeholder="Target notes" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
            <button type="submit" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Save Target
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current Status</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-4">
                <span>Last contacted</span>
                <span>{formatDate(target.lastContactedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Last response</span>
                <span>{formatDate(target.lastResponseAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Next follow-up</span>
                <span>{formatDate(target.nextFollowUpAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Source</span>
                <span>{target.isSeeded ? "Seeded" : target.source}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Log Activity</p>
            <form action={logOutreachActivityAction} className="mt-4 space-y-3">
              <input type="hidden" name="targetId" value={target.id} />
              <input type="hidden" name="returnPath" value={`/admin/craft-board/outreach/${target.id}`} />
              <select name="activityType" defaultValue="NOTE" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                {["NOTE", "CONTACT_ATTEMPT", "FOLLOW_UP", "RESPONSE", "LINK_WON", "REJECTION", "STATUS_CHANGE"].map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                ))}
              </select>
              <input name="campaignKey" defaultValue={target.preferredCampaignKeys[0] ?? ""} placeholder="Campaign key" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input name="assetPageKey" placeholder="Asset page key" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <select name="status" defaultValue="" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                <option value="">Keep current status</option>
                {["PROSPECT", "QUALIFIED", "CONTACTED", "FOLLOW_UP_DUE", "RESPONDED", "WON", "REJECTED", "DEFERRED"].map((status) => (
                  <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                ))}
              </select>
              <input type="date" name="nextFollowUpAt" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <input name="outcome" placeholder="Outcome" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <textarea name="note" required rows={4} placeholder="What happened?" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" />
              <button type="submit" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Log Activity
              </button>
            </form>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Best Page To Pitch</p>
            {input.draftPacket ? (
              <div className="mt-4 space-y-3">
                <p className="text-lg font-medium text-white">{input.draftPacket.supportLinks[0]?.title}</p>
                <p className="text-xs text-slate-400">{input.draftPacket.campaignKey}</p>
                <p className="text-sm text-slate-300">{input.draftPacket.pitchSummary}</p>
                <Link href={input.draftPacket.supportLinks[0]?.href ?? "#"} className="text-sm text-emerald-200 hover:underline">
                  {input.draftPacket.supportLinks[0]?.href}
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No draft packet is available for this target yet.</p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Suggested Subject Lines</p>
            <div className="mt-4 space-y-3">
              {input.draftPacket?.suggestedSubjectLines.map((subject) => (
                <div key={subject} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white">{subject}</p>
                </div>
              )) ?? <p className="text-sm text-slate-400">No subject suggestions yet.</p>}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Anchor Themes</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {input.draftPacket?.anchorThemeSuggestions.map((anchor) => (
                <span key={anchor} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
                  {anchor}
                </span>
              )) ?? <p className="text-sm text-slate-400">No anchor suggestions yet.</p>}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Support Links</p>
            <div className="mt-4 space-y-3">
              {input.draftPacket?.supportLinks.map((link) => (
                <div key={link.href} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                  <p className="font-medium text-white">{link.title}</p>
                  <p className="mt-2 text-xs text-slate-400">{link.pageKey}</p>
                  <Link href={link.href} className="mt-2 block text-sm text-emerald-200 hover:underline">
                    {link.href}
                  </Link>
                </div>
              )) ?? <p className="text-sm text-slate-400">No support links yet.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Suggested Email</p>
            {input.draftPacket ? (
              <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{input.draftPacket.suggestedEmailBody}</pre>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No email draft is available for this target yet.</p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Follow-Up Draft</p>
            {input.draftPacket?.suggestedFollowUpBody ? (
              <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{input.draftPacket.suggestedFollowUpBody}</pre>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No follow-up draft is available for this target yet.</p>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Why This Is A Good Fit</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>{input.draftPacket?.pitchSummary ?? target.fitNotes}</p>
              {input.draftPacket?.callToActionSuggestion ? (
                <p className="text-emerald-200">{input.draftPacket.callToActionSuggestion}</p>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Activity History</p>
        <div className="mt-4 space-y-3">
          {target.activities.map((activity) => (
            <article key={activity.id} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{activity.activityType.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-400">{formatDate(activity.createdAt)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {activity.campaignKey ?? "No campaign"} · {activity.assetPageKey ?? "No asset key"}
              </p>
              <p className="mt-3 text-sm text-slate-200">{activity.note}</p>
              {activity.outcome ? <p className="mt-2 text-xs text-emerald-200">Outcome: {activity.outcome}</p> : null}
              {activity.nextFollowUpAt ? <p className="mt-2 text-xs text-amber-100">Next follow-up: {formatDate(activity.nextFollowUpAt)}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
