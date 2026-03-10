import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getWorkModuleReadContext,
  getWorkModuleWriteContext
} from "../modules/projects/adapters/contextAdapter.js";
import {
  createWorkModule,
  getWorkModuleDetailView,
  listWorkModulesView,
  updateWorkModule
} from "../modules/workModules/service.js";

const router = Router();
const workModuleCreateSchema = z.object({
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(160),
  status: z.string().trim().max(64).optional(),
  summary: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).optional()
});

const workModuleUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    status: z.string().trim().max(64).nullable().optional(),
    summary: z.string().trim().max(500).nullable().optional(),
    sortOrder: z.number().int().min(0).optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one work module field must be provided."
  });

function handleWorkModuleRouteError(error: unknown, res: any, next: any) {
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
    const status = error.message === "Project not found." || error.message === "Work module not found." ? 404 : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

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
    handleWorkModuleRouteError(error, res, next);
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
    handleWorkModuleRouteError(error, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const context = getWorkModuleWriteContext(req);
    const body = workModuleCreateSchema.parse(req.body);

    res.status(201).json(
      await createWorkModule({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleWorkModuleRouteError(error, res, next);
  }
});

router.patch("/:workModuleId", async (req, res, next) => {
  try {
    const context = getWorkModuleWriteContext(req);
    const params = z.object({ workModuleId: z.string().trim().min(1) }).parse(req.params);
    const body = workModuleUpdateSchema.parse(req.body);

    res.json(
      await updateWorkModule({
        organizationId: context.currentOrganization.id,
        workModuleId: params.workModuleId,
        ...body
      })
    );
  } catch (error) {
    handleWorkModuleRouteError(error, res, next);
  }
});

export default router;
