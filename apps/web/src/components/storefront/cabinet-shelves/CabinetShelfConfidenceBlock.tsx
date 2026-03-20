import { cabinetShelfSupportContent } from "../../../content/cabinetShelves";

export function CabinetShelfConfidenceBlock() {
  return (
    <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Quick Fit Check</p>
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
        {cabinetShelfSupportContent.confidenceTitle}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{cabinetShelfSupportContent.confidenceBody}</p>
      <div className="mt-5 rounded-[1.5rem] bg-[#f8eee2] p-4 text-sm leading-6 text-[#4f3f33]">
        {cabinetShelfSupportContent.confidenceExample}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6f5847]">
        If you are between tape-measure marks, stay within 1/8 inch increments only and measure twice before you submit.
      </p>
    </article>
  );
}
