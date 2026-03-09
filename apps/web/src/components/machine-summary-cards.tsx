export function MachineSummaryCards(props: {
  summary: {
    totalMachines: number;
    activeMachines: number;
    cncMachines: number;
    edgebanders: number;
  };
}) {
  const cards = [
    { label: "Total Machines", value: props.summary.totalMachines },
    { label: "Active", value: props.summary.activeMachines },
    { label: "CNC", value: props.summary.cncMachines },
    { label: "Edgebanders", value: props.summary.edgebanders }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
