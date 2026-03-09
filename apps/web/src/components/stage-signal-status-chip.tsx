export function StageSignalStatusChip(props: {
  status: "OPEN" | "APPLIED" | "REJECTED" | "SUPERSEDED";
}) {
  const styles = {
    OPEN: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    APPLIED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    REJECTED: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    SUPERSEDED: "border-slate-400/20 bg-slate-400/10 text-slate-200"
  } as const;

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[props.status]}`}>{props.status}</span>;
}
