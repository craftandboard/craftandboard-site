import { type NextFunction, type Response, Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  consumeRemnant,
  createRemnant,
  generateRemnantLabel,
  getRemnantDetail,
  listRemnants,
  updateRemnant
} from "../modules/remnants/service.js";

const router = Router();

const remnantStatusSchema = z.enum(["AVAILABLE", "RESERVED", "PARTIAL", "CONSUMED", "HOLD", "SCRAPPED"]);
const materialCodeSchema = z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]);

const createRemnantSchema = z.object({
  materialCode: materialCodeSchema,
  materialLabel: z.string().trim().min(1).max(120).optional(),
  thicknessIn: z.number().positive(),
  edgeBandPattern: z.enum(["ALL_FOUR"]).optional(),
  lengthIn: z.number().positive(),
  widthIn: z.number().positive(),
  usableAreaSqIn: z.number().positive().optional(),
  sourceBatchId: z.string().min(1).optional(),
  sourceType: z.enum(["FULL_SHEET_LEFTOVER", "MANUAL", "IMPORTED"]).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const updateRemnantSchema = z.object({
  status: remnantStatusSchema.optional(),
  lengthIn: z.number().positive().optional(),
  widthIn: z.number().positive().optional(),
  usableAreaSqIn: z.number().min(0).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const consumeRemnantSchema = z.object({
  usedAreaSqIn: z.number().positive(),
  batchId: z.string().min(1).optional(),
  partId: z.string().min(1).optional(),
  notes: z.string().trim().max(500).optional()
});

const listRemnantsQuerySchema = z.object({
  materialCode: materialCodeSchema.optional(),
  status: remnantStatusSchema.optional(),
  location: z.string().trim().min(1).optional(),
  minimumLengthIn: z.coerce.number().positive().optional(),
  minimumWidthIn: z.coerce.number().positive().optional()
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
    res.status(error.message === "Remnant not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const query = listRemnantsQuerySchema.parse(req.query);
    const payload = await listRemnants(query, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const payload = await getRemnantDetail(req.params.id, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = createRemnantSchema.parse(req.body ?? {});
    const payload = await createRemnant(body, context.currentOrganization.id);
    res.status(201).json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = updateRemnantSchema.parse(req.body ?? {});
    const payload = await updateRemnant(req.params.id, body, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/consume", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = consumeRemnantSchema.parse(req.body ?? {});
    const payload = await consumeRemnant(req.params.id, body, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/label", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const payload = await generateRemnantLabel(req.params.id, context.currentOrganization.id);
    res.status(201).json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
