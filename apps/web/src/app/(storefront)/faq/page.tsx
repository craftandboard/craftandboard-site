import type { Metadata } from "next";
import { faqItems, faqPageContent } from "../../../content/faq";
import { CTA } from "../../../components/storefront/CTA";
import { Container } from "../../../components/storefront/Container";
import { FaqList } from "../../../components/storefront/FaqList";
import { Section } from "../../../components/storefront/Section";
import { SectionIntro } from "../../../components/storefront/SectionIntro";
import { generatePageSEO } from "../../../lib/seo/metadata";
import { storefrontTitle } from "../../../lib/storefront/config";

export const metadata: Metadata = generatePageSEO({
  title: storefrontTitle("FAQ"),
  description: "Answers about custom sizing, lead times, finishes, and the Craft & Board quote-first process.",
  pathname: "/faq"
});

export default function FaqPage() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <SectionIntro eyebrow="FAQ" title={faqPageContent.title} body={faqPageContent.body} />
          <FaqList items={faqItems} />
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="Still Need Clarity"
            title="Use the inquiry form even if a few product decisions are still in progress."
            body="The notes field exists for room details, mounting questions, and custom context that does not fit neatly into a stock-product flow."
            primary={{ href: "/contact", label: "Open Inquiry Form" }}
            secondary={{ href: "/shop/floating-shelves", label: "View the Shelf" }}
          />
        </Container>
      </Section>
    </>
  );
}
