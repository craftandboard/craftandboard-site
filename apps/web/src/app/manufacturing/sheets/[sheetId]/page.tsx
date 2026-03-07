import Link from "next/link";
import { notFound } from "next/navigation";
import { getManufacturingSheet, getSheetMap } from "../../../../lib/api";

export default async function ManufacturingSheetPage({
  params
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const [sheetPayload, mapPayload] = await Promise.all([
    getManufacturingSheet(sheetId),
    getSheetMap(sheetId)
  ]);

  if (!sheetPayload?.sheet || !mapPayload?.map) {
    notFound();
  }

  const sheet = sheetPayload.sheet;
  const map = mapPayload.map;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <Link href={`/manufacturing/${sheet.productionBundleCode}`} className="text-sm text-emerald-300">
          Back to manufacturing bundle
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">Sheet {sheet.sheetNumber}</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{sheet.productionBundleCode}</h2>
        <p className="mt-3 text-sm text-slate-300">
          Material {sheet.materialCode} · Utilization {sheet.utilizationPct}% · {sheet.totalParts} parts
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Version {sheet.version ?? 1} · {sheet.isCurrent ? "Current" : "Superseded"} · {sheet.status ?? "planned"}
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-white">Sheet Map</h3>
          <a
            href={`http://localhost:4000/manufacturing/sheets/${sheet.id}/map?format=svg`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
          >
            Open SVG
          </a>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white p-4" dangerouslySetInnerHTML={{ __html: map.svg }} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Placements</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Seq</th>
                  <th className="pb-3 pr-4">Part</th>
                  <th className="pb-3 pr-4">X</th>
                  <th className="pb-3 pr-4">Y</th>
                  <th className="pb-3 pr-4">Width</th>
                  <th className="pb-3 pr-4">Depth</th>
                  <th className="pb-3 pr-4">Onion</th>
                </tr>
              </thead>
              <tbody>
                {sheet.placements.map((placement) => (
                  <tr key={placement.id ?? placement.partCode} className="border-t border-white/5">
                    <td className="py-3 pr-4">{placement.sequenceNumber}</td>
                    <td className="py-3 pr-4">{placement.partCode}</td>
                    <td className="py-3 pr-4">{placement.xIn}</td>
                    <td className="py-3 pr-4">{placement.yIn}</td>
                    <td className="py-3 pr-4">{placement.widthIn}&quot;</td>
                    <td className="py-3 pr-4">{placement.depthIn}&quot;</td>
                    <td className="py-3 pr-4">{placement.onionSkin ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Sheet CNC</h3>
          <div className="mt-4 space-y-3">
            {(sheet.cncJobs ?? []).map((job) => (
              <a
                key={job.id ?? job.code}
                href={job.id ? `http://localhost:4000/manufacturing/cnc/${job.id}/file` : "#"}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-200 transition hover:border-emerald-300/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <span>{job.fileName}</span>
                  <span className="text-xs text-slate-400">
                    v{job.version ?? 1} · {job.isCurrent ? "Current" : "Superseded"} · {job.status ?? "generated"}
                  </span>
                </div>
                {job.failureReason ? <p className="mt-2 text-xs text-red-200">Failure: {job.failureReason}</p> : null}
              </a>
            ))}
            {(sheet.cncJobs ?? []).length === 0 ? (
              <p className="text-sm text-slate-300">Generate CNC from the manufacturing bundle page.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
