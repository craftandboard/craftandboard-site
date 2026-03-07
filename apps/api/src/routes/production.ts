import { Router } from "express";
import { z } from "zod";
import {
  getBundleLabels,
  getBundleLegacyXml,
  getBundleOptimizer,
  getBundlePickList,
  getProductionBundleDetail,
  listProductionBundles,
  rebuildProductionBundles
} from "../modules/productionBundles/service.js";
import {
  buildDailyProductionReport,
  buildLabelJob,
  buildLegacyXmlExport,
  buildOptimizerExport,
  parseShipByDateParam
} from "../modules/productionOutputs/service.js";

const router = Router();

const querySchema = z.object({
  shipByDate: z.string().min(1),
  materialCode: z.string().optional()
});
const bundleParamsSchema = z.object({
  bundleCode: z.string().min(1)
});

router.get("/bundles", async (_req, res, next) => {
  try {
    const bundles = await listProductionBundles();

    res.json({ status: "ok", scope: "bundle-foundation", bundles });
  } catch (error) {
    next(error);
  }
});

router.post("/bundles/rebuild", async (_req, res, next) => {
  try {
    const bundles = await rebuildProductionBundles();

    res.json({ status: "ok", scope: "bundle-foundation", bundles });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode", async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const bundle = await getProductionBundleDetail(params.bundleCode);

    res.json({ status: "ok", scope: "bundle-foundation", bundle });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/pick-list", async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const pickList = await getBundlePickList(params.bundleCode);

    res.json({ status: "ok", scope: "bundle-foundation", pickList });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/labels", async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const labels = await getBundleLabels(params.bundleCode);

    res.json({ status: "ok", scope: "bundle-foundation", labels });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/optimizer", async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const optimizer = await getBundleOptimizer(params.bundleCode);

    res.json({ status: "ok", scope: "bundle-foundation", optimizer });
  } catch (error) {
    next(error);
  }
});

router.get("/bundles/:bundleCode/legacy-xml", async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const legacyXml = await getBundleLegacyXml(params.bundleCode);

    res.json({ status: "ok", scope: "bundle-foundation", legacyXml });
  } catch (error) {
    next(error);
  }
});

router.get("/daily", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const report = await buildDailyProductionReport({
      shipByDate: parseShipByDateParam(query.shipByDate),
      materialCode: query.materialCode as never
    });

    res.json({ status: "ok", scope: "normalized-foundation", report });
  } catch (error) {
    next(error);
  }
});

router.get("/labels", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const labels = await buildLabelJob({
      shipByDate: parseShipByDateParam(query.shipByDate),
      materialCode: query.materialCode as never
    });

    res.json({ status: "ok", scope: "normalized-foundation", labels });
  } catch (error) {
    next(error);
  }
});

router.get("/optimizer", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const optimizer = await buildOptimizerExport({
      shipByDate: parseShipByDateParam(query.shipByDate),
      materialCode: query.materialCode as never
    });

    res.json({ status: "ok", scope: "normalized-foundation", optimizer });
  } catch (error) {
    next(error);
  }
});

router.get("/legacy-xml", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const legacyXml = await buildLegacyXmlExport({
      shipByDate: parseShipByDateParam(query.shipByDate),
      materialCode: query.materialCode as never
    });

    res.json({ status: "ok", scope: "normalized-foundation", legacyXml });
  } catch (error) {
    next(error);
  }
});

export default router;
