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
  family: "floating-shelves",
  heroTitle: "Architectural shelving with a custom fit from the start.",
  heroBody:
    "This first collection is built around clean profiles, room-specific dimensions, finish-driven material choices, and a quote-first custom order path.",
  primaryCtaLabel: "View Classic Shelf",
  primaryCtaHref: "/shop/floating-shelves/classic-floating-shelf",
  metadataTitle: storefrontTitle("Floating Shelves"),
  metadataDescription: "Explore made-to-order floating shelves with custom sizing, finish direction, and concealed mounting options."
});

export const metadata: Metadata = generatePageSEO({
  title: resolvedCategoryPage.metadataTitle,
  description: resolvedCategoryPage.metadataDescription,
  pathname: "/shop/floating-shelves",
  pageKey: resolvedCategoryPage.pageKey
});

export default function FloatingShelvesPage() {
  const products = getStorefrontProductsByCategory("floating-shelves");
  const relatedContent = resolveCategoryRelatedContent("floating-shelves");
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Floating Shelves", path: "/shop/floating-shelves" }
  ]);

  return (
    <>
      <StructuredDataScript data={breadcrumbSchema} />
      <Hero
        eyebrow="Floating Shelves"
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
                Built for rooms that need exact width, clean lines, and material presence.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
                Use the floating shelf collection when stock dimensions fall short and the finish needs to feel intentional in the room. Start with common widths or define the exact size needed.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Common Widths</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['48"', '72"', '96"'].map((size) => (
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
            title="A shelf reads better when the proportion belongs to the room."
            body="Custom floating shelves are less about complexity and more about avoiding the visual compromises that happen when a stock width, depth, or thickness is close but not right."
          />
          <ValueStrip
            items={[
              "Longer widths create a cleaner architectural line over furniture and millwork.",
              "Depth should match how the shelf will actually be styled or used.",
              "Thickness changes the visual weight more than most customers expect."
            ]}
          />
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <SectionIntro
            eyebrow="Finish Preview"
            title="Starter material directions for the first shelf line."
            body="The launch palette stays focused so the first collection feels curated rather than overloaded. Each finish direction is chosen to work across calm, design-minded spaces."
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
            title="Start with the first shelf template and tailor it to the project."
            body="The Classic Floating Shelf is the launch template for gathering dimensions, finish direction, and concealed mounting choices in one clean path."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <ProductCard
              product={{
                slug: products[0].productSlug,
                categorySlug: products[0].categorySlug,
                name: products[0].displayName,
                shortDescription: products[0].content.shortDescription,
                description: products[0].content.description,
                storytelling: products[0].content.storytelling,
                href: products[0].pdpPath,
                imagePublicId: products[0].imagePublicId,
                featureBullets: products[0].content.featureBullets,
                sizeCallouts: products[0].content.sizeCallouts,
                detailBlocks: products[0].content.detailBlocks,
                processSteps: products[0].content.processSteps,
                reassurance: products[0].content.reassurance,
                liveStatus: products[0].liveStatus
              }}
            />
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">What to Expect</p>
              <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                Start with the shelf, then let the review confirm the right next step.
              </h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[#5c4a3d]">
                <p>Choose the finish and concealed mounting direction that best fits the room.</p>
                <p>Send the dimensions you know, including common examples if you are still narrowing the final width.</p>
                <p>Receive a reviewed follow-up instead of a generic checkout assumption.</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <RelatedLinksSection
        eyebrow="Popular Shelf Paths"
        title="Use the category page to move into the strongest shelf search clusters."
        body="These linked paths reinforce the shelf category around dimensions, materials, fireplace use, and installation research."
        links={[...relatedContent.productLinks, ...relatedContent.variants]}
      />
      <RelatedLinksSection
        eyebrow="Shelf Guides"
        title="Answer planning questions before moving into the configurator."
        body="These guides support installation, weight, and wood-selection questions that often precede a real floating shelf project."
        links={relatedContent.guides}
        tone="tinted"
      />
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="Ready to Start"
            title="Move from inspiration into a real shelf request."
            body="The product detail page is the fastest way to define dimensions and send a structured inquiry for review."
            primary={{ href: "/shop/floating-shelves/classic-floating-shelf", label: "View the Product" }}
            secondary={{ href: "/contact", label: "Ask a Question" }}
          />
        </Container>
      </Section>
    </>
  );
}
