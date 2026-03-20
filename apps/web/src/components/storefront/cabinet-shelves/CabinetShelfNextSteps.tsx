import { cabinetShelfSupportContent } from "../../../content/cabinetShelves";

export function CabinetShelfNextSteps() {
  return (
    <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">What Happens Next</p>
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
        {cabinetShelfSupportContent.nextStepsTitle}
      </h2>
      <div className="mt-5 space-y-3">
        {cabinetShelfSupportContent.nextSteps.map((item, index) => (
          <div key={item} className="rounded-[1.25rem] bg-[#f8eee2] p-4 text-sm leading-6 text-[#4f3f33]">
            <span className="mr-2 text-[#8d6b4f]">{index + 1}.</span>
            {item}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6f5847]">{cabinetShelfSupportContent.shippingBody}</p>
    </article>
  );
}
