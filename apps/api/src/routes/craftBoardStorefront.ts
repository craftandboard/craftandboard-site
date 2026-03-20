import { Router } from "express";
import { z } from "zod";
import {
  createStorefrontChangeRequest,
  createStorefrontOrderIssue,
  cancelCraftBoardStorefrontOrderPayment,
  completeCraftBoardStorefrontTestPayment,
  createCraftBoardStorefrontPaymentSession,
  getCustomerStorefrontOrderStatus,
  getCraftBoardStorefrontQuote,
  getCraftBoardStorefrontOrderConfirmation,
  handleCraftBoardStorefrontPaymentWebhook,
  previewFloatingShelfPrice,
  submitCraftBoardStorefrontOrder
} from "../modules/craftBoardStorefront/service.js";
import {
  configurableProductPricePreviewSchema,
  storefrontProductQuoteSchema,
  storefrontAttemptParamsSchema,
  storefrontChangeRequestCreateSchema,
  storefrontOrderIssueCreateSchema,
  storefrontPaymentSessionSchema,
  storefrontStatusTokenParamsSchema,
  submitStorefrontOrderSchema
} from "../modules/craftBoardStorefront/schemas.js";

const router = Router();

async function handlePricePreview(req: any, res: any, next: any) {
  try {
    const body = configurableProductPricePreviewSchema.parse(req.body);
    res.json(await previewFloatingShelfPrice(body));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
}

router.post("/public/craft-board/pricing/floating-shelves", handlePricePreview);
router.post("/public/craft-board/storefront/floating-shelves/price", handlePricePreview);
router.post("/public/craft-board/storefront/products/price", handlePricePreview);
router.post("/public/craft-board/storefront/floating-mantels/price", handlePricePreview);

router.post("/public/craft-board/storefront/products/quote", async (req: any, res: any, next: any) => {
  try {
    const body = storefrontProductQuoteSchema.parse(req.body);
    res.json(await getCraftBoardStorefrontQuote(body));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

async function handleStorefrontOrder(req: any, res: any, next: any) {
  try {
    const body = submitStorefrontOrderSchema.parse(req.body);
    const payload = await submitCraftBoardStorefrontOrder(body);
    res.status(201).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
}

router.post("/public/craft-board/storefront/orders", handleStorefrontOrder);
router.post("/public/craft-board/storefront-orders/floating-shelves", handleStorefrontOrder);

router.post("/public/craft-board/storefront/orders/:id/payment-session", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontAttemptParamsSchema.parse(req.params);
    const body = storefrontPaymentSessionSchema.parse(req.body ?? {});
    const payload = await createCraftBoardStorefrontPaymentSession({
      attemptId: params.id,
      successPath: body.successPath,
      cancelPath: body.cancelPath
    });
    res.status(201).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/public/craft-board/storefront/orders/:id/confirmation", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontAttemptParamsSchema.parse(req.params);
    const payload = await getCraftBoardStorefrontOrderConfirmation({ attemptId: params.id });
    res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/public/craft-board/storefront/order-status/:publicToken", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontStatusTokenParamsSchema.parse(req.params);
    const payload = await getCustomerStorefrontOrderStatus({ publicToken: params.publicToken });
    res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(404).json({ ok: false, error: "Order status is unavailable." });
      return;
    }
    next(error);
  }
});

router.post("/public/craft-board/storefront/order-status/:publicToken/change-requests", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontStatusTokenParamsSchema.parse(req.params);
    const body = storefrontChangeRequestCreateSchema.parse(req.body);
    const payload = await createStorefrontChangeRequest({
      publicToken: params.publicToken,
      payload: body
    });
    res.status(201).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/public/craft-board/storefront/order-status/:publicToken/issues", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontStatusTokenParamsSchema.parse(req.params);
    const body = storefrontOrderIssueCreateSchema.parse(req.body);
    const payload = await createStorefrontOrderIssue({
      publicToken: params.publicToken,
      payload: body
    });
    res.status(201).json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/public/craft-board/storefront/orders/:id/dev-complete-payment", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontAttemptParamsSchema.parse(req.params);
    const payload = await completeCraftBoardStorefrontTestPayment({ attemptId: params.id });
    res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/public/craft-board/storefront/orders/:id/payment-cancel", async (req: any, res: any, next: any) => {
  try {
    const params = storefrontAttemptParamsSchema.parse(req.params);
    const payload = await cancelCraftBoardStorefrontOrderPayment({ attemptId: params.id });
    res.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/public/craft-board/storefront/payments/webhook", async (req: any, res: any, next: any) => {
  try {
    const payload = await handleCraftBoardStorefrontPaymentWebhook({
      payload: req.body,
      headers: req.headers
    });
    res.json(payload);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
