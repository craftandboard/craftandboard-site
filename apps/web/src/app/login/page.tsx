import Link from "next/link";
import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Authentication</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to Craft &amp; Board</h1>
      <p className="mt-3 text-sm text-slate-300">
        Use a seeded demo account to establish a real session-backed current user.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <div className="mt-6 text-sm text-slate-400">
        <Link href="/forgot-password" className="text-emerald-300 underline underline-offset-4">
          Forgot password?
        </Link>
      </div>
    </section>
  );
}
