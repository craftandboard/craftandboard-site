export function MaterialForecastSummaryCards(props: {
  summary: {
    totalPendingMaterials: number;
    totalPendingParts: number;
    estimatedTotalSheets: number;
    materialsWithRemnantCandidates: number;
  };
}) {
  const cards = [
    {
      label: "Pending Materials",
      value: props.summary.totalPendingMaterials,
      tone: "text-emerald-200"
    },
    {
      label: "Pending Parts",
      value: props.summary.totalPendingParts,
      tone: "text-white"
    },
    {
      label: "Estimated Sheets",
      value: props.summary.estimatedTotalSheets,
      tone: "text-amber-200"
    },
    {
      label: "Remnant Candidates",
      value: props.summary.materialsWithRemnantCandidates,
      tone: "text-sky-200"
    }
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
          <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}
