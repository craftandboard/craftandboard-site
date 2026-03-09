import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  STAGE_CANDIDATE_ACTIONS,
  STAGE_CANDIDATE_STATUSES,
  STAGE_CANDIDATE_TARGET_TYPES
} from "../modules/stageSignals/contracts.js";
import {
  applyStageCandidateSignal,
  getStageCandidateSignal,
  listStageCandidateSignals,
  rejectStageCandidateSignal
} from "../modules/stageSignals/service.js";

const router = Router();

const listQuerySchema = z.object({
  status: z.enum(STAGE_CANDIDATE_STATUSES).optional(),
  targetType: z.enum(STAGE_CANDIDATE_TARGET_TYPES).optional(),
  machineId: z.string().trim().min(1).optional(),
  batchId: z.string().trim().min(1).optional(),
  recommendedAction: z.enum(STAGE_CANDIDATE_ACTIONS).optional()
});

const applySchema = z.object({
  note: z.string().trim().max(500).optional()
});

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500)
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
    res.status(error.message === "Stage candidate signal not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "stage_signal_read");
    const query = listQuerySchema.parse(req.query);
    res.json(await listStageCandidateSignals(query, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "stage_signal_read");
    res.json(await getStageCandidateSignal(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/apply", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "stage_signal_manage");
    const body = applySchema.parse(req.body ?? {});
    res.json(
      await applyStageCandidateSignal(
        req.params.id,
        {
          reviewedByMemberId: context.membership.id,
          note: body.note
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/reject", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "stage_signal_manage");
    const body = rejectSchema.parse(req.body ?? {});
    res.json(
      await rejectStageCandidateSignal(
        req.params.id,
        {
          reviewedByMemberId: context.membership.id,
          rejectionReason: body.rejectionReason
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
