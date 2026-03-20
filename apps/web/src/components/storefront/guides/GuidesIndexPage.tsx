import Link from "next/link";
import type { GuideContentEntry } from "../../../content/guides";
import type { ResolvedRelatedLink } from "../../../lib/seo/relatedContent";
import { CTA } from "../CTA";
import { Container } from "../Container";
import { RelatedLinksSection } from "../seo/RelatedLinksSection";
import { Section } from "../Section";
import { SectionIntro } from "../SectionIntro";

export function GuidesIndexPage(input: {
  guides: GuideContentEntry[];
  featuredGuides: ResolvedRelatedLink[];
  familyRoutes: ResolvedRelatedLink[];
  productLinks: ResolvedRelatedLink[];
  heroTitle?: string;
  heroBody?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
}) {
  return (
    <>
      <Section>
        <Container className="space-y-10">
          <SectionIntro
            eyebrow="Guides"
            title={input.heroTitle ?? "Authority content built around the real questions customers search first."}
            body={input.heroBody ?? "These guides cover installation, wood selection, styling, weight planning, and mantel design so research-driven traffic has a clear path into the live product and configurator pages."}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {input.featuredGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="rounded-[1.75rem] border border-[#dbcab9] bg-[#f8eee2] p-5 transition hover:bg-[#fff7ee]"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Featured Guide</p>
                <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
                  {guide.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5c4a3d]">{guide.description}</p>
              </Link>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {input.guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6 transition hover:bg-white"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Guide</p>
                <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
                  {guide.heroHeading}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{guide.summary}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
      <RelatedLinksSection
        eyebrow="Product Families"
        title="Use the guides hub as a router into the live shelf and mantel collections."
        body="These links connect informational content directly into the category and flagship product pages where the conversion path actually begins."
        links={[...input.familyRoutes, ...input.productLinks]}
        tone="tinted"
      />
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="From Research to Product"
            title="Use the guides to narrow direction, then move into the live configurator."
            body="The authority layer exists to answer pre-purchase questions and connect that research to real shelf and mantel product paths."
            primary={{ href: input.primaryCtaHref ?? "/shop", label: input.primaryCtaLabel ?? "Browse the Collection" }}
            secondary={{ href: "/shop/floating-shelves/classic-floating-shelf", label: "Start a Shelf Project" }}
          />
        </Container>
      </Section>
    </>
  );
}
