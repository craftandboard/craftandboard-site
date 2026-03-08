import { Router } from "express";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getBackgroundJobStatus } from "../lib/backgroundJobs.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";

const router = Router();

router.get("/:jobId", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "batch_read");
    const publicJobId = req.params.jobId;
    const job = await getBackgroundJobStatus(publicJobId);

    res.json({
      ok: true,
      job
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
      res.status(error.message === "Job not found." ? 404 : 400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
