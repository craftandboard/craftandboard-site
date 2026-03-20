import type { Metadata } from "next";
import { aboutPageContent } from "../../../content/about";
import { CTA } from "../../../components/storefront/CTA";
import { Container } from "../../../components/storefront/Container";
import { Section } from "../../../components/storefront/Section";
import { SectionIntro } from "../../../components/storefront/SectionIntro";
import { generatePageSEO } from "../../../lib/seo/metadata";
import { storefrontTitle } from "../../../lib/storefront/config";

export const metadata: Metadata = generatePageSEO({
  title: storefrontTitle("About"),
  description: "Learn the Craft & Board approach to made-to-order shelving, craftsmanship, and clean architectural fit.",
  pathname: "/about"
});

export default function AboutPage() {
  return (
    <>
      <Section>
        <Container className="space-y-12">
          <SectionIntro eyebrow="About Craft & Board" title={aboutPageContent.hero.title} body={aboutPageContent.hero.body} />
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="space-y-6 text-base leading-8 text-[#5c4a3d]">
              {aboutPageContent.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="space-y-5">
              {aboutPageContent.values.map((value) => (
                <article key={value.title} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                  <h2 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{value.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5c4a3d]">{value.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {aboutPageContent.process.map((step, index) => (
              <div key={step} className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8c6c53]">Process {index + 1}</p>
                <p className="mt-4 text-sm leading-7 text-[#4f3f33]">{step}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <CTA
            eyebrow="Next Step"
            title="Bring the project details into the shelf request flow."
            body="If the dimensions are ready, start the inquiry. If the project is still taking shape, the contact flow still gives room to explain the context."
            primary={{ href: aboutPageContent.cta.href, label: aboutPageContent.cta.label }}
            secondary={{ href: "/shop/floating-shelves", label: "Browse Shelves" }}
          />
        </Container>
      </Section>
    </>
  );
}
