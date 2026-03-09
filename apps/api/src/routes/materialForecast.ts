import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { createBatchFromForecastSelection, getMaterialForecast } from "../modules/materialForecast/service.js";

const router = Router();

const createForecastBatchSchema = z
  .object({
    materialCode: z
      .enum(["WHITE_MELAMINE", "MAPLE_MELAMINE", "BIRCH_18", "WALNUT_18", "MAPLE_18", "MDF_18"])
      .optional(),
    jobIds: z.array(z.string().min(1)).optional(),
    partIds: z.array(z.string().min(1)).optional(),
    batchName: z.string().trim().min(1).max(120).optional()
  })
  .refine((value) => (value.jobIds?.length ?? 0) > 0 || (value.partIds?.length ?? 0) > 0, {
    message: "Select at least one forecast job or part to create a batch."
  });

router.get("/", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const payload = await getMaterialForecast(context.currentOrganization.id);
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
    next(error);
  }
});

router.post("/create-batch", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "batch_build");
    const body = createForecastBatchSchema.parse(req.body);
    const payload = await createBatchFromForecastSelection(body, context.currentOrganization.id);
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

export default router;
