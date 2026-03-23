import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "../../components/auth-shell";
import { ResetPasswordForm } from "../../components/reset-password-form";

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
  const token = searchParams.token?.trim() ?? "";

  return (
    <AuthShell
      eyebrow="Craft & Board Admin"
      title="Set a new password"
      body="Use your reset link to regain access to the private Craft & Board admin workspace."
      footer={
        <Link href="/login" className="text-sm text-[#6b7550] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div>
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
    </AuthShell>
  );
}
