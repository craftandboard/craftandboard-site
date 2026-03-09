import type { EdgeBandEstimateSummary } from "../lib/api";

export function EdgeBandingSummaryCards(props: {
  summary: EdgeBandEstimateSummary;
  title?: string;
}) {
  const cards = [
    {
      label: "Estimated Demand",
      value: `${props.summary.totals.estimatedDemandFt.toFixed(2)} ft`,
      detail: "Adjusted total including setup allowance"
    },
    {
      label: "Raw Linear Feet",
      value: `${props.summary.totals.rawLinearFt.toFixed(2)} ft`,
      detail: "Pure perimeter before allowances"
    },
    {
      label: "Waste + Setup",
      value: `${(props.summary.totals.estimatedDemandFt - props.summary.totals.rawLinearFt).toFixed(2)} ft`,
      detail: `${props.summary.assumptions.perEdgeWasteIn}" per banded edge + ${props.summary.assumptions.setupAllowanceFtPerEdgeBandMaterialGroup} ft setup per material`
    },
    {
      label: "Edge Band Buckets",
      value: props.summary.materials.length,
      detail: props.summary.unmappedParts.length > 0 ? `${props.summary.unmappedParts.length} unmapped parts` : "No unmapped parts"
    }
  ];

  return (
    <section className="space-y-4">
      {props.title ? <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{props.title}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm text-slate-300">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
