"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects, getProposals, type ProjectListItem, type ProposalListItem } from "../lib/api";
import { formatDateTime } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function MvpProjectsList() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectsPayload, proposalsPayload] = await Promise.all([getProjects(), getProposals()]);
        setProjects(projectsPayload?.projects ?? []);
        setProposals(proposalsPayload?.proposals ?? []);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load projects.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Projects</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Confirm proposal conversion landed in a project record and inspect the basic handoff details.
        </p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No projects yet. Convert an accepted proposal to create the first project.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const linkedProposal = proposals.find((proposal) => proposal.project?.id === project.id) ?? null;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                      <StatusBadge value={project.status} />
                    </div>
                    <p className="text-sm text-slate-300">
                      {project.key ?? "No project key"} · {project.address ?? "No address"}
                    </p>
                    {linkedProposal ? (
                      <p className="text-sm text-slate-400">
                        Proposal: {linkedProposal.title ?? "Untitled proposal"}
                        {linkedProposal.lead ? ` · Lead: ${linkedProposal.lead.name}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{project.phaseCount} phases</p>
                    <p>{project.openTaskCount} open tasks</p>
                    <p className="mt-1">Updated {formatDateTime(project.updatedAt)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
