import Link from "next/link";
import { notFound } from "next/navigation";
import { RecomputeEstimateButton } from "../../../components/recompute-estimate-button";
import { getCanonicalSalesOrder, getCanonicalShelfJob, getSalesOrderEstimate } from "../../../lib/api";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getCanonicalSalesOrder(id);

  if (!payload?.order) {
    notFound();
  }

  const order = payload.order;
  const estimatePayload = await getSalesOrderEstimate(id);
  const shelfJobs = (
    await Promise.all(order.shelfJobs.map(async (job) => (await getCanonicalShelfJob(job.id))?.shelfJob ?? null))
  ).filter((job): job is NonNullable<typeof job> => Boolean(job));

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <Link href="/orders" className="text-sm text-emerald-300">
          Back to orders
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
          {order.sourceOrderId ?? order.id}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {order.customerName ?? "Unknown customer"}
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          {order.sourceType} · {order.currency} · status {order.status}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Order Estimate</h3>
              <p className="mt-2 text-sm text-slate-300">
                Canonical order-level estimate built from shelf jobs.
              </p>
            </div>
            <RecomputeEstimateButton targetType="order" targetId={order.id} />
          </div>
          {estimatePayload?.estimate ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-2 text-xl font-semibold text-white">{estimatePayload.estimate.estimateStatus}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Warnings</p>
                <p className="mt-2 text-sm text-slate-200">
                  {estimatePayload.estimate.warnings.length === 0
                    ? "None"
                    : estimatePayload.estimate.warnings.join(", ")}
                </p>
              </div>
              <pre className="md:col-span-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
                {JSON.stringify(estimatePayload.estimate.result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-300">No persisted order estimate exists yet.</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold text-white">Order Summary</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Line Items</p>
              <p className="mt-2 text-2xl font-semibold text-white">{order.items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shelf Jobs</p>
              <p className="mt-2 text-2xl font-semibold text-white">{order.shelfJobs.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Canonical Line Items</h3>
        <div className="mt-4 space-y-6">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
                {item.id}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {item.title} · {item.materialType ?? "Unknown material"}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {item.lengthIn ? `${item.lengthIn}"` : "Unknown"} x{" "}
                {item.depthIn ? `${item.depthIn}"` : "Unknown"} · Qty {item.quantity}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Normalize: {item.normalizationStatus} · Pricing: {item.pricingStatus}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Shelf Jobs</h3>
        <div className="mt-4 space-y-4">
          {shelfJobs.length === 0 ? (
            <p className="text-sm text-slate-300">No shelf jobs have been created for this order yet.</p>
          ) : (
            shelfJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">{job.id}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{job.jobStatus}</p>
                    <p className="mt-2 text-sm text-slate-300">Qty {job.quantity}</p>
                  </div>
                  <RecomputeEstimateButton targetType="shelfJob" targetId={job.id} />
                </div>
                <pre className="mt-4 overflow-x-auto text-xs text-slate-300">
                  {JSON.stringify(job.normalizedSpecJson, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
