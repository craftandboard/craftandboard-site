import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { transitionPartStatusById, transitionPartStatusByLabelCode, transitionPartStatusByScanCode } from "../modules/parts/service.js";

const router = Router();
const partParamsSchema = z.object({
  partId: z.string().min(1)
});
const transitionSchema = z.object({
  nextStatus: z.enum(["CUT", "EDGEBANDED", "PACKED"])
});
const scanSchema = z.object({
  scanCode: z.string().min(1).optional(),
  labelCode: z.string().min(1).optional(),
  nextStatus: z.enum(["CUT", "EDGEBANDED", "PACKED"])
}).refine((value) => value.scanCode || value.labelCode, {
  message: "scanCode or labelCode is required."
});

router.post("/:partId/status", async (req, res, next) => {
  try {
    const params = partParamsSchema.parse(req.params);
    const body = transitionSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "part_transition");
    const result = await transitionPartStatusById(
      params.partId,
      body.nextStatus.toLowerCase() as "cut" | "edgebanded" | "packed",
      context.currentOrganization.id
    );

    res.json({
      ok: true,
      action: "transition-part",
      part: result.part,
      ...(result.jobStatus ? { jobStatus: result.jobStatus } : {}),
      ...(result.orderStatus ? { orderStatus: result.orderStatus } : {})
    });
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
      res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/scan", async (req, res, next) => {
  try {
    const body = scanSchema.parse(req.body);
    const transitionStatus = body.nextStatus.toLowerCase() as "cut" | "edgebanded" | "packed";
    const context = getRequestContext(req);
    assertCapability(context, "part_transition");
    const result = body.scanCode
      ? await transitionPartStatusByScanCode(body.scanCode, transitionStatus, context.currentOrganization.id)
      : await transitionPartStatusByLabelCode(body.labelCode!, transitionStatus, context.currentOrganization.id);

    res.json({
      ok: true,
      action: "transition-part",
      part: result.part,
      ...(result.jobStatus ? { jobStatus: result.jobStatus } : {}),
      ...(result.orderStatus ? { orderStatus: result.orderStatus } : {})
    });
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
      res.status(error.message.includes("not found") ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
