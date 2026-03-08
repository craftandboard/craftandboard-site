import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { enqueueArtifactJob } from "../lib/backgroundJobs.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { deliverBatchCncToWatchFolder } from "../modules/machineIntegration/service.js";
import {
  createBatchForMaterial,
  generateBatchCncJson,
  generateBatchCncMosaic,
  generateBatchCncPacket,
  generateBatchCncCsv,
  generateBatchLabelPacket,
  generateBatchLabelCsv,
  generateBatchLabelPdf,
  generateBatchTravelerPdf,
  getBatchDetail,
  listBatches,
  nestBatch,
  transitionBatchStatus
} from "../modules/batches/service.js";

const router = Router();
const buildBatchSchema = z.object({
  material: z.enum(["WHITE_MELAMINE", "MAPLE_MELAMINE"])
});
const nestBatchSchema = z.object({
  batchId: z.string().min(1),
  mode: z.enum(["sync", "async"]).optional()
});
const deliverCncWatchFolderSchema = z.object({
  batchId: z.string().min(1),
  format: z.enum(["csv", "mosaic", "json"]),
  mode: z.enum(["sync", "async"]).optional()
});
const transitionBatchSchema = z.object({
  nextStatus: z.enum(["PLANNED", "RELEASED", "CUTTING", "CUT_COMPLETE", "READY_FOR_NEXT_STAGE"])
});

router.get("/", async (_req, res, next) => {
  try {
    const context = getRequestContext(_req);
    assertCapability(context, "batch_read");
    const batches = await listBatches(context.currentOrganization.id);

    res.json({
      status: "ok",
      scope: "foundation-only",
      batches
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

router.get("/:batchId", async (req, res, next) => {
  try {
    const params = nestBatchSchema.parse(req.params);
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const detail = await getBatchDetail(params.batchId, context.currentOrganization.id);

    res.json({
      ok: true,
      ...detail
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
      res.status(error.message === "Batch not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/build", async (req, res, next) => {
  try {
    const body = buildBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "batch_build");
    const result = await createBatchForMaterial(body.material, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "create-batch",
      batch: result.batch,
      parts: result.parts
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/nest", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "batch_nest");
    const result = await nestBatch(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "nest-batch",
      batchId: result.batchId,
      sheets: result.sheets
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-cnc", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");
    const result = await generateBatchCncPacket(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-cnc",
      batchId: result.batchId,
      packet: result.packet,
      sheets: result.sheets
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-labels", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");
    const result = await generateBatchLabelPacket(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-labels",
      batchId: result.batchId,
      packet: result.packet,
      labels: result.labels
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-cnc-csv", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-cnc-csv",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchCncCsv(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-cnc-csv",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-label-csv", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-label-csv",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchLabelCsv(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-label-csv",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-cnc-mosaic", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-cnc-mosaic",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchCncMosaic(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-cnc-mosaic",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-cnc-json", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-cnc-json",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchCncJson(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-cnc-json",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-label-pdf", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-label-pdf",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchLabelPdf(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-label-pdf",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/deliver-cnc-watch-folder", async (req, res, next) => {
  try {
    const body = deliverCncWatchFolderSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "deliver-cnc-watch-folder",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id,
        format: body.format
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await deliverBatchCncToWatchFolder(body.batchId, body.format, context.currentOrganization.id);
    res.status(201).json({
      ok: true,
      action: "deliver-cnc-watch-folder",
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
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(error.message === "Batch not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/generate-traveler-pdf", async (req, res, next) => {
  try {
    const body = nestBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "artifact_generate");

    if (body.mode === "async") {
      const job = await enqueueArtifactJob({
        type: "generate-traveler-pdf",
        batchId: body.batchId,
        organizationId: context.currentOrganization.id
      });

      res.status(202).json({
        ok: true,
        jobId: job.jobId,
        status: job.status
      });
      return;
    }

    const result = await generateBatchTravelerPdf(body.batchId, context.currentOrganization.id);

    res.status(201).json({
      ok: true,
      action: "generate-traveler-pdf",
      batchId: result.batchId,
      artifact: result.artifact
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
      res.status(error.message === "Batch not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/:batchId/status", async (req, res, next) => {
  try {
    const params = nestBatchSchema.parse(req.params);
    const body = transitionBatchSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "batch_nest");
    const result = await transitionBatchStatus(
      params.batchId,
      body.nextStatus.toLowerCase() as "planned" | "released" | "cutting" | "cut_complete" | "ready_for_next_stage",
      context.currentOrganization.id
    );

    res.json({
      ok: true,
      action: "transition-batch",
      batch: result.batch
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
      res.status(error.message === "Batch not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
