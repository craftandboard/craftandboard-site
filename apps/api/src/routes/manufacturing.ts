import { Router } from 'express';
import { z } from 'zod';
import { getBundlePacket, generateBundlePacket } from '../modules/bundlePackets/service.js';
import { projectCustomerOrderStatus } from '../modules/customerStatus/service.js';
import {
  approveCnc,
  approveNesting,
  completeCncJob,
  failCncJob,
  getBundleLifecycleView,
  LifecycleActionError,
  postCncJob,
  releaseBundle
} from '../modules/manufacturingLifecycle/service.js';
import {
  buildBundleNesting,
  generateBundleCnc,
  getBundleNesting,
  getCncFile,
  getSheetById,
  getSheetMap,
  listBundleArtifacts,
  listBundleCncJobs,
  listBundleSheets,
  listManufacturingBundles
} from '../modules/manufacturingJobs/service.js';

const router = Router();
const bundleParamsSchema = z.object({ bundleCode: z.string().min(1) });
const sheetParamsSchema = z.object({ sheetId: z.string().min(1) });
const cncParamsSchema = z.object({ jobId: z.string().min(1) });
const mapQuerySchema = z.object({
  format: z.enum(['svg', 'html', 'json']).optional()
});
const packetQuerySchema = z.object({
  version: z.coerce.number().int().positive().optional()
});
const failJobBodySchema = z.object({
  reason: z.string().trim().min(1)
});

type RouteResponse = import('express').Response;

function sendError(
  res: RouteResponse,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  res.status(status).json({ status: 'error', scope: 'manufacturing-v1', code, message, ...(details ? { details } : {}) });
}

function handleManufacturingError(res: RouteResponse, error: unknown) {
  if (error instanceof z.ZodError) {
    sendError(res, 400, 'invalid_request', error.message);
    return true;
  }

  if (error instanceof LifecycleActionError) {
    sendError(res, 400, error.code, error.message, error.details);
    return true;
  }

  const message = error instanceof Error ? error.message : 'Unexpected manufacturing error.';
  const lowered = message.toLowerCase();

  if (lowered.includes('not found')) {
    sendError(res, 404, 'not_found', message);
    return true;
  }

  if (
    lowered.includes('illegal') ||
    lowered.includes('cannot ') ||
    lowered.includes('only ') ||
    lowered.includes('missing current') ||
    lowered.includes('without a current') ||
    lowered.includes('without nesting')
  ) {
    sendError(res, 400, 'invalid_transition', message);
    return true;
  }

  if (lowered.includes('no physical parts')) {
    sendError(res, 400, 'invalid_bundle', message);
    return true;
  }

  return false;
}

async function buildBundleView(bundleCode: string) {
  const [bundles, lifecycle, nesting, jobs, artifacts] = await Promise.all([
    listManufacturingBundles(),
    getBundleLifecycleView(bundleCode),
    getBundleNesting(bundleCode),
    listBundleCncJobs(bundleCode, { includeSuperseded: true }),
    listBundleArtifacts(bundleCode)
  ]);
  const sheets = await listBundleSheets(bundleCode, { includeSuperseded: true });
  const summary = bundles.find((bundle) => bundle.bundleCode === bundleCode) ?? nesting.summary;

  if (!lifecycle) {
    throw new Error(`Production bundle not found: ${bundleCode}`);
  }

  const customerStatus = projectCustomerOrderStatus({
    orderId: bundleCode,
    bundleStatuses: [lifecycle.status],
    shipmentTrackingNo: null
  });

  return {
    bundle: summary,
    lifecycle,
    customerStatus,
    nesting: nesting.nesting,
    sheets,
    jobs,
    artifacts: artifacts.artifacts
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const bundles = await listManufacturingBundles();
    res.json({ status: 'ok', scope: 'manufacturing-v1', bundles });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const bundle = await buildBundleView(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', ...bundle });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/release', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await releaseBundle(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/nest', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await buildBundleNesting(params.bundleCode);
    res.status(201).json({ status: 'ok', scope: 'manufacturing-v1', ...result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/nest/approve', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await approveNesting(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode/nest', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await getBundleNesting(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', ...result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode/sheets', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const sheets = await listBundleSheets(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', sheets });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/sheets/:sheetId', async (req, res, next) => {
  try {
    const params = sheetParamsSchema.parse(req.params);
    const sheet = await getSheetById(params.sheetId);

    if (!sheet) {
      sendError(res, 404, 'not_found', 'Sheet not found.');
      return;
    }

    res.json({ status: 'ok', scope: 'manufacturing-v1', sheet });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/sheets/:sheetId/map', async (req, res, next) => {
  try {
    const params = sheetParamsSchema.parse(req.params);
    const query = mapQuerySchema.parse(req.query);
    const map = await getSheetMap(params.sheetId);

    if (query.format === 'svg') {
      res.type('image/svg+xml').send(map.svg);
      return;
    }

    if (query.format === 'html') {
      res.type('text/html').send(map.html);
      return;
    }

    res.json({ status: 'ok', scope: 'manufacturing-v1', map });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/cnc', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await generateBundleCnc(params.bundleCode);
    res.status(201).json({ status: 'ok', scope: 'manufacturing-v1', ...result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/cnc/approve', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await approveCnc(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode/cnc', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const jobs = await listBundleCncJobs(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', jobs });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/cnc/:jobId/post', async (req, res, next) => {
  try {
    const params = cncParamsSchema.parse(req.params);
    const result = await postCncJob(params.jobId);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/cnc/:jobId/complete', async (req, res, next) => {
  try {
    const params = cncParamsSchema.parse(req.params);
    const result = await completeCncJob(params.jobId);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/cnc/:jobId/fail', async (req, res, next) => {
  try {
    const params = cncParamsSchema.parse(req.params);
    const body = failJobBodySchema.parse(req.body);
    const result = await failCncJob(params.jobId, body.reason);
    res.json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/cnc/:jobId/file', async (req, res, next) => {
  try {
    const params = cncParamsSchema.parse(req.params);
    const file = await getCncFile(params.jobId);

    if (!file) {
      sendError(res, 404, 'not_found', 'CNC job not found.');
      return;
    }

    res.type('text/plain').send(file.ncText);
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.post('/bundles/:bundleCode/packet', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await generateBundlePacket(params.bundleCode);
    res.status(201).json({ status: 'ok', scope: 'manufacturing-v1', result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode/packet', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const query = packetQuerySchema.parse(req.query);
    const packet = await getBundlePacket(params.bundleCode, query.version);
    res.type('text/html').send(packet.html);
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

router.get('/bundles/:bundleCode/artifacts', async (req, res, next) => {
  try {
    const params = bundleParamsSchema.parse(req.params);
    const result = await listBundleArtifacts(params.bundleCode);
    res.json({ status: 'ok', scope: 'manufacturing-v1', ...result });
  } catch (error) {
    if (handleManufacturingError(res, error)) {
      return;
    }
    next(error);
  }
});

export default router;
