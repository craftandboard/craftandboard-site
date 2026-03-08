"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@craftboard.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
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
          router.push("/");
          router.refresh();
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "Login failed.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Email</label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Password</label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-xs text-slate-400">
        Demo accounts: `demo@craftboard.local / demo1234`, `operator@craftboard.local / operator1234`
      </p>
    </form>
  );
}
