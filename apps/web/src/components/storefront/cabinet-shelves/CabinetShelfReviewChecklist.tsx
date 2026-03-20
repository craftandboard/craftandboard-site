import { cabinetShelfSupportContent } from "../../../content/cabinetShelves";

export function CabinetShelfReviewChecklist() {
  return (
    <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Review Checklist</p>
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
        Quick review before you submit.
      </h2>
      <div className="mt-5 space-y-3">
        {cabinetShelfSupportContent.reviewChecklist.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-[1.25rem] bg-[#f8eee2] p-4 text-sm leading-6 text-[#4f3f33]">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2b1d16] text-xs text-[#f7efe5]">
              ✓
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
