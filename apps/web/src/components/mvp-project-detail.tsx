"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProject, getProposals, type ProjectDetail, type ProposalListItem } from "../lib/api";
import { formatDateTime } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function MvpProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [linkedProposal, setLinkedProposal] = useState<ProposalListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectPayload, proposalsPayload] = await Promise.all([getProject(projectId), getProposals()]);
        if (!projectPayload?.project) {
          setError("Project not found.");
          return;
        }
        setProject(projectPayload.project);
        setLinkedProposal(
          proposalsPayload?.proposals.find((proposal) => proposal.project?.id === projectPayload.project.id) ?? null
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load project.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Loading project...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error ?? "Project not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{project.name}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Basic project handoff view confirming conversion and the first work-module/task state.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
            Back to Projects
          </Link>
          <StatusBadge value={project.status} />
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project Key</p>
              <p className="mt-2 text-white">{project.key ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stage</p>
              <p className="mt-2 text-white">{project.stage ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</p>
              <p className="mt-2 text-white">{project.address ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
              <p className="mt-2 text-white">{formatDateTime(project.updatedAt)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope Summary</p>
              <p className="mt-2 text-white">{project.scopeSummary ?? "No scope summary yet."}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Linked Sales Record</p>
          {linkedProposal ? (
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{linkedProposal.title ?? "Untitled proposal"}</p>
                <StatusBadge value={linkedProposal.rawStatus} label={linkedProposal.statusLabel} />
              </div>
              {linkedProposal.lead ? <p>Lead: {linkedProposal.lead.name}</p> : null}
              <Link
                href={`/proposals/${linkedProposal.id}`}
                className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white"
              >
                Open Proposal
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">No linked proposal was found from the current sales records.</p>
          )}
        </article>
      </section>

      <section className="grid gap-4">
        {project.phases.length === 0 && project.backlogTasks.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No project tasks or phases yet. This still confirms conversion succeeded.
          </div>
        ) : null}

        {project.phases.map((phase) => (
          <article key={phase.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
                <p className="mt-1 text-sm text-slate-300">{phase.summary ?? "No summary."}</p>
              </div>
              <StatusBadge value={phase.status} />
            </div>
            <div className="mt-4 grid gap-3">
              {phase.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{task.title}</p>
                    <StatusBadge value={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
