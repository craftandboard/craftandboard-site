import { Container } from "./Container";
import { Section } from "./Section";
import { SectionIntro } from "./SectionIntro";

export function TrustSection({
  eyebrow,
  title,
  body,
  items,
  quote
}: {
  eyebrow: string;
  title: string;
  body: string;
  items: ReadonlyArray<{ title: string; body: string }>;
  quote?: { quote: string; attribution: string };
}) {
  return (
    <Section>
      <Container>
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div className="space-y-6">
            <SectionIntro eyebrow={eyebrow} title={title} body={body} />
            {quote ? (
              <blockquote className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8 text-[#4e3c2f]">
                <p className="font-[family-name:var(--font-cormorant)] text-3xl leading-tight text-[#281a13]">
                  “{quote.quote}”
                </p>
                <footer className="mt-4 text-sm uppercase tracking-[0.25em] text-[#8c6c53]">{quote.attribution}</footer>
              </blockquote>
            ) : null}
          </div>
          <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-1">
            {items.map((item) => (
              <article key={item.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8c6c53]">Craft & Board</p>
                <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
