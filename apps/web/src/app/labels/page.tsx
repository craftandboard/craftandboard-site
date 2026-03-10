import Link from "next/link";
import { getLabelBundles } from "../../lib/api";

export default async function LabelsPage() {
  const payload = await getLabelBundles();
  const bundles = payload?.bundles ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Label Engine</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          First-party 2 x 4 shelf labels
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          FieldMetriq now owns the shelf-part label workflow directly. Use a
          production bundle to preview, print, or inspect individual labels
          without the external paid label tool.
        </p>
      </section>

      {bundles.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          No label batches are available yet. Import fixture orders first so production
          bundles and label batches can be generated.
        </section>
      ) : (
        <section className="grid gap-4">
          {bundles.map((bundle) => (
            <Link
              key={bundle.bundleCode}
              href={`/labels/${bundle.bundleCode}`}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition hover:border-emerald-300/50"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                {bundle.bundleCode}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{bundle.productLabel}</h3>
              <p className="mt-2 text-sm text-slate-300">
                Ship by {bundle.shipByDate} · Material {bundle.materialCode}
              </p>
              <p className="mt-4 text-sm text-slate-200">{bundle.labelCount} labels ready to print</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
