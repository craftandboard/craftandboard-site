import { PublicProposalAcceptancePage } from "../../../components/public-proposal-acceptance-page";

export default async function AcceptProposalPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <PublicProposalAcceptancePage token={params.token ?? ""} />;
}
