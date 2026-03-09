import Link from "next/link";
import { BatchSortingSummaryCards } from "../../../../components/batch-sorting-summary-cards";
import { BatchSortingWorkspace } from "../../../../components/batch-sorting-workspace";
import { getBatchSortingView } from "../../../../lib/api";

export default async function BatchSortingPage(props: { params: Promise<{ batchId: string }> }) {
  const params = await props.params;
  const payload = await getBatchSortingView(params.batchId);

  if (!payload) {
    return (
      <div className="space-y-6">
        <Link href="/batches" className="text-sm text-emerald-300">
          ← Back to batches
        </Link>
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          Batch sorting view is unavailable right now.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Batch Sorting</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{payload.batch.code}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Sort freshly cut parts into physical bins or containers by job or order before downstream station work.
        </p>
      </section>

      <BatchSortingSummaryCards summary={payload.summary} />
      <BatchSortingWorkspace batchId={payload.batch.id} initialView={payload} />
    </div>
  );
}
