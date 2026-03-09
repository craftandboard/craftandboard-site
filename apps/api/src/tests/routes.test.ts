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
  createManufacturingJobFromConfigurator: vi.fn(),
  normalizeShelfConfiguratorInput: vi.fn(),
  quoteShelf: vi.fn(),
  translateShelfToManufacturingPart: vi.fn(),
  validateShelfConfiguratorInput: vi.fn()
}));

const batchMocks = vi.hoisted(() => ({
  createBatchForMaterial: vi.fn(),
  createBatchFromSelectedJobs: vi.fn(),
  generateBatchCncCsv: vi.fn(),
  generateBatchCncJson: vi.fn(),
  generateBatchCncMosaic: vi.fn(),
  generateBatchCncPacket: vi.fn(),
  generateBatchLabelCsv: vi.fn(),
  generateBatchLabelPacket: vi.fn(),
  generateBatchLabelPdf: vi.fn(),
  generateBatchTravelerPdf: vi.fn(),
  getBatchDetail: vi.fn(),
  listBatches: vi.fn(),
  nestBatch: vi.fn(),
  transitionBatchStatus: vi.fn()
}));

const materialForecastMocks = vi.hoisted(() => ({
  createBatchFromForecastSelection: vi.fn(),
  getMaterialForecast: vi.fn()
}));

const containerMocks = vi.hoisted(() => ({
  assignPartToContainer: vi.fn(),
  createContainer: vi.fn(),
  getBatchSortingView: vi.fn(),
  removePartFromContainer: vi.fn()
}));

const amazonImportMocks = vi.hoisted(() => ({
  importAmazonFixtures: vi.fn(),
  previewAmazonFixtureImport: vi.fn()
}));

const orderMocks = vi.hoisted(() => ({
  generatePackingSlipPdf: vi.fn(),
  getNormalizedOrderById: vi.fn(),
  getOrderById: vi.fn(),
  listCompletedOrders: vi.fn(),
  listOrders: vi.fn(),
  markOrderShipped: vi.fn()
}));

const partsMocks = vi.hoisted(() => ({
  transitionPartStatusById: vi.fn(),
  transitionPartStatusByLabelCode: vi.fn(),
  transitionPartStatusByScanCode: vi.fn()
}));

const stationMocks = vi.hoisted(() => ({
  isShopFloorStationKey: vi.fn((value: string) => ['cutting', 'edgebanding', 'packing'].includes(value)),
  getStationQueue: vi.fn(),
  listStations: vi.fn()
}));

const orgMemberMocks = vi.hoisted(() => ({
  addOrganizationMember: vi.fn(),
  listOrganizationMembers: vi.fn(),
  updateOrganizationMemberRole: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  activateAccount: vi.fn(),
  getActivationTokenContext: vi.fn(),
  requestPasswordReset: vi.fn(),
  getPasswordResetTokenContext: vi.fn(),
  resetPassword: vi.fn(),
  signOutSession: vi.fn(),
  getAuthSessionContext: vi.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  invalidActivationError: () => new Error('Activation token is invalid or expired.'),
  invalidResetError: () => new Error('Reset token is invalid or expired.'),
  DEMO_AUTH_CREDENTIALS: {
    owner: {
      email: 'demo@craftboard.local',
      password: 'demo1234'
    },
    operator: {
      email: 'operator@craftboard.local',
      password: 'operator1234'
    }
  }
}));

const backgroundJobMocks = vi.hoisted(() => ({
  enqueueArtifactJob: vi.fn(),
  getBackgroundJobStatus: vi.fn()
}));

const machineIntegrationMocks = vi.hoisted(() => ({
  deliverBatchCncToWatchFolder: vi.fn()
}));

const machineMocks = vi.hoisted(() => ({
  createMachine: vi.fn(),
  getMachineDetail: vi.fn(),
  ingestMachineEvent: vi.fn(),
  listMachineEvents: vi.fn(),
  listMachines: vi.fn(),
  updateMachine: vi.fn()
}));

const stageSignalMocks = vi.hoisted(() => ({
  applyStageCandidateSignal: vi.fn(),
  getStageCandidateSignal: vi.fn(),
  listStageCandidateSignals: vi.fn(),
  rejectStageCandidateSignal: vi.fn(),
  safeGenerateStageCandidatesForMachineEvent: vi.fn()
}));

const trustedAutoApplyMocks = vi.hoisted(() => ({
  createTrustedAutoApplyRule: vi.fn(),
  disableTrustedAutoApplyRule: vi.fn(),
  listTrustedAutoApplyRules: vi.fn(),
  updateTrustedAutoApplyRule: vi.fn()
}));

const requestContextMocks = vi.hoisted(() => ({
  RequestAuthenticationError: class RequestAuthenticationError extends Error {},
  getRequestContext: vi.fn(() => ({
    currentUser: {
      id: 'user_demo',
      email: 'demo@craftboard.local',
      name: 'Craft Board Demo User'
    },
    currentOrganization: {
      id: 'org_local_craft_board',
      name: 'Craft & Board Demo',
      slug: 'craft-board-demo'
    },
    membership: {
      id: 'membership_demo',
      role: 'OWNER'
    },
    organizations: [
      {
        id: 'org_local_craft_board',
        slug: 'craft-board-demo',
        name: 'Craft & Board Demo',
        role: 'OWNER'
      },
      {
        id: 'org_brady_builds_demo',
        slug: 'brady-builds-demo',
        name: 'Brady Builds Demo',
        role: 'ADMIN'
      }
    ]
  })),
  requestContextMiddleware: vi.fn((req: any, _res: any, next: any) => {
    req.requestContext = requestContextMocks.getRequestContext();
    next();
  })
}));

const packetMocks = vi.hoisted(() => ({
  generateBundlePacket: vi.fn(),
  getBundlePacket: vi.fn()
}));

