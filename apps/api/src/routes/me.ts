import { Router } from "express";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";

const router = Router();

router.get("/context", (req, res) => {
  try {
    const context = getRequestContext(req);

    res.json({
      ok: true,
      user: {
        email: context.currentUser.email,
        name: context.currentUser.name
      },
      organization: context.currentOrganization,
      membership: context.membership,
      organizations: context.organizations
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    throw error;
  }
});

export default router;
