import Link from "next/link";
import {
  getCanonicalManufacturingBatches,
  getCanonicalManufacturingPackets,
  getCanonicalManufacturingParts,
  getMachineStageCandidates
} from "../../lib/api";

export default async function ManufacturingPage() {
  const [packetsPayload, batchesPayload, partsPayload, candidatesPayload] = await Promise.all([
    getCanonicalManufacturingPackets(),
    getCanonicalManufacturingBatches(),
    getCanonicalManufacturingParts(),
    getMachineStageCandidates()
  ]);

  const packets = packetsPayload?.packets ?? [];
  const batches = batchesPayload?.batches ?? [];
  const parts = partsPayload?.parts ?? [];
  const candidates = candidatesPayload?.candidates ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Manufacturing</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Packets, batches, parts, and execution state</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This page favors the canonical manufacturing path: `ManufacturingPacket`,
          `ManufacturingBatch`, and `ManufacturingPart`. Transitional legacy bundle
          tools remain available separately.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Packets</p>
          <p className="mt-3 text-3xl font-semibold text-white">{packets.length}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Batches</p>
          <p className="mt-3 text-3xl font-semibold text-white">{batches.length}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parts</p>
          <p className="mt-3 text-3xl font-semibold text-white">{parts.length}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Machine Candidates</p>
          <p className="mt-3 text-3xl font-semibold text-white">{candidates.length}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Manufacturing Packets</h3>
            <span className="text-sm text-slate-400">{packets.length} total</span>
          </div>
          <div className="mt-4 space-y-3">
            {packets.length === 0 ? (
              <p className="text-sm text-slate-300">No packets exist yet.</p>
            ) : (
              packets.map((packet) => (
                <div key={packet.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                  <p className="font-medium text-white">{packet.packetNumber}</p>
                  <p className="mt-1 text-slate-300">{packet.sourceType}</p>
                  <pre className="mt-3 overflow-x-auto text-xs text-slate-400">
                    {JSON.stringify(packet.summaryJson, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Manufacturing Batches</h3>
            <Link href="/inventory" className="text-sm text-emerald-300">
              Open inventory
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {batches.length === 0 ? (
              <p className="text-sm text-slate-300">No manufacturing batches exist yet.</p>
            ) : (
              batches.map((batch) => (
                <div key={batch.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                  <p className="font-medium text-white">{batch.batchNumber}</p>
                  <p className="mt-1 text-slate-300">
                    {batch.batchType} · {batch.status} · {batch.materialType ?? "Mixed"} · {batch.partCount} parts
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Manufacturing Parts</h3>
          <Link href="/parts-scans" className="text-sm text-emerald-300">
            Open parts & scans
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Part</th>
                <th className="pb-3 pr-4">Material</th>
                <th className="pb-3 pr-4">Dimensions</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Batch</th>
              </tr>
            </thead>
            <tbody>
              {parts.slice(0, 12).map((part) => (
                <tr key={part.id} className="border-t border-white/5">
                  <td className="py-3 pr-4">{part.partNumber}</td>
                  <td className="py-3 pr-4">{part.materialType}</td>
                  <td className="py-3 pr-4">
                    {part.lengthIn}&quot; × {part.depthIn}&quot; × {part.thicknessIn}&quot;
                  </td>
                  <td className="py-3 pr-4">{part.status}</td>
                  <td className="py-3 pr-4">{part.batchId ?? "Unbatched"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
