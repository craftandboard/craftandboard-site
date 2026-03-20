import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "../../components/reset-password-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Craft & Board admin account."
};

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const redirectUrl = await getAppRedirectUrl(
    "/reset-password",
    new URLSearchParams(searchParams.token ? { token: searchParams.token } : {})
  );

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const token = searchParams.token?.trim() ?? "";

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-8 shadow-[0_18px_40px_rgba(73,50,33,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Craft &amp; Board Admin</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#2c221b]">Set a new password</h1>
      <p className="mt-3 text-sm text-[#6f5f51]">
        Use your reset token to set a new password and start a fresh session.
      </p>
      <div className="mt-8">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4 rounded-2xl border border-rose-300/30 bg-rose-50 p-5 text-sm text-rose-700">
            <p>Reset token is missing.</p>
            <Link href="/forgot-password" className="text-[#6b7550] underline underline-offset-4">
              Request a reset link
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
