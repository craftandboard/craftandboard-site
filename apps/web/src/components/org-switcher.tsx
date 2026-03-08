"use client";

import { useRouter } from "next/navigation";

type OrgOption = {
  id: string;
  slug: string;
  name: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
};

export function OrgSwitcher({
  currentSlug,
  organizations
}: {
  currentSlug: string;
  organizations: OrgOption[];
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
      <span>Org</span>
      <select
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
        defaultValue={currentSlug}
        onChange={(event) => {
          document.cookie = `cb_org_slug=${encodeURIComponent(event.target.value)}; path=/; max-age=2592000; samesite=lax`;
          router.refresh();
        }}
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.slug} className="bg-slate-900">
            {organization.name} ({organization.role})
          </option>
        ))}
      </select>
    </label>
  );
}
