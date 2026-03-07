import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const manufacturingJobsMocks = vi.hoisted(() => ({
  buildBundleNesting: vi.fn(),
  generateBundleCnc: vi.fn(),
  getBundleNesting: vi.fn(),
  getCncFile: vi.fn(),
  getSheetById: vi.fn(),
  getSheetMap: vi.fn(),
  listBundleArtifacts: vi.fn(),
  listBundleCncJobs: vi.fn(),
  listBundleSheets: vi.fn(),
  listManufacturingBundles: vi.fn()
}));

const lifecycleMocks = vi.hoisted(() => ({
  LifecycleActionError: class LifecycleActionError extends Error {
    code: string;
    details?: Record<string, unknown>;

    constructor(message: string, options?: { code?: string; details?: Record<string, unknown> }) {
      super(message);
      this.code = options?.code ?? 'invalid_transition';
      this.details = options?.details;
    }
  },
  approveCnc: vi.fn(),
  approveNesting: vi.fn(),
  completeCncJob: vi.fn(),
  failCncJob: vi.fn(),
  getBundleLifecycleView: vi.fn(),
  postCncJob: vi.fn(),
  releaseBundle: vi.fn()
}));

const configuratorMocks = vi.hoisted(() => ({
  normalizeShelfConfiguratorInput: vi.fn(),
  quoteShelf: vi.fn(),
  validateShelfConfiguratorInput: vi.fn()
}));

const packetMocks = vi.hoisted(() => ({
  generateBundlePacket: vi.fn(),
  getBundlePacket: vi.fn()
}));

vi.mock('../modules/manufacturingJobs/service.js', () => manufacturingJobsMocks);
vi.mock('../modules/manufacturingLifecycle/service.js', () => lifecycleMocks);
vi.mock('../modules/configurator/service.js', () => configuratorMocks);
vi.mock('../modules/bundlePackets/service.js', () => packetMocks);
vi.mock('../modules/customerStatus/service.js', () => ({
  projectCustomerOrderStatus: vi.fn(() => ({
    orderId: 'BUNDLE-1',
    customerStatus: 'in_production',
    detail: 'Projected'
  }))
}));

import { createApp } from '../app.js';

let server: any;
let baseUrl = '';

