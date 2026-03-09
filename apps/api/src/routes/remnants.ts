import { type NextFunction, type Response, Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  allocateRemnant,
  assignRemnantToContainer,
  checkRemnantCandidates,
  consumeRemnant,
  createRemnant,
  generateRemnantLabel,
  getRemnantAllocationDetail,
  getRemnantDetail,
  getRemnantLabelHtml,
  getRemnantLabelPayload,
  listRemnants,
  listRemnantAllocations,
  moveRemnant,
  releaseRemnantAllocation,
  reprintRemnantLabel,
  reserveRemnant,
  unassignRemnantFromContainer,
  updateRemnantStatus,
  updateRemnant
} from "../modules/remnants/service.js";

const router = Router();

const remnantStatusSchema = z.enum(["AVAILABLE", "RESERVED", "ALLOCATED", "PARTIAL", "CONSUMED", "HOLD", "SCRAP", "SCRAPPED"]);
const materialCodeSchema = z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"]);
const remnantSourceTypeSchema = z.enum(["CNC_LEFTOVER", "FULL_SHEET_LEFTOVER", "MANUAL", "MANUAL_ENTRY", "IMPORTED"]);
const remnantGrainDirectionSchema = z.enum(["NONE", "LENGTH", "WIDTH", "UNKNOWN"]);
const remnantEdgeConditionSchema = z.enum(["RAW", "ONE_CLEAN_EDGE", "TWO_CLEAN_EDGES", "MIXED", "UNKNOWN"]);
const remnantQualityGradeSchema = z.enum(["A", "B", "C", "UNKNOWN"]);
const remnantAllocationTargetTypeSchema = z.enum(["SHELF_JOB", "MANUFACTURING_BATCH", "COST_SCENARIO", "MANUAL"]);

const createRemnantSchema = z.object({
  materialCode: materialCodeSchema,
  materialLabel: z.string().trim().min(1).max(120).optional(),
  materialName: z.string().trim().min(1).max(120).optional(),
  thicknessIn: z.number().positive(),
  edgeBandPattern: z.enum(["ALL_FOUR"]).optional(),
  lengthIn: z.number().positive(),
  widthIn: z.number().positive(),
  usableAreaSqIn: z.number().positive().optional(),
  sourceReferenceId: z.string().trim().min(1).max(120).optional(),
  sourceBatchId: z.string().min(1).optional(),
  sourcePacketId: z.string().min(1).optional(),
  sourcePartId: z.string().min(1).optional(),
  sourceType: remnantSourceTypeSchema.optional(),
  grainDirection: remnantGrainDirectionSchema.optional(),
  edgeCondition: remnantEdgeConditionSchema.optional(),
  status: remnantStatusSchema.optional(),
  qualityGrade: remnantQualityGradeSchema.optional(),
  barcodeValue: z.string().trim().min(1).max(160).optional(),
  qrValue: z.string().trim().min(1).max(160).optional(),
  currentContainerId: z.string().min(1).optional(),
  currentContainerCode: z.string().trim().min(1).max(120).optional(),
  currentLocationId: z.string().min(1).optional(),
  currentLocationCode: z.string().trim().min(1).max(120).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const updateRemnantSchema = z.object({
  status: remnantStatusSchema.optional(),
  materialName: z.string().trim().min(1).max(120).nullable().optional(),
  grainDirection: remnantGrainDirectionSchema.nullable().optional(),
  edgeCondition: remnantEdgeConditionSchema.nullable().optional(),
  qualityGrade: remnantQualityGradeSchema.nullable().optional(),
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

const moveRemnantSchema = z.object({
  containerId: z.string().min(1).optional(),
  containerCode: z.string().trim().min(1).max(120).optional(),
  locationId: z.string().min(1).optional(),
  locationCode: z.string().trim().min(1).max(120).optional(),
  reason: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const assignRemnantContainerSchema = z.object({
  containerId: z.string().min(1).optional(),
  containerCode: z.string().trim().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).refine((value) => value.containerId || value.containerCode, {
  message: "containerId or containerCode is required."
});

const reserveAllocateSchema = z.object({
  targetType: remnantAllocationTargetTypeSchema,
  targetId: z.string().min(1),
  reservedAreaSqIn: z.number().positive().optional(),
  reservedLengthIn: z.number().positive().optional(),
  reservedWidthIn: z.number().positive().optional(),
  notes: z.string().trim().max(500).optional()
});

const releaseAllocationSchema = z.object({
  notes: z.string().trim().max(500).optional()
});

const allocationQuerySchema = z.object({
  remnantId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "RELEASED", "CONSUMED", "CANCELLED"]).optional()
});

const remnantCheckSchema = z.object({
  materialType: materialCodeSchema,
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

router.get("/allocations", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const query = allocationQuerySchema.parse(req.query);
    const payload = await listRemnantAllocations({ ...query, organizationId: context.currentOrganization.id });
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/allocations/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const payload = await getRemnantAllocationDetail(req.params.id, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/check", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const body = remnantCheckSchema.parse(req.body ?? {});
    const payload = await checkRemnantCandidates({ ...body, organizationId: context.currentOrganization.id });
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

router.get("/:id/label-payload", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const payload = await getRemnantLabelPayload(req.params.id, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id/label.html", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_read");
    const payload = await getRemnantLabelHtml(req.params.id, context.currentOrganization.id);
    res.type("html").send(payload.html);
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

router.post("/:id/move", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = moveRemnantSchema.parse(req.body ?? {});
    const payload = await moveRemnant({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      movedByUserId: context.currentUser.id,
      containerId: body.containerId,
      containerCode: body.containerCode,
      locationId: body.locationId,
      locationCode: body.locationCode,
      reason: body.reason,
      metadata: body.metadata
    });
    res.json(payload);
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

router.post("/:id/status", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = z.object({
      status: remnantStatusSchema,
      notes: z.string().trim().max(500).optional()
    }).parse(req.body ?? {});
    const payload = await updateRemnantStatus({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      status: body.status,
      notes: body.notes
    });
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/assign-container", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = assignRemnantContainerSchema.parse(req.body ?? {});
    const payload = await assignRemnantToContainer({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      containerId: body.containerId,
      containerCode: body.containerCode,
      movedByUserId: context.currentUser.id,
      metadata: body.metadata
    });
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/unassign-container", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = z.object({
      metadata: z.record(z.string(), z.unknown()).optional()
    }).parse(req.body ?? {});
    const payload = await unassignRemnantFromContainer({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      movedByUserId: context.currentUser.id,
      metadata: body.metadata
    });
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

router.post("/:id/reserve", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = reserveAllocateSchema.parse(req.body ?? {});
    const payload = await reserveRemnant({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      createdByUserId: context.currentUser.id,
      ...body
    });
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/allocate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = reserveAllocateSchema.parse(req.body ?? {});
    const payload = await allocateRemnant({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      createdByUserId: context.currentUser.id,
      ...body
    });
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/release-allocation", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = releaseAllocationSchema.parse(req.body ?? {});
    const payload = await releaseRemnantAllocation({
      allocationId: req.params.id,
      organizationId: context.currentOrganization.id,
      releasedByUserId: context.currentUser.id,
      notes: body.notes
    });
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

router.post("/:id/reprint-label", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "remnant_manage");
    const body = z.object({
      renderFormat: z.enum(["JSON", "HTML", "PDF"]).optional()
    }).parse(req.body ?? {});
    const payload = await reprintRemnantLabel({
      remnantId: req.params.id,
      organizationId: context.currentOrganization.id,
      createdByUserId: context.currentUser.id,
      renderFormat: body.renderFormat
    });
    res.status(201).json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
