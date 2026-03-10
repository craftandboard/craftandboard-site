import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getProposalAcceptanceReadContext,
  getProposalAcceptanceWriteContext,
  getProposalConversionReadContext,
  getProposalConversionWriteContext
} from "../modules/proposalOrchestration/contextAdapter.js";
import {
  acceptProposal,
  cancelAcceptance,
  createOrGetAcceptance,
  convertProposalToProject,
  evaluateConversionEligibility,
  getAcceptanceByProposal,
  getConversionByProposal,
  listOrchestrationLogsForProposal,
  rejectProposal,
  ProposalOrchestrationConflictError
} from "../modules/proposalOrchestration/service.js";
import {
  acceptanceActionSchema,
  acceptanceCreateSchema,
  proposalIdParamsSchema
} from "../modules/proposalOrchestration/schemas.js";

const router = Router();

function handleProposalOrchestrationError(error: unknown, res: any, next: any) {
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof ProposalOrchestrationConflictError) {
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
      error.message === "Proposal acceptance not found." ||
      error.message === "Proposal conversion not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/proposals/:proposalId/acceptance", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = acceptanceCreateSchema.parse(req.body);

    res.status(201).json(
      await createOrGetAcceptance({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        ...body
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.get("/proposals/:proposalId/acceptance", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await getAcceptanceByProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.patch("/proposals/:proposalId/acceptance", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = acceptanceActionSchema.parse(req.body);

    const input = {
      organizationId: context.currentOrganization.id,
      proposalId: params.proposalId,
      membershipId: context.membership.id,
      decisionSource: body.decisionSource,
      note: body.note,
      metadata: body.metadata
    };

    if (body.action === "accept") {
      res.json(await acceptProposal(input));
      return;
    }
    if (body.action === "reject") {
      res.json(await rejectProposal(input));
      return;
    }

    res.json(
      await cancelAcceptance({
        organizationId: input.organizationId,
        proposalId: input.proposalId,
        membershipId: input.membershipId,
        note: input.note,
        metadata: input.metadata
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.post("/proposals/:proposalId/conversion-evaluation", async (req, res, next) => {
  try {
    const context = getProposalConversionWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await evaluateConversionEligibility({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        membershipId: context.membership.id
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.get("/proposals/:proposalId/conversion", async (req, res, next) => {
  try {
    const context = getProposalConversionReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await getConversionByProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.post("/proposals/:proposalId/convert", async (req, res, next) => {
  try {
    const context = getProposalConversionWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.status(201).json(
      await convertProposalToProject({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        membershipId: context.membership.id,
        metadata: req.body?.metadata
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

router.get("/proposals/:proposalId/orchestration-logs", async (req, res, next) => {
  try {
    const context = getProposalConversionReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listOrchestrationLogsForProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleProposalOrchestrationError(error, res, next);
  }
});

export default router;
