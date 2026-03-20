import type { Metadata } from "next";
import Link from "next/link";
import { CTA } from "../../../../components/storefront/CTA";
import { Container } from "../../../../components/storefront/Container";
import { Hero } from "../../../../components/storefront/Hero";
import { Section } from "../../../../components/storefront/Section";
import { SectionIntro } from "../../../../components/storefront/SectionIntro";
import { CabinetShelfFinishComparison } from "../../../../components/storefront/cabinet-shelves/CabinetShelfFinishComparison";
import {
  cabinetShelfCategory,
  cabinetShelfCategoryContent,
  cabinetShelfFinishComparisons,
  cabinetShelfProducts,
  cabinetShelfSupportContent
} from "../../../../content/cabinetShelves";
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
        title="Choose the replacement cabinet shelf finish that fits your cabinet."
        body={cabinetShelfCategory.intro}
        primaryCta={{ href: "/guides/how-to-measure-cabinet-shelves", label: "Measure Your Shelf" }}
        secondaryCta={{ href: cabinetShelfProducts[0]?.href ?? "/contact", label: "Shop White Melamine" }}
      />
      <Section>
        <Container>
          <CabinetShelfFinishComparison
            eyebrow={cabinetShelfCategoryContent.comparisonEyebrow}
            title={cabinetShelfCategoryContent.comparisonTitle}
            body={cabinetShelfCategoryContent.comparisonBody}
            finishes={cabinetShelfFinishComparisons}
            showDecisionAid
            decisionAidTitle={cabinetShelfCategoryContent.decisionAidTitle}
            decisionAidChoices={cabinetShelfCategoryContent.decisionAidChoices}
          />
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <SectionIntro
              eyebrow="Measurement Help"
              title="Most customers should measure before choosing the shelf."
              body="If you are not fully confident in the width or depth yet, start with the measurement guide first. It covers inside width, depth, 1/8 inch increments, and the simple clearance rule."
            />
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Quick fit reminder</p>
              <p className="mt-4 text-sm leading-7 text-[#5c4a3d]">{cabinetShelfSupportContent.confidenceBody}</p>
              <div className="mt-5 rounded-[1rem] border border-[#ded1c4] bg-[#f8efe5] p-4 text-sm text-[#4f3f33]">
                {cabinetShelfSupportContent.confidenceExample}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/guides/how-to-measure-cabinet-shelves" className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
                  Read the Measurement Guide
                </Link>
                <Link href={cabinetShelfProducts[1]?.href ?? "/contact"} className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
                  View Maple Melamine
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Why Craft &amp; Board</p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                A replacement shelf specialist, not a giant shelf catalog.
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[#5c4a3d]">
                {cabinetShelfSupportContent.trustPoints.map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </div>
            </article>
            <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Category CTA</p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                Ready to pick the finish or still need the guide first?
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
                Move into the product page that matches your cabinet interior, or reopen the guide if you want one more measuring check before starting the order.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={cabinetShelfProducts[0]?.href ?? "/contact"} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
                  Shop White Melamine
                </Link>
                <Link href="/guides/how-to-measure-cabinet-shelves" className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
                  Measure First
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <CTA
            eyebrow="Next Step"
            title="Measure if you need help. Shop if you already know the size."
            body="The cabinet shelf flow stays simple on purpose: guide first for confidence, product page second for finish choice, configurator third for dimensions and quantity."
            primary={{ href: "/guides/how-to-measure-cabinet-shelves", label: "Use the Measurement Guide" }}
            secondary={{ href: "/shop/cabinet-shelves", label: "Shop Cabinet Shelves" }}
          />
        </Container>
      </Section>
    </>
  );
}