vi.mock('../modules/manufacturingJobs/service.js', () => manufacturingJobsMocks);
vi.mock('../modules/manufacturingLifecycle/service.js', () => lifecycleMocks);
vi.mock('../modules/configurator/service.js', () => configuratorMocks);
vi.mock('../modules/batches/service.js', () => batchMocks);
vi.mock('../modules/materialForecast/service.js', () => materialForecastMocks);
vi.mock('../modules/containers/service.js', () => containerMocks);
vi.mock('../modules/bundlePackets/service.js', () => packetMocks);
vi.mock('../modules/amazonImport/service.js', () => amazonImportMocks);
vi.mock('../modules/orders/service.js', () => orderMocks);
vi.mock('../modules/parts/service.js', () => partsMocks);
vi.mock('../modules/stations/service.js', () => stationMocks);
vi.mock('../modules/org/service.js', () => orgMemberMocks);
vi.mock('../modules/auth/service.js', () => authMocks);
vi.mock('../lib/backgroundJobs.js', () => backgroundJobMocks);
vi.mock('../modules/machineIntegration/service.js', () => machineIntegrationMocks);
vi.mock('../modules/machines/service.js', () => machineMocks);
vi.mock('../modules/machines/simulation.js', () => ({
  simulateMachineEvent: machineMocks.ingestMachineEvent
}));
vi.mock('../modules/stageSignals/service.js', () => stageSignalMocks);
vi.mock('../modules/trustedAutoApply/service.js', () => trustedAutoApplyMocks);
vi.mock('../lib/requestContext.js', () => requestContextMocks);
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
  batchMocks.listBatches.mockResolvedValue([]);
  materialForecastMocks.getMaterialForecast.mockResolvedValue({
    ok: true,
    summary: {
      totalPendingMaterials: 1,
      totalPendingParts: 2,
      estimatedTotalSheets: 1,
      materialsWithRemnantCandidates: 0
    },
    materials: []
  });
  materialForecastMocks.createBatchFromForecastSelection.mockResolvedValue({
    ok: true,
    action: 'create-forecast-batch',
    batch: {
      id: 'batch_456',
      batchCode: '20260308-WHITE_MELAMINE-02',
      status: 'DRAFT',
      material: 'WHITE_MELAMINE',
      partCount: 2,
      jobCount: 1
    },
    parts: [
      {
        id: 'part_10',
        partType: 'SHELF',
        labelCode: 'SHELF-WM-19.25x12.5-P01'
      }
    ]
  });
  machineMocks.listMachines.mockResolvedValue({
    ok: true,
    summary: {
      totalMachines: 1,
      activeMachines: 1,
      cncMachines: 1,
      edgebanders: 0
    },
    machines: [
      {
        id: 'machine_1',
        code: 'CNC-01',
        name: 'Shop CNC',
        type: 'CNC',
        status: 'ACTIVE',
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z'
      }
    ]
  });
  machineMocks.getMachineDetail.mockResolvedValue({
    ok: true,
    machine: {
      id: 'machine_1',
      code: 'CNC-01',
      name: 'Shop CNC',
      type: 'CNC',
      status: 'ACTIVE',
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    },
    recentEvents: []
  });
  machineMocks.listMachineEvents.mockResolvedValue({
    ok: true,
    events: []
  });
  machineMocks.createMachine.mockResolvedValue({
    ok: true,
    machine: {
      id: 'machine_1',
      code: 'CNC-01',
      name: 'Shop CNC',
      type: 'CNC',
      status: 'ACTIVE',
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    }
  });
  machineMocks.updateMachine.mockResolvedValue({
    ok: true,
    machine: {
      id: 'machine_1',
      code: 'CNC-01',
      name: 'Updated CNC',
      type: 'CNC',
      status: 'HOLD',
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T01:00:00.000Z'
    }
  });
  machineMocks.ingestMachineEvent.mockResolvedValue({
    ok: true,
    event: {
      id: 'evt_1',
      machineId: 'machine_1',
      eventType: 'RUN_STARTED',
      eventTs: '2026-03-08T10:00:00.000Z',
      sourceType: 'API',
      payloadJson: { batchRef: 'BATCH-1' },
      processingStatus: 'LINKED',
      createdAt: '2026-03-08T10:00:00.000Z'
    },
    linkResult: {
      processingStatus: 'LINKED',
      linkedBatchId: 'batch_1'
    }
  });
  stageSignalMocks.listStageCandidateSignals.mockResolvedValue({
    ok: true,
    summary: {
      openCount: 1,
      appliedCount: 0,
      rejectedCount: 0
    },
    candidates: [
      {
        id: 'sig_1',
        targetType: 'PART',
        candidateStage: 'CUT',
        currentStage: 'READY_FOR_BATCH',
        recommendedAction: 'MARK_PART_CUT',
        confidence: 'HIGH',
        rationale: 'Linked CNC part event indicates the part is likely cut and ready for the next stage.',
        status: 'OPEN',
        createdAt: '2026-03-08T10:00:00.000Z',
        canApply: true
      }
    ]
  });
  stageSignalMocks.getStageCandidateSignal.mockResolvedValue({
    ok: true,
    candidate: {
      id: 'sig_1',
      targetType: 'PART',
      candidateStage: 'CUT',
      currentStage: 'READY_FOR_BATCH',
      recommendedAction: 'MARK_PART_CUT',
      confidence: 'HIGH',
      rationale: 'Linked CNC part event indicates the part is likely cut and ready for the next stage.',
      status: 'OPEN',
      createdAt: '2026-03-08T10:00:00.000Z',
      canApply: true
    }
  });
  stageSignalMocks.applyStageCandidateSignal.mockResolvedValue({
    ok: true,
    candidate: {
      id: 'sig_1',
      targetType: 'PART',
      candidateStage: 'CUT',
      currentStage: 'READY_FOR_BATCH',
      recommendedAction: 'MARK_PART_CUT',
      confidence: 'HIGH',
      rationale: 'Linked CNC part event indicates the part is likely cut and ready for the next stage.',
      status: 'APPLIED',
      createdAt: '2026-03-08T10:00:00.000Z',
      canApply: false
    },
    appliedResult: {}
  });
  stageSignalMocks.rejectStageCandidateSignal.mockResolvedValue({
    ok: true,
    candidate: {
      id: 'sig_1',
      targetType: 'PART',
      candidateStage: 'CUT',
      currentStage: 'READY_FOR_BATCH',
      recommendedAction: 'MARK_PART_CUT',
      confidence: 'HIGH',
      rationale: 'Linked CNC part event indicates the part is likely cut and ready for the next stage.',
      status: 'REJECTED',
      rejectionReason: 'Not trusted.',
      createdAt: '2026-03-08T10:00:00.000Z',
      canApply: false
    }
  });
  containerMocks.getBatchSortingView.mockResolvedValue({
    ok: true,
    batch: {
      id: 'batch_123',
      code: '20260308-WHITE_MELAMINE-01',
      material: 'WHITE_MELAMINE'
    },
    summary: {
      batchId: 'batch_123',
      batchCode: '20260308-WHITE_MELAMINE-01',
      totalParts: 2,
      assignedParts: 1,
      unassignedParts: 1,
      openContainers: 1,
      completionPct: 50
    },
    containers: [],
    unassignedParts: []
  });
  containerMocks.createContainer.mockResolvedValue({
    ok: true,
    container: {
      id: 'container_1',
      batchId: 'batch_123',
      code: 'BIN-01',
      label: 'Bin 01',
      type: 'BIN',
      status: 'OPEN',
      partCount: 0,
      completionPct: 0,
      mixed: false,
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    }
  });
  containerMocks.assignPartToContainer.mockResolvedValue({
    ok: true,
    action: 'assign-part-to-container',
    container: {
      id: 'container_1',
      batchId: 'batch_123',
      code: 'BIN-01',
      label: 'Bin 01',
      type: 'BIN',
      status: 'SORTING',
      partCount: 1,
      completionPct: 50,
      mixed: false,
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    },
    part: {
      partId: 'part_1',
      labelCode: 'SHELF-WM-19.25x12.5-P01',
      scanCode: 'PART-part_1',
      currentContainerId: 'container_1',
      currentContainerCode: 'BIN-01',
      currentContainerLabel: 'Bin 01'
    }
  });
  containerMocks.removePartFromContainer.mockResolvedValue({
    ok: true,
    action: 'remove-part-from-container',
    container: {
      id: 'container_1',
      batchId: 'batch_123',
      code: 'BIN-01',
      label: 'Bin 01',
      type: 'BIN',
      status: 'OPEN',
      partCount: 0,
      completionPct: 0,
      mixed: false,
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    },
    part: {
      partId: 'part_1',
      labelCode: 'SHELF-WM-19.25x12.5-P01',
      scanCode: 'PART-part_1'
    }
  });
  orderMocks.listOrders.mockResolvedValue([]);
  orderMocks.listCompletedOrders.mockResolvedValue([]);
  orderMocks.generatePackingSlipPdf.mockResolvedValue({
    orderId: 'order_123',
    artifact: {
      type: 'order-packing-slip-pdf',
      uri: '/generated-artifacts/orders/order_123/packing-slip-v1.pdf',
      isCurrent: true,
      version: 1
    }
  });
  orderMocks.getOrderById.mockResolvedValue(null);
  orderMocks.getNormalizedOrderById.mockResolvedValue(null);
  authMocks.getAuthSessionContext.mockResolvedValue({
    ok: true,
    user: {
      email: 'demo@craftboard.local',
      name: 'Craft Board Demo User'
    },
    organization: {
      id: 'org_local_craft_board',
      slug: 'craft-board-demo',
      name: 'Craft & Board Demo'
    },
    membership: {
      id: 'membership_demo',
      role: 'OWNER'
    },
    organizations: [
      {
        id: 'org_local_craft_board',
        slug: 'craft-board-demo',
        name: 'Craft & Board Demo',
        role: 'OWNER'
      }
    ]
  });
  authMocks.getActivationTokenContext.mockResolvedValue({
    ok: true,
    user: {
      email: 'tyler@example.com',
      name: 'Tyler Phillips'
    },
    activation: {
      expiresAt: '2026-03-15T00:00:00.000Z'
    }
  });
  authMocks.activateAccount.mockResolvedValue({
    session: {
      token: 'activation-session-token',
      expiresAt: new Date('2026-03-22T00:00:00.000Z')
    },
    context: requestContextMocks.getRequestContext()
  });
  authMocks.requestPasswordReset.mockResolvedValue({
    ok: true,
    reset: {
      path: '/reset-password?token=reset-token-123'
    }
  });
  authMocks.getPasswordResetTokenContext.mockResolvedValue({
    ok: true,
    user: {
      email: 'demo@craftboard.local',
      name: 'Craft Board Demo User'
    },
    reset: {
      expiresAt: '2026-03-08T20:00:00.000Z'
    }
  });
  authMocks.resetPassword.mockResolvedValue({
    session: {
      token: 'reset-session-token',
      expiresAt: new Date('2026-03-22T00:00:00.000Z')
    },
    context: requestContextMocks.getRequestContext()
  });
  stationMocks.listStations.mockReturnValue([
    {
      id: 'station_cutting',
      organizationId: 'org_local_craft_board',
      name: 'Cutting Station',
      type: 'scan',
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z'
    }
  ]);
  stationMocks.getStationQueue.mockResolvedValue({
    ok: true,
    station: 'cutting',
    nextStatus: 'CUT',
    parts: [
      {
        partId: 'part_1',
        scanCode: 'PART-part_1',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        material: 'WHITE_MELAMINE',
        width: 19.25,
        depth: 12.5,
        batchId: 'batch_123',
        batchCode: '20260308-WHITE_MELAMINE-01',
        batchStatus: 'planned'
      }
    ]
  });
  orgMemberMocks.listOrganizationMembers.mockResolvedValue([
    {
      userId: 'user_demo',
      email: 'demo@craftboard.local',
      name: 'Craft Board Demo User',
      role: 'OWNER'
    }
  ]);
  orgMemberMocks.addOrganizationMember.mockResolvedValue({
    member: {
      userId: 'user_tyler',
      email: 'tyler@example.com',
      name: 'Tyler Phillips',
      role: 'ADMIN'
    },
    activation: {
      path: '/activate?token=activation-user_tyler'
    }
  });
  orgMemberMocks.updateOrganizationMemberRole.mockResolvedValue({
    userId: 'user_tyler',
    email: 'tyler@example.com',
    name: 'Tyler Phillips',
    role: 'OPERATOR'
  });
  batchMocks.getBatchDetail.mockResolvedValue({
    batch: {
      id: 'batch_123',
      code: '20260308-WHITE_MELAMINE-01',
      status: 'planned',
      material: 'WHITE_MELAMINE',
      source: 'CONFIGURATOR',
      partCount: 2,
      jobCount: 1,
      createdAt: '2026-03-08T00:00:00.000Z',
      updatedAt: '2026-03-08T00:00:00.000Z',
      availableNextActions: ['released'],
      progress: {
        totalParts: 2,
        cutCount: 1,
        edgebandedCount: 0,
        packedCount: 0
      }
    },
    jobs: [],
    parts: [
      {
        id: 'part_1',
        jobId: 'job_1',
        source: 'CONFIGURATOR',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        status: 'cut',
        availableNextActions: ['edgebanded', 'packed'],
        material: 'WHITE_MELAMINE',
        edgeBandPattern: 'ALL_FOUR',
        width: 19.25,
        depth: 12.5,
        thickness: 0.75,
        instanceNumber: 1
      }
    ],
    sheets: [],
    artifacts: {
      cnc: {},
      labels: {},
      traveler: {}
    }
  });
  amazonImportMocks.previewAmazonFixtureImport.mockResolvedValue({
    filesProcessed: 0,
    previews: [],
    warnings: [],
    errors: []
  });
  amazonImportMocks.importAmazonFixtures.mockResolvedValue({
    filesProcessed: 0,
    ordersCreated: 0,
    orderItemsCreated: 0,
    partInstancesCreated: 0,
    jobsCreated: 0,
    warnings: [],
    errors: [],
    orders: [],
    jobs: [],
    parts: []
  });
  batchMocks.generateBatchCncCsv.mockResolvedValue({
    batchId: 'batch_123',
    artifact: {
      type: 'batch-cnc-csv',
      uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.csv',
      isCurrent: true,
      version: 1
    }
  });
  batchMocks.generateBatchCncMosaic.mockResolvedValue({
    batchId: 'batch_123',
    artifact: {
      type: 'batch-cnc-mosaic',
      uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
      isCurrent: true,
      version: 1
    }
  });
  batchMocks.generateBatchCncJson.mockResolvedValue({
    batchId: 'batch_123',
    artifact: {
      type: 'batch-cnc-json',
      uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.json',
      isCurrent: true,
      version: 1
    }
  });
  batchMocks.generateBatchLabelCsv.mockResolvedValue({
    batchId: 'batch_123',
    artifact: {
      type: 'batch-label-csv',
      uri: '/generated-artifacts/batches/batch_123/label-export-v1.csv',
      isCurrent: true,
      version: 1
    }
  });
  backgroundJobMocks.enqueueArtifactJob.mockResolvedValue({
    jobId: 'artifact-generation:job_123',
    status: 'queued'
  });
  backgroundJobMocks.getBackgroundJobStatus.mockResolvedValue({
    id: 'artifact-generation:job_123',
    type: 'generate-cnc-mosaic',
    status: 'completed',
    artifactUri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv'
  });
  machineIntegrationMocks.deliverBatchCncToWatchFolder.mockResolvedValue({
    batchId: 'batch_123',
    format: 'mosaic',
    artifact: {
      type: 'batch-cnc-mosaic',
      uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
      version: 1
    },
    delivery: {
      target: 'watch-folder',
      path: '/tmp/craft-board-watch/20260308-WHITE_MELAMINE-01-mosaic-v1.csv'
    }
  });
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

