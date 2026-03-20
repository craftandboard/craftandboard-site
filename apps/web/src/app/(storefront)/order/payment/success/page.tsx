import type { Metadata } from "next";
import { Container } from "../../../../../components/storefront/Container";
import { Section } from "../../../../../components/storefront/Section";
import { StorefrontOrderConfirmation } from "../../../../../components/storefront/StorefrontOrderConfirmation";
import { storefrontTitle } from "../../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Deposit Payment Success"),
  description:
    "Review the confirmed deposit payment state for a Craft & Board floating shelf order."
};

export default async function StorefrontPaymentSuccessPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;

  return (
    <Section>
      <Container>
        <StorefrontOrderConfirmation searchParams={resolved} variant="payment-success" />
      </Container>
    </Section>
  );
}