beforeEach(async () => {
  server = await new Promise((resolve) => {
    const instance = createApp().listen(0, () => resolve(instance));
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server.');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;

  manufacturingJobsMocks.listManufacturingBundles.mockResolvedValue([]);
  manufacturingJobsMocks.getBundleNesting.mockResolvedValue({
    summary: {
      bundleCode: 'BUNDLE-1',
      shipByDate: '03/10/2026',
      materialCode: 'WHITE_MELAMINE',
      productLabel: 'White Shelf',
      totalPhysicalParts: 3,
      nestingBuilt: true,
      cncGenerated: false,
      totalSheets: 1,
      onionSkinPartCount: 0
    },
    nesting: {
      sheetCount: 1,
      totalParts: 3,
      totalPartAreaSqIn: 500,
      onionSkinPartCount: 0,
      utilizationPct: 72,
      sheets: []
    }
  });
  manufacturingJobsMocks.listBundleCncJobs.mockResolvedValue([]);
  manufacturingJobsMocks.listBundleArtifacts.mockResolvedValue({ bundleCode: 'BUNDLE-1', artifacts: [] });
  lifecycleMocks.getBundleLifecycleView.mockResolvedValue({
    bundleCode: 'BUNDLE-1',
    status: 'draft',
    currentNestVersion: undefined,
    currentCncVersion: undefined,
    nextAllowedActions: ['release']
  });
});

afterEach(async () => {
  await new Promise((resolve, reject) =>
    server.close((error: Error | undefined) => (error ? reject(error) : resolve(undefined)))
  );
  vi.clearAllMocks();
});

async function post(path: string, body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
}

describe('manufacturing lifecycle routes', () => {
  it('releases a bundle from a legal state', async () => {
    lifecycleMocks.releaseBundle.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'ready_for_nesting',
      message: 'Bundle released for nesting.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/release');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.status).toBe('ready_for_nesting');
  });

  it('rejects illegal bundle release transitions', async () => {
    lifecycleMocks.releaseBundle.mockRejectedValue(new Error('Illegal bundle transition from nested to ready_for_nesting.'));

    const response = await post('/manufacturing/bundles/BUNDLE-1/release');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe('invalid_transition');
  });

  it('returns a stable result when release is repeated', async () => {
    lifecycleMocks.releaseBundle.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'ready_for_nesting',
      message: 'Bundle already released for nesting.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/release');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.message).toContain('already released');
  });

  it('rejects nest approval when no current nest version exists', async () => {
    lifecycleMocks.approveNesting.mockRejectedValue(new Error('Cannot approve nesting from bundle status draft.'));

    const response = await post('/manufacturing/bundles/BUNDLE-1/nest/approve');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe('invalid_transition');
  });

  it('approves nesting and advances the bundle', async () => {
    lifecycleMocks.approveNesting.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'ready_for_cnc',
      version: 2,
      message: 'Current nesting version approved.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/nest/approve');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.status).toBe('ready_for_cnc');
    expect(payload.result.version).toBe(2);
  });

  it('returns a stable result when nest approval is repeated', async () => {
    lifecycleMocks.approveNesting.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'ready_for_cnc',
      version: 2,
      message: 'Current nesting version already approved.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/nest/approve');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.message).toContain('already approved');
  });

  it('rejects CNC approval from an invalid state', async () => {
    lifecycleMocks.approveCnc.mockRejectedValue(new Error('Cannot approve CNC from bundle status nested.'));

    const response = await post('/manufacturing/bundles/BUNDLE-1/cnc/approve');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe('invalid_transition');
  });

  it('returns a stable result when CNC approval is repeated', async () => {
    lifecycleMocks.approveCnc.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'approved_for_production',
      version: 3,
      message: 'Current CNC version already approved.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/cnc/approve');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.message).toContain('already approved');
  });

  it('rejects posting a non-approved CNC job', async () => {
    lifecycleMocks.postCncJob.mockRejectedValue(new Error('Only APPROVED CNC jobs can be posted.'));

    const response = await post('/manufacturing/cnc/JOB-1/post');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe('invalid_transition');
  });

  it('completes a posted CNC job', async () => {
    lifecycleMocks.completeCncJob.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'cut_complete',
      version: 3,
      message: 'All CNC jobs completed.'
    });

    const response = await post('/manufacturing/cnc/JOB-1/complete');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.result.status).toBe('cut_complete');
  });

  it('fails a posted CNC job and preserves the failure reason', async () => {
    lifecycleMocks.failCncJob.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      status: 'error',
      version: 3,
      message: 'CNC job marked failed.'
    });

    const response = await post('/manufacturing/cnc/JOB-1/fail', { reason: 'Vacuum loss' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(lifecycleMocks.failCncJob).toHaveBeenCalledWith('JOB-1', 'Vacuum loss');
    expect(payload.result.status).toBe('error');
  });

  it('creates a bundle packet through the packet route', async () => {
    packetMocks.generateBundlePacket.mockResolvedValue({
      bundleCode: 'BUNDLE-1',
      version: 2,
      uri: '/manufacturing/bundles/BUNDLE-1/packet?version=2',
      message: 'Bundle packet generated.'
    });

    const response = await post('/manufacturing/bundles/BUNDLE-1/packet');
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.result.version).toBe(2);
  });

  it('returns error details for invalid transitions', async () => {
    lifecycleMocks.approveCnc.mockRejectedValue(
      new lifecycleMocks.LifecycleActionError('Cannot approve CNC from bundle status nested.', {
        code: 'invalid_transition',
        details: {
          currentStatus: 'nested',
          allowedNextActions: ['approve_nesting']
        }
      })
    );

    const response = await post('/manufacturing/bundles/BUNDLE-1/cnc/approve');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.details.currentStatus).toBe('nested');
    expect(payload.details.allowedNextActions).toContain('approve_nesting');
  });
});

describe('configurator routes', () => {
  it('returns shared validate/normalize/quote DTOs', async () => {
    configuratorMocks.validateShelfConfiguratorInput.mockResolvedValue({
      valid: true,
      normalizedWidthIn: 19.25,
      normalizedDepthIn: 12.5,
      materialCode: 'WHITE_MELAMINE',
      errors: [],
      warnings: []
    });
    configuratorMocks.normalizeShelfConfiguratorInput.mockResolvedValue({
      widthIn: 19.25,
      depthIn: 12.5,
      thicknessIn: 0.75,
      materialCode: 'WHITE_MELAMINE',
      edgeBandPattern: 'ALL_FOUR',
      quantity: 2,
      channel: 'WEBSITE',
      productLabel: 'White Shelf'
    });
    configuratorMocks.quoteShelf.mockResolvedValue({
      spec: {
        widthIn: 19.25,
        depthIn: 12.5,
        thicknessIn: 0.75,
        materialCode: 'WHITE_MELAMINE',
        edgeBandPattern: 'ALL_FOUR',
        quantity: 2,
        channel: 'WEBSITE',
        productLabel: 'White Shelf'
      },
      unitPrice: 22,
      totalPrice: 44,
      estimatedLeadTimeDays: 7,
      pricingVersion: 'v1-local'
    });

    const input = {
      widthIn: 19.25,
      depthIn: 12.5,
      materialCode: 'WHITE_MELAMINE',
      quantity: 2,
      channel: 'WEBSITE'
    };

    const validateResponse = await post('/configurator/validate', input);
    const validatePayload = await validateResponse.json();
    expect(validateResponse.status).toBe(200);
    expect(validatePayload.result.valid).toBe(true);

    const normalizeResponse = await post('/configurator/normalize', input);
    const normalizePayload = await normalizeResponse.json();
    expect(normalizeResponse.status).toBe(200);
    expect(normalizePayload.result.edgeBandPattern).toBe('ALL_FOUR');

    const quoteResponse = await post('/configurator/quote', input);
    const quotePayload = await quoteResponse.json();
    expect(quoteResponse.status).toBe(200);
    expect(quotePayload.result.totalPrice).toBe(44);
  });
});
