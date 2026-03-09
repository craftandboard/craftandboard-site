import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  MACHINE_EVENT_PROCESSING_STATUSES,
  MACHINE_EVENT_SOURCE_TYPES,
  MACHINE_EVENT_TYPES
} from "../modules/machines/contracts.js";
import { ingestMachineEvent, listMachineEvents } from "../modules/machines/service.js";
import { simulateMachineEvent } from "../modules/machines/simulation.js";

const router = Router();

const machineEventBaseSchema = z.object({
  machineId: z.string().trim().min(1).optional(),
  machineCode: z.string().trim().min(1).optional(),
  eventType: z.enum(MACHINE_EVENT_TYPES),
  eventTs: z.string().trim().min(1).optional(),
  sourceType: z.enum(MACHINE_EVENT_SOURCE_TYPES),
  sourceEventId: z.string().trim().min(1).optional(),
  payload: z.unknown().optional(),
  batchRef: z.string().trim().min(1).optional(),
  jobRef: z.string().trim().min(1).optional(),
  partRef: z.string().trim().min(1).optional(),
  scanCode: z.string().trim().min(1).optional(),
  sheetRef: z.string().trim().min(1).optional(),
  severity: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional()
});

const machineEventSchema = machineEventBaseSchema.refine((value) => value.machineId || value.machineCode, {
  message: "machineId or machineCode is required."
});

const simulatedMachineEventSchema = machineEventBaseSchema
  .omit({ sourceType: true })
  .refine((value) => value.machineId || value.machineCode, {
    message: "machineId or machineCode is required."
  });

const machineEventListQuerySchema = z.object({
  machineId: z.string().trim().min(1).optional(),
  eventType: z.enum(MACHINE_EVENT_TYPES).optional(),
  processingStatus: z.enum(MACHINE_EVENT_PROCESSING_STATUSES).optional(),
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
    const query = machineEventListQuerySchema.parse(req.query);
    res.json(await listMachineEvents(query, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/ingest", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = machineEventSchema.parse(req.body ?? {});
    res.status(201).json(await ingestMachineEvent(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/simulate", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "machine_manage");
    const body = simulatedMachineEventSchema.parse(req.body ?? {});
    res.status(201).json(await simulateMachineEvent(body, context.currentOrganization.id));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
