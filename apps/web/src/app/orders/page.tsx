import Link from "next/link";
import { getCanonicalSalesOrders } from "../../lib/api";

export default async function OrdersPage() {
  const payload = await getCanonicalSalesOrders();
  const orders = payload?.orders ?? [];
  const readyOrders = orders.filter((order) => order.status === "READY").length;
  const holdOrders = orders.filter((order) => order.status === "HOLD" || order.status === "ERROR").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Canonical Orders</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Sales orders, line items, and shelf jobs</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            This screen favors `SalesOrder`, `SalesOrderItem`, and `ShelfJob`.
            Legacy import compatibility still exists in the backend, but this
            is the canonical operations view going forward.
          </p>
        </div>
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Current state</p>
          <p className="mt-4 text-4xl font-semibold text-white">{orders.length}</p>
          <p className="mt-2 text-sm text-emerald-50/80">
            {readyOrders} ready · {holdOrders} hold or error
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
            No canonical orders exist yet. Create or import an order through the intake pipeline.
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                    {order.sourceOrderId ?? order.id}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {order.customerName ?? "Unknown customer"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {order.sourceType} · {order.currency} · {order.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                    {order.items.length} lines · {order.shelfJobs.length} shelf jobs
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950"
                  >
                    View Order
                  </Link>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="pb-3 pr-4">Order Line</th>
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Material</th>
                      <th className="pb-3 pr-4">Qty</th>
                      <th className="pb-3 pr-4">Length</th>
                      <th className="pb-3 pr-4">Depth</th>
                      <th className="pb-3 pr-4">Normalization</th>
                      <th className="pb-3 pr-4">Pricing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-t border-white/5">
                        <td className="py-3 pr-4">{item.id}</td>
                        <td className="py-3 pr-4">{item.title}</td>
                        <td className="py-3 pr-4">{item.materialType ?? "Unknown"}</td>
                        <td className="py-3 pr-4">{item.quantity}</td>
                        <td className="py-3 pr-4">{item.lengthIn ? `${item.lengthIn}"` : "Unknown"}</td>
                        <td className="py-3 pr-4">{item.depthIn ? `${item.depthIn}"` : "Unknown"}</td>
                        <td className="py-3 pr-4">{item.normalizationStatus}</td>
                        <td className="py-3 pr-4">{item.pricingStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
