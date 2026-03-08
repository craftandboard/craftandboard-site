import { Router } from "express";
import { z } from "zod";
import { getRequestContext, RequestAuthenticationError } from "../lib/requestContext.js";
import { clearSessionCookie, setSessionCookie, parseCookies, SESSION_COOKIE_NAME } from "../modules/auth/session.js";
import {
  activateAccount,
  AuthenticationError,
  DEMO_AUTH_CREDENTIALS,
  getActivationTokenContext,
  getAuthSessionContext,
  getPasswordResetTokenContext,
  invalidActivationError,
  invalidResetError,
  requestPasswordReset,
  resetPassword,
  signInWithPassword,
  signOutSession
} from "../modules/auth/service.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await signInWithPassword(body);

    setSessionCookie(res, result.session.token, result.session.expiresAt);
    res.status(201).json({
      ok: true,
      sessionToken: result.session.token,
      user: result.context.currentUser,
      organization: result.context.currentOrganization,
      membership: result.context.membership,
      organizations: result.context.organizations,
      demoCredentials: DEMO_AUTH_CREDENTIALS
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof AuthenticationError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const cookies = parseCookies(req.header("cookie"));
    const token = req.header("x-session-token") ?? cookies[SESSION_COOKIE_NAME] ?? null;
    await signOutSession(token);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/session", async (req, res, next) => {
  try {
    const context = getRequestContext(req);
    res.json(await getAuthSessionContext(context));
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      res.status(401).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/activate/validate", async (req, res, next) => {
  try {
    const query = z.object({ token: z.string().min(1) }).parse(req.query);
    res.json(await getActivationTokenContext(query.token));
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) {
      const message = error instanceof Error ? error.message : "Invalid activation request.";
      res.status(400).json({ ok: false, error: message });
      return;
    }
    next(error);
  }
});

router.post("/activate", async (req, res, next) => {
  try {
    const body = activateSchema.parse(req.body);
    const result = await activateAccount(body);

    setSessionCookie(res, result.session.token, result.session.expiresAt);
    res.status(201).json({
      ok: true,
      sessionToken: result.session.token,
      user: result.context.currentUser,
      organization: result.context.currentOrganization,
      membership: result.context.membership,
      organizations: result.context.organizations
    });
  } catch (error) {
    if (
      error instanceof z.ZodError ||
      error instanceof AuthenticationError ||
      (error instanceof Error && error.message === invalidActivationError().message)
    ) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    res.status(201).json(await requestPasswordReset(body));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/reset-password/validate", async (req, res, next) => {
  try {
    const query = z.object({ token: z.string().min(1) }).parse(req.query);
    res.json(await getPasswordResetTokenContext(query.token));
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) {
      const message = error instanceof Error ? error.message : "Invalid reset request.";
      res.status(400).json({ ok: false, error: message });
      return;
    }
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const body = activateSchema.parse(req.body);
    const result = await resetPassword(body);

    setSessionCookie(res, result.session.token, result.session.expiresAt);
    res.status(201).json({
      ok: true,
      sessionToken: result.session.token,
      user: result.context.currentUser,
      organization: result.context.currentOrganization,
      membership: result.context.membership,
      organizations: result.context.organizations
    });
  } catch (error) {
    if (
      error instanceof z.ZodError ||
      error instanceof AuthenticationError ||
      (error instanceof Error && error.message === invalidResetError().message)
    ) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
