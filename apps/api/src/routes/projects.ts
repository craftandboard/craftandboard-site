import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getProjectReadContext } from "../modules/projects/adapters/contextAdapter.js";
import { getProjectDetailView, listProjectsView } from "../modules/projects/service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const context = getProjectReadContext(req);
    const query = z
      .object({
        q: z.string().trim().optional()
      })
      .parse(req.query);

    res.json(
      await listProjectsView({
        organizationId: context.currentOrganization.id,
        query: query.q
      })
    );
  } catch (error) {
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
    next(error);
  }
});

router.get("/:projectLookup", async (req, res, next) => {
  try {
    const context = getProjectReadContext(req);
    const params = z.object({ projectLookup: z.string().trim().min(1) }).parse(req.params);

    res.json(
      await getProjectDetailView({
        organizationId: context.currentOrganization.id,
        projectLookup: params.projectLookup
      })
    );
  } catch (error) {
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
      res.status(error.message === "Project not found." ? 404 : 400).json({
        ok: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
});

export default router;

