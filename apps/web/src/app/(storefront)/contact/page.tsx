import type { Metadata } from "next";
import { shelfInquiryConfig } from "../../../content/inquiry";
import { Container } from "../../../components/storefront/Container";
import { SectionIntro } from "../../../components/storefront/SectionIntro";
import { InquiryForm } from "../../../components/storefront/InquiryForm";
import { Section } from "../../../components/storefront/Section";
import { storefrontTitle } from "../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Contact"),
  description: "Start a structured Craft & Board shelf request with dimensions, finish direction, and mounting details."
};

export default function ContactPage() {
  return (
    <Section>
      <Container className="space-y-8">
        <SectionIntro
          eyebrow="Contact"
          title="Start a real custom shelf request."
          body="Craft & Board products are made to order. Send the shelf dimensions, finish direction, mounting preferences, and any room-specific notes you already know."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {shelfInquiryConfig.helperCopy.checklist.map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] px-5 py-5 text-sm leading-7 text-[#4f3f33]">
              {item}
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {shelfInquiryConfig.helperCopy.reassurance.map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[#dccdbc] bg-[#f7eee4] px-5 py-4 text-sm text-[#5c4a3d]">
              {item}
            </div>
          ))}
        </div>
        <InquiryForm />
      </Container>
    </Section>
  );
}
