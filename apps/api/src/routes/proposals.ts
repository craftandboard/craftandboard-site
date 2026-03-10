import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getProposalReadContext } from "../modules/leads/adapters/contextAdapter.js";
import { getProposalDetailView, listProposalsView } from "../modules/proposals/service.js";

const router = Router();

function handleProposalRouteError(error: unknown, res: any, next: any) {
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
    res.status(error.message === "Proposal not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getProposalReadContext(req);
    const query = z.object({ q: z.string().trim().optional() }).parse(req.query);

    res.json(
      await listProposalsView({
        organizationId: context.currentOrganization.id,
        query: query.q
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.get("/:proposalLookup", async (req, res, next) => {
  try {
    const context = getProposalReadContext(req);
    const params = z.object({ proposalLookup: z.string().trim().min(1) }).parse(req.params);

    res.json(
      await getProposalDetailView({
        organizationId: context.currentOrganization.id,
        proposalLookup: params.proposalLookup
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

export default router;
