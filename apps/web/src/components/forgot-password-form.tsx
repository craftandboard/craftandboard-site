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
      className="space-y-4 rounded-[1.5rem] border border-[#eadfd3] bg-[#fcf7f1] p-5"
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
        <label className="text-sm text-[#5e5043]">Work Email</label>
        <input
          className="w-full rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-[#2c221b]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          required
          placeholder="you@craftandboard.com"
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
        {submitting ? "Requesting..." : "Request Reset"}
      </button>
      {result ? (
        <div className="space-y-3 rounded-2xl border border-[#d7dfc7] bg-[#eef1e4] p-4 text-sm text-[#4f5a3a]">
          <p>Password reset request accepted.</p>
          {"reset" in (result as object) && (result as { reset?: { path?: string } }).reset?.path ? (
            <div className="space-y-2">
              <p className="text-[#5d5044]">
                Email delivery is not wired in this environment yet, so the reset link is shown directly for internal use.
              </p>
              <a
                className="inline-flex text-sm font-medium text-[#4f5a3a] underline underline-offset-4"
                href={(result as { reset?: { path?: string } }).reset?.path}
              >
                Open reset link
              </a>
            </div>
          ) : (
            <p className="text-[#5d5044]">
              If that account exists and email delivery is enabled in the current environment, a reset link will be sent.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
