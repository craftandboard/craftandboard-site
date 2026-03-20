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
        className="rounded-full border border-[#dccfc1] bg-[#fffaf4] px-4 py-3 text-xs text-[#5d5044] transition hover:border-[#c6b6a5] hover:text-[#2c221b]"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-[#e2d6c9] bg-[#fffaf4] px-4 py-3 text-xs text-[#6f5f51]">
      <div>
        <span className="text-[#2c221b]">{context.user.name ?? context.user.email}</span>
        <span className="ml-2 text-[#6b7550]">{context.membership.role}</span>
      </div>
      <div className="h-4 w-px bg-[#e2d6c9]" />
      <div>
        <span className="text-[#2c221b]">{context.organization.name}</span>
        <span className="ml-2 text-[#8a7869]">{context.organization.slug}</span>
      </div>
      <OrgSwitcher currentSlug={context.organization.slug} organizations={context.organizations} />
      <LogoutButton />
    </div>
  );
}
