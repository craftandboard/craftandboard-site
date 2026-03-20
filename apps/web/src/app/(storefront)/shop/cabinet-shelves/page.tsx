import type { Metadata } from "next";
import Link from "next/link";
import { CTA } from "../../../../components/storefront/CTA";
import { Container } from "../../../../components/storefront/Container";
import { Hero } from "../../../../components/storefront/Hero";
import { Section } from "../../../../components/storefront/Section";
import { SectionIntro } from "../../../../components/storefront/SectionIntro";
import { cabinetShelfCategory, cabinetShelfProducts } from "../../../../content/cabinetShelves";
import { generatePageSEO } from "../../../../lib/seo/metadata";
import { getCategoryPageKey } from "../../../../lib/seo/overrides";

export const metadata: Metadata = generatePageSEO({
  title: "Replacement Cabinet Shelves | White and Maple Melamine | Craft & Board",
  description:
    "Shop replacement cabinet shelves in white melamine and maple melamine. Start with the measurement guide, then order the shelf finish that fits your cabinet project.",
  pathname: "/shop/cabinet-shelves",
  pageKey: getCategoryPageKey("cabinet-shelves")
});

export default function CabinetShelvesCategoryPage() {
  return (
    <>
      <Hero
        eyebrow="Replacement Cabinet Shelves"
        title="Replacement cabinet shelves built around simple, accurate measuring."
        body={cabinetShelfCategory.intro}
        primaryCta={{ href: "/guides/how-to-measure-cabinet-shelves", label: "Use the Measurement Guide" }}
        secondaryCta={{ href: cabinetShelfProducts[0]?.href ?? "/contact", label: "Shop White Melamine" }}
      />
      <Section>
        <Container>
          <SectionIntro
            eyebrow="Choose a Finish"
            title="Start with the shelf finish that fits the cabinet interior."
            body="These first MVP replacement shelves keep the choice simple: a bright white melamine option and a warmer maple melamine option. Both use the same measurement-first ordering path."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {cabinetShelfProducts.map((product) => (
              <article key={product.slug} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
                <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{product.materialLabel}</p>
                <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">{product.title}</h2>
                <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{product.description}</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#5c4a3d]">
                  {product.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={product.href} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7f0e7] transition hover:bg-[#4a3529]">
                    View Product
                  </Link>
                  <Link href="/guides/how-to-measure-cabinet-shelves" className="rounded-full border border-[#dbcab9] px-5 py-3 text-sm font-medium text-[#2b1d16] transition hover:bg-white">
                    How to Measure
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="Measure First"
            title="Use the guide before you order."
            body="The easiest way to get the right replacement shelf is to measure the inside cabinet width, note the depth, and order in the correct 1/8 inch increment."
            primary={{ href: "/guides/how-to-measure-cabinet-shelves", label: "Read the Measurement Guide" }}
            secondary={{ href: cabinetShelfProducts[1]?.href ?? "/contact", label: "View Maple Melamine" }}
          />
        </Container>
      </Section>
    </>
  );
}
