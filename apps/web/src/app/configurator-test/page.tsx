'use client';

import { useState } from 'react';
import {
  createConfiguratorJob,
  normalizeConfigurator,
  quoteConfigurator,
  translateConfigurator,
  validateConfigurator,
  type ConfiguratorResponse,
  type ShelfConfiguratorInput
} from '../../lib/api';

const initialInput: ShelfConfiguratorInput = {
  widthIn: 19.25,
  depthIn: 12.5,
  materialCode: 'WHITE_MELAMINE',
  quantity: 2,
  channel: 'WEBSITE'
};

export default function ConfiguratorTestPage() {
  const [input, setInput] = useState<ShelfConfiguratorInput>(initialInput);
  const [result, setResult] = useState<ConfiguratorResponse | { hint: string }>({
    hint: 'Run validate, normalize, or quote.'
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(action: 'validate' | 'normalize' | 'quote' | 'translate' | 'create-job') {
    setPending(action);
    setError(null);
    try {
      if (action === 'validate') {
        setResult(await validateConfigurator(input));
      } else if (action === 'normalize') {
        setResult(await normalizeConfigurator(input));
      } else if (action === 'translate') {
        setResult(await translateConfigurator(input));
      } else if (action === 'create-job') {
        setResult(await createConfiguratorJob(input));
      } else {
        setResult(await quoteConfigurator(input));
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Request failed.';
      setError(message);
      setResult({
        ok: false,
        error: message
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Configurator Test</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Website/API contract harness</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This internal page exercises the shared configurator endpoints directly so the website can validate, normalize, and quote without frontend-only rules.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Width</span>
              <input type="number" step="0.125" value={input.widthIn} onChange={(event) => setInput({ ...input, widthIn: Number(event.target.value) })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
            <label className="text-sm text-slate-200">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Depth</span>
              <input type="number" step="0.125" value={input.depthIn} onChange={(event) => setInput({ ...input, depthIn: Number(event.target.value) })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
            <label className="text-sm text-slate-200">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Material</span>
              <select value={input.materialCode} onChange={(event) => setInput({ ...input, materialCode: event.target.value as ShelfConfiguratorInput['materialCode'] })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                <option value="WHITE_MELAMINE">White Melamine</option>
                <option value="MAPLE_MELAMINE">Maple Melamine</option>
              </select>
            </label>
            <label className="text-sm text-slate-200">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Quantity</span>
              <input type="number" min="1" step="1" value={input.quantity} onChange={(event) => setInput({ ...input, quantity: Number(event.target.value) })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" />
            </label>
            <label className="text-sm text-slate-200 md:col-span-2">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Channel</span>
              <select value={input.channel} onChange={(event) => setInput({ ...input, channel: event.target.value as ShelfConfiguratorInput['channel'] })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">
                <option value="WEBSITE">Website</option>
                <option value="AMAZON">Amazon</option>
                <option value="MANUAL">Manual</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => void run('validate')} disabled={pending !== null} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950 disabled:opacity-60">
              {pending === 'validate' ? 'Validating...' : 'Validate'}
            </button>
            <button type="button" onClick={() => void run('normalize')} disabled={pending !== null} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white disabled:opacity-60">
              {pending === 'normalize' ? 'Normalizing...' : 'Normalize'}
            </button>
            <button type="button" onClick={() => void run('quote')} disabled={pending !== null} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white disabled:opacity-60">
              {pending === 'quote' ? 'Quoting...' : 'Quote'}
            </button>
            <button type="button" onClick={() => void run('translate')} disabled={pending !== null} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white disabled:opacity-60">
              {pending === 'translate' ? 'Translating...' : 'Translate'}
            </button>
            <button type="button" onClick={() => void run('create-job')} disabled={pending !== null} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white disabled:opacity-60">
              {pending === 'create-job' ? 'Creating Job...' : 'Create Job'}
            </button>
          </div>
          {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">API Response</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
