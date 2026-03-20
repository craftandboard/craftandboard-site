import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import type { CraftBoardOutreachTargetStatus } from "@prisma/client";

type SeededOutreachTargetInput = {
  sourceKey: string;
  domain: string;
  siteName: string;
  targetType: string;
  authorityTier: string;
  topicCluster: string;
  fitNotes: string;
  preferredAssetTypes: string[];
  preferredCampaignKeys: string[];
  contactMethod: string | null;
  notes: string | null;
};

type OutreachTargetFilters = {
  status?: CraftBoardOutreachTargetStatus;
  targetType?: string;
  campaignKey?: string;
  authorityTier?: string;
};

const CLOSED_STATUSES = new Set(["WON", "REJECTED", "DEFERRED"]);
const CONTACTED_STATUSES = new Set(["CONTACTED", "FOLLOW_UP_DUE", "RESPONDED", "WON", "REJECTED"]);

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function isFollowUpDue(input: {
  status: string;
  nextFollowUpAt: Date | null;
}) {
  if (CLOSED_STATUSES.has(input.status) || !input.nextFollowUpAt) {
    return false;
  }

  return input.nextFollowUpAt.getTime() <= Date.now();
}

function buildTargetWhere(input: {
  organizationId: string;
  filters?: OutreachTargetFilters;
}) {
  return {
    organizationId: input.organizationId,
    ...(input.filters?.status ? { status: input.filters.status } : {}),
    ...(input.filters?.targetType ? { targetType: input.filters.targetType } : {}),
    ...(input.filters?.authorityTier ? { authorityTier: input.filters.authorityTier } : {}),
    ...(input.filters?.campaignKey ? { preferredCampaignKeys: { has: input.filters.campaignKey } } : {})
  };
}

export async function syncSeededOutreachTargets(input: {
  organizationId: string;
  targets: SeededOutreachTargetInput[];
}) {
  logger.info("Syncing seeded outreach targets", {
    organizationId: input.organizationId,
    targetCount: input.targets.length
  });

  for (const target of input.targets) {
    const existing = await prisma.craftBoardOutreachTarget.findFirst({
      where: {
        organizationId: input.organizationId,
        OR: [
          { domain: target.domain },
          { sourceKey: target.sourceKey }
        ]
      },
      select: { id: true }
    });

    if (existing) {
      await prisma.craftBoardOutreachTarget.update({
        where: { id: existing.id },
        data: {
          sourceKey: target.sourceKey,
          domain: target.domain,
          siteName: target.siteName,
          targetType: target.targetType,
          authorityTier: target.authorityTier,
          topicCluster: target.topicCluster,
          fitNotes: target.fitNotes,
          preferredAssetTypes: target.preferredAssetTypes,
          preferredCampaignKeys: target.preferredCampaignKeys,
          contactMethod: target.contactMethod,
          isSeeded: true,
          source: "SEEDED"
        }
      });
      continue;
    }

    await prisma.craftBoardOutreachTarget.create({
      data: {
        organizationId: input.organizationId,
        sourceKey: target.sourceKey,
        domain: target.domain,
        siteName: target.siteName,
        targetType: target.targetType,
        authorityTier: target.authorityTier,
        topicCluster: target.topicCluster,
        fitNotes: target.fitNotes,
        preferredAssetTypes: target.preferredAssetTypes,
        preferredCampaignKeys: target.preferredCampaignKeys,
        contactMethod: target.contactMethod,
        notes: target.notes,
        source: "SEEDED",
        isSeeded: true,
        status: "PROSPECT"
      }
    });
  }

  const total = await prisma.craftBoardOutreachTarget.count({
    where: { organizationId: input.organizationId }
  });

  return {
    ok: true as const,
    targetCount: total
  };
}

