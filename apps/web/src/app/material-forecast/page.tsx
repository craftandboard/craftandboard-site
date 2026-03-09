import { EdgeBandingDemandTable } from "../../components/edge-banding-demand-table";
import { EdgeBandingSummaryCards } from "../../components/edge-banding-summary-cards";
import { MaterialForecastSummaryCards } from "../../components/material-forecast-summary-cards";
import { MaterialGroupPanel } from "../../components/material-group-panel";
import { getForecastEdgeBandEstimate, getMaterialForecast } from "../../lib/api";

export default async function MaterialForecastPage() {
  const [payload, edgeBandEstimate] = await Promise.all([getMaterialForecast(), getForecastEdgeBandEstimate()]);

  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Material forecast is unavailable right now. Confirm the API is running and you are signed in.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Material Forecast</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Plan the next cut before it becomes a batch</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Review pending demand by material, trace it back to source orders and jobs, compare rough sheet demand,
          and create the next production batch from explicit forecast selection.
        </p>
      </section>

      <MaterialForecastSummaryCards summary={payload.summary} />

      {edgeBandEstimate ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <EdgeBandingSummaryCards summary={edgeBandEstimate} title="Edge Band Estimate" />
          <div className="mt-6">
            <EdgeBandingDemandTable summary={edgeBandEstimate} />
          </div>
        </section>
      ) : null}

      {payload.materials.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          No unbatched forecast demand is waiting right now. New configurator or Amazon orders will appear here
          until they are turned into a batch.
        </section>
      ) : (
        <section className="space-y-6">
          {payload.materials.map((group) => (
            <MaterialGroupPanel key={group.materialKey} group={group} />
          ))}
        </section>
      )}
    </div>
  );
}
