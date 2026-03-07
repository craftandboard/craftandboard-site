import Link from 'next/link';
import { ManufacturingActions } from '../../components/manufacturing-actions';
import { getManufacturingBundles } from '../../lib/api';

export default async function ManufacturingPage() {
  const payload = await getManufacturingBundles();
  const bundles = payload?.bundles ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Manufacturing</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">4x8 nesting and CNC job generation</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Bundle lifecycle is now operator-controlled. Release, nesting, CNC, approvals, and packet generation all run against persisted current versions.
        </p>
      </section>

      {bundles.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          No manufacturing bundles are available yet. Import orders first so bundle-derived physical parts exist.
        </section>
      ) : (
        <section className="grid gap-4">
          {bundles.map((bundle) => {
            const nextAllowedActions =
              bundle.status === 'draft'
                ? ['release']
                : bundle.status === 'ready_for_nesting'
                  ? ['build_nesting']
                  : bundle.status === 'nested'
                    ? ['approve_nesting']
                    : bundle.status === 'ready_for_cnc'
                      ? ['generate_cnc']
                      : bundle.status === 'cnc_generated'
                        ? ['approve_cnc']
                        : [];

            const lifecycle = {
              bundleCode: bundle.bundleCode,
              status: bundle.status ?? 'draft',
              currentNestVersion: bundle.currentNestVersion,
              currentCncVersion: bundle.currentCncVersion,
              nextAllowedActions
            };

            return (
              <div key={bundle.bundleCode} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Link href={`/manufacturing/${bundle.bundleCode}`} className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                      {bundle.bundleCode}
                    </Link>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{bundle.productLabel}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Ship by {bundle.shipByDate} · Material {bundle.materialCode} · Status {bundle.status ?? 'draft'}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Current nest v{bundle.currentNestVersion ?? 0} · Current CNC v{bundle.currentCncVersion ?? 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 lg:grid-cols-5">
                    <div className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parts</p>
                      <p className="mt-2 text-xl font-semibold text-white">{bundle.totalPhysicalParts}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sheets</p>
                      <p className="mt-2 text-xl font-semibold text-white">{bundle.totalSheets}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nesting</p>
                      <p className="mt-2 text-sm font-semibold text-white">{bundle.nestingBuilt ? 'Built' : 'Pending'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CNC</p>
                      <p className="mt-2 text-sm font-semibold text-white">{bundle.cncGenerated ? 'Generated' : 'Pending'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Utilization</p>
                      <p className="mt-2 text-sm font-semibold text-white">{bundle.utilizationPct ?? 0}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <ManufacturingActions
                    bundleCode={bundle.bundleCode}
                    compact
                    lifecycle={lifecycle}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
