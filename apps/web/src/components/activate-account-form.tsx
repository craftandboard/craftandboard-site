"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { activateAccount, validateActivationToken } from "../lib/api";

export function ActivateAccountForm({ token }: { token: string }) {
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
        const response = await validateActivationToken(token);

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

        setError(cause instanceof Error ? cause.message : "Activation token is invalid or expired.");
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
      const response = await activateAccount({ token, password });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      document.cookie = `cb_session=${encodeURIComponent(response.sessionToken)}; path=/; max-age=1209600; samesite=lax`;
      document.cookie = `cb_org_slug=${encodeURIComponent(response.organization.slug)}; path=/; max-age=2592000; samesite=lax`;
      setSuccess("Account activated. Redirecting...");
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return <p className="text-sm text-[#6f5f51]">Checking your activation link...</p>;
  }

  return (
    <form className="space-y-4 rounded-[1.5rem] border border-[#eadfd3] bg-[#fcf7f1] p-5" onSubmit={handleSubmit}>
      {validatedEmail ? (
        <div className="rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-sm text-[#6f5f51]">
          Activating access for <span className="text-[#2c221b]">{validatedEmail}</span>
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm text-[#5e5043]">New Password</label>
        <input
          className="w-full rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-[#2c221b]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-[#5e5043]">Confirm Password</label>
        <input
          className="w-full rounded-2xl border border-[#e2d6c9] bg-[#fffdf9] px-4 py-3 text-[#2c221b]"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
        />
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-[#d7dfc7] bg-[#eef1e4] px-4 py-3 text-sm text-[#4f5a3a]">
          {success}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting || !validatedEmail}
        className="rounded-full bg-[#2c221b] px-5 py-3 text-sm font-medium text-[#f7efe5] disabled:opacity-60"
      >
        {submitting ? "Activating..." : "Set Password"}
      </button>
    </form>
  );
}
