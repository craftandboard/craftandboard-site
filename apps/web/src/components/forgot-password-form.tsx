"use client";

import { useState } from "react";
import { requestPasswordReset } from "../lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
          const response = await requestPasswordReset({ email });

          if (!response.ok) {
            setError(response.error);
            return;
          }

          setResult(response);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Password reset request failed.");
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
          required
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
        {submitting ? "Requesting..." : "Request Reset"}
      </button>
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}
