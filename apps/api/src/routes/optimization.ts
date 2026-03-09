import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { checkRemnantCandidates } from "../modules/remnants/service.js";

const router = Router();

const remnantCheckSchema = z.object({
  materialType: z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]),
  thicknessIn: z.number().positive(),
  requiredLengthIn: z.number().positive(),
  requiredWidthIn: z.number().positive(),
  quantity: z.number().int().positive().optional()
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
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/remnant-check", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const body = remnantCheckSchema.parse(req.body ?? {});
    res.json(await checkRemnantCandidates({ ...body, organizationId: context.currentOrganization.id }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
