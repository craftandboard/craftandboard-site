import { Router } from 'express';
import { z } from 'zod';
import { normalizeShelfConfiguratorInput, quoteShelf, validateShelfConfiguratorInput } from '../modules/configurator/service.js';

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

router.post('/validate', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const result = await validateShelfConfiguratorInput(input);
    res.json({ status: 'ok', scope: 'configurator-v1', result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ status: 'error', scope: 'configurator-v1', code: 'invalid_request', message: error.message });
      return;
    }
    next(error);
  }
});

router.post('/normalize', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const result = await normalizeShelfConfiguratorInput(input);
    res.json({ status: 'ok', scope: 'configurator-v1', result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ status: 'error', scope: 'configurator-v1', code: 'invalid_request', message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ status: 'error', scope: 'configurator-v1', code: 'invalid_spec', message: error.message });
      return;
    }
    next(error);
  }
});

router.post('/quote', async (req, res, next) => {
  try {
    const input = configuratorSchema.parse(req.body);
    const result = await quoteShelf(input);
    res.json({ status: 'ok', scope: 'configurator-v1', result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ status: 'error', scope: 'configurator-v1', code: 'invalid_request', message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ status: 'error', scope: 'configurator-v1', code: 'invalid_quote_request', message: error.message });
      return;
    }
    next(error);
  }
});

export default router;
