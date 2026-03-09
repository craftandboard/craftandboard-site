"use client";

import { startTransition, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createTrustedAutoApplyRule,
  disableTrustedAutoApplyRule,
  updateTrustedAutoApplyRule,
  type MachineSummary,
  type TrustedAutoApplyRuleRecord
} from "../lib/api";

type CandidateAction =
  | "MARK_PART_CUT"
  | "MARK_PART_EDGEBANDED"
  | "MARK_BATCH_CUT_IN_PROGRESS"
  | "MARK_BATCH_CUT_COMPLETE";

type MachineType = "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";

export function TrustedAutoApplyRulesPanel(props: {
  initialRules: TrustedAutoApplyRuleRecord[];
  machines: MachineSummary[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [rules, setRules] = useState(props.initialRules);
  const [scopeMode, setScopeMode] = useState<"machine" | "machineType">("machine");
  const [machineId, setMachineId] = useState(props.machines[0]?.id ?? "");
  const [machineType, setMachineType] = useState<MachineType>("CNC");
  const [candidateAction, setCandidateAction] = useState<CandidateAction>("MARK_PART_CUT");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.canManage) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const payload = await createTrustedAutoApplyRule({
        candidateAction,
        machineId: scopeMode === "machine" ? machineId : undefined,
        machineType: scopeMode === "machineType" ? machineType : undefined,
        notes
      });

      setRules((current) => [...current, payload.rule].sort((left, right) => left.candidateAction.localeCompare(right.candidateAction)));
      setNotes("");
      setResult(payload);
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Rule creation failed.";
      setError(message);
      setResult({ ok: false, error: message });
    } finally {
      setPending(false);
    }
  }

  async function handleToggle(ruleId: string, enabled: boolean) {
    setPending(true);
    setError(null);
    try {
      const payload = await updateTrustedAutoApplyRule({ ruleId, enabled });
      setRules((current) => current.map((rule) => (rule.id === ruleId ? payload.rule : rule)));
      setResult(payload);
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Rule update failed.";
      setError(message);
      setResult({ ok: false, error: message });
    } finally {
      setPending(false);
    }
  }

  async function handleDisable(ruleId: string) {
    setPending(true);
    setError(null);
    try {
      const payload = await disableTrustedAutoApplyRule(ruleId);
      setRules((current) => current.map((rule) => (rule.id === ruleId ? payload.rule : rule)));
      setResult(payload);
      startTransition(() => router.refresh());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Rule disable failed.";
      setError(message);
      setResult({ ok: false, error: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {props.canManage ? (
        <form onSubmit={handleCreate} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setScopeMode("machine")}
              className={`rounded-full border px-4 py-2 text-sm ${scopeMode === "machine" ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100" : "border-white/10 text-slate-300"}`}
            >
              Scope To Machine
            </button>
            <button
              type="button"
              onClick={() => setScopeMode("machineType")}
              className={`rounded-full border px-4 py-2 text-sm ${scopeMode === "machineType" ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100" : "border-white/10 text-slate-300"}`}
            >
              Scope To Machine Type
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {scopeMode === "machine" ? (
              <select value={machineId} onChange={(event) => setMachineId(event.target.value)} className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white">
                {props.machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.code} · {machine.name}
                  </option>
                ))}
              </select>
            ) : (
              <select value={machineType} onChange={(event) => setMachineType(event.target.value as MachineType)} className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white">
                {["CNC", "EDGEBANDER", "LABEL_PRINTER", "SCANNER_STATION", "OTHER"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            )}
            <select value={candidateAction} onChange={(event) => setCandidateAction(event.target.value as CandidateAction)} className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white">
              {["MARK_PART_CUT", "MARK_PART_EDGEBANDED", "MARK_BATCH_CUT_IN_PROGRESS", "MARK_BATCH_CUT_COMPLETE"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500" />
            <button type="submit" disabled={pending} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:border-emerald-200/50 disabled:opacity-60">
              {pending ? "Saving..." : "Add Rule"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          Only admins and owners can manage trusted auto-apply rules.
        </div>
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
        <div className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_1fr] gap-3 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Scope</span>
          <span>Action</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Actions</span>
        </div>
        {rules.map((rule) => (
          <div key={rule.id} className="grid grid-cols-[1.2fr_1.2fr_1fr_0.8fr_1fr] gap-3 border-b border-white/5 px-5 py-4 text-sm text-slate-200 last:border-b-0">
            <div>
              <p className="text-white">{rule.machine ? `${rule.machine.code} (${rule.machine.type})` : `${rule.machineType ?? "Unknown"} type`}</p>
              <p className="text-xs text-slate-400">{rule.notes ?? "No notes"}</p>
            </div>
            <span className="text-emerald-300">{rule.candidateAction}</span>
            <span>{rule.enabled ? "Enabled" : "Disabled"}</span>
            <span>{new Date(rule.updatedAt).toLocaleDateString()}</span>
            <div className="flex flex-wrap gap-2">
              {props.canManage ? (
                <>
                  <button type="button" disabled={pending} onClick={() => handleToggle(rule.id, !rule.enabled)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200">
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button type="button" disabled={pending || !rule.enabled} onClick={() => handleDisable(rule.id)} className="rounded-full border border-red-300/20 px-3 py-2 text-xs text-red-100 disabled:opacity-60">
                    Force Disable
                  </button>
                </>
              ) : (
                <span className="text-slate-500">Read only</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {result ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
