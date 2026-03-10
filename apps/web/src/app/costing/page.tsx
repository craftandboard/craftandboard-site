import { RecomputeEstimateButton } from "../../components/recompute-estimate-button";
import {
  getCanonicalSalesOrders,
  getCanonicalShelfJobs,
  getSalesOrderEstimate,
  getShelfJobEstimate
} from "../../lib/api";

export default async function CostingPage(props: {
  searchParams?: Promise<{ orderId?: string; shelfJobId?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const [ordersPayload, shelfJobsPayload] = await Promise.all([
    getCanonicalSalesOrders(),
    getCanonicalShelfJobs()
  ]);

  const orders = ordersPayload?.orders ?? [];
  const shelfJobs = shelfJobsPayload?.shelfJobs ?? [];

  const selectedOrder = orders.find((order) => order.id === searchParams.orderId) ?? orders[0];
  const selectedShelfJob =
    shelfJobs.find((job) => job.id === searchParams.shelfJobId) ??
    (selectedOrder ? shelfJobs.find((job) => job.salesOrderId === selectedOrder.id) : undefined) ??
    shelfJobs[0];

  const [orderEstimate, shelfJobEstimate] = await Promise.all([
    selectedOrder ? getSalesOrderEstimate(selectedOrder.id) : Promise.resolve(null),
    selectedShelfJob ? getShelfJobEstimate(selectedShelfJob.id) : Promise.resolve(null)
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Legacy Costing</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Shelf-job and order estimate breakdowns</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This view surfaces the persisted cost-engine platform estimates tied to canonical
          `SalesOrder` and `ShelfJob` entities.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Order Estimate</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {selectedOrder?.sourceOrderId ?? selectedOrder?.id ?? "No order selected"}
              </h3>
            </div>
            {selectedOrder ? <RecomputeEstimateButton targetType="order" targetId={selectedOrder.id} /> : null}
          </div>
          {orderEstimate?.estimate ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                Status: {orderEstimate.estimate.estimateStatus}
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
                {JSON.stringify(orderEstimate.estimate.result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-300">No order estimate has been persisted yet.</p>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shelf Job Estimate</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {selectedShelfJob?.id ?? "No shelf job selected"}
              </h3>
            </div>
            {selectedShelfJob ? <RecomputeEstimateButton targetType="shelfJob" targetId={selectedShelfJob.id} /> : null}
          </div>
          {shelfJobEstimate?.estimate ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                Status: {shelfJobEstimate.estimate.estimateStatus}
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
                {JSON.stringify(shelfJobEstimate.estimate.result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-300">No shelf-job estimate has been persisted yet.</p>
          )}
        </article>
      </section>
    </div>
  );
}
