import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth-shell";
import { GoogleSignInButton } from "../../components/google-sign-in-button";
import { LoginForm } from "../../components/login-form";

export const metadata: Metadata = {
  title: "Sign in to Craft & Board Admin",
  description: "Private Craft & Board admin sign-in for orders, production, marketing, and cabinet shelf operations."
};

function googleNotice(searchParams: Record<string, string | string[] | undefined>) {
  const raw = searchParams.google;
  const code = Array.isArray(raw) ? raw[0] : raw;

  switch (code) {
    case "not-configured":
      return "Google sign-in is wired, but this environment still needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";
    case "denied":
      return "Google sign-in was cancelled before access was granted.";
    case "state":
      return "Google sign-in could not be verified. Start again from the button below.";
    case "failed":
      return "Google sign-in could not be completed for this account.";
    case "unauthorized":
      return "This Google account is not authorized for Craft & Board Admin.";
    case "session":
      return "Google sign-in succeeded, but the admin session could not be finalized. Try again.";
    default:
      return null;
  }
}

export default async function LoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  const notice = googleNotice(searchParams);

  return (
    <AuthShell
      eyebrow="Craft & Board Admin"
      title="Sign in to Craft & Board Admin"
      body="Private workspace for orders, production, marketing, and cabinet shelf operations."
      notice={
        notice ? (
          <div className="rounded-2xl border border-[#e6d9c8] bg-[#f7f0e7] px-4 py-3 text-sm text-[#5d5044]">
            {notice}
          </div>
        ) : null
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#7d6c5e]">
          <Link href="/forgot-password" className="text-[#6b7550] underline underline-offset-4">
            Forgot password?
          </Link>
          <span>For internal team access only.</span>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8a7869]">Primary sign-in</p>
          <GoogleSignInButton
            href="/auth/google/start"
            disabled={!googleConfigured}
            reason={
              googleConfigured
                ? null
                : "Google sign-in will work once GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set for this deployment."
            }
          />
        </div>
        <LoginForm />
      </div>
    </AuthShell>
  );
}
