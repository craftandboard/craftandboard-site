import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getWorkModuleReadContext } from "../modules/projects/adapters/contextAdapter.js";
import { getWorkModuleDetailView, listWorkModulesView } from "../modules/workModules/service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const context = getWorkModuleReadContext(req);
    const query = z
      .object({
        projectId: z.string().trim().optional()
      })
      .parse(req.query);

    res.json(
      await listWorkModulesView({
        organizationId: context.currentOrganization.id,
        projectLookup: query.projectId
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

router.get("/:workModuleId", async (req, res, next) => {
  try {
    const context = getWorkModuleReadContext(req);
    const params = z.object({ workModuleId: z.string().trim().min(1) }).parse(req.params);

    res.json(
      await getWorkModuleDetailView({
        organizationId: context.currentOrganization.id,
        workModuleId: params.workModuleId
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
      res.status(error.message === "Work module not found." ? 404 : 400).json({
        ok: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
});

export default router;
