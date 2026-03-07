import Link from "next/link";
import { notFound } from "next/navigation";
import { ShelfLabel } from "../../../../../components/labels/ShelfLabel";
import { getSingleLabel } from "../../../../../lib/api";

export default async function SingleLabelPage({
  params
}: {
  params: Promise<{ bundleCode: string; partCode: string }>;
}) {
  const { bundleCode, partCode } = await params;
  const payload = await getSingleLabel(bundleCode, partCode);

  if (!payload?.label) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <Link href={`/labels/${bundleCode}`} className="text-sm text-emerald-300">
          Back to bundle labels
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
          {bundleCode}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Single label preview</h2>
      </section>

      <div className="shelf-label-sheet">
        <ShelfLabel label={payload.label} />
      </div>

      <details className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <summary className="cursor-pointer text-white">Label Data</summary>
        <pre className="mt-4 overflow-x-auto text-xs text-emerald-100">
          {JSON.stringify(payload.label, null, 2)}
        </pre>
      </details>
    </div>
  );
}
