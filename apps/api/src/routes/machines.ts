import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { MACHINE_STATUSES, MACHINE_TYPES } from "../modules/machines/contracts.js";
import { createMachine, getMachineDetail, listMachineEvents, listMachines, updateMachine } from "../modules/machines/service.js";
import { MACHINE_SOURCE_TYPES } from "../modules/machineTelemetry/contracts.js";
import {
  createMachineSource,
  getMachineSource,
  listMachineSources,
  updateMachineSource
} from "../modules/machineTelemetry/service.js";

const router = Router();

const createMachineSchema = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  type: z.enum(MACHINE_TYPES),
  status: z.enum(MACHINE_STATUSES).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  adapterType: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const createMachineSourceSchema = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  machineType: z.enum(MACHINE_TYPES),
  sourceType: z.enum(MACHINE_SOURCE_TYPES),
  status: z.enum(MACHINE_STATUSES).optional(),
  currentLocationId: z.string().trim().min(1).optional(),
  currentLocationCode: z.string().trim().min(1).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  adapterType: z.string().trim().max(120).optional(),
  metadataJson: z.unknown().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional()
});

const updateMachineSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(MACHINE_STATUSES).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  adapterType: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const updateMachineSourceSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  machineType: z.enum(MACHINE_TYPES).optional(),
  sourceType: z.enum(MACHINE_SOURCE_TYPES).optional(),
  status: z.enum(MACHINE_STATUSES).optional(),
  currentLocationId: z.string().trim().min(1).nullable().optional(),
  currentLocationCode: z.string().trim().min(1).optional(),
  locationLabel: z.string().trim().max(120).optional(),
  adapterType: z.string().trim().max(120).optional(),
  metadataJson: z.unknown().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional()
});

const listEventsQuerySchema = z.object({
  eventType: z.string().trim().min(1).optional(),
  processingStatus: z.string().trim().min(1).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional()
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
    res.status(error.message === "Machine not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await listMachines(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/sources", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await listMachineSources(context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/sources", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = createMachineSourceSchema.parse(req.body ?? {});
    res.status(201).json(await createMachineSource(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/sources/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineSource(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/sources/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = updateMachineSourceSchema.parse(req.body ?? {});
    res.json(await updateMachineSource(req.params.id, body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = createMachineSchema.parse(req.body ?? {});
    res.status(201).json(await createMachine(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    res.json(await getMachineDetail(req.params.id, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/:id/update", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = updateMachineSchema.parse(req.body ?? {});
    res.json(await updateMachine(req.params.id, body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/:id/events", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_read");
    const query = listEventsQuerySchema.parse(req.query);
    res.json(
      await listMachineEvents(
        {
          machineId: req.params.id,
          ...query
        },
        context.currentOrganization.id
      )
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
