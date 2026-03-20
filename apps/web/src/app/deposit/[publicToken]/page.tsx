import type { Metadata } from "next";
import { PublicDepositPage } from "../../../components/storefront/PublicDepositPage";
import { StorefrontShell } from "../../../components/storefront/StorefrontShell";

export async function generateMetadata({
  params
}: {
  params: Promise<{ publicToken: string }>;
}): Promise<Metadata> {
  const resolved = await params;

  return {
    title: `Craft & Board Deposit ${resolved.publicToken.slice(0, 8)}`,
    description: "Private Craft & Board deposit request.",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function PublicDepositTokenPage({
  params
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const resolved = await params;

  return (
    <StorefrontShell>
      <PublicDepositPage publicToken={resolved.publicToken} />
    </StorefrontShell>
  );
}
