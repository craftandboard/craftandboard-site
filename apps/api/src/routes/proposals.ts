import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { RequestAuthenticationError } from "../lib/requestContext.js";
import { getProposalReadContext, getProposalWriteContext } from "../modules/leads/adapters/contextAdapter.js";
import {
  createProposal,
  createProposalLine,
  createProposalSection,
  getProposalDetailView,
  listProposalsView,
  updateProposal,
  updateProposalLine,
  updateProposalSection
} from "../modules/proposals/service.js";

const router = Router();
const proposalCreateSchema = z.object({
  projectId: z.string().trim().min(1).nullable().optional(),
  leadId: z.string().trim().min(1).nullable().optional(),
  title: z.string().trim().max(160).nullable().optional(),
  status: z.string().trim().min(1).max(64).nullable().optional(),
  depositPolicy: z
    .enum(["NO_DEPOSIT_REQUIRED", "DEPOSIT_REQUIRED_BEFORE_CONVERSION"])
    .optional(),
  version: z.number().int().min(1).optional(),
  publicToken: z.string().trim().max(120).nullable().optional()
});

const proposalUpdateSchema = proposalCreateSchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: "At least one proposal field must be provided." }
);

const proposalSectionCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).optional()
});

const proposalSectionUpdateSchema = proposalSectionCreateSchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: "At least one proposal section field must be provided." }
);

const proposalLineCreateSchema = z.object({
  sectionId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  qty: z.number().positive().optional(),
  unit: z.string().trim().max(32).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  sortOrder: z.number().int().min(0).optional()
});

const proposalLineUpdateSchema = proposalLineCreateSchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: "At least one proposal line field must be provided." }
);

function handleProposalRouteError(error: unknown, res: any, next: any) {
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
      error.message === "Proposal section not found." ||
      error.message === "Proposal line not found." ||
      error.message === "Lead not found." ||
      error.message === "Project not found."
        ? 404
        : 400;
    res.status(status).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const context = getProposalReadContext(req);
    const query = z.object({ q: z.string().trim().optional() }).parse(req.query);

    res.json(
      await listProposalsView({
        organizationId: context.currentOrganization.id,
        query: query.q
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.get("/:proposalLookup", async (req, res, next) => {
  try {
    const context = getProposalReadContext(req);
    const params = z.object({ proposalLookup: z.string().trim().min(1) }).parse(req.params);

    res.json(
      await getProposalDetailView({
        organizationId: context.currentOrganization.id,
        proposalLookup: params.proposalLookup
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const body = proposalCreateSchema.parse(req.body);

    res.status(201).json(
      await createProposal({
        organizationId: context.currentOrganization.id,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.patch("/:proposalId", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const params = z.object({ proposalId: z.string().trim().min(1) }).parse(req.params);
    const body = proposalUpdateSchema.parse(req.body);

    res.json(
      await updateProposal({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.post("/:proposalId/sections", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const params = z.object({ proposalId: z.string().trim().min(1) }).parse(req.params);
    const body = proposalSectionCreateSchema.parse(req.body);

    res.status(201).json(
      await createProposalSection({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.patch("/:proposalId/sections/:sectionId", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const params = z
      .object({
        proposalId: z.string().trim().min(1),
        sectionId: z.string().trim().min(1)
      })
      .parse(req.params);
    const body = proposalSectionUpdateSchema.parse(req.body);

    res.json(
      await updateProposalSection({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        sectionId: params.sectionId,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.post("/:proposalId/lines", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const params = z.object({ proposalId: z.string().trim().min(1) }).parse(req.params);
    const body = proposalLineCreateSchema.parse(req.body);

    res.status(201).json(
      await createProposalLine({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

router.patch("/:proposalId/lines/:lineId", async (req, res, next) => {
  try {
    const context = getProposalWriteContext(req);
    const params = z
      .object({
        proposalId: z.string().trim().min(1),
        lineId: z.string().trim().min(1)
      })
      .parse(req.params);
    const body = proposalLineUpdateSchema.parse(req.body);

    res.json(
      await updateProposalLine({
        organizationId: context.currentOrganization.id,
        proposalId: params.proposalId,
        lineId: params.lineId,
        ...body
      })
    );
  } catch (error) {
    handleProposalRouteError(error, res, next);
  }
});

export default router;
