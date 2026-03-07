import Link from "next/link";
import { notFound } from "next/navigation";
import { getNormalizedOrder, getOrder, getProductionBundles } from "../../../lib/api";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getOrder(id);
  const normalizedPayload = await getNormalizedOrder(id);

  if (!payload?.order) {
    notFound();
  }

  const order = payload.order;
  const bundles = (await getProductionBundles())?.bundles ?? [];
  const matchingBundle = bundles.find(
    (bundle) =>
      bundle.shipByDate ===
        (order.shipByDate ? new Date(order.shipByDate).toLocaleDateString("en-US") : "") &&
      order.items.some((item) => item.materialCode === bundle.materialCode)
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <Link href="/orders" className="text-sm text-emerald-300">
          Back to orders
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
          {order.amazonOrderId ?? order.id}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {order.customerFullName ?? order.customerName}
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          Ship to {order.shipToName ?? order.customerName} · Last name {order.customerLastName}
        </p>
        {matchingBundle ? (
          <Link
            href={`/production/${matchingBundle.bundleCode}`}
            className="mt-5 inline-flex rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
          >
            Open Matching Bundle
          </Link>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Raw Source Summary</h3>
        <pre className="mt-4 overflow-x-auto text-xs text-emerald-100">
          {JSON.stringify(order.rawPayload ?? {}, null, 2)}
        </pre>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Normalized Values</h3>
        <pre className="mt-4 overflow-x-auto text-xs text-slate-200">
          {JSON.stringify(normalizedPayload?.normalized ?? {}, null, 2)}
        </pre>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Items and Physical Parts</h3>
        <div className="mt-4 space-y-6">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
                {item.amazonOrderItemId ?? item.id}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {item.productLabel} · {item.materialCode}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {item.widthIn}&quot; x {item.depthIn}&quot; · Qty {item.quantity}
              </p>
              <pre className="mt-4 overflow-x-auto text-xs text-slate-300">
                {JSON.stringify(item.sourceCustomizationJson ?? {}, null, 2)}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-100">
                {(item.partInstances ?? []).map((part) => (
                  <span key={part.id} className="rounded-full border border-white/10 px-3 py-2">
                    {part.partCode}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
