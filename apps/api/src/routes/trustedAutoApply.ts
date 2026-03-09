import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { MACHINE_TYPES } from "../modules/machines/contracts.js";
import { TRUSTED_AUTO_APPLY_ACTIONS } from "../modules/trustedAutoApply/contracts.js";
import {
  createTrustedAutoApplyRule,
  disableTrustedAutoApplyRule,
  listTrustedAutoApplyRules,
  updateTrustedAutoApplyRule
} from "../modules/trustedAutoApply/service.js";

const router = Router();

const createSchema = z
  .object({
    machineId: z.string().trim().min(1).optional(),
    machineType: z.enum(MACHINE_TYPES).optional(),
    candidateAction: z.enum(TRUSTED_AUTO_APPLY_ACTIONS),
    enabled: z.boolean().optional(),
    notes: z.string().trim().max(500).optional()
  })
  .refine((value) => Boolean(value.machineId || value.machineType), {
    message: "Trusted auto-apply rules must target a machine or machine type."
  })
  .refine((value) => !(value.machineId && value.machineType), {
    message: "Trusted auto-apply rules must target either a machine or machine type, not both."
  });

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  notes: z.string().trim().max(500).optional()
});

function handleRouteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.issues[0]?.message ?? error.message });
    return;
  }
  if (error instanceof Error) {
    res.status(error.message.endsWith("not found.") ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/rules", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "trusted_auto_apply_read");
    res.json(await listTrustedAutoApplyRules(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/rules", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "trusted_auto_apply_manage");
    const body = createSchema.parse(req.body ?? {});
    res.status(201).json(await createTrustedAutoApplyRule(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/rules/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "trusted_auto_apply_manage");
    const body = updateSchema.parse(req.body ?? {});
    res.json(await updateTrustedAutoApplyRule(req.params.id, body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/rules/:id/disable", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "trusted_auto_apply_manage");
    res.json(await disableTrustedAutoApplyRule(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
