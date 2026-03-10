import { OrgSwitcher } from "./org-switcher";
import type { ViewerContextResponse } from "../lib/api";
import { appUrl } from "../lib/site-config";
import { LogoutButton } from "./logout-button";

export function CurrentContextChip({
  context
}: {
  context: ViewerContextResponse | null;
}) {
  if (!context) {
    return (
      <a
        href={appUrl("/login")}
        className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 transition hover:border-emerald-300/40 hover:text-white"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
      <div>
        <span className="text-white">{context.user.name ?? context.user.email}</span>
        <span className="ml-2 text-emerald-300">{context.membership.role}</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <div>
        <span className="text-white">{context.organization.name}</span>
        <span className="ml-2 text-slate-400">{context.organization.slug}</span>
      </div>
      <OrgSwitcher currentSlug={context.organization.slug} organizations={context.organizations} />
      <LogoutButton />
    </div>
  );
}
