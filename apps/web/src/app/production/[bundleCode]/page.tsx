import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductionBundle } from "../../../lib/api";
import { apiUrl } from "../../../lib/site-config";

function previewCsvRows(csv: string) {
  return csv.split("\n").slice(0, 6).join("\n");
}

export default async function ProductionBundlePage({
  params
}: {
  params: Promise<{ bundleCode: string }>;
}) {
  const { bundleCode } = await params;
  const payload = await getProductionBundle(bundleCode);

  if (!payload?.bundle) {
    notFound();
  }

  const bundle = payload.bundle;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/production" className="text-sm text-emerald-300">
              Back to bundles
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
              {bundle.summary.bundleCode}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {bundle.summary.productLabel}
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Ship by {bundle.summary.shipByDate} · Material {bundle.summary.materialCode}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Line items</p>
              <p className="mt-2 text-xl font-semibold text-white">{bundle.summary.totalLineItems}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Physical parts</p>
              <p className="mt-2 text-xl font-semibold text-white">{bundle.summary.totalPhysicalParts}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/manufacturing/${bundle.summary.bundleCode}`}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
          >
            View Manufacturing
          </Link>
          <Link
            href={`/labels/${bundle.summary.bundleCode}`}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
          >
            View Labels
          </Link>
          <a
            href={apiUrl(`/manufacturing/bundles/${bundle.summary.bundleCode}/nest`)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
          >
            Nest Summary API
          </a>
          <a
            href={apiUrl(`/manufacturing/bundles/${bundle.summary.bundleCode}/cnc`)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
          >
            CNC Summary API
          </a>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Pick List</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Ship By Date</th>
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Qty</th>
                <th className="pb-3 pr-4">Last Name</th>
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Box Code</th>
                <th className="pb-3 pr-4">Total Shelf Length</th>
                <th className="pb-3 pr-4">Total Shelf Depth</th>
              </tr>
            </thead>
            <tbody>
              {bundle.pickList.rows.map((row) => (
                <tr key={row.orderItemId} className="border-t border-white/5">
                  <td className="py-3 pr-4">{row.shipByDate}</td>
                  <td className="py-3 pr-4">{row.productLabel}</td>
                  <td className="py-3 pr-4">{row.quantity}</td>
                  <td className="py-3 pr-4">{row.customerLastName}</td>
                  <td className="py-3 pr-4">{row.orderId}</td>
                  <td className="py-3 pr-4">{row.boxCode ?? "-"}</td>
                  <td className="py-3 pr-4">{row.totalShelfLengthIn}&quot;</td>
                  <td className="py-3 pr-4">{row.totalShelfDepthIn}&quot;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Labels</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/labels/${bundle.summary.bundleCode}`}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
            >
              Preview Labels
            </Link>
            <a
              href={apiUrl(`/labels/bundles/${bundle.summary.bundleCode}/html`)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
            >
              Print Labels
            </a>
            {bundle.labels.rows[0] ? (
              <Link
                href={`/labels/${bundle.summary.bundleCode}/single/${bundle.labels.rows[0].partCode}`}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
              >
                View Single Label Example
              </Link>
            ) : null}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Job#</th>
                  <th className="pb-3 pr-4">Qty</th>
                  <th className="pb-3 pr-4">Last Name</th>
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Part Code</th>
                </tr>
              </thead>
              <tbody>
                {bundle.labels.rows.map((row) => (
                  <tr key={row.partCode} className="border-t border-white/5">
                    <td className="py-3 pr-4">{row.jobNumber}</td>
                    <td className="py-3 pr-4">{row.quantityDisplay}</td>
                    <td className="py-3 pr-4">{row.customerLastName}</td>
                    <td className="py-3 pr-4">{row.orderId}</td>
                    <td className="py-3 pr-4">{row.partCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
            {previewCsvRows(bundle.labels.csv)}
          </pre>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Optimizer</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Depth mm</th>
                  <th className="pb-3 pr-4">Width mm</th>
                  <th className="pb-3 pr-4">Last Name</th>
                  <th className="pb-3 pr-4">Seq</th>
                </tr>
              </thead>
              <tbody>
                {bundle.optimizer.rows.map((row) => (
                  <tr key={row.partCode} className="border-t border-white/5">
                    <td className="py-3 pr-4">{row.rowType}</td>
                    <td className="py-3 pr-4">{row.depthMm}</td>
                    <td className="py-3 pr-4">{row.widthMm}</td>
                    <td className="py-3 pr-4">{row.customerLastName}</td>
                    <td className="py-3 pr-4">{row.sequenceNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
            {previewCsvRows(bundle.optimizer.csv)}
          </pre>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Legacy XML</h3>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
            {bundle.legacyXml.xml}
          </pre>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Bundle Manifest + Pick List HTML</h3>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
            {bundle.files.manifestJson}
          </pre>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
            {bundle.files.pickListHtml.slice(0, 800)}
          </pre>
        </div>
      </section>
    </div>
  );
}
