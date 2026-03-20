import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "../../../../../components/storefront/Container";
import { CTA } from "../../../../../components/storefront/CTA";
import { FloatingShelfConfigurator } from "../../../../../components/storefront/FloatingShelfConfigurator";
import { RelatedLinksSection } from "../../../../../components/storefront/seo/RelatedLinksSection";
import { Section } from "../../../../../components/storefront/Section";
import { SectionIntro } from "../../../../../components/storefront/SectionIntro";
import { StructuredDataScript } from "../../../../../components/storefront/StructuredDataScript";
import { getCloudinaryImageUrl } from "../../../../../lib/media/cloudinary";
import { getBreadcrumbSchema } from "../../../../../lib/seo/breadcrumbSchema";
import { generatePageSEO } from "../../../../../lib/seo/metadata";
import { resolveProductPageContent } from "../../../../../lib/seo/overrideResolver";
import { getProductSchema } from "../../../../../lib/seo/productSchema";
import { resolveProductRelatedContent } from "../../../../../lib/seo/relatedContent";
import { storefrontTitle } from "../../../../../lib/storefront/config";
import { getStorefrontProductDefinition } from "../../../../../lib/storefront/products/registry";

const product = getStorefrontProductDefinition({
  categorySlug: "floating-shelves",
  productSlug: "classic-floating-shelf"
});

const resolvedProductPage = resolveProductPageContent({
  productSlug: "classic-floating-shelf",
  metadataTitle: storefrontTitle("Floating Shelf – Custom Solid Wood Shelves"),
  metadataDescription: "Custom floating shelves made from solid hardwood. Configure size, wood species, and mounting options. Built for contractor-grade durability.",
  intro: product?.content.description ?? "",
  ctaLabel: "Open Inquiry Form",
  ctaHref: "/contact"
});

export const metadata: Metadata = generatePageSEO({
  title: resolvedProductPage.metadataTitle,
  description: resolvedProductPage.metadataDescription,
  pathname: "/shop/floating-shelves/classic-floating-shelf",
  imageUrl: product?.imagePublicId
    ? getCloudinaryImageUrl(product.imagePublicId, { width: 1200, height: 630 })
    : undefined,
  imageAlt: "Craft & Board floating shelf",
  pageKey: resolvedProductPage.pageKey
});

export default function ClassicFloatingShelfPage() {
  if (!product) {
    return null;
  }
  const relatedContent = resolveProductRelatedContent("floating-shelves");

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Floating Shelves", path: "/shop/floating-shelves" },
    { name: product.displayName, path: product.pdpPath }
  ]);
  const productSchema = getProductSchema({
    product,
    material: "Hardwood"
  });

  return (
    <Section>
      <StructuredDataScript data={breadcrumbSchema} />
      <StructuredDataScript data={productSchema} />
      <Container>
        <div className="mb-8">
          <p className="text-sm text-[#7a6657]">Shop / Floating Shelves / Classic Floating Shelf</p>
          <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-5xl text-[#241811]">{product.displayName}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">{resolvedProductPage.intro}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[#dbcab9] bg-[#eadaca]">
              <Image
                src={getCloudinaryImageUrl(product.imagePublicId, { width: 1200, height: 1500 })}
                alt={product.displayName}
                fill
                className="object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {product.content.sizeCallouts.map((size) => (
                <div key={size} className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8c6c53]">Common Width</p>
                  <p className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{size}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <FloatingShelfConfigurator />
          </div>
        </div>
      </Container>
      <Container className="mt-14 space-y-14">
        <SectionIntro
          eyebrow="Product Details"
          title="More than a shelf size picker."
          body={product.content.storytelling}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {product.content.detailBlocks.map((block) => (
            <article key={block.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-7">
              <h2 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{block.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{block.body}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">What Happens Next</p>
            <div className="mt-5 space-y-4">
              {product.content.processSteps.map((step, index) => (
                <div key={step} className="rounded-[1.5rem] bg-[#fff8f0] p-5 text-sm leading-7 text-[#4f3f33]">
                  <span className="mr-2 text-[#8d6b4f]">{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Pricing Reassurance</p>
            <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
              Instant pricing when the shelf is standard. Review when it is not.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{product.content.reassurance}</p>
            <p className="mt-4 text-sm leading-7 text-[#6f5847]">
              That keeps the product page honest: standard configurations can move toward direct order intake, while complex installs still route through a cleaner review path instead of pretending every wall is the same.
            </p>
          </div>
        </div>

        <RelatedLinksSection
          eyebrow="Shelf Research Paths"
          title="Use related guides and variants to build confidence before checkout."
          body="These links keep the PDP conversion-focused while still exposing installation, weight, styling, and high-intent variant paths."
          links={[...relatedContent.guides, ...relatedContent.variants, ...relatedContent.categoryLinks]}
        />

        <CTA
          eyebrow="Need Another Path"
          title="If you are still deciding on the right size, start the request anyway."
          body="Use the contact flow to share what you know so far, including multiple possible widths or room-specific questions."
          primary={{ href: resolvedProductPage.ctaHref, label: resolvedProductPage.ctaLabel }}
          secondary={{ href: "/gallery", label: "View Inspiration" }}
        />
      </Container>
    </Section>
  );
}
