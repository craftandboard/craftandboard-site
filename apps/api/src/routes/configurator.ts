import { Router } from 'express';
import { z } from 'zod';
import { assertCapability, AuthorizationError } from '../lib/authorization.js';
import { getRequestContext, RequestAuthenticationError } from '../lib/requestContext.js';
import {
  createManufacturingJobFromConfigurator,
  normalizeShelfConfiguratorInput,
  quoteShelf,
  translateShelfToManufacturingPart,
  validateShelfConfiguratorInput
} from '../modules/configurator/service.js';

const router = Router();

const configuratorSchema = z.object({
  widthIn: z.number().finite(),
  depthIn: z.number().finite(),
  thicknessIn: z.number().finite().optional(),
  materialCode: z.enum(['WHITE_MELAMINE', 'MAPLE_MELAMINE']),
  edgeBandPattern: z.enum(['ALL_FOUR']).optional(),
  quantity: z.number().int().min(1),
  channel: z.enum(['AMAZON', 'WEBSITE', 'MANUAL'])
});

function sendConfiguratorError(res: import('express').Response, status: number, message: string) {
  res.status(status).json({
    ok: false,
    error: message
  });
}

router.post('/validate', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const context = getRequestContext(req);
    const result = await validateShelfConfiguratorInput(input, context.currentOrganization.id);
    res.json({
      ok: true,
      action: 'validate',
      validation: {
        isValid: result.valid,
        errors: result.errors
      }
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      sendConfiguratorError(res, 401, error.message);
      return;
    }
    if (error instanceof AuthorizationError) {
      sendConfiguratorError(res, 403, error.message);
      return;
    }
    if (error instanceof z.ZodError) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    next(error);
  }
});

router.post('/normalize', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const context = getRequestContext(req);
    const result = await normalizeShelfConfiguratorInput(input, context.currentOrganization.id);
    res.json({
      ok: true,
      action: 'normalize',
      normalized: {
        width: result.widthIn,
        depth: result.depthIn,
        quantity: result.quantity,
        material: result.materialCode,
        channel: result.channel,
        thickness: result.thicknessIn,
        edgeBandPattern: result.edgeBandPattern,
        unit: 'IN'
      }
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      sendConfiguratorError(res, 401, error.message);
      return;
    }
    if (error instanceof AuthorizationError) {
      sendConfiguratorError(res, 403, error.message);
      return;
    }
    if (error instanceof z.ZodError) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    if (error instanceof Error) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    next(error);
  }
});

router.post('/quote', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const context = getRequestContext(req);
    const result = await quoteShelf(input, context.currentOrganization.id);
    res.json({
      ok: true,
      action: 'quote',
      quote: {
        currency: 'USD',
        unitPrice: result.unitPrice,
        quantity: result.spec.quantity,
        subtotal: result.totalPrice,
        status: 'FOUNDATION_PLACEHOLDER'
      }
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      sendConfiguratorError(res, 401, error.message);
      return;
    }
    if (error instanceof AuthorizationError) {
      sendConfiguratorError(res, 403, error.message);
      return;
    }
    if (error instanceof z.ZodError) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    if (error instanceof Error) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    next(error);
  }
});

router.post('/translate', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const context = getRequestContext(req);
    const part = await translateShelfToManufacturingPart(input, context.currentOrganization.id);
    res.json({
      ok: true,
      action: 'translate',
      part
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      sendConfiguratorError(res, 401, error.message);
      return;
    }
    if (error instanceof AuthorizationError) {
      sendConfiguratorError(res, 403, error.message);
      return;
    }
    if (error instanceof z.ZodError) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    if (error instanceof Error) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    next(error);
  }
});

router.post('/create-job', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const context = getRequestContext(req);
    assertCapability(context, 'create_job');
    const result = await createManufacturingJobFromConfigurator(input, context.currentOrganization.id);
    res.status(201).json({
      ok: true,
      action: 'create-job',
      job: result.job,
      parts: result.parts
    });
  } catch (error) {
    if (error instanceof RequestAuthenticationError) {
      sendConfiguratorError(res, 401, error.message);
      return;
    }
    if (error instanceof AuthorizationError) {
      sendConfiguratorError(res, 403, error.message);
      return;
    }
    if (error instanceof z.ZodError) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    if (error instanceof Error) {
      sendConfiguratorError(res, 400, error.message);
      return;
    }
    next(error);
  }
});

export default router;
