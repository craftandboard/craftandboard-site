"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { resetPassword, validatePasswordResetToken } from "../lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatedEmail, setValidatedEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      setValidating(true);
      setError(null);

      try {
        const response = await validatePasswordResetToken(token);

        if (!active) {
          return;
        }

        if (!response.ok) {
          setError(response.error);
          return;
        }

        setValidatedEmail(response.user.email);
      } catch (cause) {
        if (!active) {
          return;
        }

        setError(cause instanceof Error ? cause.message : "Reset token is invalid or expired.");
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await resetPassword({ token, password });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      document.cookie = `cb_session=${encodeURIComponent(response.sessionToken)}; path=/; max-age=1209600; samesite=lax`;
      document.cookie = `cb_org_slug=${encodeURIComponent(response.organization.slug)}; path=/; max-age=2592000; samesite=lax`;
      setSuccess("Password reset complete. Redirecting...");
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return <p className="text-sm text-slate-300">Validating reset token...</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {validatedEmail ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          Resetting password for <span className="text-white">{validatedEmail}</span>
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">New Password</label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Confirm Password</label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting || !validatedEmail}
        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 disabled:opacity-60"
      >
        {submitting ? "Resetting..." : "Set New Password"}
      </button>
    </form>
  );
}
