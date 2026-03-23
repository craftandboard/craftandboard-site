import Link from "next/link";

export function MarketingHome({
  appHomeHref,
  signInHref
}: {
  appHomeHref: string;
  signInHref: string;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Craft &amp; Board Admin</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">Private access for the internal Craft &amp; Board workspace.</h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)]">
            Authorized team members can sign in here to manage orders, production, marketing, labels, and cabinet shelf operations. Customers should use the public storefront instead of this internal entry.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={signInHref}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
            >
              Open Sign-In
            </Link>
            <Link
              href={appHomeHref}
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
            >
              Go to Admin Access
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Before you sign in</p>
          <ul className="mt-4 space-y-3 text-sm text-emerald-50/85">
            <li>Internal team access only</li>
            <li>Google sign-in is the preferred admin path</li>
            <li>Password login remains available for existing users</li>
            <li>Customers should use the storefront and contact flow</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Private by design</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            This sign-in path is for the Craft &amp; Board team, not for customer order lookup or checkout access.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Google-first access</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Authorized users should prefer Google sign-in when it is configured for the current environment.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Customer-facing elsewhere</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Cabinet shelf shoppers should use the public storefront instead of this internal admin entry.
          </p>
        </article>
      </section>
    </div>
  );
}
