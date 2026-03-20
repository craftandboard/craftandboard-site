import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivateAccountForm } from "../../components/activate-account-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Activate Account",
  description: "Activate your Craft & Board admin account."
};

export default async function ActivatePage(props: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const redirectUrl = await getAppRedirectUrl(
    "/activate",
    new URLSearchParams(searchParams.token ? { token: searchParams.token } : {})
  );

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const token = searchParams.token?.trim() ?? "";

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4] p-8 shadow-[0_18px_40px_rgba(73,50,33,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Craft &amp; Board Admin</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#2c221b]">Activate your admin account</h1>
      <p className="mt-3 text-sm text-[#6f5f51]">
        Set your password to complete account activation and create your first signed-in session.
      </p>
      <div className="mt-8">
        {token ? (
          <ActivateAccountForm token={token} />
        ) : (
          <div className="space-y-4 rounded-2xl border border-rose-300/30 bg-rose-50 p-5 text-sm text-rose-700">
            <p>Activation token is missing.</p>
            <Link href="/login" className="text-[#6b7550] underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