describe('station routes', () => {
  it('lists configured stations', async () => {
    const response = await fetch(`${baseUrl}/stations`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.stations).toHaveLength(1);
    expect(payload.stations[0].name).toBe('Cutting Station');
  });

  it('returns a filtered station queue', async () => {
    const response = await fetch(`${baseUrl}/stations/cutting`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.station).toBe('cutting');
    expect(payload.parts[0].scanCode).toBe('PART-part_1');
    expect(stationMocks.getStationQueue).toHaveBeenCalledWith('cutting', 'org_local_craft_board');
  });

  it('rejects unknown station routes', async () => {
    const response = await fetch(`${baseUrl}/stations/unknown`);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      ok: false,
      error: 'Station not found.'
    });
  });

  it('returns current request context from /me/context', async () => {
    const response = await fetch(`${baseUrl}/me/context`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user.email).toBe('demo@craftboard.local');
    expect(payload.organization.slug).toBe('craft-board-demo');
    expect(payload.membership.role).toBe('OWNER');
    expect(payload.organizations).toHaveLength(2);
  });
});

describe('background job routes', () => {
  it('returns queued status when an artifact endpoint is requested in async mode', async () => {
    const response = await post('/batches/generate-cnc-mosaic', { batchId: 'batch_123', mode: 'async' });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(backgroundJobMocks.enqueueArtifactJob).toHaveBeenCalledWith({
      type: 'generate-cnc-mosaic',
      batchId: 'batch_123',
      organizationId: 'org_local_craft_board'
    });
    expect(payload).toEqual({
      ok: true,
      jobId: 'artifact-generation:job_123',
      status: 'queued'
    });
  });

  it('returns background job status for polling', async () => {
    const response = await fetch(`${baseUrl}/jobs/artifact-generation:job_123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      job: {
        id: 'artifact-generation:job_123',
        type: 'generate-cnc-mosaic',
        status: 'completed',
        artifactUri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv'
      }
    });
  });

  it('queues packing slip generation in async mode', async () => {
    const response = await post('/orders/order_123/generate-packing-slip', { mode: 'async' });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(backgroundJobMocks.enqueueArtifactJob).toHaveBeenCalledWith({
      type: 'generate-packing-slip',
      orderId: 'order_123',
      organizationId: 'org_local_craft_board'
    });
    expect(payload).toEqual({
      ok: true,
      jobId: 'artifact-generation:job_123',
      status: 'queued'
    });
  });

  it('delivers a CNC artifact to the configured watch folder', async () => {
    const response = await post('/batches/deliver-cnc-watch-folder', {
      batchId: 'batch_123',
      format: 'mosaic'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(machineIntegrationMocks.deliverBatchCncToWatchFolder).toHaveBeenCalledWith(
      'batch_123',
      'mosaic',
      'org_local_craft_board'
    );
    expect(payload).toEqual({
      ok: true,
      action: 'deliver-cnc-watch-folder',
      batchId: 'batch_123',
      format: 'mosaic',
      artifact: {
        type: 'batch-cnc-mosaic',
        uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
        version: 1
      },
      delivery: {
        target: 'watch-folder',
        path: '/tmp/craft-board-watch/20260308-WHITE_MELAMINE-01-mosaic-v1.csv'
      }
    });
  });

  it('queues watch-folder delivery in async mode', async () => {
    const response = await post('/batches/deliver-cnc-watch-folder', {
      batchId: 'batch_123',
      format: 'json',
      mode: 'async'
    });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(backgroundJobMocks.enqueueArtifactJob).toHaveBeenCalledWith({
      type: 'deliver-cnc-watch-folder',
      batchId: 'batch_123',
      organizationId: 'org_local_craft_board',
      format: 'json'
    });
    expect(payload).toEqual({
      ok: true,
      jobId: 'artifact-generation:job_123',
      status: 'queued'
    });
  });
});

describe('organization member routes', () => {
  it('lists current organization members', async () => {
    const response = await fetch(`${baseUrl}/org/members`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.members[0].email).toBe('demo@craftboard.local');
    expect(orgMemberMocks.listOrganizationMembers).toHaveBeenCalledWith('org_local_craft_board');
  });

  it('allows an owner to add a member', async () => {
    const response = await post('/org/members', {
      email: 'tyler@example.com',
      name: 'Tyler Phillips',
      role: 'ADMIN'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.member.email).toBe('tyler@example.com');
    expect(orgMemberMocks.addOrganizationMember).toHaveBeenCalledWith({
      organizationId: 'org_local_craft_board',
      email: 'tyler@example.com',
      name: 'Tyler Phillips',
      role: 'ADMIN'
    });
  });

  it('allows an owner to update a member role', async () => {
    const response = await post('/org/members/user_tyler/role', {
      role: 'OPERATOR'
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.member.role).toBe('OPERATOR');
    expect(orgMemberMocks.updateOrganizationMemberRole).toHaveBeenCalledWith({
      organizationId: 'org_local_craft_board',
      userId: 'user_tyler',
      role: 'OPERATOR'
    });
  });

  it('blocks admins from managing organization members', async () => {
    const adminContext = {
      currentUser: {
        id: 'user_admin',
        email: 'admin@craftboard.local',
        name: 'Brady Builds Admin'
      },
      currentOrganization: {
        id: 'org_brady_builds_demo',
        name: 'Brady Builds Demo',
        slug: 'brady-builds-demo'
      },
      membership: {
        id: 'membership_admin',
        role: 'ADMIN'
      },
      organizations: [
        {
          id: 'org_brady_builds_demo',
          slug: 'brady-builds-demo',
          name: 'Brady Builds Demo',
          role: 'ADMIN'
        }
      ]
    };
    requestContextMocks.getRequestContext
      .mockImplementationOnce(() => adminContext)
      .mockImplementationOnce(() => adminContext);

    const response = await post('/org/members', {
      email: 'operator2@example.com',
      name: 'Second Operator',
      role: 'OPERATOR'
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      error: 'User admin@craftboard.local does not have permission to perform organization member management in organization brady-builds-demo.'
    });
  });
});

describe('auth routes', () => {
  it('signs in a seeded demo user and returns session context', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      session: {
        token: 'session-token-123',
        expiresAt: new Date('2026-03-22T00:00:00.000Z')
      },
      context: requestContextMocks.getRequestContext()
    });

    const response = await post('/auth/login', {
      email: 'demo@craftboard.local',
      password: 'demo1234'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.sessionToken).toBe('session-token-123');
    expect(payload.user.email).toBe('demo@craftboard.local');
  });

  it('returns the current authenticated session', async () => {
    const response = await fetch(`${baseUrl}/auth/session`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.user.email).toBe('demo@craftboard.local');
  });

  it('requires authentication when request context is absent', async () => {
    requestContextMocks.requestContextMiddleware.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.requestContext = undefined;
      next();
    });
    requestContextMocks.getRequestContext.mockImplementationOnce(() => {
      throw new requestContextMocks.RequestAuthenticationError('Authentication required.');
    });

    const response = await fetch(`${baseUrl}/auth/session`);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      ok: false,
      error: 'Authentication required.'
    });
  });

  it('validates an activation token', async () => {
    const response = await fetch(`${baseUrl}/auth/activate/validate?token=activation-token-123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.user.email).toBe('tyler@example.com');
    expect(authMocks.getActivationTokenContext).toHaveBeenCalledWith('activation-token-123');
  });

  it('activates an account and returns a session context', async () => {
    const response = await post('/auth/activate', {
      token: 'activation-token-123',
      password: 'supersecure123'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.sessionToken).toBe('activation-session-token');
    expect(authMocks.activateAccount).toHaveBeenCalledWith({
      token: 'activation-token-123',
      password: 'supersecure123'
    });
  });

  it('requests a password reset without exposing auth internals', async () => {
    const response = await post('/auth/forgot-password', {
      email: 'demo@craftboard.local'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.reset.path).toBe('/reset-password?token=reset-token-123');
    expect(authMocks.requestPasswordReset).toHaveBeenCalledWith({
      email: 'demo@craftboard.local'
    });
  });

  it('validates a reset token', async () => {
    const response = await fetch(`${baseUrl}/auth/reset-password/validate?token=reset-token-123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.user.email).toBe('demo@craftboard.local');
    expect(authMocks.getPasswordResetTokenContext).toHaveBeenCalledWith('reset-token-123');
  });

  it('resets a password and returns a fresh session context', async () => {
    const response = await post('/auth/reset-password', {
      token: 'reset-token-123',
      password: 'newsecure123'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.sessionToken).toBe('reset-session-token');
    expect(authMocks.resetPassword).toHaveBeenCalledWith({
      token: 'reset-token-123',
      password: 'newsecure123'
    });
  });
});

describe('order routes', () => {
  it('returns the completed work queue', async () => {
    orderMocks.listCompletedOrders.mockResolvedValue([
      {
        orderId: 'order_123',
        source: 'AMAZON',
        status: 'READY_FOR_SHIPMENT',
        jobCount: 2,
        partCount: 8,
        completedAt: '2026-03-08T10:00:00.000Z'
      }
    ]);

    const response = await fetch(`${baseUrl}/orders/completed`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      orders: [
        {
          orderId: 'order_123',
          source: 'AMAZON',
          status: 'READY_FOR_SHIPMENT',
          jobCount: 2,
          partCount: 8,
          completedAt: '2026-03-08T10:00:00.000Z'
        }
      ]
    });
  });

  it('marks a completed order shipped', async () => {
    orderMocks.markOrderShipped.mockResolvedValue({
      id: 'order_123',
      status: 'SHIPPED'
    });

    const response = await post('/orders/order_123/ship');
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      order: {
        id: 'order_123',
        status: 'SHIPPED'
      }
    });
  });

  it('generates a packing slip pdf for a completed order', async () => {
    const response = await post('/orders/order_123/generate-packing-slip');
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-packing-slip',
      orderId: 'order_123',
      artifact: {
        type: 'order-packing-slip-pdf',
        uri: '/generated-artifacts/orders/order_123/packing-slip-v1.pdf',
        isCurrent: true,
        version: 1
      }
    });
    expect(orderMocks.generatePackingSlipPdf).toHaveBeenCalledWith('order_123', 'org_local_craft_board');
  });

  it('blocks operator users from fixture import', async () => {
    const operatorContext = {
      currentUser: {
        id: 'user_operator',
        email: 'operator@craftboard.local',
        name: 'Craft Board Demo Operator'
      },
      currentOrganization: {
        id: 'org_local_craft_board',
        name: 'Craft & Board Demo',
        slug: 'craft-board-demo'
      },
      membership: {
        id: 'membership_operator',
        role: 'OPERATOR'
      },
      organizations: [
        {
          id: 'org_local_craft_board',
          slug: 'craft-board-demo',
          name: 'Craft & Board Demo',
          role: 'OPERATOR'
        }
      ]
    };
    requestContextMocks.getRequestContext
      .mockReturnValueOnce(operatorContext)
      .mockReturnValueOnce(operatorContext);

    const response = await fetch(`${baseUrl}/orders/import/amazon-fixtures`, {
      method: 'POST'
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      error:
        'User operator@craftboard.local does not have permission to perform fixture import in organization craft-board-demo.'
    });
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
    configuratorMocks.translateShelfToManufacturingPart.mockResolvedValue({
      partType: 'SHELF',
      width: 19.25,
      depth: 12.5,
      thickness: 0.75,
      material: 'WHITE_MELAMINE',
      edgeBandPattern: 'ALL_FOUR',
      quantity: 2,
      unit: 'IN',
      manufacturingMode: 'CUT_AND_EDGE',
      labelCode: 'SHELF-WM-19.25x12.5',
      grainDirection: 'WIDTH',
      cutMethod: 'RECTANGLE_CUT',
      source: 'CONFIGURATOR'
    });
    configuratorMocks.createManufacturingJobFromConfigurator.mockResolvedValue({
      job: {
        id: 'job_123',
        status: 'DRAFT',
        source: 'CONFIGURATOR'
      },
      parts: [
        {
          id: 'part_1',
          partType: 'SHELF',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          unit: 'IN',
          manufacturingMode: 'CUT_AND_EDGE',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          grainDirection: 'WIDTH',
          cutMethod: 'RECTANGLE_CUT',
          source: 'CONFIGURATOR'
        },
        {
          id: 'part_2',
          partType: 'SHELF',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          unit: 'IN',
          manufacturingMode: 'CUT_AND_EDGE',
          labelCode: 'SHELF-WM-19.25x12.5-P02',
          grainDirection: 'WIDTH',
          cutMethod: 'RECTANGLE_CUT',
          source: 'CONFIGURATOR'
        }
      ]
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
    expect(validatePayload).toEqual({
      ok: true,
      action: 'validate',
      validation: {
        isValid: true,
        errors: []
      }
    });

    const normalizeResponse = await post('/configurator/normalize', input);
    const normalizePayload = await normalizeResponse.json();
    expect(normalizeResponse.status).toBe(200);
    expect(normalizePayload).toEqual({
      ok: true,
      action: 'normalize',
      normalized: {
        width: 19.25,
        depth: 12.5,
        quantity: 2,
        material: 'WHITE_MELAMINE',
        channel: 'WEBSITE',
        thickness: 0.75,
        edgeBandPattern: 'ALL_FOUR',
        unit: 'IN'
      }
    });

    const quoteResponse = await post('/configurator/quote', input);
    const quotePayload = await quoteResponse.json();
    expect(quoteResponse.status).toBe(200);
    expect(quotePayload).toEqual({
      ok: true,
      action: 'quote',
      quote: {
        currency: 'USD',
        unitPrice: 22,
        quantity: 2,
        subtotal: 44,
        status: 'FOUNDATION_PLACEHOLDER'
      }
    });

    const translateResponse = await post('/configurator/translate', input);
    const translatePayload = await translateResponse.json();
    expect(translateResponse.status).toBe(200);
    expect(translatePayload).toEqual({
      ok: true,
      action: 'translate',
      part: {
        partType: 'SHELF',
        width: 19.25,
        depth: 12.5,
        thickness: 0.75,
        material: 'WHITE_MELAMINE',
        edgeBandPattern: 'ALL_FOUR',
        quantity: 2,
        unit: 'IN',
        manufacturingMode: 'CUT_AND_EDGE',
        labelCode: 'SHELF-WM-19.25x12.5',
        grainDirection: 'WIDTH',
        cutMethod: 'RECTANGLE_CUT',
        source: 'CONFIGURATOR'
      }
    });

    const createJobResponse = await post('/configurator/create-job', input);
    const createJobPayload = await createJobResponse.json();
    expect(createJobResponse.status).toBe(201);
    expect(createJobPayload).toEqual({
      ok: true,
      action: 'create-job',
      job: {
        id: 'job_123',
        status: 'DRAFT',
        source: 'CONFIGURATOR'
      },
      parts: [
        {
          id: 'part_1',
          partType: 'SHELF',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          unit: 'IN',
          manufacturingMode: 'CUT_AND_EDGE',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          grainDirection: 'WIDTH',
          cutMethod: 'RECTANGLE_CUT',
          source: 'CONFIGURATOR'
        },
        {
          id: 'part_2',
          partType: 'SHELF',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          unit: 'IN',
          manufacturingMode: 'CUT_AND_EDGE',
          labelCode: 'SHELF-WM-19.25x12.5-P02',
          grainDirection: 'WIDTH',
          cutMethod: 'RECTANGLE_CUT',
          source: 'CONFIGURATOR'
        }
      ]
    });
  });

  it('returns structured error json for invalid translate input', async () => {
    configuratorMocks.translateShelfToManufacturingPart.mockRejectedValue(
      new Error('Width must be between 8 and 35 inches.')
    );

    const response = await post('/configurator/translate', {
      widthIn: 4,
      depthIn: 12.5,
      materialCode: 'WHITE_MELAMINE',
      quantity: 2,
      channel: 'WEBSITE'
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Width must be between 8 and 35 inches.'
    });
  });

  it('returns structured error json for invalid create job input', async () => {
    const response = await post('/configurator/create-job', {
      widthIn: 19.25,
      depthIn: 12.5,
      materialCode: 'WHITE_MELAMINE',
      quantity: 0,
      channel: 'WEBSITE'
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(typeof payload.error).toBe('string');
  });
});

describe('amazon import routes', () => {
  it('returns a structured fixture import summary with operational records', async () => {
    amazonImportMocks.importAmazonFixtures.mockResolvedValue({
      filesProcessed: 2,
      ordersCreated: 2,
      orderItemsCreated: 3,
      partInstancesCreated: 6,
      jobsCreated: 2,
      warnings: [],
      errors: [],
      orders: [{ id: 'order_1', source: 'AMAZON' }],
      jobs: [
        {
          id: 'job_1',
          status: 'DRAFT',
          source: 'AMAZON',
          orderId: 'order_1',
          orderItemId: 'item_1'
        }
      ],
      parts: [
        {
          id: 'part_1',
          jobId: 'job_1',
          orderId: 'order_1',
          orderItemId: 'item_1',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          scanCode: 'PART-part_1',
          source: 'AMAZON'
        }
      ]
    });

    const response = await post('/orders/import/amazon-fixtures');
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'import-amazon-fixtures',
      summary: {
        ordersCreated: 2,
        jobsCreated: 2,
        partsCreated: 6
      },
      filesProcessed: 2,
      ordersCreated: 2,
      orderItemsCreated: 3,
      partInstancesCreated: 6,
      jobsCreated: 2,
      warnings: [],
      errors: [],
      orders: [{ id: 'order_1', source: 'AMAZON' }],
      jobs: [
        {
          id: 'job_1',
          status: 'DRAFT',
          source: 'AMAZON',
          orderId: 'order_1',
          orderItemId: 'item_1'
        }
      ],
      parts: [
        {
          id: 'part_1',
          jobId: 'job_1',
          orderId: 'order_1',
          orderItemId: 'item_1',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          scanCode: 'PART-part_1',
          source: 'AMAZON'
        }
      ]
    });
  });

  it('returns a structured import error', async () => {
    amazonImportMocks.importAmazonFixtures.mockRejectedValue(new Error('Fixture payload missing ship-by date.'));

    const response = await post('/orders/import/amazon-fixtures');
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Fixture payload missing ship-by date.'
    });
  });
});

describe('batch routes', () => {
  it('returns aggregated batch detail', async () => {
    batchMocks.getBatchDetail.mockResolvedValue({
      batch: {
        id: 'batch_123',
        code: '20260308-WHITE_MELAMINE-01',
        status: 'planned',
        material: 'WHITE_MELAMINE',
        source: 'CONFIGURATOR',
        partCount: 2,
        jobCount: 1,
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
        availableNextActions: ['released'],
        progress: {
          totalParts: 2,
          cutCount: 1,
          edgebandedCount: 0,
          packedCount: 0
        }
      },
      jobs: [
        {
          id: 'job_1',
          source: 'CONFIGURATOR',
          status: 'DRAFT',
          channel: 'WEBSITE',
          labelCode: 'SHELF-WM-19.25x12.5',
          partType: 'SHELF',
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          quantity: 2,
          partIds: ['part_1', 'part_2']
        }
      ],
      parts: [
        {
          id: 'part_1',
          jobId: 'job_1',
          source: 'CONFIGURATOR',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          scanCode: 'PART-part_1',
          status: 'cut',
          availableNextActions: ['edgebanded', 'packed'],
          material: 'WHITE_MELAMINE',
          edgeBandPattern: 'ALL_FOUR',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          instanceNumber: 1
        }
      ],
      sheets: [
        {
          id: 'sheet_1',
          sheetIndex: 1,
          material: 'WHITE_MELAMINE',
          sheetWidth: 48,
          sheetHeight: 96,
          status: 'planned',
          placements: [
            {
              id: 'placement_1',
              partId: 'part_1',
              labelCode: 'SHELF-WM-19.25x12.5-P01',
              x: 0.25,
              y: 0.25,
              width: 19.25,
              depth: 12.5,
              sequenceNumber: 1
            }
          ]
        }
      ],
      artifacts: {
        cnc: {
        artifact: {
          id: 'artifact_cnc',
          type: 'batch-cnc-packet',
          uri: '/batches/batch_123/cnc-packet',
            version: 1,
            isCurrent: true,
            generatedFrom: 'CNC-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          },
          packet: {
            packetCode: 'CNC-20260308-WHITE_MELAMINE-01',
            sheetCount: 1,
            partCount: 1,
            format: 'FOUNDATION_JSON'
          },
          sheets: [],
          csv: {
            id: 'artifact_cnc_csv',
            type: 'batch-cnc-csv',
            uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.csv',
            version: 1,
            isCurrent: true,
            generatedFrom: 'CNC-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          },
          mosaic: {
            id: 'artifact_cnc_mosaic',
            type: 'batch-cnc-mosaic',
            uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
            version: 1,
            isCurrent: true,
            generatedFrom: 'MOSAIC-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          },
          json: {
            id: 'artifact_cnc_json',
            type: 'batch-cnc-json',
            uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.json',
            version: 1,
            isCurrent: true,
            generatedFrom: 'CNC_JSON-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          }
        },
        labels: {
          artifact: {
            id: 'artifact_labels',
            type: 'batch-label-packet',
            uri: '/batches/batch_123/labels-packet',
            version: 1,
            isCurrent: true,
            generatedFrom: 'LABELS-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          },
          packet: {
            packetCode: 'LABELS-20260308-WHITE_MELAMINE-01',
            labelCount: 1,
            format: 'FOUNDATION_JSON'
          },
          labels: [],
          csv: {
            id: 'artifact_labels_csv',
            type: 'batch-label-csv',
            uri: '/generated-artifacts/batches/batch_123/label-export-v1.csv',
            version: 1,
            isCurrent: true,
            generatedFrom: 'LABELS-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          },
          pdf: {
            id: 'artifact_labels_pdf',
            type: 'batch-label-pdf',
            uri: '/generated-artifacts/batches/batch_123/label-packet-v1.pdf',
            version: 1,
            isCurrent: true,
            generatedFrom: 'LABELS-20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          }
        },
        traveler: {
          pdf: {
            id: 'artifact_traveler_pdf',
            type: 'batch-traveler-pdf',
            uri: '/generated-artifacts/batches/batch_123/traveler-v1.pdf',
            version: 1,
            isCurrent: true,
            generatedFrom: '20260308-WHITE_MELAMINE-01',
            createdAt: '2026-03-08T00:00:00.000Z'
          }
        }
      }
    });

    const response = await fetch(`${baseUrl}/batches/batch_123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.batch.code).toBe('20260308-WHITE_MELAMINE-01');
    expect(payload.sheets[0].placements[0].labelCode).toBe('SHELF-WM-19.25x12.5-P01');
    expect(payload.artifacts.cnc.packet.packetCode).toBe('CNC-20260308-WHITE_MELAMINE-01');
    expect(payload.artifacts.cnc.csv.uri).toBe('/generated-artifacts/batches/batch_123/cnc-export-v1.csv');
    expect(payload.artifacts.cnc.mosaic.uri).toBe('/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv');
    expect(payload.artifacts.cnc.json.uri).toBe('/generated-artifacts/batches/batch_123/cnc-export-v1.json');
    expect(payload.artifacts.labels.packet.packetCode).toBe('LABELS-20260308-WHITE_MELAMINE-01');
    expect(payload.artifacts.labels.csv.uri).toBe('/generated-artifacts/batches/batch_123/label-export-v1.csv');
    expect(payload.artifacts.labels.pdf.uri).toBe('/generated-artifacts/batches/batch_123/label-packet-v1.pdf');
    expect(payload.artifacts.traveler.pdf.uri).toBe('/generated-artifacts/batches/batch_123/traveler-v1.pdf');
    expect(payload.batch.availableNextActions).toEqual(['released']);
    expect(payload.batch.progress.cutCount).toBe(1);
    expect(payload.parts[0].status).toBe('cut');
  });

  it('returns structured error json when batch detail is missing', async () => {
    batchMocks.getBatchDetail.mockRejectedValue(new Error('Batch not found.'));

    const response = await fetch(`${baseUrl}/batches/missing`);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      ok: false,
      error: 'Batch not found.'
    });
  });

  it('creates a persisted draft batch for a material', async () => {
    batchMocks.createBatchForMaterial.mockResolvedValue({
      batch: {
        id: 'batch_123',
        batchCode: '20260308-WHITE_MELAMINE-01',
        status: 'DRAFT',
        material: 'WHITE_MELAMINE',
        partCount: 6,
        jobCount: 3
      },
      parts: [
        {
          id: 'part_1',
          partType: 'SHELF',
          labelCode: 'SHELF-WM-19.25x12.5-P01'
        }
      ]
    });

    const response = await post('/batches/build', { material: 'WHITE_MELAMINE' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'create-batch',
      batch: {
        id: 'batch_123',
        batchCode: '20260308-WHITE_MELAMINE-01',
        status: 'DRAFT',
        material: 'WHITE_MELAMINE',
        partCount: 6,
        jobCount: 3
      },
      parts: [
        {
          id: 'part_1',
          partType: 'SHELF',
          labelCode: 'SHELF-WM-19.25x12.5-P01'
        }
      ]
    });
  });

  it('returns the computed material forecast', async () => {
    const response = await fetch(`${baseUrl}/material-forecast`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.summary.totalPendingMaterials).toBe(1);
  });

  it('creates a batch from explicit forecast selection', async () => {
    const response = await post('/material-forecast/create-batch', {
      materialCode: 'WHITE_MELAMINE',
      jobIds: ['job_1']
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.action).toBe('create-forecast-batch');
    expect(materialForecastMocks.createBatchFromForecastSelection).toHaveBeenCalledWith(
      {
        materialCode: 'WHITE_MELAMINE',
        jobIds: ['job_1']
      },
      'org_local_craft_board'
    );
  });

  it('returns the batch sorting view for a batch', async () => {
    const response = await fetch(`${baseUrl}/containers/batch/batch_123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.assignedParts).toBe(1);
  });

  it('creates a container for a batch', async () => {
    const response = await post('/containers', {
      batchId: 'batch_123',
      type: 'BIN',
      label: 'Bin 01'
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.container.code).toBe('BIN-01');
  });

  it('assigns a part into a container by scan code', async () => {
    const response = await post('/containers/scan', {
      containerId: 'container_1',
      scanCode: 'PART-part_1'
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.action).toBe('assign-part-to-container');
    expect(containerMocks.assignPartToContainer).toHaveBeenCalledWith(
      {
        containerId: 'container_1',
        scanCode: 'PART-part_1'
      },
      'org_local_craft_board'
    );
  });

  it('allows operators to read batch detail but blocks batch build', async () => {
    const operatorContext = {
      currentUser: {
        id: 'user_operator',
        email: 'operator@craftboard.local',
        name: 'Craft Board Demo Operator'
      },
      currentOrganization: {
        id: 'org_local_craft_board',
        name: 'Craft & Board Demo',
        slug: 'craft-board-demo'
      },
      membership: {
        id: 'membership_operator',
        role: 'OPERATOR'
      },
      organizations: [
        {
          id: 'org_local_craft_board',
          slug: 'craft-board-demo',
          name: 'Craft & Board Demo',
          role: 'OPERATOR'
        }
      ]
    };
    requestContextMocks.getRequestContext
      .mockReturnValueOnce(operatorContext)
      .mockReturnValueOnce(operatorContext)
      .mockReturnValueOnce(operatorContext)
      .mockReturnValueOnce(operatorContext);

    const detailResponse = await fetch(`${baseUrl}/batches/batch_123`);
    expect(detailResponse.status).toBe(200);

    const buildResponse = await post('/batches/build', { material: 'WHITE_MELAMINE' });
    const buildPayload = await buildResponse.json();

    expect(buildResponse.status).toBe(403);
    expect(buildPayload).toEqual({
      ok: false,
      error:
        'User operator@craftboard.local does not have permission to perform batch build in organization craft-board-demo.'
    });
  });

  it('allows admin users to perform batch build in a valid organization', async () => {
    const adminContext = {
      currentUser: {
        id: 'user_demo',
        email: 'demo@craftboard.local',
        name: 'Craft Board Demo User'
      },
      currentOrganization: {
        id: 'org_brady_builds_demo',
        name: 'Brady Builds Demo',
        slug: 'brady-builds-demo'
      },
      membership: {
        id: 'membership_admin',
        role: 'ADMIN'
      },
      organizations: [
        {
          id: 'org_local_craft_board',
          slug: 'craft-board-demo',
          name: 'Craft & Board Demo',
          role: 'OWNER'
        },
        {
          id: 'org_brady_builds_demo',
          slug: 'brady-builds-demo',
          name: 'Brady Builds Demo',
          role: 'ADMIN'
        }
      ]
    };
    requestContextMocks.getRequestContext
      .mockReturnValueOnce(adminContext)
      .mockReturnValueOnce(adminContext);

    batchMocks.createBatchForMaterial.mockResolvedValue({
      batch: {
        id: 'batch_admin',
        batchCode: '20260308-WHITE_MELAMINE-02',
        status: 'DRAFT',
        material: 'WHITE_MELAMINE',
        partCount: 2,
        jobCount: 1
      },
      parts: [
        {
          id: 'part_admin_1',
          partType: 'SHELF',
          labelCode: 'SHELF-WM-19.25x12.5-P01'
        }
      ]
    });

    const response = await post('/batches/build', { material: 'WHITE_MELAMINE' });

    expect(response.status).toBe(201);
    expect(batchMocks.createBatchForMaterial).toHaveBeenCalledWith(
      'WHITE_MELAMINE',
      'org_brady_builds_demo'
    );
  });

  it('transitions a batch through a legal next status', async () => {
    batchMocks.transitionBatchStatus.mockResolvedValue({
      batch: {
        id: 'batch_123',
        code: '20260308-WHITE_MELAMINE-01',
        status: 'released',
        availableNextActions: ['cutting']
      }
    });

    const response = await post('/batches/batch_123/status', { nextStatus: 'RELEASED' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      action: 'transition-batch',
      batch: {
        id: 'batch_123',
        code: '20260308-WHITE_MELAMINE-01',
        status: 'released',
        availableNextActions: ['cutting']
      }
    });
  });

  it('returns structured error json for invalid batch transition', async () => {
    batchMocks.transitionBatchStatus.mockRejectedValue(
      new Error('Batch 20260308-WHITE_MELAMINE-01 cannot move from DRAFT to CUT_COMPLETE.')
    );

    const response = await post('/batches/batch_123/status', { nextStatus: 'CUT_COMPLETE' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Batch 20260308-WHITE_MELAMINE-01 cannot move from DRAFT to CUT_COMPLETE.'
    });
  });

  it('returns structured error json when no eligible parts exist', async () => {
    batchMocks.createBatchForMaterial.mockRejectedValue(
      new Error('No eligible draft parts found for WHITE_MELAMINE.')
    );

    const response = await post('/batches/build', { material: 'WHITE_MELAMINE' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'No eligible draft parts found for WHITE_MELAMINE.'
    });
  });

  it('creates persisted sheet layouts for a batch', async () => {
    batchMocks.nestBatch.mockResolvedValue({
      batchId: 'batch_123',
      sheets: [
        {
          sheetIndex: 1,
          material: 'WHITE_MELAMINE',
          parts: [
            {
              partId: 'part_1',
              x: 0,
              y: 0,
              width: 19.25,
              depth: 12.5
            }
          ]
        }
      ]
    });

    const response = await post('/batches/nest', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'nest-batch',
      batchId: 'batch_123',
      sheets: [
        {
          sheetIndex: 1,
          material: 'WHITE_MELAMINE',
          parts: [
            {
              partId: 'part_1',
              x: 0,
              y: 0,
              width: 19.25,
              depth: 12.5
            }
          ]
        }
      ]
    });
  });

  it('returns structured error json for invalid batch nest input', async () => {
    const response = await post('/batches/nest', { batchId: '' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(typeof payload.error).toBe('string');
  });

  it('generates a deterministic cnc packet for a nested batch', async () => {
    batchMocks.generateBatchCncPacket.mockResolvedValue({
      batchId: 'batch_123',
      packet: {
        packetCode: 'CNC-20260308-WHITE_MELAMINE-01',
        sheetCount: 1,
        partCount: 1,
        format: 'FOUNDATION_JSON'
      },
      sheets: [
        {
          sheetIndex: 1,
          material: 'WHITE_MELAMINE',
          sheetWidth: 48,
          sheetHeight: 96,
          placements: [
            {
              partId: 'part_1',
              labelCode: 'SHELF-WM-19.25x12.5-P01',
              x: 0.25,
              y: 0.25,
              width: 19.25,
              depth: 12.5,
              cutMethod: 'RECTANGLE_CUT'
            }
          ]
        }
      ]
    });

    const response = await post('/batches/generate-cnc', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-cnc',
      batchId: 'batch_123',
      packet: {
        packetCode: 'CNC-20260308-WHITE_MELAMINE-01',
        sheetCount: 1,
        partCount: 1,
        format: 'FOUNDATION_JSON'
      },
      sheets: [
        {
          sheetIndex: 1,
          material: 'WHITE_MELAMINE',
          sheetWidth: 48,
          sheetHeight: 96,
          placements: [
            {
              partId: 'part_1',
              labelCode: 'SHELF-WM-19.25x12.5-P01',
              x: 0.25,
              y: 0.25,
              width: 19.25,
              depth: 12.5,
              cutMethod: 'RECTANGLE_CUT'
            }
          ]
        }
      ]
    });
  });

  it('returns structured error json for cnc generation on a non-nested batch', async () => {
    batchMocks.generateBatchCncPacket.mockRejectedValue(
      new Error('Batch 20260308-WHITE_MELAMINE-01 must be nested before CNC generation.')
    );

    const response = await post('/batches/generate-cnc', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Batch 20260308-WHITE_MELAMINE-01 must be nested before CNC generation.'
    });
  });

  it('generates a deterministic label packet for a batch', async () => {
    batchMocks.generateBatchLabelPacket.mockResolvedValue({
      batchId: 'batch_123',
      packet: {
        packetCode: 'LABELS-20260308-WHITE_MELAMINE-01',
        labelCount: 1,
        format: 'FOUNDATION_JSON'
      },
      labels: [
        {
          partId: 'part_1',
          jobId: 'job_1',
          batchId: 'batch_123',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          scanCode: 'PART-part_1',
          partType: 'SHELF',
          material: 'WHITE_MELAMINE',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          source: 'CONFIGURATOR',
          sheetIndex: 1,
          x: 0.25,
          y: 0.25
        }
      ]
    });

    const response = await post('/batches/generate-labels', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-labels',
      batchId: 'batch_123',
      packet: {
        packetCode: 'LABELS-20260308-WHITE_MELAMINE-01',
        labelCount: 1,
        format: 'FOUNDATION_JSON'
      },
      labels: [
        {
          partId: 'part_1',
          jobId: 'job_1',
          batchId: 'batch_123',
          labelCode: 'SHELF-WM-19.25x12.5-P01',
          scanCode: 'PART-part_1',
          partType: 'SHELF',
          material: 'WHITE_MELAMINE',
          width: 19.25,
          depth: 12.5,
          thickness: 0.75,
          edgeBandPattern: 'ALL_FOUR',
          quantity: 1,
          source: 'CONFIGURATOR',
          sheetIndex: 1,
          x: 0.25,
          y: 0.25
        }
      ]
    });
  });

  it('returns structured error json for empty label packet generation', async () => {
    batchMocks.generateBatchLabelPacket.mockRejectedValue(
      new Error('Batch 20260308-WHITE_MELAMINE-01 has no parts available for label generation.')
    );

    const response = await post('/batches/generate-labels', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Batch 20260308-WHITE_MELAMINE-01 has no parts available for label generation.'
    });
  });

  it('generates a printable label pdf artifact', async () => {
    batchMocks.generateBatchLabelPdf.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-label-pdf',
        uri: '/generated-artifacts/batches/batch_123/label-packet-v1.pdf',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-label-pdf', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-label-pdf',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-label-pdf',
        uri: '/generated-artifacts/batches/batch_123/label-packet-v1.pdf',
        isCurrent: true,
        version: 1
      }
    });
  });

  it('generates a CNC CSV export artifact', async () => {
    batchMocks.generateBatchCncCsv.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-csv',
        uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.csv',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-cnc-csv', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-cnc-csv',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-csv',
        uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.csv',
        isCurrent: true,
        version: 1
      }
    });
  });

  it('generates a label CSV export artifact', async () => {
    batchMocks.generateBatchLabelCsv.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-label-csv',
        uri: '/generated-artifacts/batches/batch_123/label-export-v1.csv',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-label-csv', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-label-csv',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-label-csv',
        uri: '/generated-artifacts/batches/batch_123/label-export-v1.csv',
        isCurrent: true,
        version: 1
      }
    });
  });

  it('generates a Mosaic CNC export artifact', async () => {
    batchMocks.generateBatchCncMosaic.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-mosaic',
        uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-cnc-mosaic', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-cnc-mosaic',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-mosaic',
        uri: '/generated-artifacts/batches/batch_123/cnc-mosaic-v1.csv',
        isCurrent: true,
        version: 1
      }
    });
  });

  it('generates a CNC JSON export artifact', async () => {
    batchMocks.generateBatchCncJson.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-json',
        uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.json',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-cnc-json', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-cnc-json',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-cnc-json',
        uri: '/generated-artifacts/batches/batch_123/cnc-export-v1.json',
        isCurrent: true,
        version: 1
      }
    });
  });

  it('generates a printable traveler pdf artifact', async () => {
    batchMocks.generateBatchTravelerPdf.mockResolvedValue({
      batchId: 'batch_123',
      artifact: {
        type: 'batch-traveler-pdf',
        uri: '/generated-artifacts/batches/batch_123/traveler-v1.pdf',
        isCurrent: true,
        version: 1
      }
    });

    const response = await post('/batches/generate-traveler-pdf', { batchId: 'batch_123' });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({
      ok: true,
      action: 'generate-traveler-pdf',
      batchId: 'batch_123',
      artifact: {
        type: 'batch-traveler-pdf',
        uri: '/generated-artifacts/batches/batch_123/traveler-v1.pdf',
        isCurrent: true,
        version: 1
      }
    });
  });
});

describe('machine routes', () => {
  it('lists machines', async () => {
    const response = await fetch(`${baseUrl}/machines`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        machines: expect.any(Array)
      })
    );
  });

  it('creates a machine', async () => {
    const response = await fetch(`${baseUrl}/machines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'CNC-01',
        name: 'Shop CNC',
        type: 'CNC'
      })
    });

    expect(response.status).toBe(201);
    expect(machineMocks.createMachine).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CNC-01',
        name: 'Shop CNC',
        type: 'CNC'
      }),
      'org_local_craft_board'
    );
  });

  it('returns machine detail with recent events', async () => {
    const response = await fetch(`${baseUrl}/machines/machine_1`);
    expect(response.status).toBe(200);
    expect(machineMocks.getMachineDetail).toHaveBeenCalledWith('machine_1', 'org_local_craft_board');
  });

  it('ingests a machine event', async () => {
    const response = await fetch(`${baseUrl}/machine-events/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machineCode: 'CNC-01',
        eventType: 'RUN_STARTED',
        sourceType: 'API',
        payload: { batchRef: 'BATCH-1' }
      })
    });

    expect(response.status).toBe(201);
    expect(machineMocks.ingestMachineEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        machineCode: 'CNC-01',
        eventType: 'RUN_STARTED',
        sourceType: 'API'
      }),
      'org_local_craft_board'
    );
  });

  it('simulates a machine event', async () => {
    const response = await fetch(`${baseUrl}/machine-events/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machineCode: 'CNC-01',
        eventType: 'FAULT',
        payload: { code: 'E-STOP' }
      })
    });

    expect(response.status).toBe(201);
  });
});

