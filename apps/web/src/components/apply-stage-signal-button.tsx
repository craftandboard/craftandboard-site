"use client";

import { useState } from "react";
import { applyStageSignal } from "../lib/api";

export function ApplyStageSignalButton(props: { candidateId: string; disabled?: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || props.disabled}
        onClick={async () => {
          setPending(true);
          setMessage(null);
          try {
            await applyStageSignal(props.candidateId);
            setMessage("Applied. Refresh to see updated state.");
          } catch (caught) {
            setMessage(caught instanceof Error ? caught.message : "Apply failed.");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-emerald-300/25 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/60 hover:text-white disabled:opacity-50"
      >
        {pending ? "Applying..." : "Apply"}
      </button>
      {message ? <p className="text-[11px] text-slate-300">{message}</p> : null}
    </div>
  );
}
