"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4 rounded-[1.5rem] border border-[#eadfd3] bg-[#fcf7f1] p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
          const response = await login({ email, password });

          if (!response.ok) {
            setError(response.error);
            return;
          }

          document.cookie = `cb_session=${encodeURIComponent(response.sessionToken)}; path=/; max-age=1209600; samesite=lax`;
          document.cookie = `cb_org_slug=${encodeURIComponent(response.organization.slug)}; path=/; max-age=2592000; samesite=lax`;
          router.push("/admin/craft-board/dashboard");
          router.refresh();
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "Login failed.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#8a7869]">Fallback sign-in</p>
        <p className="text-sm text-[#6f5f51]">
          Use email and password only if your team is still on the password-based internal login.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-[#5e5043]">Email</label>
        <input
          className="w-full rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-[#2c221b]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@craftandboard.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-[#5e5043]">Password</label>
        <input
          className="w-full rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-[#2c221b]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[#2c221b] px-5 py-3 text-sm font-medium text-[#f7efe5] disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-xs text-[#7d6c5e]">
        For internal team access only. This is not a customer order portal.
      </p>
    </form>
  );
}
