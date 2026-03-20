import Link from "next/link";
import Image from "next/image";
import {
  cabinetShelfFinishComparisons,
  cabinetShelfHomepageContent,
  cabinetShelfProducts,
  cabinetShelfSupportContent
} from "../../content/cabinetShelves";
import { getCloudinaryImageUrl } from "../../lib/media/cloudinary";
import { resolveHomePageContent } from "../../lib/seo/overrideResolver";
import { Container } from "./Container";
import { CTA } from "./CTA";
import { Hero } from "./Hero";
import { Section } from "./Section";
import { SectionIntro } from "./SectionIntro";
import { CabinetShelfFinishComparison } from "./cabinet-shelves/CabinetShelfFinishComparison";

export function StorefrontHomePage() {
  const featuredProduct = cabinetShelfProducts[0];
  const resolvedHomePage = resolveHomePageContent({
    heroTitle: cabinetShelfHomepageContent.hero.title,
    heroBody: cabinetShelfHomepageContent.hero.body,
    primaryCtaLabel: cabinetShelfHomepageContent.hero.primaryLabel,
    primaryCtaHref: cabinetShelfHomepageContent.hero.primaryHref
  });

  return (
    <>
      <Hero
        eyebrow={cabinetShelfHomepageContent.hero.eyebrow}
        title={resolvedHomePage.heroTitle}
        body={resolvedHomePage.heroBody}
        primaryCta={{
          href: resolvedHomePage.primaryCtaHref,
          label: resolvedHomePage.primaryCtaLabel
        }}
        secondaryCta={{
          href: cabinetShelfHomepageContent.hero.secondaryHref,
          label: cabinetShelfHomepageContent.hero.secondaryLabel
        }}
        aside={
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#d8c7b5] bg-[#eadaca] shadow-[0_24px_70px_rgba(64,42,28,0.12)]">
            <div className="relative aspect-[4/5]">
              <Image
                src={getCloudinaryImageUrl(featuredProduct.imagePublicId, { width: 1000, height: 1250 })}
                alt={featuredProduct.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-[#fff6ed]/92 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8c6c53]">Shelf finish spotlight</p>
              <p className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#2b1d16]">
                {featuredProduct.shortTitle}
              </p>
              <p className="mt-2 text-sm text-[#5c4a3d]">{featuredProduct.summary}</p>
            </div>
          </div>
        }
      />

      <Section>
        <Container>
          <SectionIntro
            eyebrow="How It Works"
            title="A clear four-step path from cabinet opening to replacement shelf."
            body="The homepage now does one job: point you into the measurement guide or directly into the two live cabinet shelf products."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cabinetShelfHomepageContent.howItWorks.map((step, index) => (
              <article key={step.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8c6c53]">Step {index + 1}</p>
                <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#2b1d16]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{step.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="tinted">
        <Container>
          <CabinetShelfFinishComparison
            eyebrow={cabinetShelfHomepageContent.finishComparison.eyebrow}
            title={cabinetShelfHomepageContent.finishComparison.title}
            body={cabinetShelfHomepageContent.finishComparison.body}
            finishes={cabinetShelfFinishComparisons}
            showDecisionAid
            decisionAidTitle="Which one is right for me?"
            decisionAidChoices={[
              "Choose White Melamine if you want a bright, crisp, practical replacement look.",
              "Choose Maple Melamine if you want a warmer, more finished cabinet appearance."
            ]}
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionIntro
              eyebrow="Measurement Help"
              title="Not sure how to measure? Start with the guide."
              body="Most first-time customers need the same help first: measure the inside width, note the depth, and leave a simple 1/8 inch clearance so the shelf fits without forcing it."
            />
            <div className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">Quick fit rule</p>
              <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
                {cabinetShelfSupportContent.confidenceTitle}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#5c4a3d]">{cabinetShelfSupportContent.confidenceBody}</p>
              <div className="mt-5 rounded-[1rem] border border-[#ded1c4] bg-[#f8efe5] p-4 text-sm text-[#4f3f33]">
                {cabinetShelfSupportContent.confidenceExample}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/guides/how-to-measure-cabinet-shelves" className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
                  Read the Measurement Guide
                </Link>
                <Link href="/shop/cabinet-shelves" className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]">
                  Shop Cabinet Shelves
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="tinted">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <SectionIntro
                eyebrow="Why Craft & Board"
                title={cabinetShelfHomepageContent.whyCraftBoard.title}
                body={cabinetShelfHomepageContent.whyCraftBoard.body}
              />
            </div>
            <div className="space-y-4">
              {cabinetShelfSupportContent.trustPoints.map((point) => (
                <div key={point} className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] px-5 py-5 text-sm leading-7 text-[#4f3f33]">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionIntro
            eyebrow="Cabinet Shelf Use Cases"
            title="Built for the cabinets homeowners actually need to fix."
            body="The first release is intentionally practical: replacement shelves for common cabinet spaces where the fit, finish, and ordering confidence matter most."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cabinetShelfHomepageContent.useCases.map((useCase) => (
              <article key={useCase.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#2b1d16]">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{useCase.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <CTA
            eyebrow={cabinetShelfHomepageContent.finalCta.eyebrow}
            title={cabinetShelfHomepageContent.finalCta.title}
            body={cabinetShelfHomepageContent.finalCta.body}
            primary={{
              href: cabinetShelfHomepageContent.finalCta.primaryHref,
              label: cabinetShelfHomepageContent.finalCta.primaryLabel
            }}
            secondary={{
              href: cabinetShelfHomepageContent.finalCta.secondaryHref,
              label: cabinetShelfHomepageContent.finalCta.secondaryLabel
            }}
          />
        </Container>
      </Section>
    </>
  );
}
