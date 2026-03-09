export function BatchSortingSummaryCards(props: {
  summary: {
    totalParts: number;
    assignedParts: number;
    unassignedParts: number;
    openContainers: number;
    completionPct: number;
  };
}) {
  const cards = [
    { label: "Total Parts", value: props.summary.totalParts, tone: "text-white" },
    { label: "Assigned", value: props.summary.assignedParts, tone: "text-emerald-200" },
    { label: "Unassigned", value: props.summary.unassignedParts, tone: "text-amber-200" },
    { label: "Open Containers", value: props.summary.openContainers, tone: "text-sky-200" },
    { label: "Completion %", value: `${props.summary.completionPct}%`, tone: "text-fuchsia-200" }
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
          <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}
