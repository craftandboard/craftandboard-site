import { BatchStatusActions } from "../../../components/batch-status-actions";
import Link from "next/link";
import { GenerateCncButton } from "../../../components/generate-cnc-button";
import { GenerateCncCsvButton } from "../../../components/generate-cnc-csv-button";
import { GenerateCncJsonButton } from "../../../components/generate-cnc-json-button";
import { GenerateCncMosaicButton } from "../../../components/generate-cnc-mosaic-button";
import { GenerateLabelCsvButton } from "../../../components/generate-label-csv-button";
import { GenerateLabelPdfButton } from "../../../components/generate-label-pdf-button";
import { GenerateLabelsButton } from "../../../components/generate-labels-button";
import { GenerateTravelerPdfButton } from "../../../components/generate-traveler-pdf-button";
import { NestBatchButton } from "../../../components/nest-batch-button";
import { PartStatusActions } from "../../../components/part-status-actions";
import { ScanLabelForm } from "../../../components/scan-label-form";
import { getBatchDetail } from "../../../lib/api";

export default async function BatchDetailPage(props: { params: Promise<{ batchId: string }> }) {
  const params = await props.params;
  const payload = await getBatchDetail(params.batchId);

  if (!payload) {
    return (
      <div className="space-y-6">
        <Link href="/batches" className="text-sm text-emerald-300">
          ← Back to batches
        </Link>
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          Batch not found.
        </div>
      </div>
    );
  }

  const { batch, jobs, parts, sheets, artifacts } = payload;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/batches" className="text-sm text-emerald-300">
          ← Back to batches
        </Link>
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Batch Detail</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{batch.code}</h1>
          <div className="mt-4 grid gap-3 text-sm text-slate-200 md:grid-cols-2 xl:grid-cols-4">
            <div>Status: {batch.status}</div>
            <div>Material: {batch.material}</div>
            <div>Source: {batch.source}</div>
            <div>Batch Id: {batch.id}</div>
            <div>Parts: {batch.partCount}</div>
            <div>Jobs: {batch.jobCount}</div>
            <div>Created: {new Date(batch.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(batch.updatedAt).toLocaleString()}</div>
            <div>Cut: {batch.progress.cutCount}</div>
            <div>Edgebanded: {batch.progress.edgebandedCount}</div>
            <div>Packed: {batch.progress.packedCount}</div>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Workflow Actions</p>
            <p className="mt-2 text-sm text-slate-300">Available next actions: {batch.availableNextActions.join(", ") || "None"}</p>
            <div className="mt-4">
              <BatchStatusActions batchId={batch.id} availableNextActions={batch.availableNextActions} />
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-9">
            <NestBatchButton batchId={batch.id} />
            <GenerateCncButton batchId={batch.id} />
            <GenerateCncCsvButton batchId={batch.id} />
            <GenerateCncMosaicButton batchId={batch.id} />
            <GenerateCncJsonButton batchId={batch.id} />
            <GenerateLabelsButton batchId={batch.id} />
            <GenerateLabelCsvButton batchId={batch.id} />
            <GenerateLabelPdfButton batchId={batch.id} />
            <GenerateTravelerPdfButton batchId={batch.id} />
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/30 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Scan Label</p>
            <div className="mt-4">
              <ScanLabelForm initialScanCode={parts[0]?.scanCode} />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Jobs And Parts</p>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-300">No jobs persisted for this batch.</p>
            ) : (
              jobs.map((job) => (
                <article key={job.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">{job.id}</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">{job.labelCode}</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {job.source} · {job.channel} · {job.material} · Qty {job.quantity}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {job.width}&quot; × {job.depth}&quot; × {job.thickness}&quot; · {job.edgeBandPattern}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Part IDs: {job.partIds.join(", ") || "None"}</p>
                </article>
              ))
            )}
          </div>
          <div className="space-y-4">
            {parts.length === 0 ? (
              <p className="text-sm text-slate-300">No parts persisted for this batch.</p>
            ) : (
              parts.map((part) => (
                <article key={part.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">{part.labelCode}</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {part.width}&quot; × {part.depth}&quot; × {part.thickness}&quot;
                  </p>
                  <p className="mt-2 text-xs text-emerald-200">Scan {part.scanCode}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {part.material} · {part.edgeBandPattern} · {part.source} · Status {part.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Part {part.id} · Job {part.jobId ?? "Unlinked"} · Instance {part.instanceNumber}
                  </p>
                  <div className="mt-4">
                    <PartStatusActions partId={part.id} availableNextActions={part.availableNextActions} />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Nested Sheets</p>
        <div className="mt-6 space-y-4">
          {sheets.length === 0 ? (
            <p className="text-sm text-slate-300">No nested sheets yet.</p>
          ) : (
            sheets.map((sheet) => (
              <article key={sheet.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <h2 className="text-lg font-semibold text-white">
                  Sheet {sheet.sheetIndex} · {sheet.material}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {sheet.sheetWidth}&quot; × {sheet.sheetHeight}&quot; · Status {sheet.status}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">Label</th>
                        <th className="pb-3 pr-4">X</th>
                        <th className="pb-3 pr-4">Y</th>
                        <th className="pb-3 pr-4">Width</th>
                        <th className="pb-3 pr-4">Depth</th>
                        <th className="pb-3 pr-4">Seq</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.placements.map((placement) => (
                        <tr key={placement.id} className="border-t border-white/5">
                          <td className="py-3 pr-4">{placement.labelCode}</td>
                          <td className="py-3 pr-4">{placement.x}</td>
                          <td className="py-3 pr-4">{placement.y}</td>
                          <td className="py-3 pr-4">{placement.width}</td>
                          <td className="py-3 pr-4">{placement.depth}</td>
                          <td className="py-3 pr-4">{placement.sequenceNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">CNC Packet</p>
          {artifacts.cnc.artifact ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>Artifact: {artifacts.cnc.artifact.id}</p>
              <p>Type: {artifacts.cnc.artifact.type}</p>
              <p>URI: {artifacts.cnc.artifact.uri}</p>
              <p>Generated From: {artifacts.cnc.artifact.generatedFrom ?? "Unknown"}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">No CNC artifact generated yet.</p>
          )}
          {artifacts.cnc.packet ? (
            <pre className="mt-4 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-xs text-emerald-100">
              {JSON.stringify(
                {
                  packet: artifacts.cnc.packet,
                  sheets: artifacts.cnc.sheets ?? []
                },
                null,
                2
              )}
            </pre>
          ) : null}
          {artifacts.cnc.csv ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>CSV Artifact: {artifacts.cnc.csv.id}</p>
              <p>
                CSV URI:{" "}
                <a href={artifacts.cnc.csv.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.cnc.csv.uri}
                </a>
              </p>
            </div>
          ) : null}
          {artifacts.cnc.mosaic ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>Mosaic Artifact: {artifacts.cnc.mosaic.id}</p>
              <p>
                Mosaic URI:{" "}
                <a href={artifacts.cnc.mosaic.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.cnc.mosaic.uri}
                </a>
              </p>
            </div>
          ) : null}
          {artifacts.cnc.json ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>JSON Artifact: {artifacts.cnc.json.id}</p>
              <p>
                JSON URI:{" "}
                <a href={artifacts.cnc.json.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.cnc.json.uri}
                </a>
              </p>
            </div>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Label Packet</p>
          {artifacts.labels.artifact ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>Artifact: {artifacts.labels.artifact.id}</p>
              <p>Type: {artifacts.labels.artifact.type}</p>
              <p>URI: {artifacts.labels.artifact.uri}</p>
              <p>Generated From: {artifacts.labels.artifact.generatedFrom ?? "Unknown"}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">No label artifact generated yet.</p>
          )}
          {artifacts.labels.packet ? (
            <pre className="mt-4 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-xs text-emerald-100">
              {JSON.stringify(
                {
                  packet: artifacts.labels.packet,
                  labels: artifacts.labels.labels ?? []
                },
                null,
                2
              )}
            </pre>
          ) : null}
          {artifacts.labels.pdf ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>PDF Artifact: {artifacts.labels.pdf.id}</p>
              <p>
                PDF URI:{" "}
                <a href={artifacts.labels.pdf.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.labels.pdf.uri}
                </a>
              </p>
            </div>
          ) : null}
          {artifacts.labels.csv ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>CSV Artifact: {artifacts.labels.csv.id}</p>
              <p>
                CSV URI:{" "}
                <a href={artifacts.labels.csv.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.labels.csv.uri}
                </a>
              </p>
            </div>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Traveler PDF</p>
          {artifacts.traveler.pdf ? (
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>Artifact: {artifacts.traveler.pdf.id}</p>
              <p>Type: {artifacts.traveler.pdf.type}</p>
              <p>
                URI:{" "}
                <a href={artifacts.traveler.pdf.uri} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                  {artifacts.traveler.pdf.uri}
                </a>
              </p>
              <p>Generated From: {artifacts.traveler.pdf.generatedFrom ?? "Unknown"}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">No traveler PDF generated yet.</p>
          )}
        </article>
      </section>
    </div>
  );
}
