import type { Metadata } from "next";
import { Container } from "../../../../../../components/storefront/Container";
import { Section } from "../../../../../../components/storefront/Section";
import { StorefrontChangeRequestPage } from "../../../../../../components/storefront/StorefrontChangeRequestPage";
import { storefrontTitle } from "../../../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Request a Change"),
  description: "Submit a reviewed post-purchase change request for your Craft & Board order."
};

export default async function StorefrontChangeRequestRoute({
  params
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const resolved = await params;

  return (
    <Section>
      <Container>
        <StorefrontChangeRequestPage publicToken={resolved.publicToken} />
      </Container>
    </Section>
  );
}
