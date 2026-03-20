import type { CabinetShelfProduct } from "../../../content/cabinetShelves";
import { cabinetShelfSupportContent } from "../../../content/cabinetShelves";

export function CabinetShelfTrustBlock({ product }: { product: CabinetShelfProduct }) {
  return (
    <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Why Craft &amp; Board</p>
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
        Built for real cabinet replacements.
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{product.trustCopy}</p>
      <div className="mt-5 space-y-3">
        {cabinetShelfSupportContent.trustPoints.map((item) => (
          <div key={item} className="rounded-[1.25rem] bg-[#f8eee2] p-4 text-sm leading-6 text-[#4f3f33]">
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}
