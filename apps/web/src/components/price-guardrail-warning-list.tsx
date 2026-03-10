"use client";

import { getRiskLevelLabel, getRiskLevelTone } from "../lib/cost-engine";

export function PriceGuardrailWarningList({
  warnings,
  emptyMessage
}: {
  warnings: Array<Record<string, unknown>> | null | undefined;
  emptyMessage?: string;
}) {
  const items = Array.isArray(warnings) ? warnings : [];

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/20 px-4 py-4 text-sm text-slate-300">
        {emptyMessage ?? "No active launch guardrail warnings for this scenario."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((warning, index) => {
        const severity = String(warning.severity ?? "");
        return (
          <div key={`${warning.code ?? "warning"}-${index}`} className={`rounded-2xl border px-4 py-3 text-sm ${getRiskLevelTone(severity)}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">{String(warning.message ?? "Guardrail warning")}</p>
              <span className="text-xs uppercase tracking-[0.2em]">{getRiskLevelLabel(severity)}</span>
            </div>
            {warning.code ? (
              <p className="mt-2 text-xs text-slate-300/80">Code: {String(warning.code)}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
