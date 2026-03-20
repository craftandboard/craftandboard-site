import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { listStorefrontSeoAttributionAttempts } from "../modules/craftBoardStorefront/seo/service.js";

const router = Router();

const storefrontSeoAttributionQuerySchema = z.object({
  lookbackDays: z.coerce.number().int().min(1).max(365).optional()
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

router.get("/craft-board/storefront/seo-attribution", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = storefrontSeoAttributionQuerySchema.parse(req.query);
    res.json(
      await listStorefrontSeoAttributionAttempts({
        organizationId: context.currentOrganization.id,
        lookbackDays: query.lookbackDays ?? 28
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
