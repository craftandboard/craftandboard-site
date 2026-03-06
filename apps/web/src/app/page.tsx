const cards = [
  {
    title: "Monorepo foundation",
    detail: "Web, API, worker, Prisma, Redis, Postgres, and Python service are wired for local development."
  },
  {
    title: "Feature scope",
    detail: "Amazon import, batching, nesting, CNC output, and shipping are intentionally deferred to later specs."
  },
  {
    title: "Next step",
    detail: "Bring up Postgres and Redis, generate Prisma, then begin feature slices on stable contracts."
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Local foundation scaffold
          </p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight text-white">
            Build the operating layer before the factory logic.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)]">
            This dashboard confirms the initial Craft & Board workspace is live.
            It is designed for future order intake, batching, stations, and
            manufacturing orchestration, but only foundational contracts and
            health surfaces exist today.
          </p>
        </div>
        <div className="rounded-[2rem] border border-[var(--panel-border)] bg-emerald-500/10 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
            Day one target
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">Runnable locally</p>
          <p className="mt-3 text-sm text-emerald-50/80">
            Use this scaffold to start implementation without pulling in any remote
            integrations or legacy project references.
          </p>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6"
          >
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{card.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
