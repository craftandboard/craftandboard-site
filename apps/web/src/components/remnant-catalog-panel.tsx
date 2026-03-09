"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  consumeRemnant,
  createRemnant,
  generateRemnantLabel,
  updateRemnant,
  type RemnantListResponse
} from "../lib/api";

type RemnantRow = RemnantListResponse["remnants"][number];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function RemnantCatalogPanel(props: {
  remnants: RemnantRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    materialCode: "WHITE_MELAMINE",
    thicknessIn: "0.75",
    lengthIn: "",
    widthIn: "",
    locationLabel: "",
    notes: ""
  });

  function refresh(messageText?: string) {
    if (messageText) {
      setMessage(messageText);
    }
    startTransition(() => {
      router.refresh();
    });
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await createRemnant({
        materialCode: createForm.materialCode as "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18",
        thicknessIn: Number(createForm.thicknessIn),
        lengthIn: Number(createForm.lengthIn),
        widthIn: Number(createForm.widthIn),
        locationLabel: createForm.locationLabel || undefined,
        notes: createForm.notes || undefined
      });
      setCreateForm((current) => ({
        ...current,
        lengthIn: "",
        widthIn: "",
        locationLabel: "",
        notes: ""
      }));
      refresh(`Created remnant ${result.remnant.code}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create remnant.");
    }
  }

  async function onUpdate(remnantId: string, formData: FormData) {
    setMessage(null);
    try {
      await updateRemnant(remnantId, {
        status: String(formData.get("status")) as RemnantRow["status"],
        locationLabel: String(formData.get("locationLabel") || ""),
        notes: String(formData.get("notes") || "")
      });
      refresh("Remnant updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update remnant.");
    }
  }

  async function onConsume(remnantId: string, formData: FormData) {
    setMessage(null);
    try {
      await consumeRemnant(remnantId, {
        usedAreaSqIn: Number(formData.get("usedAreaSqIn")),
        notes: String(formData.get("consumeNotes") || "")
      });
      refresh("Remnant consumption recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to consume remnant.");
    }
  }

  async function onGenerateLabel(remnantId: string) {
    setMessage(null);
    try {
      const result = await generateRemnantLabel(remnantId);
      refresh(`Remnant label ready: ${result.artifact.uri}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate remnant label.");
    }
  }

  return (
    <section className="space-y-6">
      <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Create Remnant</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Capture usable leftover material</h3>
          </div>
          {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        </div>

        <form onSubmit={onCreate} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            value={createForm.materialCode}
            onChange={(event) => setCreateForm((current) => ({ ...current, materialCode: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          >
            {["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"].map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
          <input
            value={createForm.thicknessIn}
            onChange={(event) => setCreateForm((current) => ({ ...current, thicknessIn: event.target.value }))}
            placeholder="Thickness"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <input
            value={createForm.lengthIn}
            onChange={(event) => setCreateForm((current) => ({ ...current, lengthIn: event.target.value }))}
            placeholder="Length in"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <input
            value={createForm.widthIn}
            onChange={(event) => setCreateForm((current) => ({ ...current, widthIn: event.target.value }))}
            placeholder="Width in"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <input
            value={createForm.locationLabel}
            onChange={(event) => setCreateForm((current) => ({ ...current, locationLabel: event.target.value }))}
            placeholder="Location"
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Create Remnant"}
          </button>
          <textarea
            value={createForm.notes}
            onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notes"
            className="md:col-span-2 xl:col-span-6 min-h-24 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
          />
        </form>
      </article>

      <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Dimensions</th>
                <th className="px-4 py-3 font-medium">Usable Area</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {props.remnants.map((remnant) => (
                <tr key={remnant.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{remnant.code}</div>
                    <div className="text-xs text-slate-400">{formatDate(remnant.updatedAt)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div>{remnant.materialLabel}</div>
                    <div className="text-xs text-slate-400">{remnant.materialCode}</div>
                  </td>
                  <td className="px-4 py-4">
                    {remnant.lengthIn.toFixed(2)}&quot; × {remnant.widthIn.toFixed(2)}&quot; × {remnant.thicknessIn.toFixed(2)}&quot;
                  </td>
                  <td className="px-4 py-4">
                    {remnant.usableAreaSqIn.toFixed(1)} sq in
                    <div className="text-xs text-slate-400">{(remnant.usableAreaSqIn / 144).toFixed(2)} sq ft</div>
                  </td>
                  <td className="px-4 py-4 uppercase tracking-[0.18em] text-emerald-200">{remnant.status}</td>
                  <td className="px-4 py-4">{remnant.locationLabel ?? "Unassigned"}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-3">
                      <form
                        action={(formData) => onUpdate(remnant.id, formData)}
                        className="grid gap-2 xl:grid-cols-[1fr_1fr_auto]"
                      >
                        <select
                          name="status"
                          defaultValue={remnant.status}
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white"
                        >
                          {["AVAILABLE", "RESERVED", "PARTIAL", "CONSUMED", "HOLD", "SCRAPPED"].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <input
                          name="locationLabel"
                          defaultValue={remnant.locationLabel ?? ""}
                          placeholder="Location"
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
                        >
                          Save
                        </button>
                        <input type="hidden" name="notes" value={remnant.notes ?? ""} />
                      </form>

                      <form
                        action={(formData) => onConsume(remnant.id, formData)}
                        className="grid gap-2 xl:grid-cols-[1fr_1fr_auto]"
                      >
                        <input
                          name="usedAreaSqIn"
                          placeholder="Used area sq in"
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white"
                        />
                        <input
                          name="consumeNotes"
                          placeholder="Consume notes"
                          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="rounded-xl border border-amber-300/20 px-3 py-2 text-xs text-amber-100 transition hover:border-amber-200/40 hover:text-white"
                        >
                          Consume
                        </button>
                      </form>

                      <button
                        type="button"
                        onClick={() => onGenerateLabel(remnant.id)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
                      >
                        Generate Label
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
