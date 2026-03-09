import { RemnantCatalogPanel } from "../../components/remnant-catalog-panel";
import { RemnantSummaryCards } from "../../components/remnant-summary-cards";
import { getRemnants } from "../../lib/api";

export default async function RemnantsPage(props: {
  searchParams?: Promise<{
    materialCode?: string;
    status?: string;
    location?: string;
    minimumLengthIn?: string;
    minimumWidthIn?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const payload = await getRemnants({
    materialCode: searchParams.materialCode as
      | "WHITE_MELAMINE"
      | "MAPLE_MELAMINE"
      | "BIRCH_18"
      | "WALNUT_18"
      | "MAPLE_18"
      | "MDF_18"
      | undefined,
    status: searchParams.status as
      | "AVAILABLE"
      | "RESERVED"
      | "PARTIAL"
      | "CONSUMED"
      | "HOLD"
      | "SCRAPPED"
      | undefined,
    location: searchParams.location,
    minimumLengthIn: searchParams.minimumLengthIn ? Number(searchParams.minimumLengthIn) : undefined,
    minimumWidthIn: searchParams.minimumWidthIn ? Number(searchParams.minimumWidthIn) : undefined
  });

  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
        Remnant inventory is unavailable right now. Confirm the API is running and you are signed in.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Remnant Catalog</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Track leftover sheet value before it disappears</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Capture usable leftovers after CNC, label them, track where they live, and surface real candidates in
          forecast planning before new full sheets are pulled.
        </p>
      </section>

      <RemnantSummaryCards summary={payload.summary} />

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            name="materialCode"
            defaultValue={searchParams.materialCode ?? ""}
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          >
            <option value="">All materials</option>
            {["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"].map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          >
            <option value="">All statuses</option>
            {["AVAILABLE", "RESERVED", "PARTIAL", "CONSUMED", "HOLD", "SCRAPPED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            name="location"
            defaultValue={searchParams.location ?? ""}
            placeholder="Location"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <input
            name="minimumLengthIn"
            defaultValue={searchParams.minimumLengthIn ?? ""}
            placeholder="Min length in"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <input
            name="minimumWidthIn"
            defaultValue={searchParams.minimumWidthIn ?? ""}
            placeholder="Min width in"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <button
            type="submit"
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
          >
            Apply Filters
          </button>
        </form>
      </section>

      <RemnantCatalogPanel remnants={payload.remnants} />
    </div>
  );
}
