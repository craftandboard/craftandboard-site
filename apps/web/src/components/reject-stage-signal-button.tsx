"use client";

import { useState } from "react";
import { rejectStageSignal } from "../lib/api";

export function RejectStageSignalButton(props: { candidateId: string; disabled?: boolean }) {
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
            await rejectStageSignal(props.candidateId, "Rejected during manual stage signal review.");
            setMessage("Rejected. Refresh to see updated state.");
          } catch (caught) {
            setMessage(caught instanceof Error ? caught.message : "Reject failed.");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-rose-300/25 px-3 py-1 text-xs text-rose-100 transition hover:border-rose-300/60 hover:text-white disabled:opacity-50"
      >
        {pending ? "Rejecting..." : "Reject"}
      </button>
      {message ? <p className="text-[11px] text-slate-300">{message}</p> : null}
    </div>
  );
}
