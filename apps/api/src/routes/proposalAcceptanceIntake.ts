import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import {
  getProposalAcceptanceIntakeReadContext,
  getProposalAcceptanceIntakeWriteContext
} from "../modules/proposalAcceptanceIntake/contextAdapter.js";
import { UnknownAcceptanceProviderError } from "../modules/proposalAcceptanceIntake/providerAdapter.js";
import {
  createIntakeSession,
  getIntakeById,
  ingestProviderAcceptanceSignal,
  listEvidenceForIntake,
  listIntakeLogsForProposal,
  listIntakesForProposal,
  ProposalAcceptanceIntakeConflictError,
  ProposalAcceptancePublicTokenError,
  revokeIntakeSession,
  submitExternalAcceptance,
  validatePublicToken
} from "../modules/proposalAcceptanceIntake/service.js";
import {
  createIntakeSchema,
  intakeIdParamsSchema,
  proposalIdParamsSchema,
  providerAcceptanceSignalSchema,
  providerParamsSchema,
  publicSubmitSchema,
  publicValidateTokenSchema,
  revokeIntakeSchema
} from "../modules/proposalAcceptanceIntake/schemas.js";

const router = Router();

function requestHeadersToObject(headers: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String) : value === undefined ? undefined : String(value)
    ])
  );
}

function publicError(res: any) {
  res.status(400).json({
    ok: false,
    error: "Invalid or expired acceptance token."
  });
}

function handleRouteError(error: unknown, res: any, next: any) {
  if (error instanceof ProposalAcceptancePublicTokenError) {
    publicError(res);
    return;
  }
  if (error instanceof RequestAuthenticationError) {
    res.status(401).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof AuthorizationError) {
    res.status(403).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof UnknownAcceptanceProviderError) {
    res.status(400).json({ ok: false, error: error.message });
    return;
  }
  if (error instanceof ProposalAcceptanceIntakeConflictError) {
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
      error.message === "Proposal acceptance intake not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/proposals/:proposalId/acceptance-intakes", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeWriteContext(req);
    const params = proposalIdParamsSchema.parse(req.params);
    const body = createIntakeSchema.parse(req.body);

    res.status(201).json(
      await createIntakeSession({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        actorMembershipId: context.membership.id,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/acceptance-intakes", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listIntakesForProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/acceptance-intakes/:intakeId", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeReadContext(req);
    const params = intakeIdParamsSchema.parse(req.params);

    res.json(
      await getIntakeById({
        organizationId: context.currentOrganization.id,
        intakeId: params.intakeId
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/acceptance-intakes/:intakeId/revoke", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeWriteContext(req);
    const params = intakeIdParamsSchema.parse(req.params);
    const body = revokeIntakeSchema.parse(req.body ?? {});

    res.json(
      await revokeIntakeSession({
        organizationId: context.currentOrganization.id,
        intakeId: params.intakeId,
        actorMembershipId: context.membership.id,
        note: body.note
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/acceptance-intakes/:intakeId/evidence", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeReadContext(req);
    const params = intakeIdParamsSchema.parse(req.params);

    res.json(
      await listEvidenceForIntake({
        organizationId: context.currentOrganization.id,
        intakeId: params.intakeId
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/proposals/:proposalId/acceptance-intake-logs", async (req, res, next) => {
  try {
    const context = getProposalAcceptanceIntakeReadContext(req);
    const params = proposalIdParamsSchema.parse(req.params);

    res.json(
      await listIntakeLogsForProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/validate-token", async (req, res, next) => {
  try {
    const body = publicValidateTokenSchema.parse(req.body);
    res.json(await validatePublicToken({ token: body.token }));
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/public/proposal-acceptance/submit", async (req, res, next) => {
  try {
    const body = publicSubmitSchema.parse(req.body);

    res.json(
      await submitExternalAcceptance({
        token: body.token,
        confirmed: body.confirmed,
        signerName: body.signerName,
        signerEmail: body.signerEmail,
        note: body.note,
        metadata: body.metadata,
        externalIp: req.ip,
        externalUserAgent: req.header("user-agent")
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.post("/payments/providers/:provider/acceptance-signals", async (req, res, next) => {
  try {
    const params = providerParamsSchema.parse(req.params);
    providerAcceptanceSignalSchema.parse(req.body);

    res.status(201).json(
      await ingestProviderAcceptanceSignal({
        provider: params.provider,
        payload: req.body,
        headers: requestHeadersToObject(req.headers as Record<string, unknown>)
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
