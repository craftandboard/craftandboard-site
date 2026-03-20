import {
  getCraftBoardOutreachWorkspace,
  syncCraftBoardOutreachSeedTargets,
  type CraftBoardOutreachSeedTargetInput,
  type CraftBoardOutreachWorkspaceResponse
} from "../api";
import { backlinkTargets } from "./backlinkTargets";

function buildSeedPayload(): CraftBoardOutreachSeedTargetInput[] {
  return backlinkTargets.map((target) => ({
    sourceKey: target.id,
    domain: target.domain,
    siteName: target.siteName,
    targetType: target.targetType,
    authorityTier: target.authorityTier,
    topicCluster: target.topicCluster,
    fitNotes: target.fitNotes,
    preferredAssetTypes: target.preferredAssetTypes,
    preferredCampaignKeys: target.preferredCampaignKeys,
    contactMethod: target.contactMethod,
    notes: target.notes
  }));
}

export async function ensureCraftBoardOutreachSeedTargets() {
  return syncCraftBoardOutreachSeedTargets({
    targets: buildSeedPayload()
  });
}

export async function getCraftBoardOutreachWorkspaceData(input?: {
  status?: string;
  targetType?: string;
  campaignKey?: string;
  authorityTier?: string;
  targetId?: string;
}) {
  await ensureCraftBoardOutreachSeedTargets().catch((error) => {
    console.warn("[web][outreach] Failed to sync seeded outreach targets", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  return getCraftBoardOutreachWorkspace(input);
}

export function getTopOutreachCampaignKey(workspace: CraftBoardOutreachWorkspaceResponse | null) {
  return workspace?.campaignProgress[0]?.campaignKey ?? null;
}
