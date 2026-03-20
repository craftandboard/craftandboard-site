import { CraftBoardDepositDetail } from "../../../../../components/craft-board-deposit-detail";

export default async function CraftBoardDepositDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  return <CraftBoardDepositDetail depositId={resolved.id} />;
}
