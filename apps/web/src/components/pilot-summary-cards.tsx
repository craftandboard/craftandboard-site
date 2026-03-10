"use client";

export function PilotSummaryCards({
  items
}: {
  items: Array<{ label: string; value: string; tone?: "neutral" | "warning" | "danger" | "success" }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <article
          key={item.label}
          className={`rounded-[1.5rem] border px-5 py-5 ${
            item.tone === "danger"
              ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
              : item.tone === "warning"
                ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                : item.tone === "success"
                  ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.22em] opacity-80">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
