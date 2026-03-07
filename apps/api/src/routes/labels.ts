import { Router } from "express";
import { z } from "zod";
import { buildShelfLabelBatchResponse } from "../modules/labels/batchRenderer.js";
import {
  getRenderedShelfLabelBatch,
  getShelfLabelBatch,
  getSingleShelfLabel,
  listLabelBundleSummaries
} from "../modules/labels/shelfLabelService.js";

const router = Router();
const paramsSchema = z.object({
  bundleCode: z.string().min(1)
});
const singleParamsSchema = z.object({
  bundleCode: z.string().min(1),
  partCode: z.string().min(1)
});

router.get("/bundles", async (_req, res, next) => {
  try {
    const bundles = await listLabelBundleSummaries();
    res.json({ status: "ok", scope: "label-engine", bundles });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode", async (req, res, next) => {
  try {
    const params = paramsSchema.parse(req.params);
    const batch = await getRenderedShelfLabelBatch(params.bundleCode);

    res.json({ status: "ok", scope: "label-engine", batch });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/html", async (req, res, next) => {
  try {
    const params = paramsSchema.parse(req.params);
    const batch = await getRenderedShelfLabelBatch(params.bundleCode);

    res.type("html").send(buildShelfLabelBatchResponse(batch).html);
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/pdf-data", async (req, res, next) => {
  try {
    const params = paramsSchema.parse(req.params);
    const batch = await getShelfLabelBatch(params.bundleCode);

    res.json({ status: "ok", scope: "label-engine", batch });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/single/:partCode", async (req, res, next) => {
  try {
    const params = singleParamsSchema.parse(req.params);
    const label = await getSingleShelfLabel(params.bundleCode, params.partCode);

    if (!label) {
      res.status(404).json({
        status: "error",
        scope: "label-engine",
        message: "Label not found."
      });
      return;
    }

    res.json({ status: "ok", scope: "label-engine", label });
  } catch (error) {
    next(error);
  }
});

export default router;
