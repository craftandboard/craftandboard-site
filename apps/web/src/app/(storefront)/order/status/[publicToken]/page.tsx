import type { Metadata } from "next";
import { Container } from "../../../../../components/storefront/Container";
import { Section } from "../../../../../components/storefront/Section";
import { StorefrontOrderStatusPage } from "../../../../../components/storefront/StorefrontOrderStatusPage";
import { storefrontTitle } from "../../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Order Status"),
  description: "View the latest customer-safe status update for your Craft & Board order."
};

export default async function CustomerOrderStatusPage({
  params
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const resolved = await params;

  return (
    <Section>
      <Container>
        <StorefrontOrderStatusPage publicToken={resolved.publicToken} />
      </Container>
    </Section>
  );
}
