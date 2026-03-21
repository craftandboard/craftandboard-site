import type { CabinetShelfFaqItem } from "../../../content/cabinetShelves";

export function CabinetShelfFaq({ items }: { items: CabinetShelfFaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.question} className="rounded-[1.75rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{item.question}</h3>
          <p className="mt-3 text-base leading-7 text-[#5c4a3d]">{item.answer}</p>
        </article>
      ))}
    </div>
  );
}
