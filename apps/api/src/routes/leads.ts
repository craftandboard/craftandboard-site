import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getLeadReadContext, getLeadWriteContext } from "../modules/leads/adapters/contextAdapter.js";
import { createLead, getLeadDetailView, listLeadsView, updateLead } from "../modules/leads/service.js";

const router = Router();
const leadCreateSchema = z.object({
  projectId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  status: z.string().trim().min(1).max(64).nullable().optional(),
  stage: z.string().trim().max(64).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional()
});

const leadUpdateSchema = leadCreateSchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: "At least one lead field must be provided." }
);

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
    const status =
      error.message === "Lead not found." || error.message === "Project not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
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

router.post("/", async (req, res, next) => {
  try {
    const context = getLeadWriteContext(req);
    const body = leadCreateSchema.parse(req.body);

    res.status(201).json(
      await createLead({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleLeadRouteError(error, res, next);
  }
});

router.patch("/:leadId", async (req, res, next) => {
  try {
    const context = getLeadWriteContext(req);
    const params = z.object({ leadId: z.string().trim().min(1) }).parse(req.params);
    const body = leadUpdateSchema.parse(req.body);

    res.json(
      await updateLead({
        organizationId: context.currentOrganization.id,
        leadId: params.leadId,
        ...body
      })
    );
  } catch (error) {
    handleLeadRouteError(error, res, next);
  }
});

export default router;