describe('stage signal routes', () => {
  it('lists open stage candidate signals', async () => {
    const response = await fetch(`${baseUrl}/stage-signals`);
    expect(response.status).toBe(200);
    expect(stageSignalMocks.listStageCandidateSignals).toHaveBeenCalledWith({}, 'org_local_craft_board');
  });

  it('returns stage candidate signal detail', async () => {
    const response = await fetch(`${baseUrl}/stage-signals/sig_1`);
    expect(response.status).toBe(200);
    expect(stageSignalMocks.getStageCandidateSignal).toHaveBeenCalledWith('sig_1', 'org_local_craft_board');
  });

  it('applies a stage candidate signal', async () => {
    const response = await fetch(`${baseUrl}/stage-signals/sig_1/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(stageSignalMocks.applyStageCandidateSignal).toHaveBeenCalledWith(
      'sig_1',
      expect.objectContaining({
        reviewedByMemberId: 'membership_demo'
      }),
      'org_local_craft_board'
    );
  });

  it('rejects a stage candidate signal', async () => {
    const response = await fetch(`${baseUrl}/stage-signals/sig_1/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rejectionReason: 'Not trusted.'
      })
    });

    expect(response.status).toBe(200);
    expect(stageSignalMocks.rejectStageCandidateSignal).toHaveBeenCalledWith(
      'sig_1',
      expect.objectContaining({
        reviewedByMemberId: 'membership_demo',
        rejectionReason: 'Not trusted.'
      }),
      'org_local_craft_board'
    );
  });
});

