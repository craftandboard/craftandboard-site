import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "../../components/auth-shell";
import { ActivateAccountForm } from "../../components/activate-account-form";

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
  const token = searchParams.token?.trim() ?? "";

  return (
    <AuthShell
      eyebrow="Craft & Board Admin"
      title="Activate your admin account"
      body="Finish setting up access for the private Craft & Board workspace."
      footer={
        <Link href="/login" className="text-sm text-[#6b7550] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div>
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
    </AuthShell>
  );
}
