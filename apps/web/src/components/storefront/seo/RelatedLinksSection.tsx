import Link from "next/link";
import type { ResolvedRelatedLink } from "../../../lib/seo/relatedContent";
import { Container } from "../Container";
import { Section } from "../Section";
import { SectionIntro } from "../SectionIntro";

export function RelatedLinksSection(input: {
  eyebrow: string;
  title: string;
  body?: string;
  links: ResolvedRelatedLink[];
  tone?: "default" | "tinted";
}) {
  if (input.links.length === 0) {
    return null;
  }

  return (
    <Section tone={input.tone}>
      <Container>
        <SectionIntro eyebrow={input.eyebrow} title={input.title} body={input.body} />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {input.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-5 transition hover:bg-white"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#8d6b4f]">{link.linkType}</p>
              <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
                {link.title}
              </h3>
              {link.description ? (
                <p className="mt-2 text-sm leading-6 text-[#5c4a3d]">{link.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
