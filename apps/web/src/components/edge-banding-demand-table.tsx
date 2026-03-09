import type { EdgeBandEstimateSummary } from "../lib/api";

export function EdgeBandingDemandTable(props: {
  summary: EdgeBandEstimateSummary;
}) {
  return (
    <div className="space-y-4">
      {props.summary.unmappedParts.length > 0 || props.summary.invalidParts.length > 0 ? (
        <article className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          {props.summary.unmappedParts.length > 0 ? (
            <p>Unmapped parts: {props.summary.unmappedParts.map((part) => part.labelCode).join(", ")}</p>
          ) : null}
          {props.summary.invalidParts.length > 0 ? (
            <p className={props.summary.unmappedParts.length > 0 ? "mt-2" : ""}>
              Invalid source data: {props.summary.invalidParts.map((part) => part.labelCode).join(", ")}
            </p>
          ) : null}
        </article>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Edge Band</th>
              <th className="px-4 py-3 font-medium">Parts</th>
              <th className="px-4 py-3 font-medium">Raw</th>
              <th className="px-4 py-3 font-medium">Adjusted</th>
              <th className="px-4 py-3 font-medium">Setup</th>
              <th className="px-4 py-3 font-medium">Estimated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            {props.summary.materials.map((bucket) => (
              <tr key={bucket.edgeBandMaterialKey}>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{bucket.edgeBandMaterialLabel}</div>
                  <div className="text-xs text-slate-400">{bucket.edgeBandColorLabel}</div>
                </td>
                <td className="px-4 py-3">
                  {bucket.partCount} parts · {bucket.jobCount} jobs
                </td>
                <td className="px-4 py-3">{bucket.rawLinearFt.toFixed(2)} ft</td>
                <td className="px-4 py-3">{bucket.adjustedLinearFt.toFixed(2)} ft</td>
                <td className="px-4 py-3">{bucket.setupAllowanceFt.toFixed(2)} ft</td>
                <td className="px-4 py-3 font-medium text-emerald-200">{bucket.estimatedDemandFt.toFixed(2)} ft</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
