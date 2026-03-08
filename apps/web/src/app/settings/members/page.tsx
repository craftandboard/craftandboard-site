import Link from "next/link";
import { OrgMembersPanel } from "../../../components/org-members-panel";
import { getOrganizationMembers, getViewerContext } from "../../../lib/api";

export default async function SettingsMembersPage() {
  const [context, membersPayload] = await Promise.all([getViewerContext(), getOrganizationMembers()]);

  if (!context) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Organization Members</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Authentication required</h2>
        <p className="mt-3 text-sm text-slate-300">Sign in to view or manage organization members.</p>
      </section>
    );
  }

  const canManage = context.membership.role === "OWNER";

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Organization Members</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{context.organization.name}</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Manage membership for the current organization. Owner-only actions are available when
            your current role allows them.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300/30 hover:text-white"
        >
          Back to Settings
        </Link>
      </div>

      {membersPayload ? (
        <OrgMembersPanel initialMembers={membersPayload.members} canManage={canManage} />
      ) : (
        <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
          Member data is unavailable for the current organization or role.
        </div>
      )}
    </section>
  );
}
