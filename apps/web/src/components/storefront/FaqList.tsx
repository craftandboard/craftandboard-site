import type { FaqItem } from "../../content/faq";

export function FaqList({ items }: { items: FaqItem[] }) {
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{group}</p>
          </div>
          <div className="space-y-5">
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <article key={item.question} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                  <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{item.question}</h3>
                  <p className="mt-3 text-base leading-7 text-[#5c4a3d]">{item.answer}</p>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
