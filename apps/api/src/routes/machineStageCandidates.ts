import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { MACHINE_STAGE_CANDIDATE_STATUSES, MACHINE_TELEMETRY_ENTITY_TYPES } from "../modules/machineTelemetry/contracts.js";
import { getMachineStageCandidate, listMachineStageCandidates } from "../modules/machineTelemetry/service.js";

const router = Router();

const listMachineStageCandidateQuerySchema = z.object({
  status: z.enum(MACHINE_STAGE_CANDIDATE_STATUSES).optional(),
  entityType: z.enum(MACHINE_TELEMETRY_ENTITY_TYPES).optional(),
  machineSourceId: z.string().trim().min(1).optional()
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
    res.status(error.message === "Machine stage candidate not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    const query = listMachineStageCandidateQuerySchema.parse(req.query);
    res.json(await listMachineStageCandidates(query, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineStageCandidate(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
