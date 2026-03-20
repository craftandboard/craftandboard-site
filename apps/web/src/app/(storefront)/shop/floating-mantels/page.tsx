import type { Metadata } from "next";
import { finishes } from "../../../../content/finishes";
import { StructuredDataScript } from "../../../../components/storefront/StructuredDataScript";
import { Container } from "../../../../components/storefront/Container";
import { CTA } from "../../../../components/storefront/CTA";
import { Hero } from "../../../../components/storefront/Hero";
import { ProductCard } from "../../../../components/storefront/ProductCard";
import { RelatedLinksSection } from "../../../../components/storefront/seo/RelatedLinksSection";
import { Section } from "../../../../components/storefront/Section";
import { SectionIntro } from "../../../../components/storefront/SectionIntro";
import { ValueStrip } from "../../../../components/storefront/ValueStrip";
import { getBreadcrumbSchema } from "../../../../lib/seo/breadcrumbSchema";
import { generatePageSEO } from "../../../../lib/seo/metadata";
import { resolveCategoryPageContent } from "../../../../lib/seo/overrideResolver";
import { resolveCategoryRelatedContent } from "../../../../lib/seo/relatedContent";
import { storefrontTitle } from "../../../../lib/storefront/config";
import { getStorefrontProductsByCategory } from "../../../../lib/storefront/products/registry";

const resolvedCategoryPage = resolveCategoryPageContent({
  family: "floating-mantels",
  heroTitle: "Architectural mantels sized for the fireplace wall, not the stock aisle.",
  heroBody:
    "This launch collection brings the same pricing-first, deposit-ready order path to made-to-order mantels with configurable span, section profile, and concealed support guidance.",
  primaryCtaLabel: "View Classic Mantel",
  primaryCtaHref: "/shop/floating-mantels/classic-floating-mantel",
  metadataTitle: storefrontTitle("Floating Mantels"),
  metadataDescription: "Explore made-to-order floating mantels with configurable span, material direction, and concealed support options."
});

export const metadata: Metadata = generatePageSEO({
  title: resolvedCategoryPage.metadataTitle,
  description: resolvedCategoryPage.metadataDescription,
  pathname: "/shop/floating-mantels",
  pageKey: resolvedCategoryPage.pageKey
});

export default function FloatingMantelsPage() {
  const products = getStorefrontProductsByCategory("floating-mantels");
  const featuredProduct = products[0];
  const relatedContent = resolveCategoryRelatedContent("floating-mantels");
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Floating Mantels", path: "/shop/floating-mantels" }
  ]);

  if (!featuredProduct) {
    return null;
  }

  return (
    <>
      <StructuredDataScript data={breadcrumbSchema} />
      <Hero
        eyebrow="Floating Mantels"
        title={resolvedCategoryPage.heroTitle}
        body={resolvedCategoryPage.heroBody}
        primaryCta={{ href: resolvedCategoryPage.primaryCtaHref, label: resolvedCategoryPage.primaryCtaLabel }}
      />
      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Category Overview</p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#241811]">
                Built for fireplace walls that need proportion, material presence, and a cleaner support path.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
                Use the floating mantel collection when a stock beam look is close but not right. Standard spans can price instantly, while oversized or install-sensitive configurations still route into review first.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Common Spans</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['60"', '72"', '84"'].map((size) => (
                  <span
                    key={size}
                    className="rounded-full border border-[#cdb59e] bg-[#fff8f0] px-4 py-2 text-sm tracking-[0.2em] text-[#5d4535]"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionIntro
            eyebrow="Why Custom Sizing Matters"
            title="A mantel reads best when the span and section belong to the surround."
            body="Custom floating mantels are less about novelty and more about getting the fireplace wall composition right. Length, depth, and height all change how architectural the final install feels."
          />
          <ValueStrip
            items={[
              "Longer spans create a cleaner line across the fireplace wall.",
              "Depth affects display, clearance feel, and visual weight.",
              "Height changes whether the mantel reads subtle, architectural, or substantial."
            ]}
          />
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <SectionIntro
            eyebrow="Material Direction"
            title="A focused launch palette for the first mantel line."
            body="The same premium material palette used across Craft & Board’s launch products carries into mantels so the collection stays coherent instead of sprawling."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {finishes.map((finish) => (
              <article key={finish.code} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-5">
                <div className="h-20 rounded-[1.25rem]" style={{ backgroundColor: finish.swatchHex }} />
                <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-2xl text-[#281a13]">{finish.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c4a3d]">{finish.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionIntro
            eyebrow="Collection Product"
            title="Start with the first mantel template and tailor it to the fireplace wall."
            body="The Classic Floating Mantel is the second live product on the reusable commerce framework, built to prove the same pricing, checkout, payment, and handoff path works beyond shelves."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <ProductCard
              product={{
                slug: featuredProduct.productSlug,
                categorySlug: featuredProduct.categorySlug,
                name: featuredProduct.displayName,
                shortDescription: featuredProduct.content.shortDescription,
                description: featuredProduct.content.description,
                storytelling: featuredProduct.content.storytelling,
                href: featuredProduct.pdpPath,
                imagePublicId: featuredProduct.imagePublicId,
                featureBullets: featuredProduct.content.featureBullets,
                sizeCallouts: featuredProduct.content.sizeCallouts,
                detailBlocks: featuredProduct.content.detailBlocks,
                processSteps: featuredProduct.content.processSteps,
                reassurance: featuredProduct.content.reassurance,
                liveStatus: featuredProduct.liveStatus
              }}
            />
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">What to Expect</p>
              <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                Configure the mantel, see the price, and move into the same deposit-ready order flow.
              </h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[#5c4a3d]">
                <p>Choose the length, depth, height, material, and concealed support direction that fit the fireplace wall.</p>
                <p>See the live price and lead-time guidance tied to the exact mantel profile.</p>
                <p>Continue into standard order and deposit payment when the configuration stays within the launch guardrails.</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <RelatedLinksSection
        eyebrow="Popular Mantel Paths"
        title="Use the mantel category page to move into the strongest size, material, and fireplace clusters."
        body="These links connect the category page to the flagship mantel product and the top landing pages customers tend to compare before configuring."
        links={[...relatedContent.productLinks, ...relatedContent.variants]}
      />
      <RelatedLinksSection
        eyebrow="Mantel Guides"
        title="Use related planning content to move from inspiration into a real mantel path."
        body="Mantel design ideas reinforce the fireplace use case and connect the category page back into the broader authority-content layer."
        links={relatedContent.guides}
        tone="tinted"
      />
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="Ready to Start"
            title="Move from fireplace inspiration into a real mantel order."
            body="The product detail page is the fastest way to define span, profile, and support direction for a standard mantel build."
            primary={{ href: "/shop/floating-mantels/classic-floating-mantel", label: "View the Product" }}
            secondary={{ href: "/contact", label: "Ask a Question" }}
          />
        </Container>
      </Section>
    </>
  );
}
