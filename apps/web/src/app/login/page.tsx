import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/login-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Craft & Board admin."
};

export default async function LoginPage() {
  const redirectUrl = await getAppRedirectUrl("/login");

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-8 shadow-[0_18px_40px_rgba(73,50,33,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Craft &amp; Board Admin</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#2c221b]">Sign in to the private workspace</h1>
      <p className="mt-3 text-sm text-[#6f5f51]">
        Use an authorized admin account to open orders, marketing, and cabinet shelf operations.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <div className="mt-6 text-sm text-[#7d6c5e]">
        <Link href="/forgot-password" className="text-[#6b7550] underline underline-offset-4">
          Forgot password?
        </Link>
      </div>
    </section>
  );
}
