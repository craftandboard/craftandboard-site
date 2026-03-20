import type { Metadata } from "next";
import { Container } from "../../../../../../components/storefront/Container";
import { Section } from "../../../../../../components/storefront/Section";
import { StorefrontOrderIssuePage } from "../../../../../../components/storefront/StorefrontOrderIssuePage";
import { storefrontTitle } from "../../../../../../lib/storefront/config";

export const metadata: Metadata = {
  title: storefrontTitle("Report an Issue"),
  description: "Submit a reviewed post-delivery issue report for your Craft & Board order."
};

export default async function StorefrontOrderIssueRoute({
  params
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const resolved = await params;

  return (
    <Section>
      <Container>
        <StorefrontOrderIssuePage publicToken={resolved.publicToken} />
      </Container>
    </Section>
  );
}
