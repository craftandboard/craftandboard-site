"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeads, type LeadListItem } from "../lib/api";
import { formatDateTime } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function MvpLeadsList() {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const payload = await getLeads();
      setLeads(payload?.leads ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Leads</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Create and manage contractor leads, then open proposal work from the same flow.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
          >
            Refresh
          </button>
          <Link
            href="/leads/new"
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950"
          >
            New Lead
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No leads yet. Create the first lead to start the MVP contractor flow.
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{lead.name}</h3>
                    <StatusBadge value={lead.rawStatus} label={lead.stageLabel} />
                  </div>
                  <p className="text-sm text-slate-300">
                    {lead.email ?? "No email"} · {lead.phone ?? "No phone"} · {lead.address ?? "No address"}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>{lead.proposalCount} proposals</p>
                  <p className="mt-1">Updated {formatDateTime(lead.updatedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
