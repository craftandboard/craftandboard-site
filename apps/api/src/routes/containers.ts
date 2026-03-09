import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { assignPartToContainer, createContainer, getBatchSortingView, removePartFromContainer } from "../modules/containers/service.js";
import {
  activateContainerSchema,
  assignPartToActiveContainerSchema,
  assignPartToExplicitContainerSchema,
  createContainerLocationSchema,
  createManagedContainerSchema,
  listContainerAssignmentsQuerySchema,
  moveContainerSchema,
  scanContainerSchema,
  scanLocationSchema,
  unassignPartSchema,
  updateContainerLocationSchema,
  updateManagedContainerSchema
} from "../modules/containers/schemas.js";
import {
  activateContainerSessionRecord,
  assignManufacturingPartToActiveContainer,
  assignManufacturingPartToContainer,
  createContainerLocationRecord,
  createManagedContainer,
  deactivateContainerSessionRecord,
  getContainerAssignmentView,
  getContainerPartsView,
  getManagedContainer,
  listActiveContainerSessionsView,
  listContainerAssignmentsView,
  listContainerLocations,
  listManagedContainers,
  moveContainerToLocation,
  scanContainerForActivation,
  scanLocationForContainerMove,
  unassignManufacturingPartFromContainer,
  updateContainerLocationRecord,
  updateManagedContainer
} from "../modules/containers/workflowService.js";

const router = Router();

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
    const maybeScanEvent = (error as Error & { scanEvent?: unknown }).scanEvent;
    res.status(error.message.toLowerCase().includes("not found") ? 404 : 400).json({
      ok: false,
      error: error.message,
      ...(maybeScanEvent ? { event: maybeScanEvent } : {})
    });
    return;
  }
  next(error);
}

const createContainerSchema = z.object({
  batchId: z.string().min(1),
  type: z.enum(["CONTAINER", "BIN"]),
  code: z.string().trim().min(1).max(80).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  orderId: z.string().min(1).optional(),
  manufacturingJobId: z.string().min(1).optional(),
  notes: z.string().trim().max(500).optional()
});

const batchParamsSchema = z.object({
  batchId: z.string().min(1)
});

const assignPartSchema = z.object({
  containerId: z.string().min(1),
  partId: z.string().min(1).optional(),
  scanCode: z.string().min(1).optional(),
  allowReassign: z.boolean().optional()
}).refine((value) => value.partId || value.scanCode, {
  message: "partId or scanCode is required."
});

const removePartSchema = z.object({
  containerId: z.string().min(1),
  partId: z.string().min(1).optional(),
  scanCode: z.string().min(1).optional()
}).refine((value) => value.partId || value.scanCode, {
  message: "partId or scanCode is required."
});

router.post("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const legacyParse = createContainerSchema.safeParse(req.body ?? {});

    if (legacyParse.success) {
      const payload = await createContainer(legacyParse.data, context.currentOrganization.id);
      res.status(201).json(payload);
      return;
    }

    const body = createManagedContainerSchema.parse(req.body ?? {});
    const payload = await createManagedContainer({ organizationId: context.currentOrganization.id, ...body });
    res.status(201).json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/batch/:batchId", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const params = batchParamsSchema.parse(req.params);
    const payload = await getBatchSortingView(params.batchId, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/locations", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await listContainerLocations(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/locations", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = createContainerLocationSchema.parse(req.body ?? {});
    res.status(201).json(await createContainerLocationRecord({ organizationId: context.currentOrganization.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/locations/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = updateContainerLocationSchema.parse(req.body ?? {});
    res.json(await updateContainerLocationRecord({ organizationId: context.currentOrganization.id, locationId: req.params.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/move", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = moveContainerSchema.parse(req.body ?? {});
    res.json(
      await moveContainerToLocation({
        organizationId: context.currentOrganization.id,
        containerId: req.params.id,
        toLocationId: body.toLocationId,
        toLocationCode: body.toLocationCode,
        movedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/activate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = activateContainerSchema.parse(req.body ?? {});
    res.json(
      await activateContainerSessionRecord({
        organizationId: context.currentOrganization.id,
        containerId: req.params.id,
        stationType: body.stationType,
        startedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/deactivate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(
      await deactivateContainerSessionRecord({
        organizationId: context.currentOrganization.id,
        containerId: req.params.id,
        endedByUserId: context.currentUser.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/assign", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = assignPartSchema.parse(req.body);
    const payload = await assignPartToContainer(body, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/assign-part", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = assignPartToExplicitContainerSchema.parse(req.body ?? {});
    res.json(
      await assignManufacturingPartToContainer({
        organizationId: context.currentOrganization.id,
        containerId: body.containerId,
        containerScanValue: body.containerScanValue,
        partId: body.partId,
        partScanValue: body.partScanValue,
        assignedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scan", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = assignPartSchema.parse(req.body);
    const payload = await assignPartToContainer(body, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/assign-part-to-active", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = assignPartToActiveContainerSchema.parse(req.body ?? {});
    res.json(
      await assignManufacturingPartToActiveContainer({
        organizationId: context.currentOrganization.id,
        partId: body.partId,
        partScanValue: body.partScanValue,
        assignedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/remove", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = removePartSchema.parse(req.body);
    const payload = await removePartFromContainer(body, context.currentOrganization.id);
    res.json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/unassign-part", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = unassignPartSchema.parse(req.body ?? {});
    res.json(
      await unassignManufacturingPartFromContainer({
        organizationId: context.currentOrganization.id,
        containerId: body.containerId,
        partId: body.partId,
        partScanValue: body.partScanValue,
        unassignedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/container-assignments", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const query = listContainerAssignmentsQuerySchema.parse(req.query ?? {});
    res.json(await listContainerAssignmentsView({ organizationId: context.currentOrganization.id, ...query }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/container-assignments/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await getContainerAssignmentView(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/active-container-sessions", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await listActiveContainerSessionsView(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scan/container", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = scanContainerSchema.parse(req.body ?? {});
    res.json(
      await scanContainerForActivation({
        organizationId: context.currentOrganization.id,
        scanValue: body.scanValue,
        stationType: body.stationType,
        startedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/scan/location", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = scanLocationSchema.parse(req.body ?? {});
    res.json(
      await scanLocationForContainerMove({
        organizationId: context.currentOrganization.id,
        locationScanValue: body.locationScanValue,
        locationCode: body.locationCode,
        toLocationId: body.toLocationId,
        containerId: body.containerId,
        containerScanValue: body.containerScanValue,
        movedByUserId: context.currentUser.id,
        metadata: body.metadata
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await listManagedContainers(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await getManagedContainer(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    const body = updateManagedContainerSchema.parse(req.body ?? {});
    res.json(await updateManagedContainer({ organizationId: context.currentOrganization.id, containerId: req.params.id, ...body }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id/parts", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "container_sorting");
    res.json(await getContainerPartsView(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
