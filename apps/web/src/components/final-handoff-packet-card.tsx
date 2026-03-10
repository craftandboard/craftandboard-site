"use client";

import type { ListingPrepPackageRecord } from "../lib/api";

export function FinalHandoffPacketCard({
  listingPrepPackage
}: {
  listingPrepPackage: ListingPrepPackageRecord | null;
}) {
  const packet = listingPrepPackage?.finalHandoffPacketSnapshot;
  if (!listingPrepPackage) return null;
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Final Handoff Packet</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Use this packet now</h3>
      <p className="mt-1 text-sm text-slate-300">
        {String(packet?.handoffPacketSummary ?? "The final internal handoff packet is ready.")}
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-xs text-slate-200">
        {JSON.stringify(packet, null, 2)}
      </pre>
    </section>
  );
}
