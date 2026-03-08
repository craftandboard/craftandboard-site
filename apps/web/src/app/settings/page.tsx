import Link from "next/link";

export default function SettingsPage() {
  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Workspace settings foundation</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Authentication and organization context are now live. Member management is available
          through the organization settings page without introducing broader admin systems yet.
        </p>
      </div>

      <Link
        href="/settings/members"
        className="flex max-w-xl items-center justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-5 text-left transition hover:border-emerald-300/30"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Organization</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Members</h3>
          <p className="mt-2 text-sm text-slate-300">
            List current members, add users to the current organization, and update membership roles.
          </p>
        </div>
        <span className="text-sm text-emerald-300">Open</span>
      </Link>
    </section>
  );
}
