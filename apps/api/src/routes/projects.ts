import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getProjectReadContext,
  getProjectTaskWriteContext,
  getProjectWriteContext
} from "../modules/projects/adapters/contextAdapter.js";
import {
  createProject,
  createProjectTask,
  getProjectDetailView,
  listProjectsView,
  updateProject,
  updateProjectTask
} from "../modules/projects/service.js";

const router = Router();
const projectCreateSchema = z.object({
  key: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().max(240).optional(),
  status: z.string().trim().max(64).optional(),
  stage: z.string().trim().max(64).optional(),
  scopeSummary: z.string().trim().max(1000).optional()
});

const projectUpdateSchema = projectCreateSchema
  .partial()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one project field must be provided."
  });

const taskWriteSchema = z.object({
  phaseId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  status: z.string().trim().min(1).max(32).optional(),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  assignedToUserId: z.string().trim().min(1).nullable().optional(),
  isRequired: z.boolean().optional()
});

function toOptionalDate(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function handleProjectRouteError(error: unknown, res: any, next: any) {
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
    const status =
      error.message === "Project not found."
        ? 404
        : error.message === "Project task not found." || error.message === "Work module not found."
          ? 404
          : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

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
    handleProjectRouteError(error, res, next);
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
    handleProjectRouteError(error, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const context = getProjectWriteContext(req);
    const body = projectCreateSchema.parse(req.body);

    res.status(201).json(
      await createProject({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleProjectRouteError(error, res, next);
  }
});

router.patch("/:projectId", async (req, res, next) => {
  try {
    const context = getProjectWriteContext(req);
    const params = z.object({ projectId: z.string().trim().min(1) }).parse(req.params);
    const body = projectUpdateSchema.parse(req.body);

    res.json(
      await updateProject({
        organizationId: context.currentOrganization.id,
        projectId: params.projectId,
        ...body
      })
    );
  } catch (error) {
    handleProjectRouteError(error, res, next);
  }
});

router.post("/:projectId/tasks", async (req, res, next) => {
  try {
    const context = getProjectTaskWriteContext(req);
    const params = z.object({ projectId: z.string().trim().min(1) }).parse(req.params);
    const body = taskWriteSchema
      .extend({
        title: z.string().trim().min(1).max(160)
      })
      .parse(req.body);

    res.status(201).json(
      await createProjectTask({
        organizationId: context.currentOrganization.id,
        projectId: params.projectId,
        phaseId: body.phaseId,
        title: body.title,
        status: body.status,
        dueDate: toOptionalDate(body.dueDate),
        assignedToUserId: body.assignedToUserId,
        isRequired: body.isRequired
      })
    );
  } catch (error) {
    handleProjectRouteError(error, res, next);
  }
});

router.patch("/:projectId/tasks/:taskId", async (req, res, next) => {
  try {
    const context = getProjectTaskWriteContext(req);
    const params = z
      .object({
        projectId: z.string().trim().min(1),
        taskId: z.string().trim().min(1)
      })
      .parse(req.params);
    const body = taskWriteSchema.refine(
      (value) => Object.values(value).some((entry) => entry !== undefined),
      { message: "At least one task field must be provided." }
    ).parse(req.body);

    res.json(
      await updateProjectTask({
        organizationId: context.currentOrganization.id,
        projectId: params.projectId,
        taskId: params.taskId,
        title: body.title,
        status: body.status,
        dueDate: toOptionalDate(body.dueDate),
        assignedToUserId: body.assignedToUserId,
        isRequired: body.isRequired
      })
    );
  } catch (error) {
    handleProjectRouteError(error, res, next);
  }
});

export default router;
