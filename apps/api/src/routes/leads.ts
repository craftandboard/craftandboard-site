import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getLeadReadContext } from "../modules/leads/adapters/contextAdapter.js";
import { getLeadDetailView, listLeadsView } from "../modules/leads/service.js";

const router = Router();

function handleLeadRouteError(error: unknown, res: any, next: any) {
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
    res.status(error.message === "Lead not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getLeadReadContext(req);
    const query = z.object({ q: z.string().trim().optional() }).parse(req.query);

    res.json(
      await listLeadsView({
        organizationId: context.currentOrganization.id,
        query: query.q
      })
    );
  } catch (error) {
    handleLeadRouteError(error, res, next);
  }
});

router.get("/:leadLookup", async (req, res, next) => {
  try {
    const context = getLeadReadContext(req);
    const params = z.object({ leadLookup: z.string().trim().min(1) }).parse(req.params);

    res.json(
      await getLeadDetailView({
        organizationId: context.currentOrganization.id,
        leadLookup: params.leadLookup
      })
    );
  } catch (error) {
    handleLeadRouteError(error, res, next);
  }
});

export default router;

