"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { transitionPartStatusByScanCode, type PartStatusTransitionResponse } from "../lib/api";

export function ScanLabelForm(props: { initialScanCode?: string }) {
  const router = useRouter();
  const [scanCode, setScanCode] = useState(props.initialScanCode ?? "");
  const [nextStatus, setNextStatus] = useState<"CUT" | "EDGEBANDED" | "PACKED">("CUT");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PartStatusTransitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const payload = await transitionPartStatusByScanCode(scanCode, nextStatus);
      setResult(payload);
      setScanCode("");
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Label scan update failed.";
      setError(message);
      setResult({
        ok: false,
        error: message
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={scanCode}
          onChange={(event) => setScanCode(event.target.value)}
          placeholder="PART-cmmhgzugo0013lwwphjaziae6"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none"
        />
        <select
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as "CUT" | "EDGEBANDED" | "PACKED")}
          className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="CUT">CUT</option>
          <option value="EDGEBANDED">EDGEBANDED</option>
          <option value="PACKED">PACKED</option>
        </select>
        <button
          type="submit"
          disabled={pending || !scanCode.trim()}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-emerald-300/40 disabled:opacity-60"
        >
          {pending ? "Updating..." : "Update By Scan Code"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}
