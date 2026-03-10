"use client";

import { humanizeToken, toneForStatus } from "../lib/mvp";

export function StatusBadge({
  value,
  label
}: {
  value: string | null | undefined;
  label?: string | null;
}) {
  const tone = toneForStatus(value ?? label);
  const classes =
    tone === "success"
      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
      : tone === "danger"
        ? "border-rose-300/30 bg-rose-400/15 text-rose-100"
        : tone === "warning"
          ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
          : "border-white/10 bg-white/5 text-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classes}`}>
      {label ?? humanizeToken(value)}
    </span>
  );
}
