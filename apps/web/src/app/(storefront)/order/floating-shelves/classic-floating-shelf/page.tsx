import type { Metadata } from "next";
import { Container } from "../../../../../components/storefront/Container";
import { FloatingShelfCheckout } from "../../../../../components/storefront/FloatingShelfCheckout";
import { Section } from "../../../../../components/storefront/Section";
import { parseFloatingShelfConfigFromSearchParams } from "../../../../../lib/storefront/order";
import { storefrontTitle } from "../../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Floating Shelf Order"),
  description:
    "Complete a standard Craft & Board floating shelf order with customer details, shipping information, and payment-mode selection."
};

export default async function FloatingShelfOrderPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const configuration = parseFloatingShelfConfigFromSearchParams(resolved);

  return (
    <Section>
      <Container>
        <div className="mb-8">
          <p className="text-sm text-[#7a6657]">Shop / Floating Shelves / Order</p>
          <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-5xl text-[#241811]">
            Start Your Shelf Order
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">
            Standard shelves can move from live configuration and pricing into a structured order submission. Review-required conditions still route into the premium review path instead of pretending every wall is checkout-ready.
          </p>
        </div>
        <FloatingShelfCheckout initialConfiguration={configuration} />
      </Container>
    </Section>
  );
}
