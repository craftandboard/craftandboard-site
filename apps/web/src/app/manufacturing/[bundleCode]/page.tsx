import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ManufacturingActions } from '../../../components/manufacturing-actions';
import { getManufacturingBundle } from '../../../lib/api';

export default async function ManufacturingBundlePage({
  params
}: {
  params: Promise<{ bundleCode: string }>;
}) {
  const { bundleCode } = await params;
  const payload = await getManufacturingBundle(bundleCode);

  if (!payload?.bundle || !payload.lifecycle) {
    notFound();
  }

  const { bundle, lifecycle, customerStatus, nesting, jobs, artifacts } = payload;
  const allSheets = payload.sheets ?? nesting.sheets;
  const currentSheets = allSheets.filter((sheet) => sheet.isCurrent !== false);
  const supersededSheets = allSheets.filter((sheet) => sheet.isCurrent === false);
  const currentJobs = jobs.filter((job) => job.isCurrent !== false);
  const supersededJobs = jobs.filter((job) => job.isCurrent === false);
  const currentArtifacts = artifacts.filter((artifact) => artifact.isCurrent);
  const supersededArtifacts = artifacts.filter((artifact) => !artifact.isCurrent);
  const currentPacket = currentArtifacts.find((artifact) => artifact.artifactType === 'BUNDLE_PACKET_HTML');

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/manufacturing" className="text-sm text-emerald-300">
              Back to manufacturing
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">{bundle.bundleCode}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{bundle.productLabel}</h2>
            <p className="mt-3 text-sm text-slate-300">
              Ship by {bundle.shipByDate} · Material {bundle.materialCode} · Status {lifecycle.status}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Customer-safe status: {customerStatus.customerStatus} · {customerStatus.detail}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Current nest v{lifecycle.currentNestVersion ?? 0} · Current CNC v{lifecycle.currentCncVersion ?? 0}
            </p>
          </div>
          <div className="max-w-xl">
            <ManufacturingActions bundleCode={bundleCode} lifecycle={lifecycle} jobs={jobs} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total sheets</p>
          <p className="mt-3 text-3xl font-semibold text-white">{nesting.sheetCount}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total part area</p>
          <p className="mt-3 text-3xl font-semibold text-white">{nesting.totalPartAreaSqIn}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Utilization</p>
          <p className="mt-3 text-3xl font-semibold text-white">{nesting.utilizationPct}%</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Onion skin parts</p>
          <p className="mt-3 text-3xl font-semibold text-white">{nesting.onionSkinPartCount}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-white">Sheets</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/production/${bundleCode}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                Back to Production
              </Link>
              <Link href={`/labels/${bundleCode}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                View Labels
              </Link>
              {currentPacket ? (
                <a
                  href={`http://localhost:4000${currentPacket.uri}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Open Packet
                </a>
              ) : null}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {currentSheets.map((sheet) => (
              <Link
                key={sheet.id ?? sheet.sheetNumber}
                href={sheet.id ? `/manufacturing/sheets/${sheet.id}` : '#'}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-200 transition hover:border-emerald-300/40"
              >
                <div>
                  <span>Sheet {sheet.sheetNumber}</span>
                  <p className="mt-1 text-xs text-slate-400">
                    Version {sheet.version ?? 1} · {sheet.isCurrent ? 'Current' : 'Superseded'} · {sheet.status ?? 'planned'}
                  </p>
                </div>
                <span>{sheet.totalParts} parts · {sheet.utilizationPct}%</span>
              </Link>
            ))}
            {currentSheets.length === 0 ? <p className="text-sm text-slate-300">Build nesting to create sheet layouts.</p> : null}
            {supersededSheets.length > 0 ? (
              <div className="pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Superseded Sheets</p>
                <div className="mt-3 space-y-3">
                  {supersededSheets.map((sheet) => (
                    <div key={sheet.id ?? `old-${sheet.sheetNumber}-${sheet.version ?? 0}`} className="rounded-2xl border border-white/5 px-4 py-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-4">
                        <span>Sheet {sheet.sheetNumber}</span>
                        <span>v{sheet.version ?? 1} · {sheet.status ?? 'planned'}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {sheet.totalParts} parts · {sheet.utilizationPct}% · superseded
                        {sheet.postedAt ? ` · posted ${sheet.postedAt}` : ''}
                        {sheet.completedAt ? ` · completed ${sheet.completedAt}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">CNC Jobs</h3>
          <div className="mt-4 space-y-3">
            {currentJobs.map((job) => (
              <div key={job.id ?? job.code} className="rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{job.fileName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {job.controllerType} · Version {job.version ?? 1} · {job.isCurrent ? 'Current' : 'Superseded'} · {job.status}
                    </p>
                    {job.failureReason ? <p className="mt-1 text-xs text-red-200">Failure: {job.failureReason}</p> : null}
                  </div>
                  <a
                    href={job.id ? `http://localhost:4000/manufacturing/cnc/${job.id}/file` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-white"
                  >
                    Open File
                  </a>
                </div>
              </div>
            ))}
            {currentJobs.length === 0 ? <p className="text-sm text-slate-300">Generate CNC after nesting is built.</p> : null}
            {supersededJobs.length > 0 ? (
              <div className="pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Superseded CNC Jobs</p>
                <div className="mt-3 space-y-3">
                  {supersededJobs.map((job) => (
                    <div key={job.id ?? `old-${job.code}-${job.version ?? 0}`} className="rounded-2xl border border-white/5 px-4 py-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-4">
                        <span>{job.fileName}</span>
                        <span>v{job.version ?? 1} · {job.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {job.postedAt ? `Posted ${job.postedAt}` : 'Not posted'}
                        {job.ranAt ? ` · Ran ${job.ranAt}` : ''}
                        {job.failureReason ? ` · Failure: ${job.failureReason}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-white">Artifacts</h3>
          <p className="text-sm text-slate-400">Only one current artifact version is active at a time.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Version</th>
                <th className="pb-3 pr-4">Current</th>
                <th className="pb-3 pr-4">URI</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((artifact) => (
                <tr key={artifact.id ?? artifact.uri} className="border-t border-white/5">
                  <td className="py-3 pr-4">{artifact.artifactType}</td>
                  <td className="py-3 pr-4">{artifact.version}</td>
                  <td className="py-3 pr-4">{artifact.isCurrent ? 'Current' : 'Superseded'}</td>
                  <td className="py-3 pr-4">
                    <a href={`http://localhost:4000${artifact.uri}`} target="_blank" rel="noreferrer" className="text-emerald-300">
                      {artifact.uri}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentArtifacts.length === 0 ? <p className="mt-4 text-sm text-slate-300">Artifacts appear after nesting, CNC, or packet generation.</p> : null}
          {supersededArtifacts.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prior Artifact Versions</p>
              <table className="mt-3 min-w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Version</th>
                    <th className="pb-3 pr-4">Superseded At</th>
                  </tr>
                </thead>
                <tbody>
                  {supersededArtifacts.map((artifact) => (
                    <tr key={artifact.id ?? `old-${artifact.uri}-${artifact.version}`} className="border-t border-white/5">
                      <td className="py-3 pr-4">{artifact.artifactType}</td>
                      <td className="py-3 pr-4">{artifact.version}</td>
                      <td className="py-3 pr-4">{artifact.supersededAt ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
