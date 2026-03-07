import { Router } from "express";
import { z } from "zod";
import {
  importAmazonFixtures,
  previewAmazonFixtureImport
} from "../modules/amazonImport/service.js";
import { importFixtureOrders } from "../modules/ordersImport/importFixtures.js";
import { getNormalizedOrderById, getOrderById, listOrders } from "../modules/orders/service.js";

const router = Router();

router.post("/import/fixtures", async (_req, res, next) => {
  try {
    const result = await importFixtureOrders();

    res.status(201).json({
      status: "ok",
      scope: "normalized-foundation",
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.get("/import/amazon-fixtures/preview", async (_req, res, next) => {
  try {
    const preview = await previewAmazonFixtureImport();

    res.json({
      status: "ok",
      scope: "amazon-import-v1",
      preview
    });
  } catch (error) {
    next(error);
  }
});

router.post("/import/amazon-fixtures", async (_req, res, next) => {
  try {
    const result = await importAmazonFixtures();

    res.status(201).json({
      status: "ok",
      scope: "amazon-import-v1",
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const orders = await listOrders();

    res.json({
      status: "ok",
      scope: "normalized-foundation",
      orders
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const order = await getOrderById(params.id);

    if (!order) {
      res.status(404).json({
        status: "error",
        scope: "normalized-foundation",
        message: "Order not found."
      });
      return;
    }

    res.json({
      status: "ok",
      scope: "normalized-foundation",
      order
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/normalized", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const normalized = await getNormalizedOrderById(params.id);

    if (!normalized) {
      res.status(404).json({
        status: "error",
        scope: "amazon-import-v1",
        message: "Order not found."
      });
      return;
    }

    res.json({
      status: "ok",
      scope: "amazon-import-v1",
      normalized
    });
  } catch (error) {
    next(error);
  }
});

export default router;
