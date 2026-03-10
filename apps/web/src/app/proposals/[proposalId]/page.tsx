import { MvpProposalEditor } from "../../../components/mvp-proposal-editor";

export default async function ProposalEditorPage({
  params
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  return <MvpProposalEditor proposalId={proposalId} />;
}
