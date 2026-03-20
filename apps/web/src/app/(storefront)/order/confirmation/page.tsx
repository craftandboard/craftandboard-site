import type { Metadata } from "next";
import { Container } from "../../../../components/storefront/Container";
import { Section } from "../../../../components/storefront/Section";
import { StorefrontOrderConfirmation } from "../../../../components/storefront/StorefrontOrderConfirmation";
import { storefrontTitle } from "../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Order Confirmation"),
  description:
    "Review the confirmation details for a Craft & Board floating shelf order submission."
};

export default async function StorefrontOrderConfirmationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;

  return (
    <Section>
      <Container>
        <StorefrontOrderConfirmation searchParams={resolved} />
      </Container>
    </Section>
  );
}
