import Link from "next/link";
import { ResetPasswordForm } from "../../components/reset-password-form";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{
    token?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token?.trim() ?? "";

  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Password Reset</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Set a new password</h1>
      <p className="mt-3 text-sm text-slate-300">
        Use your reset token to set a new password and start a fresh session.
      </p>
      <div className="mt-8">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
            <p>Reset token is missing.</p>
            <Link href="/forgot-password" className="text-emerald-300 underline underline-offset-4">
              Request a reset link
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
