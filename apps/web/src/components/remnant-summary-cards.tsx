export function RemnantSummaryCards(props: {
  summary: {
    totalAvailableRemnants: number;
    totalAvailableAreaSqIn: number;
    heldCount: number;
    scrappedCount: number;
    topMaterials: Array<{
      materialLabel: string;
      remnantCount: number;
    }>;
  };
}) {
  const cards = [
    {
      label: "Available Remnants",
      value: props.summary.totalAvailableRemnants,
      detail: `${(props.summary.totalAvailableAreaSqIn / 144).toFixed(2)} sq ft usable`
    },
    {
      label: "Held Pieces",
      value: props.summary.heldCount,
      detail: "Not recommended in forecast"
    },
    {
      label: "Scrapped",
      value: props.summary.scrappedCount,
      detail: "Unavailable for planning"
    },
    {
      label: "Top Material",
      value: props.summary.topMaterials[0]?.materialLabel ?? "None",
      detail: props.summary.topMaterials[0]
        ? `${props.summary.topMaterials[0].remnantCount} usable pieces`
        : "No live remnant inventory"
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          <p className="mt-2 text-sm text-slate-300">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
