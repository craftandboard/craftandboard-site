import type { Metadata } from "next";
import { PublicProposalPage } from "../../../components/storefront/PublicProposalPage";
import { StorefrontShell } from "../../../components/storefront/StorefrontShell";

export async function generateMetadata({
  params
}: {
  params: Promise<{ publicToken: string }>;
}): Promise<Metadata> {
  const resolved = await params;

  return {
    title: `Craft & Board Proposal ${resolved.publicToken.slice(0, 8)}`,
    description: "Private Craft & Board proposal review page.",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function PublicProposalTokenPage({
  params
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const resolved = await params;

  return (
    <StorefrontShell>
      <PublicProposalPage publicToken={resolved.publicToken} />
    </StorefrontShell>
  );
}
