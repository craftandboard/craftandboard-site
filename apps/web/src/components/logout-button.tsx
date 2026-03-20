"use client";

import { useRouter } from "next/navigation";
import { logout } from "../lib/api";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-full border border-[#dccfc1] px-3 py-2 text-xs text-[#5d5044] transition hover:border-[#c6b6a5] hover:text-[#2c221b]"
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
