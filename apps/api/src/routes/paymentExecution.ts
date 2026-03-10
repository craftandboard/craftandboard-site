import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getPaymentEventReadContext,
  getPaymentEventWriteContext,
  getPaymentExecutionReadContext,
  getPaymentExecutionWriteContext
} from "../modules/paymentExecution/contextAdapter.js";
import { UnknownPaymentProviderError } from "../modules/paymentExecution/providerRegistry.js";
import {
  createPaymentExecution,
  getPaymentExecutionView,
  getProviderEventView,
  ingestProviderEvent,
  listPaymentExecutionsView,
  listProposalProviderEventsView,
  listReconciliationLogsView,
  refreshPaymentExecution,
  PaymentExecutionConflictError
} from "../modules/paymentExecution/service.js";
import {
  createExecutionSchema,
  eventIdParamsSchema,
  executionIdParamsSchema,
  proposalIdParamsSchema,
  providerParamsSchema,
  refreshExecutionSchema
} from "../modules/paymentExecution/schemas.js";

const router = Router();

function requestHeadersToObject(headers: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : value === undefined ? undefined : String(value)])
  );
}

function handlePaymentExecutionRouteError(error: unknown, res: any, next: any) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof UnknownPaymentProviderError) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof PaymentExecutionConflictError) {
    res.status(409).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof Error) {
    const status =
      error.message === "Proposal not found." ||
      error.message === "Payment not found." ||
      error.message === "Deposit request not found." ||
      error.message === "Payment execution not found." ||
      error.message === "Payment provider event not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/proposals/:proposalId/payment-executions", async (req, res, next) => {
  try {
    const context = getPaymentExecutionWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = createExecutionSchema.parse(req.body);

    res.status(201).json(
      await createPaymentExecution({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/payment-executions", async (req, res, next) => {
  try {
    const context = getPaymentExecutionReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listPaymentExecutionsView({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.get("/payment-executions/:executionId", async (req, res, next) => {
  try {
    const context = getPaymentExecutionReadContext(req);
    const params = executionIdParamsSchema.parse(req.params);

    res.json(
      await getPaymentExecutionView({
        organizationId: context.currentOrganization.id,
        executionId: params.executionId
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.patch("/payment-executions/:executionId/refresh", async (req, res, next) => {
  try {
    const context = getPaymentExecutionWriteContext(req);
    const params = executionIdParamsSchema.parse(req.params);
    refreshExecutionSchema.parse(req.body ?? {});

    res.json(
      await refreshPaymentExecution({
        organizationId: context.currentOrganization.id,
        executionId: params.executionId,
        actorMembershipId: context.membership.id
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.post("/payments/providers/:provider/events", async (req, res, next) => {
  try {
    const context = getPaymentEventWriteContext(req);
    const params = providerParamsSchema.parse(req.params);

    res.status(201).json(
      await ingestProviderEvent({
        organizationId: context.currentOrganization.id,
        provider: params.provider,
        payload: req.body,
        headers: requestHeadersToObject(req.headers as Record<string, unknown>)
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.get("/payments/provider-events/:eventId", async (req, res, next) => {
  try {
    const context = getPaymentEventReadContext(req);
    const params = eventIdParamsSchema.parse(req.params);

    res.json(
      await getProviderEventView({
        organizationId: context.currentOrganization.id,
        eventId: params.eventId
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/provider-events", async (req, res, next) => {
  try {
    const context = getPaymentEventReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listProposalProviderEventsView({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

router.get("/payment-executions/:executionId/reconciliation-logs", async (req, res, next) => {
  try {
    const context = getPaymentExecutionReadContext(req);
    const params = executionIdParamsSchema.parse(req.params);

    res.json(
      await listReconciliationLogsView({
        organizationId: context.currentOrganization.id,
        executionId: params.executionId
      })
    );
  } catch (error) {
    handlePaymentExecutionRouteError(error, res, next);
  }
});

export default router;
