import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShelfConfigurator } from "../../../../../components/storefront/CabinetShelfConfigurator";
import { Container } from "../../../../../components/storefront/Container";
import { Section } from "../../../../../components/storefront/Section";
import { SectionIntro } from "../../../../../components/storefront/SectionIntro";
import { StructuredDataScript } from "../../../../../components/storefront/StructuredDataScript";
import {
  cabinetShelfFaqs,
  cabinetShelfFinishComparisons,
  cabinetShelfProducts,
  getAlternateCabinetShelfFinish,
  getCabinetShelfFinishComparison,
  getCabinetShelfProduct
} from "../../../../../content/cabinetShelves";
import { CabinetShelfAlternateFinishLink } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfAlternateFinishLink";
import { CabinetShelfConfidenceBlock } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfConfidenceBlock";
import { CabinetShelfFaq } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfFaq";
import { CabinetShelfFinishComparison } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfFinishComparison";
import { CabinetShelfMeasurementHelp } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfMeasurementHelp";
import { CabinetShelfNextSteps } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfNextSteps";
import { CabinetShelfReviewChecklist } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfReviewChecklist";
import { CabinetShelfTrustBlock } from "../../../../../components/storefront/cabinet-shelves/CabinetShelfTrustBlock";
import { getBreadcrumbSchema } from "../../../../../lib/seo/breadcrumbSchema";
import { absoluteMarketingUrl, generatePageSEO } from "../../../../../lib/seo/metadata";
import { getProductPageKey } from "../../../../../lib/seo/overrides";

export function generateStaticParams() {
  return cabinetShelfProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const product = getCabinetShelfProduct(resolved.slug);

  if (!product) {
    return {};
  }

  return generatePageSEO({
    title: `${product.title} | Craft & Board`,
    description: product.description,
    pathname: product.href,
    type: "website",
    pageKey: getProductPageKey(product.slug)
  });
}

function getCabinetShelfProductSchema(product: NonNullable<ReturnType<typeof getCabinetShelfProduct>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    category: "Replacement Cabinet Shelf",
    material: product.materialLabel,
    brand: {
      "@type": "Brand",
      name: "Craft & Board"
    },
    url: absoluteMarketingUrl(product.href)
  };
}

function getCabinetShelfFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cabinetShelfFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export default async function CabinetShelfProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const product = getCabinetShelfProduct(resolved.slug);

  if (!product) {
    notFound();
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Replacement Cabinet Shelves", path: "/shop/cabinet-shelves" },
    { name: product.title, path: product.href }
  ]);
  const currentFinish = getCabinetShelfFinishComparison(product.slug);
  const alternateFinish = getAlternateCabinetShelfFinish(product.slug);

  return (
    <Section>
      <StructuredDataScript data={breadcrumbSchema} />
      <StructuredDataScript data={getCabinetShelfProductSchema(product)} />
      <StructuredDataScript data={getCabinetShelfFaqSchema()} />
      <Container className="space-y-12">
        <div className="space-y-4">
          <p className="text-sm text-[#7a6657]">Shop / Replacement Cabinet Shelves / {product.title}</p>
          <h1 className="font-[family-name:var(--font-cormorant)] text-5xl text-[#241811]">{product.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-[#5c4a3d]">{product.intro}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Best For</p>
            <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">{product.summary}</h2>
            <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{product.finishDirection}</p>
            <p className="mt-4 text-sm leading-7 text-[#6f5847]">{product.bestFor}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-[#5c4a3d]">
              {product.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
            {currentFinish ? (
              <div className="mt-6 rounded-[1.25rem] border border-[#e0d2c4] bg-[#fbf5ee] p-4 text-sm leading-6 text-[#4f3f33]">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8d6b4f]">Choose this if</p>
                <p className="mt-2">{currentFinish.chooseThisIf}</p>
              </div>
            ) : null}
          </article>

          <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">How to Measure Reminder</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[#4f3f33]">
              <p>1. Measure the inside cabinet width.</p>
              <p>2. Note the shelf depth.</p>
              <p>3. Subtract 1/8 inch from the opening width if you want a simple fit rule.</p>
              <p>4. Enter the shelf width and depth below in 1/8 inch increments only.</p>
            </div>
          </article>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <CabinetShelfAlternateFinishLink currentFinishTitle={product.shortTitle} alternateFinish={alternateFinish} />
          <div className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Same measuring process</p>
            <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">
              White and maple use the same fit rules.
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">
              Both finishes use the same measurement guide, the same 1/8 inch increments, and the same simple clearance rule. Finish is the main style decision in this MVP.
            </p>
          </div>
        </div>

        <CabinetShelfConfigurator product={product} />

        <SectionIntro
          eyebrow="Buy With More Confidence"
          title="Simple guidance matters more than a complicated shelf builder."
          body="This MVP cabinet shelf flow is built around width, depth, quantity, and a clear fit rule. That keeps the experience understandable for homeowners while still sending a real replacement-shelf request into the Craft & Board order path."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <CabinetShelfConfidenceBlock />
          <CabinetShelfReviewChecklist />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <CabinetShelfNextSteps />
          <CabinetShelfTrustBlock product={product} />
        </div>

        <CabinetShelfMeasurementHelp />

        <div className="max-w-5xl">
          <CabinetShelfFinishComparison
            eyebrow="Compare Finishes"
            title="Still deciding between white and maple?"
            body="The measuring steps stay the same either way. The real choice is whether your cabinet looks better with a brighter practical white shelf or a warmer wood-look maple shelf."
            finishes={cabinetShelfFinishComparisons}
          />
        </div>

        <div className="max-w-5xl">
          <SectionIntro
            eyebrow="Cabinet Shelf FAQ"
            title="Common questions before you submit measurements."
            body="These answers are here to reduce second-guessing around fit, depth, quantity, and what happens after the order start is sent."
          />
          <div className="mt-10">
            <CabinetShelfFaq items={cabinetShelfFaqs} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
