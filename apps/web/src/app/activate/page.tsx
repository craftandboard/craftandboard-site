import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivateAccountForm } from "../../components/activate-account-form";
import { getAppRedirectUrl } from "../../lib/request-site";

export const metadata: Metadata = {
  title: "Activate Account",
  description: "Activate your FieldMetriq account."
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
    <section className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Account Activation</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Activate your FieldMetriq account</h1>
      <p className="mt-3 text-sm text-slate-300">
        Set your password to complete account activation and create your first signed-in session.
      </p>
      <div className="mt-8">
        {token ? (
          <ActivateAccountForm token={token} />
        ) : (
          <div className="space-y-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
            <p>Activation token is missing.</p>
            <Link href="/login" className="text-emerald-300 underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
