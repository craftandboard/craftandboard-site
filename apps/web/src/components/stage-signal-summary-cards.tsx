export function StageSignalSummaryCards(props: {
  summary: {
    openCount: number;
    appliedCount: number;
    rejectedCount: number;
  };
}) {
  const cards = [
    { label: "Open Signals", value: props.summary.openCount },
    { label: "Applied", value: props.summary.appliedCount },
    { label: "Rejected", value: props.summary.rejectedCount }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
