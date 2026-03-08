import Link from "next/link";
import { CreateBatchButton } from "../../components/create-batch-button";
import { GenerateCncButton } from "../../components/generate-cnc-button";
import { GenerateLabelsButton } from "../../components/generate-labels-button";
import { NestBatchButton } from "../../components/nest-batch-button";
import { getBatches } from "../../lib/api";

export default async function BatchesPage() {
  const payload = await getBatches();
  const batches = payload?.batches ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Batches</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Draft batch generation</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Create one material-specific draft batch from eligible configurator-created jobs and parts.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <CreateBatchButton material="WHITE_MELAMINE" label="White Melamine" />
          <CreateBatchButton material="MAPLE_MELAMINE" label="Maple Melamine" />
        </div>
      </section>

      <section className="space-y-4">
        {batches.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
            No persisted batches yet. Create configurator jobs first, then generate a material batch.
          </div>
        ) : (
          batches.map((batch) => (
            <article key={batch.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                {batch.code ?? batch.name}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{batch.materialCode ?? "Unknown Material"}</h3>
              <p className="mt-2 text-sm text-slate-300">
                Status {batch.status} · Parts {batch.partCount ?? 0} · Jobs {batch.jobCount ?? 0}
              </p>
              <div className="mt-4">
                <Link
                  href={`/batches/${batch.id}`}
                  className="inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950"
                >
                  View Batch
                </Link>
              </div>
              <div className="mt-4">
                <NestBatchButton batchId={batch.id} />
              </div>
              <div className="mt-4">
                <GenerateCncButton batchId={batch.id} />
              </div>
              <div className="mt-4">
                <GenerateLabelsButton batchId={batch.id} />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
