import Link from "next/link";
import Image from "next/image";
import { categories } from "../../content/categories";
import { galleryItems } from "../../content/gallery";
import { homepageContent } from "../../content/homepage";
import { products } from "../../content/products";
import { getCloudinaryImageUrl } from "../../lib/media/cloudinary";
import { resolveHomePageContent } from "../../lib/seo/overrideResolver";
import { CategoryCard } from "./CategoryCard";
import { Container } from "./Container";
import { CTA } from "./CTA";
import { GalleryGrid } from "./GalleryGrid";
import { Hero } from "./Hero";
import { ProductCard } from "./ProductCard";
import { Section } from "./Section";
import { SectionIntro } from "./SectionIntro";
import { TrustSection } from "./TrustSection";

export function StorefrontHomePage() {
  const featuredProduct = products[0];
  const resolvedHomePage = resolveHomePageContent({
    heroTitle: homepageContent.hero.headline,
    heroBody: homepageContent.hero.body,
    primaryCtaLabel: homepageContent.hero.primaryLabel,
    primaryCtaHref: homepageContent.hero.primaryHref
  });

  return (
    <>
      <Hero
        eyebrow="Made to order"
        title={resolvedHomePage.heroTitle}
        body={resolvedHomePage.heroBody}
        primaryCta={{
          href: resolvedHomePage.primaryCtaHref,
          label: resolvedHomePage.primaryCtaLabel
        }}
        secondaryCta={{
          href: homepageContent.hero.secondaryHref,
          label: homepageContent.hero.secondaryLabel
        }}
        aside={
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#d8c7b5] bg-[#eadaca] shadow-[0_24px_70px_rgba(64,42,28,0.12)]">
            <div className="relative aspect-[4/5]">
              <Image
                src={getCloudinaryImageUrl(featuredProduct.imagePublicId, { width: 1000, height: 1250 })}
                alt={featuredProduct.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-[#fff6ed]/92 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8c6c53]">Featured collection</p>
              <p className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#2b1d16]">
                Floating Shelves
              </p>
              <p className="mt-2 text-sm text-[#5c4a3d]">Common project widths from 48 to 96 inches and beyond.</p>
            </div>
          </div>
        }
      />

      <Section>
        <Container>
          <SectionIntro
            eyebrow="Featured Categories"
            title={homepageContent.featuredCategoriesIntro.title}
            body={homepageContent.featuredCategoriesIntro.body}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="tinted">
        <Container>
          <SectionIntro
            eyebrow="How It Works"
            title="A simpler custom-order path from the start."
            body="The first release is designed to move a project from inspiration into a real reviewed request without pretending every custom case belongs in a generic checkout."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {homepageContent.howItWorks.map((step, index) => (
              <article key={step.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8c6c53]">Step {index + 1}</p>
                <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#2b1d16]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{step.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionIntro
            eyebrow="Featured Product"
            title="Floating shelves that fit the room instead of forcing the room to fit the shelf."
            body="The launch product is intentionally narrow in scope and stronger because of it: one product line, enough meaningful options, and a quote-first flow that stays honest about custom work."
          />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <ProductCard product={featuredProduct} />
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8c6c53]">Why this first</p>
              <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                Clear options. Strong visuals. Fastest path to a real custom-order flow.
              </h3>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{featuredProduct.description}</p>
              <Link
                href={featuredProduct.href}
                className="mt-8 inline-flex rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]"
              >
                Configure the Shelf
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <SectionIntro
                eyebrow="Why Custom"
                title={homepageContent.craftsmanshipStrip.title}
                body={homepageContent.craftsmanshipStrip.body}
              />
            </div>
            <div className="space-y-4">
              {homepageContent.craftsmanshipStrip.points.map((point) => (
                <div key={point} className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] px-5 py-5 text-sm leading-7 text-[#4f3f33]">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="tinted">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionIntro
              eyebrow="Gallery Preview"
              title={homepageContent.galleryPreview.title}
              body={homepageContent.galleryPreview.body}
            />
            <Link href="/gallery" className="text-sm font-medium text-[#5e4636] underline-offset-4 hover:underline">
              View Full Gallery
            </Link>
          </div>
          <GalleryGrid items={galleryItems.slice(0, 4)} columns="three" />
        </Container>
      </Section>

      <TrustSection
        eyebrow="Trust and Craft"
        title="Built to feel credible before the first shelf is even ordered."
        body="The launch site is meant to answer the biggest confidence questions clearly: is it custom, will it fit, and does the finish and mounting path feel considered?"
        items={homepageContent.trustStatements}
        quote={homepageContent.trustQuotes[0]}
      />

      <Section>
        <Container>
          <CTA
            eyebrow="Phase 1"
            title={homepageContent.finalCta.headline}
            body={homepageContent.finalCta.body}
            primary={{
              href: homepageContent.finalCta.primaryHref,
              label: homepageContent.finalCta.primaryLabel
            }}
            secondary={{
              href: homepageContent.finalCta.secondaryHref,
              label: homepageContent.finalCta.secondaryLabel
            }}
          />
        </Container>
      </Section>
    </>
  );
}
