import Link from "next/link";
import { getProductionBundles } from "../../lib/api";

function bundleAccent(materialCode: string) {
  return materialCode === "WHITE_MELAMINE"
    ? "border-slate-200/30 bg-slate-100/10"
    : "border-amber-300/30 bg-amber-300/10";
}

export default async function ProductionPage() {
  const payload = await getProductionBundles();
  const bundles = payload?.bundles ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Production Bundles</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Ship-by-date and material-separated output packages
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Each bundle replaces the old filtered-sheet export package. White and maple
          melamine are always split into separate bundles, even on the same ship-by date.
        </p>
      </section>

      {bundles.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          No production bundles are available yet. Import fixture orders first so the
          API can derive bundle groups from persisted order items and physical parts.
        </section>
      ) : (
        <section className="grid gap-4">
          {bundles.map((bundle) => (
            <Link
              key={bundle.bundleCode}
              href={`/production/${bundle.bundleCode}`}
              className={`rounded-[1.75rem] border p-6 transition hover:border-emerald-300/50 ${bundleAccent(
                bundle.materialCode
              )}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                    {bundle.bundleCode}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {bundle.productLabel}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Ship by {bundle.shipByDate} · Material {bundle.materialCode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Line items</p>
                    <p className="mt-2 text-xl font-semibold text-white">{bundle.totalLineItems}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Physical parts</p>
                    <p className="mt-2 text-xl font-semibold text-white">{bundle.totalPhysicalParts}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 px-4 py-2 text-slate-200">
                  Labels available
                </span>
                <span className="rounded-full border border-white/10 px-4 py-2 text-slate-200">
                  Manufacturing ready
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