export async function listCraftBoardOutreachWorkspace(input: {
  organizationId: string;
  filters?: OutreachTargetFilters;
  targetId?: string;
}) {
  const where = buildTargetWhere({
    organizationId: input.organizationId,
    filters: input.filters
  });

  const [allTargets, filteredTargets, recentActivities, selectedTarget] = await Promise.all([
    prisma.craftBoardOutreachTarget.findMany({
      where: { organizationId: input.organizationId },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.craftBoardOutreachTarget.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.craftBoardOutreachActivity.findMany({
      where: { organizationId: input.organizationId },
      include: {
        outreachTarget: {
          select: {
            id: true,
            siteName: true,
            domain: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.craftBoardOutreachTarget.findFirst({
      where: input.targetId
        ? {
            id: input.targetId,
            organizationId: input.organizationId
          }
        : {
            id: "__not_found__",
            organizationId: input.organizationId
          },
      include: {
        activities: {
          orderBy: { createdAt: "desc" }
        }
      }
    })
  ]);

  const followUpsDue = allTargets
    .filter((target) => isFollowUpDue({ status: target.status, nextFollowUpAt: target.nextFollowUpAt }))
    .sort((left, right) => {
      const leftTime = left.nextFollowUpAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.nextFollowUpAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 10);

  const campaignProgress = [...new Set(allTargets.flatMap((target) => target.preferredCampaignKeys))]
    .filter((campaignKey) => campaignKey.trim().length > 0)
    .map((campaignKey) => {
      const assignedTargets = allTargets.filter((target) => target.preferredCampaignKeys.includes(campaignKey));

      return {
        campaignKey,
        assignedCount: assignedTargets.length,
        contactedCount: assignedTargets.filter((target) => CONTACTED_STATUSES.has(target.status)).length,
        followUpDueCount: assignedTargets.filter((target) =>
          isFollowUpDue({ status: target.status, nextFollowUpAt: target.nextFollowUpAt })
        ).length,
        wonCount: assignedTargets.filter((target) => target.status === "WON").length,
        rejectedCount: assignedTargets.filter((target) => target.status === "REJECTED").length
      };
    })
    .sort((left, right) => {
      if (right.wonCount !== left.wonCount) {
        return right.wonCount - left.wonCount;
      }
      if (right.contactedCount !== left.contactedCount) {
        return right.contactedCount - left.contactedCount;
      }
      return right.assignedCount - left.assignedCount;
    });

  return {
    ok: true as const,
    summary: {
      totalTargets: allTargets.length,
      qualifiedTargets: allTargets.filter((target) => target.status === "QUALIFIED").length,
      contactedTargets: allTargets.filter((target) => CONTACTED_STATUSES.has(target.status)).length,
      followUpsDue: followUpsDue.length,
      linksWon: allTargets.filter((target) => target.status === "WON").length,
      rejectedTargets: allTargets.filter((target) => target.status === "REJECTED").length,
      activeCampaigns: campaignProgress.filter((campaign) => campaign.contactedCount > 0 || campaign.followUpDueCount > 0).length
    },
    targets: filteredTargets.map((target) => ({
      id: target.id,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString(),
      domain: target.domain,
      siteName: target.siteName,
      targetType: target.targetType,
      authorityTier: target.authorityTier,
      topicCluster: target.topicCluster,
      fitNotes: target.fitNotes,
      preferredAssetTypes: target.preferredAssetTypes,
      preferredCampaignKeys: target.preferredCampaignKeys,
      topCampaignKey: target.preferredCampaignKeys[0] ?? null,
      status: target.status,
      primaryContactName: target.primaryContactName,
      primaryContactEmail: target.primaryContactEmail,
      contactMethod: target.contactMethod,
      lastContactedAt: toIso(target.lastContactedAt),
      nextFollowUpAt: toIso(target.nextFollowUpAt),
      lastResponseAt: toIso(target.lastResponseAt),
      notes: target.notes,
      source: target.source,
      isSeeded: target.isSeeded,
      latestActivityNote: target.activities[0]?.note ?? null,
      latestActivityAt: toIso(target.activities[0]?.createdAt),
      followUpDue: isFollowUpDue({ status: target.status, nextFollowUpAt: target.nextFollowUpAt })
    })),
    followUpsDue: followUpsDue.map((target) => ({
      id: target.id,
      siteName: target.siteName,
      domain: target.domain,
      campaignKey: target.preferredCampaignKeys[0] ?? null,
      nextFollowUpAt: toIso(target.nextFollowUpAt),
      lastContactedAt: toIso(target.lastContactedAt),
      notes: target.notes
    })),
    campaignProgress,
    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      createdAt: activity.createdAt.toISOString(),
      activityType: activity.activityType,
      campaignKey: activity.campaignKey,
      assetPageKey: activity.assetPageKey,
      note: activity.note,
      outcome: activity.outcome,
      nextFollowUpAt: toIso(activity.nextFollowUpAt),
      target: {
        id: activity.outreachTarget.id,
        siteName: activity.outreachTarget.siteName,
        domain: activity.outreachTarget.domain
      }
    })),
    selectedTarget: selectedTarget
      ? {
          id: selectedTarget.id,
          createdAt: selectedTarget.createdAt.toISOString(),
          updatedAt: selectedTarget.updatedAt.toISOString(),
          domain: selectedTarget.domain,
          siteName: selectedTarget.siteName,
          targetType: selectedTarget.targetType,
          authorityTier: selectedTarget.authorityTier,
          topicCluster: selectedTarget.topicCluster,
          fitNotes: selectedTarget.fitNotes,
          preferredAssetTypes: selectedTarget.preferredAssetTypes,
          preferredCampaignKeys: selectedTarget.preferredCampaignKeys,
          status: selectedTarget.status,
          primaryContactName: selectedTarget.primaryContactName,
          primaryContactEmail: selectedTarget.primaryContactEmail,
          contactMethod: selectedTarget.contactMethod,
          lastContactedAt: toIso(selectedTarget.lastContactedAt),
          nextFollowUpAt: toIso(selectedTarget.nextFollowUpAt),
          lastResponseAt: toIso(selectedTarget.lastResponseAt),
          notes: selectedTarget.notes,
          source: selectedTarget.source,
          isSeeded: selectedTarget.isSeeded,
          activities: selectedTarget.activities.map((activity) => ({
            id: activity.id,
            createdAt: activity.createdAt.toISOString(),
            activityType: activity.activityType,
            campaignKey: activity.campaignKey,
            assetPageKey: activity.assetPageKey,
            note: activity.note,
            outcome: activity.outcome,
            nextFollowUpAt: toIso(activity.nextFollowUpAt)
          }))
        }
      : null
  };
}

export async function createCraftBoardOutreachTarget(input: {
  organizationId: string;
  siteName: string;
  domain: string;
  targetType: string;
  authorityTier: string;
  topicCluster: string;
  fitNotes: string;
  preferredAssetTypes?: string[];
  preferredCampaignKeys?: string[];
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  contactMethod?: string | null;
  notes?: string | null;
}) {
  const target = await prisma.craftBoardOutreachTarget.create({
    data: {
      organizationId: input.organizationId,
      siteName: input.siteName,
      domain: input.domain,
      targetType: input.targetType,
      authorityTier: input.authorityTier,
      topicCluster: input.topicCluster,
      fitNotes: input.fitNotes,
      preferredAssetTypes: input.preferredAssetTypes ?? [],
      preferredCampaignKeys: input.preferredCampaignKeys ?? [],
      primaryContactName: input.primaryContactName ?? null,
      primaryContactEmail: input.primaryContactEmail ?? null,
      contactMethod: input.contactMethod ?? null,
      notes: input.notes ?? null,
      source: "MANUAL",
      isSeeded: false,
      status: "PROSPECT"
    }
  });

  return {
    ok: true as const,
    targetId: target.id
  };
}

export async function updateCraftBoardOutreachTarget(input: {
  organizationId: string;
  targetId: string;
  siteName?: string;
  domain?: string;
  targetType?: string;
  authorityTier?: string;
  topicCluster?: string;
  fitNotes?: string;
  preferredAssetTypes?: string[];
  preferredCampaignKeys?: string[];
  status?: string;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  contactMethod?: string | null;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
  lastResponseAt?: Date | null;
  notes?: string | null;
}) {
  await prisma.craftBoardOutreachTarget.updateMany({
    where: {
      id: input.targetId,
      organizationId: input.organizationId
    },
    data: {
      ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
      ...(input.domain !== undefined ? { domain: input.domain } : {}),
      ...(input.targetType !== undefined ? { targetType: input.targetType } : {}),
      ...(input.authorityTier !== undefined ? { authorityTier: input.authorityTier } : {}),
      ...(input.topicCluster !== undefined ? { topicCluster: input.topicCluster } : {}),
      ...(input.fitNotes !== undefined ? { fitNotes: input.fitNotes } : {}),
      ...(input.preferredAssetTypes !== undefined ? { preferredAssetTypes: input.preferredAssetTypes } : {}),
      ...(input.preferredCampaignKeys !== undefined ? { preferredCampaignKeys: input.preferredCampaignKeys } : {}),
      ...(input.status !== undefined ? { status: input.status as any } : {}),
      ...(input.primaryContactName !== undefined ? { primaryContactName: input.primaryContactName } : {}),
      ...(input.primaryContactEmail !== undefined ? { primaryContactEmail: input.primaryContactEmail } : {}),
      ...(input.contactMethod !== undefined ? { contactMethod: input.contactMethod } : {}),
      ...(input.lastContactedAt !== undefined ? { lastContactedAt: input.lastContactedAt } : {}),
      ...(input.nextFollowUpAt !== undefined ? { nextFollowUpAt: input.nextFollowUpAt } : {}),
      ...(input.lastResponseAt !== undefined ? { lastResponseAt: input.lastResponseAt } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {})
    }
  });

  return { ok: true as const };
}

export async function createCraftBoardOutreachActivity(input: {
  organizationId: string;
  targetId: string;
  activityType: string;
  campaignKey?: string | null;
  assetPageKey?: string | null;
  note: string;
  outcome?: string | null;
  nextFollowUpAt?: Date | null;
  status?: string | null;
}) {
  const now = new Date();

  await prisma.$transaction(async (transaction) => {
    await transaction.craftBoardOutreachActivity.create({
      data: {
        organizationId: input.organizationId,
        outreachTargetId: input.targetId,
        activityType: input.activityType as any,
        campaignKey: input.campaignKey ?? null,
        assetPageKey: input.assetPageKey ?? null,
        note: input.note,
        outcome: input.outcome ?? null,
        nextFollowUpAt: input.nextFollowUpAt ?? null
      }
    });

    const targetUpdate: Record<string, unknown> = {};

    if (input.activityType === "CONTACT_ATTEMPT" || input.activityType === "FOLLOW_UP") {
      targetUpdate.lastContactedAt = now;
    }
    if (input.activityType === "RESPONSE" || input.activityType === "LINK_WON" || input.activityType === "REJECTION") {
      targetUpdate.lastResponseAt = now;
    }
    if (input.nextFollowUpAt !== undefined) {
      targetUpdate.nextFollowUpAt = input.nextFollowUpAt;
    }

    if (input.status) {
      targetUpdate.status = input.status;
    } else if (input.activityType === "CONTACT_ATTEMPT") {
      targetUpdate.status = "CONTACTED";
    } else if (input.activityType === "FOLLOW_UP") {
      targetUpdate.status = "FOLLOW_UP_DUE";
    } else if (input.activityType === "RESPONSE") {
      targetUpdate.status = "RESPONDED";
    } else if (input.activityType === "LINK_WON") {
      targetUpdate.status = "WON";
    } else if (input.activityType === "REJECTION") {
      targetUpdate.status = "REJECTED";
    }

    await transaction.craftBoardOutreachTarget.updateMany({
      where: {
        id: input.targetId,
        organizationId: input.organizationId
      },
      data: targetUpdate
    });
  });

  return { ok: true as const };
}
