import type { Metadata } from "next";
import { galleryItems, galleryPageContent } from "../../../content/gallery";
import { CTA } from "../../../components/storefront/CTA";
import { Container } from "../../../components/storefront/Container";
import { GalleryGrid } from "../../../components/storefront/GalleryGrid";
import { Section } from "../../../components/storefront/Section";
import { SectionIntro } from "../../../components/storefront/SectionIntro";
import { generatePageSEO } from "../../../lib/seo/metadata";
import { storefrontTitle } from "../../../lib/storefront/config";

export const metadata: Metadata = generatePageSEO({
  title: storefrontTitle("Gallery"),
  description: "Browse early inspiration imagery for Craft & Board floating shelves and architectural wood details.",
  pathname: "/gallery"
});

export default function GalleryPage() {
  return (
    <>
      <Section>
        <Container>
          <SectionIntro eyebrow="Gallery" title={galleryPageContent.title} body={galleryPageContent.body} />
          <GalleryGrid items={galleryItems} columns="three" />
        </Container>
      </Section>
      <Section tone="tinted">
        <Container>
          <CTA
            eyebrow="From Inspiration to Request"
            title="When the room and the shelf start to make sense together, move into the collection."
            body="Use the shelf product page to define dimensions, finish direction, and mounting questions while the visual references are still fresh."
            primary={{ href: galleryPageContent.cta.href, label: galleryPageContent.cta.label }}
            secondary={{ href: "/contact", label: "Start an Inquiry" }}
          />
        </Container>
      </Section>
    </>
  );
}
