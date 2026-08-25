import cors from "cors";
import express from "express";
import { GENERATED_ARTIFACTS_DIR } from "./lib/generatedArtifacts.js";
import { requestContextMiddleware } from "./lib/requestContext.js";
import authRouter from "./routes/auth.js";
import configuratorRouter from "./routes/configurator.js";
import containersRouter from "./routes/containers.js";
import costingRouter from "./routes/costing.js";
import costEngineRouter from "./routes/costEngine.js";
import edgeBandingRouter from "./routes/edgeBanding.js";
import healthRouter from "./routes/health.js";
import hqRouter from "./routes/hq.js";
import jobsRouter from "./routes/jobs.js";
import labelsRouter from "./routes/labels.js";
import leadsRouter from "./routes/leads.js";
import machineEventsRouter from "./routes/machineEvents.js";
import machineStageCandidatesRouter from "./routes/machineStageCandidates.js";
import machinesRouter from "./routes/machines.js";
import manufacturingRouter from "./routes/manufacturing.js";
import manufacturingExpansionRouter from "./routes/manufacturingExpansion.js";
import manufacturingLabelsRouter from "./routes/manufacturingLabels.js";
import materialForecastRouter from "./routes/materialForecast.js";
import meRouter from "./routes/me.js";
import orgRouter from "./routes/org.js";
import optimizationRouter from "./routes/optimization.js";
import orderIntakeRouter from "./routes/orderIntake.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import paymentExecutionRouter from "./routes/paymentExecution.js";
import pilotFeedbackRouter from "./routes/pilotFeedback.js";
import proposalAcceptanceIntakeRouter from "./routes/proposalAcceptanceIntake.js";
import proposalAcceptancePresentationRouter from "./routes/proposalAcceptancePresentation.js";
import proposalAcceptanceReviewRouter from "./routes/proposalAcceptanceReview.js";
import partsRouter from "./routes/parts.js";
import batchesRouter from "./routes/batches.js";
import productionRouter from "./routes/production.js";
import pricingRouter from "./routes/pricing.js";
import proposalsRouter from "./routes/proposals.js";
import proposalOrchestrationRouter from "./routes/proposalOrchestration.js";
import projectsRouter from "./routes/projects.js";
import remnantsRouter from "./routes/remnants.js";
import reportsRouter from "./routes/reports.js";
import shelfJobsRouter from "./routes/shelfJobs.js";
import scanningRouter from "./routes/scanning.js";
import stationsRouter from "./routes/stations.js";
import stageSignalsRouter from "./routes/stageSignals.js";
import trustedAutoApplyRouter from "./routes/trustedAutoApply.js";
import workModulesRouter from "./routes/workModules.js";
import { logger } from "./lib/logger.js";

/**
 * Browser origins allowed to call this API, from CORS_ALLOWED_ORIGINS
 * (comma-separated). Deployment config, not code: the Vercel preview host and
 * the craftandboard.com domains are set on the Railway service.
 *
 * Read straight from process.env rather than through lib/env.js on purpose --
 * importing the validated env schema here would force it to parse whenever
 * app.ts is imported, which breaks tests that mock the request-context module
 * and never set AUTH_SESSION_SECRET.
 */
function corsAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();

  if (!raw) {
    return ["http://localhost:3000"];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: corsAllowedOrigins(),
      credentials: false
    })
  );
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use("/generated-artifacts", express.static(GENERATED_ARTIFACTS_DIR));

  app.use("/auth", authRouter);
  app.use("/health", healthRouter);
  app.use("/hq", hqRouter);
  app.use("/jobs", jobsRouter);
  app.use("/me", meRouter);
  app.use("/org", orgRouter);
  app.use("/labels", labelsRouter);
  app.use("/leads", leadsRouter);
  app.use("/machine-events", machineEventsRouter);
  app.use("/machine-stage-candidates", machineStageCandidatesRouter);
  app.use("/machines", machinesRouter);
  app.use("/manufacturing", manufacturingRouter);
  app.use("/", manufacturingExpansionRouter);
  app.use("/", manufacturingLabelsRouter);
  app.use("/material-forecast", materialForecastRouter);
  app.use("/configurator", configuratorRouter);
  app.use("/containers", containersRouter);
  app.use("/costing", costingRouter);
  app.use("/", costEngineRouter);
  app.use("/edge-banding", edgeBandingRouter);
  app.use("/optimization", optimizationRouter);
  app.use("/order-intake", orderIntakeRouter);
  app.use("/orders", ordersRouter);
  app.use("/", paymentsRouter);
  app.use("/", paymentExecutionRouter);
  app.use("/", pilotFeedbackRouter);
  app.use("/", proposalAcceptanceIntakeRouter);
  app.use("/", proposalAcceptancePresentationRouter);
  app.use("/", proposalAcceptanceReviewRouter);
  app.use("/parts", partsRouter);
  app.use("/batches", batchesRouter);
  app.use("/pricing", pricingRouter);
  app.use("/proposals", proposalsRouter);
  app.use("/", proposalOrchestrationRouter);
  app.use("/projects", projectsRouter);
  app.use("/", shelfJobsRouter);
  app.use("/", scanningRouter);
  app.use("/stations", stationsRouter);
  app.use("/stage-signals", stageSignalsRouter);
  app.use("/trusted-auto-apply", trustedAutoApplyRouter);
  app.use("/work-modules", workModulesRouter);
  app.use("/production", productionRouter);
  app.use("/remnants", remnantsRouter);
  app.use("/reports", reportsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled request error", err);
    res.status(500).json({
      status: "error",
      scope: "foundation-only",
      message: "Unexpected API error."
    });
  });

  return app;
}
