import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { enqueueArtifactJob } from "../lib/backgroundJobs.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  importAmazonFixtures,
  previewAmazonFixtureImport
} from "../modules/amazonImport/service.js";
import { importFixtureOrders } from "../modules/ordersImport/importFixtures.js";
import {
  generatePackingSlipPdf,
  getNormalizedOrderById,
  getOrderById,
  listCompletedOrders,
  listOrders,
  markOrderShipped
} from "../modules/orders/service.js";

const router = Router();
const orderArtifactModeSchema = z.object({
  mode: z.enum(["sync", "async"]).optional()
});

router.post("/import/fixtures", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    assertCapability(context, "fixture_import");
    const result = await importFixtureOrders(context.currentOrganization.id);

    res.status(201).json({
      status: "ok",
      scope: "normalized-foundation",
      ...result
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
    next(error);
  }
});

router.get("/import/amazon-fixtures/preview", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    assertCapability(context, "fixture_import");
    const preview = await previewAmazonFixtureImport();

    res.json({
      status: "ok",
      scope: "amazon-import-v1",
      preview
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
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/import/amazon-fixtures", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    assertCapability(context, "fixture_import");
    const result = await importAmazonFixtures(context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "import-amazon-fixtures",
      summary: {
        ordersCreated: result.ordersCreated,
        jobsCreated: result.jobsCreated,
        partsCreated: result.partInstancesCreated
      },
      ...result
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    const orders = await listOrders(context.currentOrganization.id);

    res.json({
      status: "ok",
      scope: "normalized-foundation",
      orders
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/completed", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    assertCapability(context, "completed_work_read");
    const orders = await listCompletedOrders(context.currentOrganization.id);

    res.json({
      ok: true,
      orders
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/:orderId/ship", async (req, res, next) => {
  try {
    const params = z.object({ orderId: z.string().min(1) }).parse(req.params);
    const context = getRequestContext(req);
    assertCapability(context, "shipping_admin");
    const order = await markOrderShipped(params.orderId, context.currentOrganization.id);

    res.json({
      ok: true,
      order
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
    if (error instanceof Error) {
      res.status(error.message === "Order not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/:orderId/generate-packing-slip", async (req, res, next) => {
  try {
    const params = z.object({ orderId: z.string().min(1) }).parse(req.params);
    const body = orderArtifactModeSchema.parse(req.body ?? {});
    const context = getRequestContext(req);
    assertCapability(context, "shipping_admin");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-packing-slip",
        orderId: params.orderId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generatePackingSlipPdf(params.orderId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-packing-slip",
      ...result
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
    if (error instanceof Error) {
      res.status(error.message === "Order not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const context = getRequestContext(req);
    const order = await getOrderById(params.id, context.currentOrganization.id);

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
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/:id/normalized", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const context = getRequestContext(req);
    const normalized = await getNormalizedOrderById(params.id, context.currentOrganization.id);

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
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
