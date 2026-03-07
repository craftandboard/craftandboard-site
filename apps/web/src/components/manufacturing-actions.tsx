'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useState } from 'react';
import {
  approveCnc,
  approveNest,
  buildNesting,
  completeCncJob,
  failCncJob,
  generateBundlePacket,
  generateCnc,
  postCncJob,
  releaseBundle
} from '../lib/api';

interface ManufacturingLifecycle {
  bundleCode: string;
  status: string;
  currentNestVersion?: number;
  currentCncVersion?: number;
  nextAllowedActions: string[];
}

interface ManufacturingJob {
  id?: string;
  version?: number;
  isCurrent?: boolean;
  code: string;
  status: string;
  failureReason?: string;
}

interface ManufacturingActionsProps {
  bundleCode: string;
  lifecycle: ManufacturingLifecycle;
  jobs?: ManufacturingJob[];
  compact?: boolean;
}

export function ManufacturingActions({ bundleCode, lifecycle, jobs = [], compact = false }: ManufacturingActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const currentJobs = useMemo(() => jobs.filter((job) => job.isCurrent !== false), [jobs]);

  async function runAction(key: string, action: () => Promise<{ result?: { message?: string } } | { message?: string }>) {
    setPendingKey(key);
    setMessage(null);
    setError(null);

    try {
      const payload = await action();
      const nextMessage =
        'result' in payload && payload.result?.message
          ? payload.result.message
          : 'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : 'Action completed.';
      setMessage(nextMessage);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      setPendingKey(null);
    }
  }

  const canGeneratePacket = Boolean(lifecycle.currentNestVersion);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {lifecycle.nextAllowedActions.includes('release') ? (
          <button
            type="button"
            onClick={() => runAction('release', () => releaseBundle(bundleCode))}
            disabled={pendingKey !== null}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
          >
            {pendingKey === 'release' ? 'Releasing...' : 'Release Bundle'}
          </button>
        ) : null}

        {lifecycle.nextAllowedActions.includes('build_nesting') ? (
          <button
            type="button"
            onClick={() =>
              runAction('nest', async () => {
                const payload = await buildNesting(bundleCode);
                return {
                  message: `Built ${payload.nesting?.sheetCount ?? 0} sheets with ${payload.nesting?.onionSkinPartCount ?? 0} onion-skin parts.`
                };
              })
            }
            disabled={pendingKey !== null}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
          >
            {pendingKey === 'nest' ? 'Building Nesting...' : 'Build Nesting'}
          </button>
        ) : null}

        {lifecycle.nextAllowedActions.includes('approve_nesting') ? (
          <button
            type="button"
            onClick={() => runAction('approve-nest', () => approveNest(bundleCode))}
            disabled={pendingKey !== null}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === 'approve-nest' ? 'Approving Nest...' : 'Approve Nest'}
          </button>
        ) : null}

        {lifecycle.nextAllowedActions.includes('generate_cnc') ? (
          <button
            type="button"
            onClick={() =>
              runAction('cnc', async () => {
                const payload = await generateCnc(bundleCode);
                return { message: `Generated ${payload.totalJobs ?? 0} CNC job files.` };
              })
            }
            disabled={pendingKey !== null}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === 'cnc' ? 'Generating CNC...' : 'Generate CNC'}
          </button>
        ) : null}

        {lifecycle.nextAllowedActions.includes('approve_cnc') ? (
          <button
            type="button"
            onClick={() => runAction('approve-cnc', () => approveCnc(bundleCode))}
            disabled={pendingKey !== null}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === 'approve-cnc' ? 'Approving CNC...' : 'Approve CNC'}
          </button>
        ) : null}

        {canGeneratePacket ? (
          <button
            type="button"
            onClick={() => runAction('packet', () => generateBundlePacket(bundleCode))}
            disabled={pendingKey !== null}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === 'packet' ? 'Generating Packet...' : 'Generate Packet'}
          </button>
        ) : null}
      </div>

      {!compact && currentJobs.length > 0 ? (
        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CNC Actions</p>
            <p className="mt-2 text-sm text-slate-300">Only current CNC jobs expose legal next actions.</p>
          </div>
          <div className="space-y-3">
            {currentJobs.map((job) => (
              <div key={job.id ?? job.code} className="rounded-2xl border border-white/10 px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{job.code}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Version {job.version ?? 1} · Status {job.status}
                      {job.failureReason ? ` · ${job.failureReason}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.id && job.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => runAction(`post-${job.id}`, () => postCncJob(job.id!))}
                        disabled={pendingKey !== null}
                        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
                      >
                        {pendingKey === `post-${job.id}` ? 'Posting...' : 'Mark Posted'}
                      </button>
                    ) : null}
                    {job.id && job.status === 'posted' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => runAction(`complete-${job.id}`, () => completeCncJob(job.id!))}
                          disabled={pendingKey !== null}
                          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
                        >
                          {pendingKey === `complete-${job.id}` ? 'Completing...' : 'Mark Complete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = window.prompt('Failure reason');
                            if (!reason) {
                              return;
                            }
                            void runAction(`fail-${job.id}`, () => failCncJob(job.id!, reason));
                          }}
                          disabled={pendingKey !== null}
                          className="rounded-full border border-red-400/40 px-4 py-2 text-xs text-red-100 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingKey === `fail-${job.id}` ? 'Failing...' : 'Mark Failed'}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-100/80">{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