describe('trusted auto-apply routes', () => {
  it('lists trusted auto-apply rules', async () => {
    trustedAutoApplyMocks.listTrustedAutoApplyRules.mockResolvedValue({
      ok: true,
      rules: [
        {
          id: 'rule_1',
          organizationId: 'org_local_craft_board',
          machineId: 'machine_1',
          candidateAction: 'MARK_PART_CUT',
          enabled: true,
          createdAt: '2026-03-08T00:00:00.000Z',
          updatedAt: '2026-03-08T00:00:00.000Z'
        }
      ]
    });

    const response = await fetch(`${baseUrl}/trusted-auto-apply/rules`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.rules).toHaveLength(1);
  });

  it('creates a trusted auto-apply rule', async () => {
    trustedAutoApplyMocks.createTrustedAutoApplyRule.mockResolvedValue({
      ok: true,
      rule: {
        id: 'rule_1',
        organizationId: 'org_local_craft_board',
        machineId: 'machine_1',
        candidateAction: 'MARK_PART_CUT',
        enabled: true,
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z'
      }
    });

    const response = await fetch(`${baseUrl}/trusted-auto-apply/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        machineId: 'machine_1',
        candidateAction: 'MARK_PART_CUT'
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.rule.id).toBe('rule_1');
  });
});

describe('part routes', () => {
  it('transitions a part by part id', async () => {
    partsMocks.transitionPartStatusById.mockResolvedValue({
      part: {
        id: 'part_1',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        status: 'cut',
        availableNextActions: ['edgebanded', 'packed']
      }
    });

    const response = await post('/parts/part_1/status', { nextStatus: 'CUT' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      action: 'transition-part',
      part: {
        id: 'part_1',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        status: 'cut',
        availableNextActions: ['edgebanded', 'packed']
      }
    });
  });

  it('transitions a part by scan code', async () => {
    partsMocks.transitionPartStatusByScanCode.mockResolvedValue({
      part: {
        id: 'part_1',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        status: 'packed',
        availableNextActions: []
      },
      jobStatus: 'COMPLETE',
      orderStatus: 'READY_FOR_SHIPMENT'
    });

    const response = await post('/parts/scan', {
      scanCode: 'PART-part_1',
      nextStatus: 'PACKED'
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      action: 'transition-part',
      part: {
        id: 'part_1',
        labelCode: 'SHELF-WM-19.25x12.5-P01',
        scanCode: 'PART-part_1',
        status: 'packed',
        availableNextActions: []
      },
      jobStatus: 'COMPLETE',
      orderStatus: 'READY_FOR_SHIPMENT'
    });
  });

  it('returns structured error json for invalid part transition', async () => {
    partsMocks.transitionPartStatusById.mockRejectedValue(
      new Error('Part SHELF-WM-19.25x12.5-P01 cannot move from PENDING to PACKED.')
    );

    const response = await post('/parts/part_1/status', { nextStatus: 'PACKED' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: 'Part SHELF-WM-19.25x12.5-P01 cannot move from PENDING to PACKED.'
    });
  });
});
