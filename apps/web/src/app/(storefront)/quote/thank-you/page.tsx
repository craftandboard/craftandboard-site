import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "../../../../components/storefront/Container";
import { Section } from "../../../../components/storefront/Section";
import { storefrontTitle } from "../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Thank You"),
  description: "Confirmation page for the Craft & Board custom shelf request flow."
};

export default function QuoteThankYouPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <div className="rounded-[2.5rem] border border-[#dbcab9] bg-[#fffaf4] p-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Thank You</p>
          <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-5xl text-[#241811]">
            Your request has been received.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5c4a3d]">
            Craft & Board has your shelf details. Final fit, feasibility, and pricing are confirmed after review, not instantly on the storefront.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#dbcab9] bg-[#f8eee2] p-4 text-sm leading-7 text-[#4f3f33]">
              1. Your dimensions and finish direction are reviewed.
            </div>
            <div className="rounded-[1.5rem] border border-[#dbcab9] bg-[#f8eee2] p-4 text-sm leading-7 text-[#4f3f33]">
              2. Mounting and project notes are considered before response.
            </div>
            <div className="rounded-[1.5rem] border border-[#dbcab9] bg-[#f8eee2] p-4 text-sm leading-7 text-[#4f3f33]">
              3. The next step is confirmed without pretending the request is already final.
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop/floating-shelves"
              className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]"
            >
              Back to Shelves
            </Link>
            <Link
              href="/gallery"
              className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]"
            >
              View Gallery
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
