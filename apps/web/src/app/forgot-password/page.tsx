import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "../../components/auth-shell";
import { ForgotPasswordForm } from "../../components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for Craft & Board admin."
};

export default async function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Craft & Board Admin"
      title="Reset your admin password"
      body="Request a fresh sign-in link for the private Craft & Board workspace."
      footer={
        <Link href="/login" className="text-sm text-[#6b7550] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
