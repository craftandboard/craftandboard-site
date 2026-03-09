import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { assignPartToContainer, createContainer, getBatchSortingView, removePartFromContainer } from "../modules/containers/service.js";

const router = Router();

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
    const body = createContainerSchema.parse(req.body);
    const payload = await createContainer(body, context.currentOrganization.id);
    res.status(201).json(payload);
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
      res.status(400).json({ ok: false, error: error.issues[0]?.message ?? error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
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
      res.status(error.message === "Batch not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
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
      res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
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
      res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
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
      res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
