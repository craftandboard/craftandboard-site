import Link from "next/link";

const stations = [
  {
    href: "/stations/cutting",
    label: "Cutting",
    description: "Scan queued parts and move them from pending to cut."
  },
  {
    href: "/stations/edgebanding",
    label: "Edgebanding",
    description: "Process cut parts and advance them to edgebanded."
  },
  {
    href: "/stations/packing",
    label: "Packing",
    description: "Finish edgebanded parts and mark them packed."
  },
  {
    href: "/stations/shipping",
    label: "Shipping",
    description: "View completed orders that are ready for shipment or pickup."
  }
];

export default function StationsPage() {
  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Stations</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Shop-floor station views</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Open the station that matches the next production step. Each page is focused on the active queue and scan action for that stage.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stations.map((station) => (
          <Link
            key={station.href}
            href={station.href}
            className="rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{station.label}</p>
            <p className="mt-3 text-sm text-slate-300">{station.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
