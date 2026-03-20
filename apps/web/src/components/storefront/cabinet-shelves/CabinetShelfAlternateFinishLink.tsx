import Link from "next/link";
import type { CabinetShelfFinishComparison } from "../../../content/cabinetShelves";

export function CabinetShelfAlternateFinishLink(input: {
  currentFinishTitle: string;
  alternateFinish: CabinetShelfFinishComparison | null | undefined;
}) {
  const { currentFinishTitle, alternateFinish } = input;

  if (!alternateFinish) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Also considering another finish?</p>
      <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
        Compare {currentFinishTitle} with {alternateFinish.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{alternateFinish.chooseThisIf}</p>
      <Link
        href={alternateFinish.href}
        className="mt-5 inline-flex rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33] transition hover:bg-white"
      >
        Switch to {alternateFinish.shortSummary.includes("Warmer") ? "Maple" : "White"} Finish
      </Link>
    </div>
  );
}
