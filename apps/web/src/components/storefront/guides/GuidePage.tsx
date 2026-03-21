import Link from "next/link";
import type { GuideContentEntry } from "../../../content/guides";
import type { ResolvedRelatedContent } from "../../../lib/seo/relatedContent";
import { CTA } from "../CTA";
import { Container } from "../Container";
import { RelatedLinksSection } from "../seo/RelatedLinksSection";
import { Section } from "../Section";
import { SectionIntro } from "../SectionIntro";
import { StructuredDataScript } from "../StructuredDataScript";

export function GuidePage(input: {
  guide: GuideContentEntry;
  articleSchema: Record<string, unknown>;
  breadcrumbSchema: Record<string, unknown>;
  faqSchema?: Record<string, unknown>;
  relatedGuides: GuideContentEntry[];
  relatedContent: ResolvedRelatedContent;
}) {
  return (
    <>
      <StructuredDataScript data={input.articleSchema} />
      <StructuredDataScript data={input.breadcrumbSchema} />
      {input.faqSchema ? <StructuredDataScript data={input.faqSchema} /> : null}
      <Section>
        <Container className="space-y-10">
          <SectionIntro
            eyebrow="Guides"
            title={input.guide.heroHeading}
            body={input.guide.intro}
          />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Guide Summary</p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                {input.guide.summary}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{input.guide.description}</p>
            </article>
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Related Product Paths</p>
              <div className="mt-5 space-y-4">
                {input.guide.relatedProducts.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-[1.5rem] border border-[#cfbaa7] bg-[#fffaf4] p-4 transition hover:bg-white"
                  >
                    <p className="font-medium text-[#2d2018]">{link.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#5c4a3d]">{link.description}</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-5xl space-y-10">
          {input.guide.sections.map((section) => (
            <article key={section.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <h2 className="font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                {section.title}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-[#5c4a3d]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </Container>
      </Section>
      <RelatedLinksSection
        eyebrow="Category and Product Paths"
        title="Move from authority content into the live commerce surface."
        body="These structured links route the guide into the category and flagship product pages instead of leaving the research disconnected from the configurator."
        links={[...input.relatedContent.categoryLinks, ...input.relatedContent.productLinks]}
      />
      <RelatedLinksSection
        eyebrow="Variant Paths"
        title="Explore size, material, and use-case landing pages tied to this topic."
        body="Variant pages help search visitors narrow the exact shelf or mantel direction before entering the live configurator."
        links={input.relatedContent.variants}
        tone="tinted"
      />
      {input.guide.faqItems.length > 0 ? (
        <Section>
          <Container className="max-w-5xl">
            <SectionIntro
              eyebrow="FAQ"
              title="Questions that usually come up around this topic."
              body="The answers below keep the guide practical and reinforce the exact questions that often lead customers into the product and configurator flow."
            />
            <div className="mt-10 space-y-4">
              {input.guide.faqItems.map((item) => (
                <article key={item.question} className="rounded-[1.75rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                  <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[#5c4a3d]">{item.answer}</p>
                </article>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
      {input.relatedGuides.length > 0 ? (
        <Section tone="tinted">
          <Container>
            <SectionIntro
              eyebrow="Related Guides"
              title="Keep exploring the shelf and mantel planning system."
              body="Authority content works best when it is interconnected. These guides carry readers deeper into planning decisions before they move into the live configurator."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {input.relatedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-5 transition hover:bg-white"
                >
                  <p className="font-medium text-[#2d2018]">{guide.heroHeading}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c4a3d]">{guide.summary}</p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
      <Section>
        <Container>
          <CTA
            eyebrow="Ready to Act"
            title={input.relatedContent.ctas[0]?.title ?? input.guide.primaryCta.label}
            body={input.relatedContent.ctas[0]?.description ?? input.guide.primaryCta.body}
            primary={{
              href: input.relatedContent.ctas[0]?.href ?? input.guide.primaryCta.href,
              label: input.relatedContent.ctas[0]?.title ?? input.guide.primaryCta.label
            }}
            secondary={{ href: "/guides", label: "Browse More Guides" }}
          />
        </Container>
      </Section>
    </>
  );
}
