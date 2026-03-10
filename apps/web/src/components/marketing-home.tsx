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
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            FieldMetriq
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">
            Operating system for field and shop workflows.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)]">
            FieldMetriq unifies order intake, production control, labels,
            costing, machines, scans, and inventory into one operational
            workspace. The current product is live and incremental, not a
            finished brochure promise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={signInHref}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
            >
              Sign In
            </Link>
            <Link
              href={appHomeHref}
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
            >
              Open App
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
            Current focus
          </p>
          <ul className="mt-4 space-y-3 text-sm text-emerald-50/85">
            <li>Canonical order and job intake</li>
            <li>Manufacturing packets, batches, and labels</li>
            <li>Machine telemetry and stage evidence review</li>
            <li>Container, inventory, and remnant tracking</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Field-ready</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Designed for operations teams that need a working control surface
            now, with room to expand safely.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Shop-aware</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Production, labels, machine events, and artifact generation live in
            the same app instead of scattered tools.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold text-white">Incremental rollout</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Craft &amp; Board can coexist briefly during cutover, but the SaaS
            brand and canonical domains now belong to FieldMetriq.
          </p>
        </article>
      </section>
    </div>
  );
}
