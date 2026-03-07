import Link from "next/link";
import { ImportFixturesButton } from "../../components/import-fixtures-button";
import { getOrders } from "../../lib/api";

export default async function OrdersPage() {
  const payload = await getOrders();
  const orders = payload?.orders ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Orders</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Amazon Seller Central intake</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            This page imports Seller Central style fixtures, maps legacy Amazon
            Length and Depth fields into internal Width and Depth, normalizes
            materials and edge-banding, and expands quantity into physical parts.
          </p>
          <div className="mt-6">
            <ImportFixturesButton />
          </div>
        </div>
        <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Current state</p>
          <p className="mt-4 text-4xl font-semibold text-white">{orders.length}</p>
          <p className="mt-2 text-sm text-emerald-50/80">Imported orders in the local database</p>
        </div>
      </section>

      <section className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
            No orders imported yet. Use the fixture import action above after starting
            Postgres, Prisma, and the API.
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
                    {order.amazonOrderId ?? order.externalOrderId}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {order.customerFullName ?? order.customerName}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Ship by:{" "}
                    {order.shipByDate
                      ? new Date(order.shipByDate).toLocaleDateString()
                      : "Unknown"}
                    {" · "}
                    Last name: {order.customerLastName ?? "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                    {order.quantityTotal ?? order.items.reduce((sum, item) => sum + item.quantity, 0)} physical parts planned
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
                      <th className="pb-3 pr-4">Amazon Item</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">Material</th>
                      <th className="pb-3 pr-4">Qty</th>
                      <th className="pb-3 pr-4">Width</th>
                      <th className="pb-3 pr-4">Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-t border-white/5">
                        <td className="py-3 pr-4">{item.amazonOrderItemId ?? item.id}</td>
                        <td className="py-3 pr-4">{item.productLabel}</td>
                        <td className="py-3 pr-4">{item.materialCode ?? "Unknown"}</td>
                        <td className="py-3 pr-4">{item.quantity}</td>
                        <td className="py-3 pr-4">{item.widthIn}&quot;</td>
                        <td className="py-3 pr-4">{item.depthIn}&quot;</td>
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
