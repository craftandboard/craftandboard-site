import { CraftBoardProposalDetail } from "../../../../../components/craft-board-proposal-detail";

export default async function CraftBoardProposalDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  return <CraftBoardProposalDetail proposalId={resolved.id} />;
}
