import { CraftBoardOutreachWorkspace } from "../../../../components/craft-board-outreach-workspace";
import { getCraftBoardOutreachWorkspaceData } from "../../../../lib/seo/outreach";

export const dynamic = "force-dynamic";

export default async function CraftBoardOutreachWorkspacePage({
  searchParams
}: {
  searchParams?: Promise<{
    status?: string;
    targetType?: string;
    campaignKey?: string;
    authorityTier?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const workspace = await getCraftBoardOutreachWorkspaceData({
    status: resolvedSearchParams?.status,
    targetType: resolvedSearchParams?.targetType,
    campaignKey: resolvedSearchParams?.campaignKey,
    authorityTier: resolvedSearchParams?.authorityTier
  });

  if (!workspace) {
    throw new Error("Failed to load outreach workspace.");
  }

  return (
    <CraftBoardOutreachWorkspace
      workspace={workspace}
      filters={{
        status: resolvedSearchParams?.status,
        targetType: resolvedSearchParams?.targetType,
        campaignKey: resolvedSearchParams?.campaignKey,
        authorityTier: resolvedSearchParams?.authorityTier
      }}
    />
  );
}
