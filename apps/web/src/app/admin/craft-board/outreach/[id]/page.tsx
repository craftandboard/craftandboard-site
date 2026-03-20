import { notFound } from "next/navigation";
import { CraftBoardOutreachTargetDetail } from "../../../../../components/craft-board-outreach-workspace";
import { buildCraftBoardOutreachDraftPacket } from "../../../../../lib/seo/outreachDrafts";
import { getCraftBoardOutreachWorkspaceData } from "../../../../../lib/seo/outreach";

export const dynamic = "force-dynamic";

export default async function CraftBoardOutreachTargetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const workspace = await getCraftBoardOutreachWorkspaceData({
    targetId: resolved.id
  });

  if (!workspace?.selectedTarget) {
    notFound();
  }

  const draftPacket = await buildCraftBoardOutreachDraftPacket({
    target: workspace.selectedTarget
  });

  return <CraftBoardOutreachTargetDetail workspace={workspace} draftPacket={draftPacket} />;
}
