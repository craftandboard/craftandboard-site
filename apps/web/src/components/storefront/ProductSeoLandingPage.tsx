import Link from "next/link";
import type { ResolvedRelatedContent } from "../../lib/seo/relatedContent";
import { CTA } from "./CTA";
import { Container } from "./Container";
import { Section } from "./Section";
import { SectionIntro } from "./SectionIntro";
import { RelatedLinksSection } from "./seo/RelatedLinksSection";
import { StructuredDataScript } from "./StructuredDataScript";

export function ProductSeoLandingPage(input: {
  eyebrow: string;
  title: string;
  intro: string;
  guidanceTitle: string;
  guidanceBody: string;
  configuratorHref: string;
  configuratorLabel: string;
  related: Array<{ title: string; href: string }>;
  relatedContent: ResolvedRelatedContent;
  breadcrumbSchema: Record<string, unknown>;
  productSchema: Record<string, unknown>;
}) {
  return (
    <>
      <StructuredDataScript data={input.breadcrumbSchema} />
      <StructuredDataScript data={input.productSchema} />
      <Section>
        <Container className="space-y-10">
          <SectionIntro
            eyebrow={input.eyebrow}
            title={input.title}
            body={input.intro}
          />
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <h2 className="font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                {input.guidanceTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
                {input.guidanceBody}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#6f5847]">
                Configure the main product page to choose exact dimensions, wood direction, and mounting details without losing the search path that brought you here.
              </p>
            </article>
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Start Here</p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                Move from this landing page into the live configurator.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
                These pages are designed to answer the long-tail search intent, then hand off to the real product configurator and pricing path.
              </p>
              <Link
                href={input.configuratorHref}
                className="mt-6 inline-flex rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]"
              >
                {input.configuratorLabel}
              </Link>
            </article>
          </div>
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <SectionIntro
            eyebrow="Related Pages"
            title="Explore related searches and product directions."
            body="Internal links keep the content useful for customers and easier for search engines to understand as a connected product cluster."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {input.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-5 text-sm leading-7 text-[#4f3f33] transition hover:bg-white"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </Container>
      </Section>
      <RelatedLinksSection
        eyebrow="Guides"
        title="Use planning guides to move from search intent into a real product decision."
        body="These informational pages reinforce the same keyword cluster and keep the path back to the live product clear."
        links={input.relatedContent.guides}
      />
      <RelatedLinksSection
        eyebrow="Product Paths"
        title="Cross-link the variant page back into the flagship product and category flow."
        body="The best variant pages act like entry points, then route visitors toward the category page, live product page, and neighboring search paths."
        links={[...input.relatedContent.productLinks, ...input.relatedContent.categoryLinks]}
        tone="tinted"
      />
      <Section>
        <Container>
          <CTA
            eyebrow="Ready to Configure"
            title="Use the product page for exact options, pricing, and next steps."
            body="The landing page helps you narrow the right size, material, or use case. The configurator is where the project becomes a real order path."
            primary={{ href: input.configuratorHref, label: input.configuratorLabel }}
            secondary={{ href: "/shop", label: "Browse the Collection" }}
          />
        </Container>
      </Section>
    </>
  );
}
