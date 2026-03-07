import Link from "next/link";
import { notFound } from "next/navigation";
import { LabelPrintActions } from "../../../components/labels/LabelPrintActions";
import { ShelfLabelBatch } from "../../../components/labels/ShelfLabelBatch";
import { getLabelBundle } from "../../../lib/api";

export default async function LabelBundlePage({
  params
}: {
  params: Promise<{ bundleCode: string }>;
}) {
  const { bundleCode } = await params;
  const payload = await getLabelBundle(bundleCode);

  if (!payload?.batch) {
    notFound();
  }

  const batch = payload.batch;
  const singlePartCode = batch.labels[0]?.partCode;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/labels" className="text-sm text-emerald-300">
              Back to label batches
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
              {batch.bundleCode}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Shelf label batch preview</h2>
            <p className="mt-3 text-sm text-slate-300">
              {batch.labelCount} labels in this bundle. Use browser print or open the raw
              printable HTML view.
            </p>
          </div>
          <div className="space-y-3">
            <LabelPrintActions bundleCode={batch.bundleCode} />
            {singlePartCode ? (
              <Link
                href={`/labels/${batch.bundleCode}/single/${singlePartCode}`}
                className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-white"
              >
                View Single Label Example
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <ShelfLabelBatch labels={batch.labels} />

      <details className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <summary className="cursor-pointer text-white">JSON Debug</summary>
        <pre className="mt-4 overflow-x-auto text-xs text-emerald-100">
          {JSON.stringify(batch, null, 2)}
        </pre>
      </details>
    </div>
  );
}
