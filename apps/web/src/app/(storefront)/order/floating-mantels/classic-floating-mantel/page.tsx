import type { Metadata } from "next";
import { Container } from "../../../../../components/storefront/Container";
import { FloatingMantelCheckout } from "../../../../../components/storefront/FloatingMantelCheckout";
import { Section } from "../../../../../components/storefront/Section";
import { storefrontTitle } from "../../../../../lib/storefront/config";
import { parseFloatingMantelConfigFromSearchParams } from "../../../../../lib/storefront/order";

export const metadata: Metadata = {
  title: storefrontTitle("Floating Mantel Order"),
  description:
    "Complete a standard Craft & Board floating mantel order with customer details, shipping information, and payment-mode selection."
};

export default async function FloatingMantelOrderPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const configuration = parseFloatingMantelConfigFromSearchParams(resolved);

  return (
    <Section>
      <Container>
        <div className="mb-8">
          <p className="text-sm text-[#7a6657]">Shop / Floating Mantels / Order</p>
          <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-5xl text-[#241811]">
            Start Your Mantel Order
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4a3d]">
            Standard mantels can move from live configuration and pricing into a structured order submission. Review-required conditions still route into the premium review path instead of pretending every fireplace wall is checkout-ready.
          </p>
        </div>
        <FloatingMantelCheckout initialConfiguration={configuration} />
      </Container>
    </Section>
  );
}
