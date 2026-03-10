import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getDepositReadContext,
  getDepositWriteContext,
  getPaymentReadContext,
  getPaymentWriteContext
} from "../modules/payments/contextAdapter.js";
import {
  createDepositRequest,
  getDepositRequestView,
  getPaymentView,
  getProposalPaymentSummaryView,
  listDepositRequestsView,
  listPaymentsView,
  recordPayment,
  updateDepositRequest,
  updatePaymentStatus
} from "../modules/payments/service.js";
import {
  depositRequestCreateSchema,
  depositRequestIdParamsSchema,
  depositRequestUpdateSchema,
  paymentCreateSchema,
  paymentIdParamsSchema,
  paymentUpdateSchema,
  proposalIdParamsSchema
} from "../modules/payments/schemas.js";

const router = Router();

function handlePaymentsRouteError(error: unknown, res: any, next: any) {
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
    const status =
      error.message === "Proposal not found." ||
      error.message === "Deposit request not found." ||
      error.message === "Payment not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/proposals/:proposalId/deposit-requests", async (req, res, next) => {
  try {
    const context = getDepositWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = depositRequestCreateSchema.parse(req.body);

    res.status(201).json(
      await createDepositRequest({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/deposit-requests", async (req, res, next) => {
  try {
    const context = getDepositReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listDepositRequestsView({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.get("/deposit-requests/:depositRequestId", async (req, res, next) => {
  try {
    const context = getDepositReadContext(req);
    const params = depositRequestIdParamsSchema.parse(req.params);

    res.json(
      await getDepositRequestView({
        organizationId: context.currentOrganization.id,
        depositRequestId: params.depositRequestId
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.patch("/deposit-requests/:depositRequestId", async (req, res, next) => {
  try {
    const context = getDepositWriteContext(req);
    const params = depositRequestIdParamsSchema.parse(req.params);
    const body = depositRequestUpdateSchema.parse(req.body);

    res.json(
      await updateDepositRequest({
        organizationId: context.currentOrganization.id,
        depositRequestId: params.depositRequestId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.post("/proposals/:proposalId/payments", async (req, res, next) => {
  try {
    const context = getPaymentWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = paymentCreateSchema.parse(req.body);

    res.status(201).json(
      await recordPayment({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/payments", async (req, res, next) => {
  try {
    const context = getPaymentReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listPaymentsView({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.get("/payments/:paymentId", async (req, res, next) => {
  try {
    const context = getPaymentReadContext(req);
    const params = paymentIdParamsSchema.parse(req.params);

    res.json(
      await getPaymentView({
        organizationId: context.currentOrganization.id,
        paymentId: params.paymentId
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.patch("/payments/:paymentId", async (req, res, next) => {
  try {
    const context = getPaymentWriteContext(req);
    const params = paymentIdParamsSchema.parse(req.params);
    const body = paymentUpdateSchema.parse(req.body);

    res.json(
      await updatePaymentStatus({
        organizationId: context.currentOrganization.id,
        paymentId: params.paymentId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/payment-summary", async (req, res, next) => {
  try {
    const context = getPaymentReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await getProposalPaymentSummaryView({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handlePaymentsRouteError(error, res, next);
  }
});

export default router;
