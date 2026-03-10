"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createLead,
  createProposal,
  getLead,
  updateLead,
  type LeadDetail
} from "../lib/api";
import { humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

const leadStatusOptions = [
  "lead_new",
  "jobwalk_scheduled",
  "jobwalk_complete",
  "estimate_sent",
  "proposal_sent",
  "won",
  "lost",
  "archived"
] as const;

const depositPolicyOptions = [
  "NO_DEPOSIT_REQUIRED",
  "DEPOSIT_REQUIRED_BEFORE_CONVERSION"
] as const;

export function MvpLeadEditor({ leadId }: { leadId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(Boolean(leadId));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "lead_new",
    stage: "",
    notes: ""
  });

  useEffect(() => {
    if (!leadId) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getLead(leadId);
        if (!payload?.lead) {
          setError("Lead not found.");
          return;
        }
        setLead(payload.lead);
        setForm({
          name: payload.lead.name,
          email: payload.lead.email ?? "",
          phone: payload.lead.phone ?? "",
          address: payload.lead.address ?? "",
          status: payload.lead.rawStatus ?? "lead_new",
          stage: payload.lead.rawStage ?? "",
          notes: payload.lead.notes ?? ""
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load lead.");
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function refreshLead(nextLeadId: string) {
    const payload = await getLead(nextLeadId);
    if (payload?.lead) {
      setLead(payload.lead);
      setForm({
        name: payload.lead.name,
        email: payload.lead.email ?? "",
        phone: payload.lead.phone ?? "",
        address: payload.lead.address ?? "",
        status: payload.lead.rawStatus ?? "lead_new",
        stage: payload.lead.rawStage ?? "",
        notes: payload.lead.notes ?? ""
      });
    }
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = leadId
            ? await updateLead(leadId, {
                name: form.name,
                email: form.email || null,
                phone: form.phone || null,
                address: form.address || null,
                status: form.status,
                stage: form.stage || null,
                notes: form.notes || null
              })
            : await createLead({
                name: form.name,
                email: form.email || null,
                phone: form.phone || null,
                address: form.address || null,
                status: form.status,
                stage: form.stage || null,
                notes: form.notes || null
              });

          const nextLeadId = payload.lead.id;
          await refreshLead(nextLeadId);
          setSuccess(leadId ? "Lead updated." : "Lead created.");
          if (!leadId) {
            router.replace(`/leads/${nextLeadId}`);
          }
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to save lead.");
        }
      })();
    });
  }

  function handleCreateProposal() {
    if (!lead?.id) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(() => {
      void (async () => {
        try {
          const payload = await createProposal({
            leadId: lead.id,
            title: `${lead.name} Proposal`,
            status: "draft",
            depositPolicy: depositPolicyOptions[0]
          });
          router.push(`/proposals/${payload.proposal.id}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Failed to create proposal.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading lead...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {leadId ? "Lead Detail" : "New Lead"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Capture the lead, update sales stage, and open the proposal workflow from here.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/leads" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
            Back to Leads
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !form.name.trim()}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            {isPending ? "Saving..." : leadId ? "Save Lead" : "Create Lead"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Lead Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Email</span>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Address</span>
              <input
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {leadStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {humanizeToken(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Stage Label</span>
              <input
                value={form.stage}
                onChange={(event) => updateField("stage", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                placeholder="Optional custom stage label"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
              <span>Summary</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
          </div>
        </article>

        <article className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Linked Proposals</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Proposal handoff</h3>
            </div>
            {lead ? <StatusBadge value={lead.rawStatus} label={lead.stageLabel} /> : null}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Use this lead as the starting point for the estimate and acceptance flow.
          </p>
          <button
            type="button"
            onClick={handleCreateProposal}
            disabled={!lead?.id || isPending}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
          >
            Create Proposal
          </button>

          {!lead?.proposals?.length ? (
            <div className="rounded-2xl border border-white/10 px-4 py-4 text-sm text-slate-300">
              No proposals linked to this lead yet.
            </div>
          ) : (
            <div className="space-y-3">
              {lead.proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="block rounded-2xl border border-white/10 px-4 py-4 transition hover:border-emerald-300/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{proposal.title ?? "Untitled proposal"}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Version {proposal.version} · Updated {new Date(proposal.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge value={proposal.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
