import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "../../components/forgot-password-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for Craft & Board admin."
};

export default async function ForgotPasswordPage() {
  const redirectUrl = await getAppRedirectUrl("/forgot-password");

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-8 shadow-[0_18px_40px_rgba(73,50,33,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Craft &amp; Board Admin</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#2c221b]">Request a password reset</h1>
      <p className="mt-3 text-sm text-[#6f5f51]">
        Enter your account email to generate a reset link. Email delivery is not wired yet, so the
        link is returned directly for this foundation phase.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <div className="mt-6 text-sm text-[#7d6c5e]">
        <Link href="/login" className="text-[#6b7550] underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </section>
  );
}
