import Link from "next/link";
import type { Metadata } from "next";
import { MarketingHome } from "../components/marketing-home";
import {
  getActiveContainerSessions,
  getCanonicalManufacturingBatches,
  getCanonicalManufacturingPackets,
  getCanonicalManufacturingParts,
  getCanonicalSalesOrders,
  getCanonicalShelfJobs,
  getMachineEvents,
  getMachineStageCandidates,
  getManagedContainers,
  getRemnants,
  getScanEvents
} from "../lib/api";
import { getRequestSiteContext } from "../lib/request-site";
import { appUrl } from "../lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();

  if (site.isMarketingHost) {
    return {
      title: "FieldMetriq",
      description: "FieldMetriq is the operating system for field and shop workflows.",
      alternates: {
        canonical: "/"
      }
    };
  }

  return {
    title: "Craft & Board Admin",
    description: "Craft & Board admin for operations, production review, and marketing workflows.",
    alternates: {
      canonical: "/"
    }
  };
}

export default async function DashboardPage() {
  const site = await getRequestSiteContext();

  if (site.isMarketingHost) {
    return <MarketingHome appHomeHref={appUrl("/")} signInHref={appUrl("/login")} />;
  }

  const [
    ordersPayload,
    jobsPayload,
    packetsPayload,
    partsPayload,
    batchesPayload,
    machineEventsPayload,
    machineCandidatesPayload,
    scanEventsPayload,
    containersPayload,
    sessionsPayload,
    remnantsPayload
  ] = await Promise.all([
    getCanonicalSalesOrders(),
    getCanonicalShelfJobs(),
    getCanonicalManufacturingPackets(),
    getCanonicalManufacturingParts(),
    getCanonicalManufacturingBatches(),
    getMachineEvents(),
    getMachineStageCandidates(),
    getScanEvents(),
    getManagedContainers(),
    getActiveContainerSessions(),
    getRemnants()
  ]);

  const orders = ordersPayload?.orders ?? [];
  const shelfJobs = jobsPayload?.shelfJobs ?? [];
  const packets = packetsPayload?.packets ?? [];
  const parts = partsPayload?.parts ?? [];
  const batches = batchesPayload?.batches ?? [];
  const machineEvents = machineEventsPayload?.events ?? [];
  const machineCandidates = machineCandidatesPayload?.candidates ?? [];
  const scanEvents = scanEventsPayload?.events ?? [];
  const containers = containersPayload?.containers ?? [];
  const sessions = sessionsPayload?.sessions ?? [];
  const remnants = remnantsPayload?.remnants ?? [];

  const cards = [
    { title: "Sales Orders", value: orders.length, detail: "Canonical intake records" },
    { title: "Shelf Jobs", value: shelfJobs.length, detail: "Canonical manufacturing intent" },
    { title: "Manufacturing Parts", value: parts.length, detail: "Unit-level production records" },
    { title: "Tracked Containers", value: containers.length, detail: "Physical sorting units" }
  ];

  const attentionOrders = orders.filter((order) => order.status === "HOLD" || order.status === "ERROR").slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Craft &amp; Board Operations</p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight text-white">
            One private workspace for orders, production, and shelf launch activity.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)]">
            This dashboard favors the core operating records first:
            `SalesOrder`, `ShelfJob`, `ManufacturingPacket`,
            `ManufacturingBatch`, and `ManufacturingPart`. Transitional tools
            remain available, but the live Craft &amp; Board workflow can start from here.
          </p>
        </div>
        <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[#eef1e4] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#6b7550]">Today</p>
          <p className="mt-4 text-3xl font-semibold text-white">{packets.length} packets</p>
          <p className="mt-3 text-sm text-[#6f5f51]">
            {batches.length} manufacturing batches, {machineCandidates.length} machine candidates,
            {sessions.length} active container sessions, and {remnants.length} tracked remnants.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-6"
          >
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.title}</h3>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Orders Needing Attention</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Hold and error queue</h3>
            </div>
            <Link href="/orders" className="text-sm text-emerald-300">
              Open orders
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {attentionOrders.length === 0 ? (
              <p className="text-sm text-slate-300">No canonical orders are currently held or errored.</p>
            ) : (
              attentionOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                  <p className="font-medium text-white">{order.sourceOrderId ?? order.id}</p>
                  <p className="mt-1 text-slate-300">
                    {order.customerName ?? "Unknown customer"} · {order.status} · {order.items.length} items
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Telemetry & Signals</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Machine evidence review</h3>
            </div>
            <Link href="/machines" className="text-sm text-emerald-300">
              Open machines
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
              {machineEvents.length} recent events · {machineCandidates.length} stage candidates
            </div>
            {machineCandidates.slice(0, 4).map((candidate) => (
              <div key={candidate.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                <p className="font-medium text-white">{candidate.suggestedAction}</p>
                <p className="mt-1 text-slate-300">
                  {candidate.machineName ?? candidate.machineCode ?? "Unknown machine"} · {candidate.status}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Manufacturing Flow</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Packets, batches, and scans</h3>
            </div>
            <Link href="/manufacturing" className="text-sm text-emerald-300">
              Open manufacturing
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Packets</p>
              <p className="mt-2 text-2xl font-semibold text-white">{packets.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Batches</p>
              <p className="mt-2 text-2xl font-semibold text-white">{batches.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scan Events</p>
              <p className="mt-2 text-2xl font-semibold text-white">{scanEvents.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inventory & Sorting</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Containers and remnants</h3>
            </div>
            <Link href="/inventory" className="text-sm text-emerald-300">
              Open inventory
            </Link>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 px-4 py-3">
              {containers.length} containers · {sessions.length} active sessions · {remnants.length} remnants
            </div>
            {sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="font-medium text-white">
                  {session.container?.displayName ?? session.container?.containerCode ?? session.containerId}
                </p>
                <p className="mt-1 text-slate-300">
                  {session.stationType ?? "Unassigned station"} · started {new Date(session.startedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
