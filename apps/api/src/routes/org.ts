import { Router } from "express";
import { z } from "zod";
import { assertCapability, AuthorizationError } from "../lib/authorization.js";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import {
  addOrganizationMember,
  listOrganizationMembers,
  updateOrganizationMemberRole
} from "../modules/org/service.js";

const router = Router();

const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
  role: z.enum(["OWNER", "ADMIN", "OPERATOR"])
});

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "OPERATOR"])
});

router.get("/members", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    assertCapability(context, "org_member_read");
    const members = await listOrganizationMembers(context.currentOrganization.id);

    res.json({
      ok: true,
      members
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

router.post("/members", async (req, res, next) => {
  try {
    const body = createMemberSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "org_member_manage");
    const member = await addOrganizationMember({
      organizationId: context.currentOrganization.id,
      email: body.email,
      name: body.name,
      role: body.role
    });

    res.status(201).json({
      ok: true,
      ...member
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
    if (error instanceof z.ZodError || error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/members/:userId/role", async (req, res, next) => {
  try {
    const params = z.object({ userId: z.string().min(1) }).parse(req.params);
    const body = updateRoleSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, "org_member_manage");
    const member = await updateOrganizationMemberRole({
      organizationId: context.currentOrganization.id,
      userId: params.userId,
      role: body.role
    });

    res.json({
      ok: true,
      member
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
      res.status(error.message === "Organization member not found." ? 404 : 400).json({
        ok: false,
        error: error.message
      });
      return;
    }
    next(error);
  }
});

export default router;
