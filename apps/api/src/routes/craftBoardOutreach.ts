import { Router } from "express";
import { z } from "zod";
import type { CraftBoardOutreachTargetStatus } from "@prisma/client";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createCraftBoardOutreachActivity,
  createCraftBoardOutreachTarget,
  listCraftBoardOutreachWorkspace,
  syncSeededOutreachTargets,
  updateCraftBoardOutreachTarget
} from "../modules/craftBoardOutreach/service.js";

const router = Router();

const workspaceQuerySchema = z.object({
  status: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  campaignKey: z.string().trim().optional(),
  authorityTier: z.string().trim().optional(),
  targetId: z.string().trim().optional()
});

const seedTargetSchema = z.object({
  sourceKey: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  siteName: z.string().trim().min(1),
  targetType: z.string().trim().min(1),
  authorityTier: z.string().trim().min(1),
  topicCluster: z.string().trim().min(1),
  fitNotes: z.string().trim().min(1),
  preferredAssetTypes: z.array(z.string().trim().min(1)).default([]),
  preferredCampaignKeys: z.array(z.string().trim().min(1)).default([]),
  contactMethod: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional()
});

const syncSeedsSchema = z.object({
  targets: z.array(seedTargetSchema)
});

const createTargetSchema = z.object({
  siteName: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  targetType: z.string().trim().min(1),
  authorityTier: z.string().trim().min(1),
  topicCluster: z.string().trim().min(1),
  fitNotes: z.string().trim().min(1),
  preferredAssetTypes: z.array(z.string().trim().min(1)).optional(),
  preferredCampaignKeys: z.array(z.string().trim().min(1)).optional(),
  primaryContactName: z.string().trim().nullable().optional(),
  primaryContactEmail: z.string().trim().nullable().optional(),
  contactMethod: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional()
});

const updateTargetSchema = z.object({
  siteName: z.string().trim().min(1).optional(),
  domain: z.string().trim().min(1).optional(),
  targetType: z.string().trim().min(1).optional(),
  authorityTier: z.string().trim().min(1).optional(),
  topicCluster: z.string().trim().min(1).optional(),
  fitNotes: z.string().trim().min(1).optional(),
  preferredAssetTypes: z.array(z.string().trim().min(1)).optional(),
  preferredCampaignKeys: z.array(z.string().trim().min(1)).optional(),
  status: z.string().trim().min(1).optional(),
  primaryContactName: z.string().trim().nullable().optional(),
  primaryContactEmail: z.string().trim().nullable().optional(),
  contactMethod: z.string().trim().nullable().optional(),
  lastContactedAt: z.string().datetime().nullable().optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  lastResponseAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().nullable().optional()
});

const targetParamsSchema = z.object({
  id: z.string().trim().min(1)
});

const createActivitySchema = z.object({
  activityType: z.string().trim().min(1),
  campaignKey: z.string().trim().nullable().optional(),
  assetPageKey: z.string().trim().nullable().optional(),
  note: z.string().trim().min(1),
  outcome: z.string().trim().nullable().optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  status: z.string().trim().nullable().optional()
});

function handleRouteError(error: unknown, res: any, next: any) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof Error) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return value === null ? null : undefined;
  }

  return new Date(value);
}

router.get("/craft-board/outreach/workspace", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = workspaceQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardOutreachWorkspace({
        organizationId: context.currentOrganization.id,
        filters: {
          status: query.status as CraftBoardOutreachTargetStatus | undefined,
          targetType: query.targetType,
          campaignKey: query.campaignKey,
          authorityTier: query.authorityTier
        },
        targetId: query.targetId
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/craft-board/outreach/targets/sync-seeds", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const body = syncSeedsSchema.parse(req.body ?? {});
    res.json(
      await syncSeededOutreachTargets({
        organizationId: context.currentOrganization.id,
        targets: body.targets.map((target) => ({
          ...target,
          contactMethod: target.contactMethod ?? null,
          notes: target.notes ?? null
        }))
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/craft-board/outreach/targets", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const body = createTargetSchema.parse(req.body ?? {});
    res.json(
      await createCraftBoardOutreachTarget({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/outreach/targets/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = targetParamsSchema.parse(req.params);
    const body = updateTargetSchema.parse(req.body ?? {});
    res.json(
      await updateCraftBoardOutreachTarget({
        organizationId: context.currentOrganization.id,
        targetId: params.id,
        ...body,
        lastContactedAt: parseDateValue(body.lastContactedAt),
        nextFollowUpAt: parseDateValue(body.nextFollowUpAt),
        lastResponseAt: parseDateValue(body.lastResponseAt)
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/craft-board/outreach/targets/:id/activities", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = targetParamsSchema.parse(req.params);
    const body = createActivitySchema.parse(req.body ?? {});
    res.json(
      await createCraftBoardOutreachActivity({
        organizationId: context.currentOrganization.id,
        targetId: params.id,
        activityType: body.activityType,
        campaignKey: body.campaignKey,
        assetPageKey: body.assetPageKey,
        note: body.note,
        outcome: body.outcome,
        nextFollowUpAt: parseDateValue(body.nextFollowUpAt),
        status: body.status
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
