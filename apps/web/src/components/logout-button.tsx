"use client";

import { useRouter } from "next/navigation";
import { logout } from "../lib/api";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-300/40 hover:text-white"
      onClick={async () => {
        await logout();
        document.cookie = "cb_session=; path=/; max-age=0; samesite=lax";
        router.push("/login");
        router.refresh();
      }}
      type="button"
    >
      Sign Out
    </button>
  );
}
