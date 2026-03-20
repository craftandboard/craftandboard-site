import { Router } from "express";
import { z } from "zod";
import { AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  createCraftBoardInquiry,
  getCraftBoardInquiryDetail,
  listCraftBoardInquiries,
  updateCraftBoardInquiry
} from "../modules/craftBoardInquiries/service.js";
import {
  craftBoardInquiryIdParamsSchema,
  createCraftBoardInquirySchema,
  listCraftBoardInquiriesQuerySchema,
  updateCraftBoardInquirySchema
} from "../modules/craftBoardInquiries/schemas.js";
import { LOCAL_ORG_ID } from "../modules/settings/service.js";

const router = Router();

function handleRouteError(error: unknown, res: any, next: any) {
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
    res.status(error.message === "Inquiry not found." ? 404 : 400).json({ ok: false, error: error.message });
    return;
  }
  next(error);
}

router.post("/craft-board/inquiries", async (req, res, next) => {
  try {
    const body = createCraftBoardInquirySchema.parse(req.body);
    const payload = await createCraftBoardInquiry({
      organizationId: LOCAL_ORG_ID,
      ...body
    });
    res.status(201).json(payload);
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/inquiries", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const query = listCraftBoardInquiriesQuerySchema.parse(req.query);
    res.json(
      await listCraftBoardInquiries({
        organizationId: context.currentOrganization.id,
        status: query.status,
        query: query.q,
        productFamily: query.productFamily,
        assignedToUserId: query.assignedToUserId,
        estimateState: query.estimateState
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.get("/craft-board/inquiries/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardInquiryIdParamsSchema.parse(req.params);
    res.json(
      await getCraftBoardInquiryDetail({
        organizationId: context.currentOrganization.id,
        id: params.id
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

router.patch("/craft-board/inquiries/:id", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    const params = craftBoardInquiryIdParamsSchema.parse(req.params);
    const body = updateCraftBoardInquirySchema.parse(req.body);
    res.json(
      await updateCraftBoardInquiry({
        organizationId: context.currentOrganization.id,
        id: params.id,
        actorName: context.currentUser.name ?? context.currentUser.email,
        ...body
      })
    );
  } catch (error) {
    handleRouteError(error, res, next);
  }
});

export default router;
