import { GeneratePackingSlipButton } from "../../../components/generate-packing-slip-button";
import Link from "next/link";
import { ShipOrderButton } from "../../../components/ship-order-button";
import { getCompletedOrders } from "../../../lib/api";

export default async function ShippingStationPage() {
  const payload = await getCompletedOrders();
  const orders = payload?.orders ?? [];

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Shipping Station</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Completed work queue</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Orders appear here automatically once all associated manufacturing jobs are complete and the order is ready for shipment or pickup.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
          No completed orders are waiting for shipment.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order.orderId}
              className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300 md:grid-cols-[1.2fr_0.7fr_0.6fr_0.6fr_1fr_1fr]"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Order</p>
                <p className="mt-1 font-medium text-white">{order.orderId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Source</p>
                <p className="mt-1 text-white">{order.source}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Jobs</p>
                <p className="mt-1 text-white">{order.jobCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Parts</p>
                <p className="mt-1 text-white">{order.partCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Completed</p>
                <p className="mt-1 text-white">{new Date(order.completedAt).toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                <GeneratePackingSlipButton orderId={order.orderId} />
                <Link
                  href={`/orders/${order.orderId}`}
                  className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40"
                >
                  View Order
                </Link>
                <ShipOrderButton orderId={order.orderId} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
