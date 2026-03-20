import type { Metadata } from "next";
import { categories } from "../../../content/categories";
import { CategoryCard } from "../../../components/storefront/CategoryCard";
import { Container } from "../../../components/storefront/Container";
import { CTA } from "../../../components/storefront/CTA";
import { Hero } from "../../../components/storefront/Hero";
import { Section } from "../../../components/storefront/Section";
import { SectionIntro } from "../../../components/storefront/SectionIntro";
import { generatePageSEO } from "../../../lib/seo/metadata";
import { storefrontTitle } from "../../../lib/storefront/config";

export const metadata: Metadata = generatePageSEO({
  title: storefrontTitle("Shop Custom Floating Shelves"),
  description: "Browse the first Craft & Board collection of custom-made floating shelves and future architectural wood categories.",
  pathname: "/shop"
});

export default function ShopPage() {
  return (
    <>
      <Hero
        eyebrow="Shop"
        title="Made-to-order pieces built around the project, not a stock catalog."
        body="Craft & Board begins with custom floating shelves and a clear path toward additional architectural wood products."
        primaryCta={{ href: "/shop/floating-shelves", label: "Browse Floating Shelves" }}
      />
      <Section>
        <Container>
          <SectionIntro
            eyebrow="Launch Collection"
            title="Start with the shelf line built for custom sizing."
            body="Every Craft & Board product is positioned as custom and made to order. Floating Shelves are the first active family because they offer the clearest path into visual merchandising, dimension capture, and a strong request flow."
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
          <CTA
            eyebrow="First Collection"
            title="Floating Shelves are the first active line for a reason."
            body="They are easy to understand visually, flexible enough for real projects, and the strongest place to start a premium quote-first custom order experience."
            primary={{ href: "/shop/floating-shelves", label: "Explore Floating Shelves" }}
            secondary={{ href: "/contact", label: "Start a Request" }}
          />
        </Container>
      </Section>
    </>
  );
}
