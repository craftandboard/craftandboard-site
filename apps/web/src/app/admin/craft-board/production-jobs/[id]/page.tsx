import { CraftBoardProductionJobDetail } from "../../../../../components/craft-board-production-job-detail";

export default async function CraftBoardProductionJobDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  return <CraftBoardProductionJobDetail productionJobId={resolved.id} />;
}
