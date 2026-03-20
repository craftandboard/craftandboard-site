import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "../../components/forgot-password-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for FieldMetriq."
};

export default async function ForgotPasswordPage() {
  const redirectUrl = await getAppRedirectUrl("/forgot-password");

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Password Reset</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Request a password reset</h1>
      <p className="mt-3 text-sm text-slate-300">
        Enter your account email to generate a reset link. Email delivery is not wired yet, so the
        link is returned directly for this foundation phase.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <div className="mt-6 text-sm text-slate-400">
        <Link href="/login" className="text-emerald-300 underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </section>
  );
}
