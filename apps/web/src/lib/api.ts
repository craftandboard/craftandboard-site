import { API_BASE_URL } from "./site-config";

const ORG_COOKIE = "cb_org_slug";
const SESSION_COOKIE = "cb_session";

async function getContextHeaders() {
  const headers: Record<string, string> = {};

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const orgSlug = store.get(ORG_COOKIE)?.value;
    const sessionToken = store.get(SESSION_COOKIE)?.value;

    if (orgSlug) {
      headers["x-organization-slug"] = orgSlug;
    }
    if (sessionToken) {
      headers["x-session-token"] = sessionToken;
    }

    return headers;
  }

  const sessionMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  const orgMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${ORG_COOKIE}=`));

  if (sessionMatch) {
    headers["x-session-token"] = decodeURIComponent(sessionMatch.split("=").slice(1).join("="));
  }
  if (orgMatch) {
    headers["x-organization-slug"] = decodeURIComponent(orgMatch.split("=").slice(1).join("="));
  }

  return headers;
}

interface BundleActionResult {
  bundleCode: string;
  status: string;
  message: string;
  version?: number;
}

interface BundleLifecycleView {
  bundleCode: string;
  status: string;
  currentNestVersion?: number;
  currentCncVersion?: number;
  releasedAt?: string;
  nestingApprovedAt?: string;
  cncApprovedAt?: string;
  nextAllowedActions: string[];
}

interface CustomerOrderStatusView {
  orderId: string;
  customerStatus: string;
  detail: string;
}

export interface ShelfConfiguratorInput {
  widthIn: number;
  depthIn: number;
  thicknessIn?: number;
  materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE";
  edgeBandPattern?: "ALL_FOUR";
  quantity: number;
  channel: "AMAZON" | "WEBSITE" | "MANUAL";
}

interface ShelfValidationResult {
  valid: boolean;
  normalizedWidthIn: number;
  normalizedDepthIn: number;
  materialCode: string;
  errors: string[];
  warnings: string[];
}

interface ShelfNormalizedSpec {
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  materialCode: string;
  edgeBandPattern: string;
  quantity: number;
  channel: string;
  productLabel: string;
}

interface ShelfQuoteResult {
  spec: ShelfNormalizedSpec;
  unitPrice: number;
  totalPrice: number;
  estimatedLeadTimeDays: number;
  pricingVersion: string;
}

interface ConfiguratorErrorResponse {
  ok: false;
  error: string;
}

interface ConfiguratorValidateResponse {
  ok: true;
  action: "validate";
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

interface ConfiguratorNormalizeResponse {
  ok: true;
  action: "normalize";
  normalized: {
    width: number;
    depth: number;
    quantity: number;
    material: string;
    channel: string;
    thickness: number;
    edgeBandPattern: string;
    unit: "IN";
  };
}

interface ConfiguratorQuoteResponse {
  ok: true;
  action: "quote";
  quote: {
    currency: "USD";
    unitPrice: number;
    quantity: number;
    subtotal: number;
    status: "FOUNDATION_PLACEHOLDER";
  };
}

interface ConfiguratorTranslateResponse {
  ok: true;
  action: "translate";
  part: {
    partType: "SHELF";
    width: number;
    depth: number;
    thickness: number;
    material: string;
    edgeBandPattern: string;
    quantity: number;
    unit: "IN";
    manufacturingMode: "CUT_AND_EDGE";
    labelCode: string;
    grainDirection: "WIDTH";
    cutMethod: "RECTANGLE_CUT";
    source: "CONFIGURATOR";
  };
}

interface ConfiguratorCreateJobResponse {
  ok: true;
  action: "create-job";
  job: {
    id: string;
    status: "DRAFT";
    source: "CONFIGURATOR";
  };
  parts: Array<{
    id: string;
    partType: "SHELF";
    width: number;
    depth: number;
    thickness: number;
    material: string;
    edgeBandPattern: string;
    quantity: number;
    unit: "IN";
    manufacturingMode: "CUT_AND_EDGE";
    labelCode: string;
    grainDirection: "WIDTH";
    cutMethod: "RECTANGLE_CUT";
    source: "CONFIGURATOR";
  }>;
}

interface CreateBatchResponse {
  ok: true;
  action: "create-batch";
  batch: {
    id: string;
    batchCode: string;
    status: "DRAFT";
    material: "WHITE_MELAMINE" | "MAPLE_MELAMINE";
    partCount: number;
    jobCount: number;
  };
  parts: Array<{
    id: string;
    partType: "SHELF";
    labelCode: string;
  }>;
}

export interface MaterialForecastResponse {
  ok: true;
  summary: {
    totalPendingMaterials: number;
    totalPendingParts: number;
    estimatedTotalSheets: number;
    materialsWithRemnantCandidates: number;
  };
  materials: Array<{
    materialKey: string;
    materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    materialDisplayName: string;
    thicknessIn: number;
    edgeBandPattern: "ALL_FOUR";
    pendingPartCount: number;
    pendingJobCount: number;
    pendingOrderCount: number;
    totalAreaSqIn: number;
    totalAreaSqFt: number;
    estimatedFullSheetsNeeded: number;
    candidateRemnantsCount: number;
    candidateRemnantsAreaSqIn: number;
    recommendedCoverageAreaSqIn: number;
    estimatedNewSheetReduction: number;
    candidateRemnantsPreview: Array<{
      id: string;
      code: string;
      label: string;
      locationLabel?: string;
      status: "AVAILABLE" | "RESERVED" | "PARTIAL" | "CONSUMED" | "HOLD" | "SCRAPPED";
      lengthIn: number;
      widthIn: number;
      availableAreaSqIn: number;
    }>;
    jobs: Array<{
      jobId: string;
      orderId?: string;
      orderItemId?: string;
      source: "CONFIGURATOR" | "AMAZON";
      channel: "AMAZON" | "WEBSITE" | "MANUAL";
      shipByDate?: string;
      customerName: string;
      partCount: number;
      totalAreaSqIn: number;
      parts: Array<{
        partId: string;
        orderId?: string;
        orderItemId?: string;
        jobId?: string;
        labelCode: string;
        scanCode: string;
        widthIn: number;
        depthIn: number;
        thicknessIn: number;
        areaSqIn: number;
        status: "pending" | "ready_for_batch" | "batched" | "cut" | "edgebanded" | "packed" | "hold" | "error";
        edgeBandPattern: "ALL_FOUR";
        source: "CONFIGURATOR" | "AMAZON";
      }>;
    }>;
  }>;
}

export interface CreateForecastBatchResponse {
  ok: true;
  action: "create-forecast-batch";
  batch: {
    id: string;
    batchCode: string;
    status: "DRAFT";
    material: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    partCount: number;
    jobCount: number;
  };
  parts: Array<{
    id: string;
    partType: "SHELF";
    labelCode: string;
  }>;
}

export interface RemnantListResponse {
  ok: true;
  summary: {
    totalAvailableRemnants: number;
    totalAvailableAreaSqIn: number;
    heldCount: number;
    scrappedCount: number;
    topMaterials: Array<{
      materialKey: string;
      materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
      materialLabel: string;
      remnantCount: number;
      totalAreaSqIn: number;
    }>;
  };
  remnants: Array<{
    id: string;
    code: string;
    materialKey: string;
    materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    materialLabel: string;
    thicknessIn: number;
    edgeBandPattern: "ALL_FOUR";
    lengthIn: number;
    widthIn: number;
    areaSqIn: number;
    usableAreaSqIn: number;
    sourceBatchId?: string;
    sourceType: "FULL_SHEET_LEFTOVER" | "MANUAL" | "IMPORTED";
    status: "AVAILABLE" | "RESERVED" | "PARTIAL" | "CONSUMED" | "HOLD" | "SCRAPPED";
    locationLabel?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface UpsertRemnantResponse {
  ok: true;
  remnant: RemnantListResponse["remnants"][number] & {
    history: Array<{
      id: string;
      actionType: "CREATED" | "RESERVED" | "CONSUMED" | "PARTIAL_CONSUME" | "RELEASED" | "SCRAPPED" | "HOLD" | "UPDATED";
      usedAreaSqIn?: number;
      previousLengthIn?: number;
      previousWidthIn?: number;
      newLengthIn?: number;
      newWidthIn?: number;
      batchId?: string;
      partId?: string;
      notes?: string;
      createdAt: string;
    }>;
  };
}

export interface RemnantLabelArtifactResponse {
  ok: true;
  action: "generate-remnant-label";
  remnantId: string;
  artifact: {
    id: string;
    type: "remnant-label-pdf";
    uri: string;
    isCurrent: true;
    version: number;
  };
}

export interface EdgeBandEstimateSummary {
  assumptions: {
    perEdgeWasteIn: number;
    setupAllowanceFtPerEdgeBandMaterialGroup: number;
  };
  totals: {
    rawLinearFt: number;
    adjustedLinearFt: number;
    setupAllowanceFt: number;
    estimatedDemandFt: number;
  };
  materials: Array<{
    edgeBandMaterialKey: string;
    edgeBandMaterialLabel: string;
    edgeBandColorLabel: string;
    rawLinearIn: number;
    adjustedLinearIn: number;
    rawLinearFt: number;
    adjustedLinearFt: number;
    setupAllowanceFt: number;
    estimatedDemandFt: number;
    partCount: number;
    jobCount: number;
    orderCount: number;
    parts: Array<{
      partId: string;
      orderId?: string;
      jobId?: string;
      labelCode: string;
      materialCode?: string;
      derivedPattern: "NONE" | "ONE_LONG_EDGE" | "TWO_LONG_EDGES" | "TWO_SHORT_EDGES" | "ALL_FOUR";
      rawLinearFt: number;
      adjustedLinearFt: number;
      source: "CONFIGURATOR" | "AMAZON";
      sourceEdgeBandText?: string;
    }>;
  }>;
  unmappedParts: Array<{
    partId: string;
    labelCode: string;
    reason: string;
  }>;
  invalidParts: Array<{
    partId: string;
    labelCode: string;
    reason: string;
  }>;
}

export interface ForecastEdgeBandEstimateResponse extends EdgeBandEstimateSummary {
  ok: true;
  scope: "forecast";
}

export interface BatchEdgeBandEstimateResponse extends EdgeBandEstimateSummary {
  ok: true;
  scope: "batch";
  batch: {
    id: string;
    code: string;
    materialCode: string | null;
  };
}

interface NestBatchResponse {
  ok: true;
  action: "nest-batch";
  batchId: string;
  sheets: Array<{
    sheetIndex: number;
    material: string;
    parts: Array<{
      partId: string;
      x: number;
      y: number;
      width: number;
      depth: number;
    }>;
  }>;
}

interface GenerateCncResponse {
  ok: true;
  action: "generate-cnc";
  batchId: string;
  packet: {
    packetCode: string;
    sheetCount: number;
    partCount: number;
    format: "FOUNDATION_JSON";
  };
  sheets: Array<{
    sheetIndex: number;
    material: string;
    sheetWidth: number;
    sheetHeight: number;
    placements: Array<{
      partId: string;
      labelCode: string;
      x: number;
      y: number;
      width: number;
      depth: number;
      cutMethod: "RECTANGLE_CUT";
    }>;
  }>;
}

interface GenerateLabelsResponse {
  ok: true;
  action: "generate-labels";
  batchId: string;
  packet: {
    packetCode: string;
    labelCount: number;
    format: "FOUNDATION_JSON";
  };
  labels: Array<{
    partId: string;
    jobId?: string;
    batchId: string;
    labelCode: string;
    scanCode: string;
    partType: "SHELF";
    material: string;
    width: number;
    depth: number;
    thickness: number;
    edgeBandPattern: string;
    quantity: 1;
    source: "CONFIGURATOR" | "AMAZON";
    sheetIndex?: number;
    x?: number;
    y?: number;
  }>;
}

interface GeneratePdfArtifactResponse {
  ok: true;
  action: "generate-label-pdf" | "generate-traveler-pdf";
  batchId: string;
  artifact: {
    type: "batch-label-pdf" | "batch-traveler-pdf";
    uri: string;
    isCurrent: true;
    version: number;
  };
}

export type ConfiguratorResponse =
  | ConfiguratorErrorResponse
  | ConfiguratorValidateResponse
  | ConfiguratorNormalizeResponse
  | ConfiguratorQuoteResponse
  | ConfiguratorTranslateResponse
  | ConfiguratorCreateJobResponse;

export type BatchActionResponse = ConfiguratorErrorResponse | CreateBatchResponse;
export type BatchNestResponse = ConfiguratorErrorResponse | NestBatchResponse;
export type BatchCncResponse = ConfiguratorErrorResponse | GenerateCncResponse;
export type BatchLabelsResponse = ConfiguratorErrorResponse | GenerateLabelsResponse;
export type BatchPdfArtifactResponse = ConfiguratorErrorResponse | GeneratePdfArtifactResponse;
export type BatchExportArtifactResponse =
  | ConfiguratorErrorResponse
  | {
      ok: true;
      action: "generate-cnc-csv" | "generate-label-csv" | "generate-cnc-mosaic" | "generate-cnc-json";
      batchId: string;
      artifact: {
        type: "batch-cnc-csv" | "batch-label-csv" | "batch-cnc-mosaic" | "batch-cnc-json";
        uri: string;
        isCurrent: true;
        version: number;
      };
    };
export interface StationQueueSuccessResponse {
  ok: true;
  station: "cutting" | "edgebanding" | "packing";
  nextStatus: "CUT" | "EDGEBANDED" | "PACKED";
  parts: Array<{
    partId: string;
    scanCode: string;
    labelCode: string;
    material: string;
    width: number;
    depth: number;
    batchId: string;
    batchCode: string;
    batchStatus: string;
    currentContainerId?: string;
    currentContainerCode?: string;
    currentContainerLabel?: string;
  }>;
}

export type StationQueueResponse = StationQueueSuccessResponse | ConfiguratorErrorResponse;

export interface BatchSortingResponse {
  ok: true;
  batch: {
    id: string;
    code: string;
    material: string;
  };
  summary: {
    batchId: string;
    batchCode: string;
    totalParts: number;
    assignedParts: number;
    unassignedParts: number;
    openContainers: number;
    completionPct: number;
  };
  containers: Array<{
    id: string;
    batchId: string;
    code: string;
    label: string;
    type: "CONTAINER" | "BIN";
    status: "OPEN" | "SORTING" | "COMPLETE" | "HOLD" | "CLOSED";
    notes?: string;
    orderId?: string;
    manufacturingJobId?: string;
    partCount: number;
    completionPct: number;
    mixed: boolean;
    createdAt: string;
    updatedAt: string;
    parts: Array<{
      partId: string;
      jobId?: string;
      orderId?: string;
      labelCode: string;
      scanCode: string;
      material: string;
      width: number;
      depth: number;
      thickness: number;
      status: string;
      source: "CONFIGURATOR" | "AMAZON";
    }>;
  }>;
  unassignedParts: Array<{
    partId: string;
    jobId?: string;
    orderId?: string;
    labelCode: string;
    scanCode: string;
    material: string;
    width: number;
    depth: number;
    thickness: number;
    status: string;
    source: "CONFIGURATOR" | "AMAZON";
  }>;
}

export type ContainerMutationResponse =
  | {
      ok: true;
      container: {
        id: string;
        batchId: string;
        code: string;
        label: string;
        type: "CONTAINER" | "BIN";
        status: "OPEN" | "SORTING" | "COMPLETE" | "HOLD" | "CLOSED";
        notes?: string;
        orderId?: string;
        manufacturingJobId?: string;
        partCount: number;
        completionPct: number;
        mixed: boolean;
        createdAt: string;
        updatedAt: string;
      };
      action?: "assign-part-to-container" | "remove-part-from-container";
      part?: {
        partId: string;
        labelCode: string;
        scanCode: string;
        currentContainerId?: string;
        currentContainerCode?: string;
        currentContainerLabel?: string;
      };
    }
  | ConfiguratorErrorResponse;

async function readJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const contextHeaders = await getContextHeaders();
    const response = await fetch(`${API_BASE_URL}${input}`, {
      ...init,
      headers: {
        ...contextHeaders,
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function sendJson<T>(input: string, init?: RequestInit): Promise<T> {
  const contextHeaders = await getContextHeaders();
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...contextHeaders,
      ...(init?.headers ?? {})
    }
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Request failed.";
    const error = new Error(message) as Error & { code?: string };
    if (payload && typeof payload === "object" && "code" in payload && typeof payload.code === "string") {
      error.code = payload.code;
    }
    throw error;
  }

  return payload as T;
}

export async function getOrders() {
  return readJson<{
    orders: Array<{
      id: string;
      amazonOrderId?: string;
      externalOrderId?: string;
      customerName: string;
      customerFullName?: string;
      customerLastName?: string;
      shipByDate?: string;
      materialSummary?: string[];
      quantityTotal?: number;
      items: Array<{
        id: string;
        amazonOrderItemId?: string;
        sku: string;
        productLabel: string;
        quantity: number;
        widthIn: number;
        depthIn: number;
        materialCode?: string;
      }>;
    }>;
  }>("/orders");
}

export async function getCompletedOrders() {
  return readJson<{
    ok: true;
    orders: Array<{
      orderId: string;
      source: "AMAZON" | "CONFIGURATOR";
      status: "READY_FOR_SHIPMENT";
      jobCount: number;
      partCount: number;
      completedAt: string;
    }>;
  }>("/orders/completed");
}

export interface ViewerContextResponse {
  ok: true;
  user: {
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
  };
  membership: {
    id: string;
    role: "OWNER" | "ADMIN" | "OPERATOR";
  };
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
    role: "OWNER" | "ADMIN" | "OPERATOR";
  }>;
}

export async function getViewerContext() {
  return readJson<ViewerContextResponse>("/me/context");
}

export interface OrganizationMemberRecord {
  userId: string;
  email: string;
  name: string | null;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}

export interface OrganizationMembersResponse {
  ok: true;
  members: OrganizationMemberRecord[];
}

export async function getOrganizationMembers() {
  return readJson<OrganizationMembersResponse>("/org/members");
}

export async function addOrganizationMember(input: {
  email: string;
  name?: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}) {
  return sendJson<{
    ok: true;
    member: OrganizationMemberRecord;
    activation?: {
      path: string;
    };
  } | ConfiguratorErrorResponse>("/org/members", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateOrganizationMemberRole(input: {
  userId: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}) {
  return sendJson<{
    ok: true;
    member: OrganizationMemberRecord;
  } | ConfiguratorErrorResponse>(`/org/members/${input.userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role: input.role })
  });
}

export type LoginResponse =
  | ({
      ok: true;
      sessionToken: string;
    } & ViewerContextResponse)
  | ConfiguratorErrorResponse;

export async function login(input: { email: string; password: string }) {
  return sendJson<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logout() {
  return sendJson<{ ok: true }>("/auth/logout", {
    method: "POST"
  });
}

export async function getAuthSession() {
  return readJson<ViewerContextResponse>("/auth/session");
}

export interface ActivationValidationResponse {
  ok: true;
  user: {
    email: string;
    name: string | null;
  };
  activation: {
    expiresAt: string;
  };
}

export type ActivationResponse =
  | ({
      ok: true;
      sessionToken: string;
    } & ViewerContextResponse)
  | ConfiguratorErrorResponse;

export async function validateActivationToken(token: string) {
  return sendJson<ActivationValidationResponse | ConfiguratorErrorResponse>(
    `/auth/activate/validate?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {}
    }
  );
}

export async function activateAccount(input: { token: string; password: string }) {
  return sendJson<ActivationResponse>("/auth/activate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export interface ForgotPasswordResponse {
  ok: true;
  reset?: {
    path: string;
  };
}

export interface PasswordResetValidationResponse {
  ok: true;
  user: {
    email: string;
    name: string | null;
  };
  reset: {
    expiresAt: string;
  };
}

export async function requestPasswordReset(input: { email: string }) {
  return sendJson<ForgotPasswordResponse | ConfiguratorErrorResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function validatePasswordResetToken(token: string) {
  return sendJson<PasswordResetValidationResponse | ConfiguratorErrorResponse>(
    `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {}
    }
  );
}

export async function resetPassword(input: { token: string; password: string }) {
  return sendJson<ActivationResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type ShipOrderResponse =
  | {
      ok: true;
      order: {
        id: string;
        status: "SHIPPED";
      };
    }
  | ConfiguratorErrorResponse;

export type PackingSlipArtifactResponse =
  | {
      ok: true;
      action: "generate-packing-slip";
      orderId: string;
      artifact: {
        type: "order-packing-slip-pdf";
        uri: string;
        isCurrent: true;
        version: number;
      };
    }
  | ConfiguratorErrorResponse;

export interface ImportAmazonFixturesResponse {
  ok: true;
  action: "import-amazon-fixtures";
  summary: {
    ordersCreated: number;
    jobsCreated: number;
    partsCreated: number;
  };
  filesProcessed: number;
  ordersCreated: number;
  orderItemsCreated: number;
  partInstancesCreated: number;
  jobsCreated: number;
  warnings: unknown[];
  errors: unknown[];
  orders: Array<{
    id: string;
    source: "AMAZON";
  }>;
  jobs: Array<{
    id: string;
    status: "DRAFT";
    source: "AMAZON";
    orderId: string;
    orderItemId: string;
  }>;
  parts: Array<{
    id: string;
    jobId: string;
    orderId: string;
    orderItemId: string;
    labelCode: string;
    scanCode: string;
    source: "AMAZON";
  }>;
}

export interface PreviewAmazonFixturesResponse {
  status: "ok";
  scope: "amazon-import-v1";
  preview: {
    filesProcessed: number;
    previews: unknown[];
    warnings: unknown[];
    errors: unknown[];
  };
}

export async function getOrder(orderId: string) {
  return readJson<{
    order: {
      id: string;
      amazonOrderId?: string;
      customerName: string;
      customerFullName?: string;
      customerLastName?: string;
      shipToName?: string;
      shipByDate?: string;
      purchaseDate?: string;
      rawPayload?: unknown;
      items: Array<{
        id: string;
        amazonOrderItemId?: string;
        asin?: string;
        sku: string;
        title: string;
        productLabel: string;
        materialCode?: string;
        quantity: number;
        widthIn: number;
        depthIn: number;
        thicknessIn: number;
        sourceLengthIn?: number;
        sourceDepthIn?: number;
        sourceEdgeBandText?: string;
        sourceCustomizationJson?: unknown;
        partInstances?: Array<{
          id: string;
          partCode: string;
          serialNumber?: number;
          widthIn: number;
          depthIn: number;
        }>;
      }>;
    };
  }>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getNormalizedOrder(orderId: string) {
  return readJson<{ normalized: unknown }>(`/orders/${encodeURIComponent(orderId)}/normalized`);
}

export async function previewAmazonFixtures() {
  return readJson<PreviewAmazonFixturesResponse>("/orders/import/amazon-fixtures/preview");
}

export async function importAmazonFixtures() {
  return sendJson<ImportAmazonFixturesResponse>("/orders/import/amazon-fixtures", {
    method: "POST"
  });
}

export async function shipOrder(orderId: string) {
  return sendJson<ShipOrderResponse>(`/orders/${encodeURIComponent(orderId)}/ship`, {
    method: "POST"
  });
}

export async function generatePackingSlip(orderId: string) {
  return sendJson<PackingSlipArtifactResponse>(
    `/orders/${encodeURIComponent(orderId)}/generate-packing-slip`,
    {
      method: "POST"
    }
  );
}

export async function getProductionBundles() {
  return readJson<{
    bundles: Array<{
      bundleCode: string;
      shipByDate: string;
      materialCode: string;
      productLabel: string;
      totalLineItems: number;
      totalPhysicalParts: number;
    }>;
  }>("/production/bundles");
}

export async function getBatches() {
  return readJson<{
    batches: Array<{
      id: string;
      organizationId: string;
      code?: string;
      name: string;
      status: string;
      materialCode?: string;
      source?: string;
      partCount?: number;
      jobCount?: number;
      createdAt: string;
      updatedAt: string;
    }>;
  }>("/batches");
}

export async function getMaterialForecast() {
  return readJson<MaterialForecastResponse>("/material-forecast");
}

export async function getForecastEdgeBandEstimate() {
  return readJson<ForecastEdgeBandEstimateResponse>("/edge-banding/forecast");
}

export async function getBatchEdgeBandEstimate(batchId: string) {
  return readJson<BatchEdgeBandEstimateResponse>(`/edge-banding/batch/${encodeURIComponent(batchId)}`);
}

export interface MachineSummary {
  id: string;
  code: string;
  name: string;
  type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  status: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
  locationLabel?: string;
  adapterType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineEventRecord {
  id: string;
  machineId: string;
  machine?: {
    id: string;
    code: string;
    name: string;
    type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  };
  eventType: string;
  eventTs: string;
  sourceType: "MANUAL_SIMULATION" | "API" | "FILE_IMPORT" | "PLC_BRIDGE" | "WEBHOOK" | "OTHER";
  sourceEventId?: string;
  payloadJson: unknown;
  normalizedBatchRef?: string;
  normalizedJobRef?: string;
  normalizedPartRef?: string;
  sheetRef?: string;
  severity?: string;
  processingStatus: "RECEIVED" | "PARSED" | "LINKED" | "UNMATCHED" | "ERROR";
  linkedBatch?: {
    id: string;
    code: string;
  };
  linkedManufacturingJob?: {
    id: string;
    labelCode: string;
  };
  linkedPart?: {
    id: string;
    scanCode: string;
    partCode: string;
  };
  notes?: string;
  createdAt: string;
}

export async function getMachines() {
  return readJson<{
    ok: true;
    summary: {
      totalMachines: number;
      activeMachines: number;
      cncMachines: number;
      edgebanders: number;
    };
    machines: MachineSummary[];
  }>("/machines");
}

export async function getMachineDetail(machineId: string) {
  return readJson<{
    ok: true;
    machine: MachineSummary;
    recentEvents: MachineEventRecord[];
  }>(`/machines/${encodeURIComponent(machineId)}`);
}

export async function getMachineEvents(input?: {
  machineId?: string;
  eventType?: string;
  processingStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();

  if (input?.machineId) params.set("machineId", input.machineId);
  if (input?.eventType) params.set("eventType", input.eventType);
  if (input?.processingStatus) params.set("processingStatus", input.processingStatus);
  if (input?.dateFrom) params.set("dateFrom", input.dateFrom);
  if (input?.dateTo) params.set("dateTo", input.dateTo);

  const query = params.toString();
  return readJson<{
    ok: true;
    events: MachineEventRecord[];
  }>(`/machine-events${query ? `?${query}` : ""}`);
}

export async function createMachine(input: {
  code: string;
  name: string;
  type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  status?: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
  locationLabel?: string;
  adapterType?: string;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    machine: MachineSummary;
  }>("/machines", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateMachine(machineId: string, input: {
  name?: string;
  status?: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
  locationLabel?: string;
  adapterType?: string;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    machine: MachineSummary;
  }>(`/machines/${encodeURIComponent(machineId)}/update`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function ingestMachineEvent(input: {
  machineId?: string;
  machineCode?: string;
  eventType: "RUN_STARTED" | "RUN_COMPLETED" | "SHEET_STARTED" | "SHEET_COMPLETED" | "PART_SCANNED" | "EDGEBAND_RUN_STARTED" | "EDGEBAND_RUN_COMPLETED" | "MACHINE_HEARTBEAT" | "FAULT" | "STOPPED";
  eventTs?: string;
  sourceType: "MANUAL_SIMULATION" | "API" | "FILE_IMPORT" | "PLC_BRIDGE" | "WEBHOOK" | "OTHER";
  sourceEventId?: string;
  payload?: unknown;
  batchRef?: string;
  jobRef?: string;
  partRef?: string;
  scanCode?: string;
  sheetRef?: string;
  severity?: string;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    event: MachineEventRecord;
    linkResult: {
      processingStatus: "LINKED" | "UNMATCHED" | "PARSED" | "RECEIVED" | "ERROR";
      linkedBatchId?: string;
      linkedManufacturingJobId?: string;
      linkedPartId?: string;
    };
  }>("/machine-events/ingest", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function simulateMachineEvent(input: {
  machineId?: string;
  machineCode?: string;
  eventType: "RUN_STARTED" | "RUN_COMPLETED" | "SHEET_STARTED" | "SHEET_COMPLETED" | "PART_SCANNED" | "EDGEBAND_RUN_STARTED" | "EDGEBAND_RUN_COMPLETED" | "MACHINE_HEARTBEAT" | "FAULT" | "STOPPED";
  eventTs?: string;
  payload?: unknown;
  batchRef?: string;
  jobRef?: string;
  partRef?: string;
  scanCode?: string;
  sheetRef?: string;
  severity?: string;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    event: MachineEventRecord;
    linkResult: {
      processingStatus: "LINKED" | "UNMATCHED" | "PARSED" | "RECEIVED" | "ERROR";
      linkedBatchId?: string;
      linkedManufacturingJobId?: string;
      linkedPartId?: string;
    };
  }>("/machine-events/simulate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export interface StageCandidateSignalRecord {
  id: string;
  targetType: "PART" | "BATCH" | "MANUFACTURING_JOB";
  candidateStage: string;
  currentStage?: string;
  recommendedAction:
    | "MARK_PART_CUT"
    | "MARK_PART_EDGEBANDED"
    | "MARK_BATCH_CUT_IN_PROGRESS"
    | "MARK_BATCH_CUT_COMPLETE"
    | "MARK_JOB_EDGE_IN_PROGRESS"
    | "MARK_JOB_EDGE_COMPLETE";
  confidence: "HIGH" | "MEDIUM";
  rationale: string;
  status: "OPEN" | "APPLIED" | "REJECTED" | "SUPERSEDED";
  appliedMode?: "MANUAL" | "AUTO";
  rejectionReason?: string;
  notes?: string;
  reviewedAt?: string;
  appliedAt?: string;
  autoAppliedAt?: string;
  autoApplyRationale?: string;
  rejectedAt?: string;
  createdAt: string;
  canApply: boolean;
  sourceMachine?: {
    id: string;
    code: string;
    name: string;
    type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  };
  sourceMachineEvent?: {
    id: string;
    eventType: string;
    eventTs: string;
    processingStatus: "RECEIVED" | "PARSED" | "LINKED" | "UNMATCHED" | "ERROR";
  };
  targetBatch?: {
    id: string;
    code: string;
    status: string;
  };
  targetManufacturingJob?: {
    id: string;
    labelCode: string;
    status: string;
  };
  targetPart?: {
    id: string;
    scanCode: string;
    partCode: string;
    status: string;
  };
  autoAppliedByRule?: {
    id: string;
    candidateAction:
      | "MARK_PART_CUT"
      | "MARK_PART_EDGEBANDED"
      | "MARK_BATCH_CUT_IN_PROGRESS"
      | "MARK_BATCH_CUT_COMPLETE"
      | "MARK_JOB_EDGE_IN_PROGRESS"
      | "MARK_JOB_EDGE_COMPLETE";
    machineId?: string;
    machineType?: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  };
}

export interface TrustedAutoApplyRuleRecord {
  id: string;
  organizationId: string;
  machineId?: string;
  machineType?: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  candidateAction:
    | "MARK_PART_CUT"
    | "MARK_PART_EDGEBANDED"
    | "MARK_BATCH_CUT_IN_PROGRESS"
    | "MARK_BATCH_CUT_COMPLETE";
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  machine?: {
    id: string;
    code: string;
    name: string;
    type: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
    status: "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
  };
}

export async function getStageSignals(input?: {
  status?: "OPEN" | "APPLIED" | "REJECTED" | "SUPERSEDED";
  targetType?: "PART" | "BATCH" | "MANUFACTURING_JOB";
  machineId?: string;
  batchId?: string;
  recommendedAction?:
    | "MARK_PART_CUT"
    | "MARK_PART_EDGEBANDED"
    | "MARK_BATCH_CUT_IN_PROGRESS"
    | "MARK_BATCH_CUT_COMPLETE"
    | "MARK_JOB_EDGE_IN_PROGRESS"
    | "MARK_JOB_EDGE_COMPLETE";
}) {
  const params = new URLSearchParams();
  if (input?.status) params.set("status", input.status);
  if (input?.targetType) params.set("targetType", input.targetType);
  if (input?.machineId) params.set("machineId", input.machineId);
  if (input?.batchId) params.set("batchId", input.batchId);
  if (input?.recommendedAction) params.set("recommendedAction", input.recommendedAction);

  return readJson<{
    ok: true;
    summary: {
      openCount: number;
      appliedCount: number;
      rejectedCount: number;
    };
    candidates: StageCandidateSignalRecord[];
  }>(`/stage-signals${params.toString() ? `?${params.toString()}` : ""}`);
}

export async function applyStageSignal(candidateId: string, note?: string) {
  return sendJson<{
    ok: true;
    candidate: StageCandidateSignalRecord;
    appliedResult: unknown;
  }>(`/stage-signals/${encodeURIComponent(candidateId)}/apply`, {
    method: "POST",
    body: JSON.stringify({
      note
    })
  });
}

export async function rejectStageSignal(candidateId: string, rejectionReason: string) {
  return sendJson<{
    ok: true;
    candidate: StageCandidateSignalRecord;
  }>(`/stage-signals/${encodeURIComponent(candidateId)}/reject`, {
    method: "POST",
    body: JSON.stringify({
      rejectionReason
    })
  });
}

export async function getTrustedAutoApplyRules() {
  return readJson<{
    ok: true;
    rules: TrustedAutoApplyRuleRecord[];
  }>("/trusted-auto-apply/rules");
}

export async function createTrustedAutoApplyRule(input: {
  machineId?: string;
  machineType?: "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
  candidateAction:
    | "MARK_PART_CUT"
    | "MARK_PART_EDGEBANDED"
    | "MARK_BATCH_CUT_IN_PROGRESS"
    | "MARK_BATCH_CUT_COMPLETE";
  enabled?: boolean;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    rule: TrustedAutoApplyRuleRecord;
  }>("/trusted-auto-apply/rules", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateTrustedAutoApplyRule(input: {
  ruleId: string;
  enabled?: boolean;
  notes?: string;
}) {
  return sendJson<{
    ok: true;
    rule: TrustedAutoApplyRuleRecord;
  }>(`/trusted-auto-apply/rules/${encodeURIComponent(input.ruleId)}/update`, {
    method: "POST",
    body: JSON.stringify({
      enabled: input.enabled,
      notes: input.notes
    })
  });
}

export async function disableTrustedAutoApplyRule(ruleId: string) {
  return sendJson<{
    ok: true;
    rule: TrustedAutoApplyRuleRecord;
  }>(`/trusted-auto-apply/rules/${encodeURIComponent(ruleId)}/disable`, {
    method: "POST"
  });
}

export async function getRemnants(input?: {
  materialCode?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  status?: "AVAILABLE" | "RESERVED" | "PARTIAL" | "CONSUMED" | "HOLD" | "SCRAPPED";
  location?: string;
  minimumLengthIn?: number;
  minimumWidthIn?: number;
}) {
  const params = new URLSearchParams();

  if (input?.materialCode) params.set("materialCode", input.materialCode);
  if (input?.status) params.set("status", input.status);
  if (input?.location) params.set("location", input.location);
  if (input?.minimumLengthIn) params.set("minimumLengthIn", String(input.minimumLengthIn));
  if (input?.minimumWidthIn) params.set("minimumWidthIn", String(input.minimumWidthIn));

  const query = params.toString();
  return readJson<RemnantListResponse>(query ? `/remnants?${query}` : "/remnants");
}

export async function createRemnant(input: {
  materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  materialLabel?: string;
  thicknessIn: number;
  edgeBandPattern?: "ALL_FOUR";
  lengthIn: number;
  widthIn: number;
  usableAreaSqIn?: number;
  sourceBatchId?: string;
  sourceType?: "FULL_SHEET_LEFTOVER" | "MANUAL" | "IMPORTED";
  locationLabel?: string;
  notes?: string;
}) {
  return sendJson<UpsertRemnantResponse>("/remnants", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateRemnant(remnantId: string, input: {
  status?: "AVAILABLE" | "RESERVED" | "PARTIAL" | "CONSUMED" | "HOLD" | "SCRAPPED";
  lengthIn?: number;
  widthIn?: number;
  usableAreaSqIn?: number;
  locationLabel?: string;
  notes?: string;
}) {
  return sendJson<UpsertRemnantResponse>(`/remnants/${encodeURIComponent(remnantId)}/update`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function consumeRemnant(remnantId: string, input: {
  usedAreaSqIn: number;
  batchId?: string;
  partId?: string;
  notes?: string;
}) {
  return sendJson<UpsertRemnantResponse>(`/remnants/${encodeURIComponent(remnantId)}/consume`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function generateRemnantLabel(remnantId: string) {
  return sendJson<RemnantLabelArtifactResponse>(`/remnants/${encodeURIComponent(remnantId)}/label`, {
    method: "POST"
  });
}

export async function generateBatchCncCsv(batchId: string) {
  return sendJson<BatchExportArtifactResponse>("/batches/generate-cnc-csv", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchLabelCsv(batchId: string) {
  return sendJson<BatchExportArtifactResponse>("/batches/generate-label-csv", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchCncMosaic(batchId: string) {
  return sendJson<BatchExportArtifactResponse>("/batches/generate-cnc-mosaic", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchCncJson(batchId: string) {
  return sendJson<BatchExportArtifactResponse>("/batches/generate-cnc-json", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function getBatchDetail(batchId: string) {
  return readJson<{
    ok: true;
    batch: {
      id: string;
      code: string;
      status: string;
      material: string;
      source: "CONFIGURATOR" | "AMAZON";
      partCount: number;
      jobCount: number;
      createdAt: string;
      updatedAt: string;
      availableNextActions: string[];
      progress: {
        totalParts: number;
        cutCount: number;
        edgebandedCount: number;
        packedCount: number;
      };
      sorting: {
        assignedParts: number;
        unassignedParts: number;
        containersOpen: number;
        completionPct: number;
      };
    };
    jobs: Array<{
      id: string;
      source: "CONFIGURATOR" | "AMAZON";
      status: "DRAFT";
      channel: string;
      labelCode: string;
      partType: string;
      material: string;
      edgeBandPattern: string;
      width: number;
      depth: number;
      thickness: number;
      quantity: number;
      partIds: string[];
    }>;
    parts: Array<{
      id: string;
      jobId?: string;
      source: "CONFIGURATOR" | "AMAZON";
      labelCode: string;
      scanCode: string;
      status: "pending" | "cut" | "edgebanded" | "packed";
      availableNextActions: Array<"cut" | "edgebanded" | "packed">;
      material: string;
      edgeBandPattern: string;
      width: number;
      depth: number;
      thickness: number;
      instanceNumber: number;
      currentContainerId?: string;
      currentContainerCode?: string;
      currentContainerLabel?: string;
    }>;
    containers: Array<{
      id: string;
      code: string;
      label: string;
      type: "CONTAINER" | "BIN";
      status: "OPEN" | "SORTING" | "COMPLETE" | "HOLD" | "CLOSED";
      partCount: number;
      orderId?: string;
      manufacturingJobId?: string;
    }>;
    sheets: Array<{
      id: string;
      sheetIndex: number;
      material: string;
      sheetWidth: number;
      sheetHeight: number;
      status: string;
      placements: Array<{
        id: string;
        partId: string;
        labelCode: string;
        x: number;
        y: number;
        width: number;
        depth: number;
        sequenceNumber: number;
      }>;
    }>;
    artifacts: {
      cnc: {
        artifact?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
        packet?: {
          packetCode: string;
          sheetCount: number;
          partCount: number;
          format: "FOUNDATION_JSON";
        };
        sheets?: Array<{
          sheetIndex: number;
          material: string;
          sheetWidth: number;
          sheetHeight: number;
          placements: Array<{
            partId: string;
            labelCode: string;
            x: number;
            y: number;
            width: number;
            depth: number;
            cutMethod: "RECTANGLE_CUT";
          }>;
        }>;
        csv?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
        mosaic?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
        json?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
      };
      labels: {
        artifact?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
        packet?: {
          packetCode: string;
          labelCount: number;
          format: "FOUNDATION_JSON";
        };
        labels?: Array<{
          partId: string;
          jobId?: string;
          batchId: string;
          labelCode: string;
          scanCode: string;
          partType: "SHELF";
          material: string;
          width: number;
          depth: number;
          thickness: number;
          edgeBandPattern: string;
          quantity: 1;
          source: "CONFIGURATOR" | "AMAZON";
          currentStatus: string;
          sheetIndex?: number;
          x?: number;
          y?: number;
        }>;
        csv?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
        pdf?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
      };
      traveler: {
        pdf?: {
          id: string;
          type: string;
          uri: string;
          version: number;
          isCurrent: boolean;
          generatedFrom?: string;
          createdAt: string;
        };
      };
    };
  }>(`/batches/${encodeURIComponent(batchId)}`);
}

export async function getBatchSortingView(batchId: string) {
  return readJson<BatchSortingResponse>(`/containers/batch/${encodeURIComponent(batchId)}`);
}

export type BatchStatusTransitionResponse =
  | {
      ok: true;
      action: "transition-batch";
      batch: {
        id: string;
        code: string;
        status: string;
        availableNextActions: string[];
      };
    }
  | ConfiguratorErrorResponse;

export type PartStatusTransitionResponse =
  | {
      ok: true;
      action: "transition-part";
      part: {
        id: string;
        labelCode: string;
        scanCode: string;
        status: "pending" | "cut" | "edgebanded" | "packed";
        availableNextActions: Array<"cut" | "edgebanded" | "packed">;
      };
      jobStatus?: "DRAFT" | "COMPLETE";
      orderStatus?:
        | "DRAFT"
        | "IMPORTED"
        | "READY_FOR_BATCH"
        | "RECEIVED"
        | "IN_PRODUCTION"
        | "READY_FOR_SHIPMENT"
        | "COMPLETE"
        | "HOLD"
        | "ERROR";
    }
  | ConfiguratorErrorResponse;

export async function getProductionBundle(bundleCode: string) {
  return readJson<{
    bundle: {
      summary: {
        bundleCode: string;
        shipByDate: string;
        materialCode: string;
        productLabel: string;
        totalLineItems: number;
        totalPhysicalParts: number;
      };
      pickList: {
        rows: Array<{
          shipByDate: string;
          productLabel: string;
          quantity: number;
          customerLastName: string;
          orderId: string;
          boxCode: string | null;
          totalShelfLengthIn: number;
          totalShelfDepthIn: number;
          orderItemId: string;
        }>;
      };
      labels: {
        rows: Array<{
          shipByDate: string;
          productLabel: string;
          quantityDisplay: string;
          customerLastName: string;
          orderId: string;
          boxCode: string | null;
          totalShelfLengthIn: number;
          totalShelfDepthIn: number;
          thicknessIn: number;
          materialCode: string;
          jobNumber: number;
          partCode: string;
          qrPayload: string;
        }>;
        csv: string;
      };
      optimizer: {
        rows: Array<{
          rowType: string;
          depthMm: number;
          widthMm: number;
          customerLastName: string;
          sequenceNumber: number;
          field6: string;
          field7: string;
          field8: string;
          field9: string;
          partCode: string;
          materialCode: string;
        }>;
        csv: string;
      };
      legacyXml: {
        xml: string;
        products: Array<{
          quantity: number;
          description: string;
        }>;
      };
      files: {
        manifestJson: string;
        pickListHtml: string;
      };
    };
  }>(`/production/bundles/${encodeURIComponent(bundleCode)}`);
}

export async function getLabelBundles() {
  return readJson<{
    bundles: Array<{
      bundleCode: string;
      shipByDate: string;
      materialCode: string;
      productLabel: string;
      labelCount: number;
    }>;
  }>("/labels/bundles");
}

export async function getLabelBundle(bundleCode: string) {
  return readJson<{
    batch: {
      bundleCode: string;
      labelCount: number;
      labels: Array<{
        bundleCode: string;
        shipByDate: string;
        productLabel: string;
        quantityDisplay: string;
        customerLastName: string;
        orderId: string;
        boxCode: string | null;
        shelfLengthIn: string;
        shelfDepthIn: string;
        jobNumber: number;
        partCode: string;
        barcodeValue: string;
        materialCode: string;
        barcodeSvg: string;
      }>;
    };
  }>(`/labels/bundles/${encodeURIComponent(bundleCode)}`);
}

export async function getSingleLabel(bundleCode: string, partCode: string) {
  return readJson<{
    label: {
      bundleCode: string;
      shipByDate: string;
      productLabel: string;
      quantityDisplay: string;
      customerLastName: string;
      orderId: string;
      boxCode: string | null;
      shelfLengthIn: string;
      shelfDepthIn: string;
      jobNumber: number;
      partCode: string;
      barcodeValue: string;
      materialCode: string;
      barcodeSvg: string;
    };
  }>(`/labels/bundles/${encodeURIComponent(bundleCode)}/single/${encodeURIComponent(partCode)}`);
}

export async function getManufacturingBundles() {
  return readJson<{
    bundles: Array<{
      id?: string;
      bundleCode: string;
      shipByDate: string;
      materialCode: string;
      productLabel: string;
      totalPhysicalParts: number;
      nestingBuilt: boolean;
      cncGenerated: boolean;
      totalSheets: number;
      utilizationPct?: number;
      onionSkinPartCount: number;
      status?: string;
      currentNestVersion?: number;
      currentCncVersion?: number;
    }>;
  }>("/manufacturing");
}

export async function getManufacturingBundle(bundleCode: string) {
  return readJson<{
    bundle: {
      id?: string;
      bundleCode: string;
      shipByDate: string;
      materialCode: string;
      productLabel: string;
      totalPhysicalParts: number;
      nestingBuilt: boolean;
      cncGenerated: boolean;
      totalSheets: number;
      utilizationPct?: number;
      onionSkinPartCount: number;
      status?: string;
      currentNestVersion?: number;
      currentCncVersion?: number;
    };
    lifecycle: BundleLifecycleView;
    customerStatus: CustomerOrderStatusView;
    nesting: {
      sheetCount: number;
      totalParts: number;
      totalPartAreaSqIn: number;
      onionSkinPartCount: number;
      utilizationPct: number;
      sheets: Array<{
        id?: string;
        sheetNumber: number;
        utilizationPct: number;
        totalParts: number;
        version?: number;
        isCurrent?: boolean;
        status?: string;
      }>;
    };
    sheets: Array<{
      id?: string;
      sheetNumber: number;
      version?: number;
      isCurrent?: boolean;
      status?: string;
      totalParts: number;
      utilizationPct: number;
      approvedAt?: string;
      postedAt?: string;
      completedAt?: string;
      scrapReason?: string;
    }>;
    jobs: Array<{
      id?: string;
      version?: number;
      isCurrent?: boolean;
      code: string;
      fileName: string;
      controllerType: string;
      status: string;
      failureReason?: string;
      postedAt?: string;
      ranAt?: string;
    }>;
    artifacts: Array<{
      id?: string;
      type: string;
      artifactType: string;
      version: number;
      isCurrent: boolean;
      uri: string;
      mimeType?: string;
      supersededAt?: string;
      sheetId?: string;
      cncJobId?: string;
    }>;
  }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}`);
}

export async function getManufacturingBundleNesting(bundleCode: string) {
  return readJson<{
    summary: {
      bundleCode: string;
      shipByDate: string;
      materialCode: string;
      productLabel: string;
      totalPhysicalParts: number;
    };
    nesting: {
      bundleCode: string;
      materialCode: string;
      sheetCount: number;
      totalParts: number;
      totalPartAreaSqIn: number;
      onionSkinPartCount: number;
      utilizationPct: number;
      sheets: Array<{
        id?: string;
        productionBundleCode: string;
        materialCode: string;
        sheetNumber: number;
        widthIn: number;
        heightIn: number;
        usableXIn: number;
        usableYIn: number;
        usableWidthIn: number;
        usableHeightIn: number;
        utilizationPct: number;
        totalParts: number;
        placements: Array<{
          id?: string;
          sheetId?: string;
          partId: string;
          partCode: string;
          xIn: number;
          yIn: number;
          widthIn: number;
          depthIn: number;
          rotationDeg: 0 | 90;
          sequenceNumber: number;
          onionSkin: boolean;
          customerLastName?: string;
        }>;
      }>;
    };
  }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}/nest`);
}

export async function getManufacturingBundleCnc(bundleCode: string) {
  return readJson<{
    jobs: Array<{
      id?: string;
      version?: number;
      isCurrent?: boolean;
      code: string;
      bundleCode: string;
      materialCode: string;
      sheetId?: string;
      sheetNumber: number;
      controllerType: string;
      fileExtension: string;
      status: string;
      toolDiameterIn: number;
      spindleRpm: number;
      feedRateIpm: number;
      plungeRateIpm: number;
      lineCount: number;
      fileName: string;
      approvedAt?: string;
      postedAt?: string;
      ranAt?: string;
      failureReason?: string;
    }>;
  }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}/cnc`);
}

export async function getBundleArtifacts(bundleCode: string) {
  return readJson<{
    artifacts: Array<{
      id?: string;
      type: string;
      artifactType: string;
      version: number;
      isCurrent: boolean;
      uri: string;
      mimeType?: string;
      supersededAt?: string;
      sheetId?: string;
      cncJobId?: string;
    }>;
  }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}/artifacts`);
}

export async function getManufacturingSheet(sheetId: string) {
  return readJson<{
    sheet: {
      id: string;
      productionBundleCode: string;
      materialCode: string;
      sheetNumber: number;
      version?: number;
      status?: string;
      isCurrent?: boolean;
      postedAt?: string;
      completedAt?: string;
      utilizationPct: number;
      totalParts: number;
      placements: Array<{
        id?: string;
        partCode: string;
        xIn: number;
        yIn: number;
        widthIn: number;
        depthIn: number;
        sequenceNumber: number;
        onionSkin: boolean;
      }>;
      cncJobs?: Array<{
        id?: string;
        code: string;
        fileName: string;
        version?: number;
        isCurrent?: boolean;
        status?: string;
        failureReason?: string;
      }>;
    };
  }>(`/manufacturing/sheets/${encodeURIComponent(sheetId)}`);
}

export async function getSheetMap(sheetId: string) {
  return readJson<{
    map: {
      sheetId?: string;
      bundleCode: string;
      sheetNumber: number;
      svg: string;
      html: string;
      manifest: {
        bundleCode: string;
        materialCode: string;
        sheetNumber: number;
        utilizationPct: number;
      };
    };
  }>(`/manufacturing/sheets/${encodeURIComponent(sheetId)}/map`);
}

export async function releaseBundle(bundleCode: string) {
  return sendJson<{ result: BundleActionResult }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}/release`, {
    method: "POST"
  });
}

export async function approveNest(bundleCode: string) {
  return sendJson<{ result: BundleActionResult }>(
    `/manufacturing/bundles/${encodeURIComponent(bundleCode)}/nest/approve`,
    {
      method: "POST"
    }
  );
}

export async function approveCnc(bundleCode: string) {
  return sendJson<{ result: BundleActionResult }>(
    `/manufacturing/bundles/${encodeURIComponent(bundleCode)}/cnc/approve`,
    {
      method: "POST"
    }
  );
}

export async function postCncJob(jobId: string) {
  return sendJson<{ result: BundleActionResult }>(`/manufacturing/cnc/${encodeURIComponent(jobId)}/post`, {
    method: "POST"
  });
}

export async function completeCncJob(jobId: string) {
  return sendJson<{ result: BundleActionResult }>(`/manufacturing/cnc/${encodeURIComponent(jobId)}/complete`, {
    method: "POST"
  });
}

export async function failCncJob(jobId: string, reason: string) {
  return sendJson<{ result: BundleActionResult }>(`/manufacturing/cnc/${encodeURIComponent(jobId)}/fail`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export async function buildNesting(bundleCode: string) {
  return sendJson<{ nesting?: { sheetCount: number; onionSkinPartCount: number } }>(
    `/manufacturing/bundles/${encodeURIComponent(bundleCode)}/nest`,
    {
      method: "POST"
    }
  );
}

export async function generateCnc(bundleCode: string) {
  return sendJson<{ totalJobs?: number }>(`/manufacturing/bundles/${encodeURIComponent(bundleCode)}/cnc`, {
    method: "POST"
  });
}

export async function generateBundlePacket(bundleCode: string) {
  return sendJson<{ result: BundleActionResult & { uri?: string } }>(
    `/manufacturing/bundles/${encodeURIComponent(bundleCode)}/packet`,
    {
      method: "POST"
    }
  );
}

export async function validateConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<ConfiguratorValidateResponse>("/configurator/validate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function normalizeConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<ConfiguratorNormalizeResponse>("/configurator/normalize", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function quoteConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<ConfiguratorQuoteResponse>("/configurator/quote", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function translateConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<ConfiguratorTranslateResponse>("/configurator/translate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createConfiguratorJob(input: ShelfConfiguratorInput) {
  return sendJson<ConfiguratorCreateJobResponse>("/configurator/create-job", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createBatch(material: "WHITE_MELAMINE" | "MAPLE_MELAMINE") {
  return sendJson<CreateBatchResponse>("/batches/build", {
    method: "POST",
    body: JSON.stringify({ material })
  });
}

export async function createForecastBatch(input: {
  materialCode: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  jobIds?: string[];
  partIds?: string[];
  batchName?: string;
}) {
  return sendJson<CreateForecastBatchResponse>("/material-forecast/create-batch", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function nestBatch(batchId: string) {
  return sendJson<NestBatchResponse>("/batches/nest", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchCnc(batchId: string) {
  return sendJson<GenerateCncResponse>("/batches/generate-cnc", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchLabels(batchId: string) {
  return sendJson<GenerateLabelsResponse>("/batches/generate-labels", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchLabelPdf(batchId: string) {
  return sendJson<GeneratePdfArtifactResponse>("/batches/generate-label-pdf", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function generateBatchTravelerPdf(batchId: string) {
  return sendJson<GeneratePdfArtifactResponse>("/batches/generate-traveler-pdf", {
    method: "POST",
    body: JSON.stringify({ batchId })
  });
}

export async function transitionBatchStatus(
  batchId: string,
  nextStatus: "PLANNED" | "RELEASED" | "CUTTING" | "CUT_COMPLETE" | "READY_FOR_NEXT_STAGE"
) {
  return sendJson<BatchStatusTransitionResponse>(`/batches/${encodeURIComponent(batchId)}/status`, {
    method: "POST",
    body: JSON.stringify({ nextStatus })
  });
}

export async function transitionPartStatus(
  partId: string,
  nextStatus: "CUT" | "EDGEBANDED" | "PACKED"
) {
  return sendJson<PartStatusTransitionResponse>(`/parts/${encodeURIComponent(partId)}/status`, {
    method: "POST",
    body: JSON.stringify({ nextStatus })
  });
}

export async function transitionPartStatusByLabel(
  labelCode: string,
  nextStatus: "CUT" | "EDGEBANDED" | "PACKED"
) {
  return sendJson<PartStatusTransitionResponse>("/parts/scan", {
    method: "POST",
    body: JSON.stringify({ labelCode, nextStatus })
  });
}

export async function transitionPartStatusByScanCode(
  scanCode: string,
  nextStatus: "CUT" | "EDGEBANDED" | "PACKED"
) {
  return sendJson<PartStatusTransitionResponse>("/parts/scan", {
    method: "POST",
    body: JSON.stringify({ scanCode, nextStatus })
  });
}

export async function getStationQueue(station: "cutting" | "edgebanding" | "packing") {
  return readJson<StationQueueResponse>(`/stations/${encodeURIComponent(station)}`);
}

export async function createContainer(input: {
  batchId: string;
  type: "CONTAINER" | "BIN";
  code?: string;
  label?: string;
  orderId?: string;
  manufacturingJobId?: string;
  notes?: string;
}) {
  return sendJson<ContainerMutationResponse>("/containers", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function assignPartToContainer(input: {
  containerId: string;
  partId?: string;
  scanCode?: string;
  allowReassign?: boolean;
}) {
  return sendJson<ContainerMutationResponse>("/containers/assign", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function scanPartToContainer(input: {
  containerId: string;
  scanCode: string;
  allowReassign?: boolean;
}) {
  return sendJson<ContainerMutationResponse>("/containers/scan", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function removePartFromContainer(input: {
  containerId: string;
  partId?: string;
  scanCode?: string;
}) {
  return sendJson<ContainerMutationResponse>("/containers/remove", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export interface CanonicalSalesOrderSummary {
  id: string;
  sourceType: "AMAZON" | "WEBSITE" | "MANUAL";
  sourceOrderId?: string;
  customerName?: string;
  currency: string;
  status: "DRAFT" | "READY" | "HOLD" | "ERROR" | "CONVERTED";
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    materialType?: string;
    lengthIn?: number;
    depthIn?: number;
    normalizationStatus: string;
    pricingStatus: string;
  }>;
  shelfJobs: Array<{
    id: string;
    salesOrderItemId: string;
    quantity: number;
    jobStatus: string;
    createdAt: string;
  }>;
}

export interface CanonicalShelfJobSummary {
  id: string;
  salesOrderId: string;
  salesOrderItemId: string;
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  quantity: number;
  jobStatus: string;
  normalizedSpecJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalManufacturingPacketSummary {
  id: string;
  packetNumber: string;
  sourceType: string;
  sourceIdsJson: string[];
  summaryJson: Record<string, unknown>;
  createdAt: string;
}

export interface CanonicalManufacturingPartSummary {
  id: string;
  manufacturingPacketId: string;
  shelfJobId: string;
  salesOrderId: string;
  salesOrderItemId: string;
  batchId?: string;
  partNumber: string;
  unitIndex: number;
  quantity: number;
  partType: string;
  materialType: string;
  thicknessIn: number;
  lengthIn: number;
  depthIn: number;
  edgeBandPattern: string;
  requiresPackaging: boolean;
  labelDataJson: Record<string, unknown>;
  status: string;
  statusReason?: string;
  sortGroup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalManufacturingBatchSummary {
  id: string;
  batchNumber: string;
  batchType: "CUT" | "EDGEBAND" | "PACKAGING";
  materialType?: string;
  thicknessIn?: number;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETE" | "HOLD";
  notes?: string;
  partCount: number;
  createdAt: string;
  updatedAt: string;
  parts: CanonicalManufacturingPartSummary[];
}

export interface CostEstimateRecord {
  id: string;
  estimateStatus: "COMPLETE" | "PARTIAL" | "ERROR";
  warnings: string[];
  inputSnapshot: Record<string, unknown>;
  assumptionSnapshot: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MachineStageCandidateRecord {
  id: string;
  machineEventId: string;
  machineId: string;
  machineCode?: string;
  machineName?: string;
  machineType?: string;
  entityType: string;
  entityId: string;
  suggestedAction: string;
  confidence: string;
  rationale: string;
  status: string;
  emittedAt: string;
  createdAt: string;
}

export interface ScanEventRecord {
  id: string;
  entityType?: string;
  entityId?: string;
  scanValue?: string;
  stationType: string;
  actionType: string;
  previousStatus?: string;
  nextStatus?: string;
  result: "ACCEPTED" | "REJECTED" | "NOOP";
  resultReason?: string;
  metadataJson?: Record<string, unknown>;
  scannedByUserId?: string;
  manufacturingPartId?: string;
  manufacturingBatchId?: string;
  createdAt: string;
}

export interface WorkflowStationRuleRecord {
  id: string;
  stationType: string;
  entityType: string;
  fromStatus: string;
  actionType: string;
  toStatus: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedContainerRecord {
  id: string;
  containerCode: string;
  displayName: string;
  description?: string;
  containerType: string;
  barcodeValue: string;
  qrValue: string;
  capacityNotes?: string;
  status: string;
  currentLocationId?: string;
  currentLocationCode?: string;
  currentLocationName?: string;
  manufacturingBatchId?: string;
  batchId?: string;
  isActive: boolean;
  activePartCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveContainerSessionRecord {
  id: string;
  containerId: string;
  stationType?: string;
  startedByUserId?: string;
  endedByUserId?: string;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
  metadataJson?: Record<string, unknown>;
  container?: ManagedContainerRecord;
}

export async function getCanonicalSalesOrders() {
  return readJson<{ ok: true; orders: CanonicalSalesOrderSummary[] }>("/order-intake/orders");
}

export async function getCanonicalSalesOrder(orderId: string) {
  return readJson<{ ok: true; order: CanonicalSalesOrderSummary }>(
    `/order-intake/orders/${encodeURIComponent(orderId)}`
  );
}

export async function getCanonicalShelfJobs() {
  return readJson<{ ok: true; shelfJobs: CanonicalShelfJobSummary[] }>("/shelf-jobs");
}

export async function getCanonicalShelfJob(shelfJobId: string) {
  return readJson<{ ok: true; shelfJob: CanonicalShelfJobSummary }>(
    `/shelf-jobs/${encodeURIComponent(shelfJobId)}`
  );
}

export async function getCanonicalManufacturingPackets() {
  return readJson<{ ok: true; packets: CanonicalManufacturingPacketSummary[] }>("/manufacturing-packets");
}

export async function getCanonicalManufacturingParts(input?: {
  packetId?: string;
  batchId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (input?.packetId) params.set("packetId", input.packetId);
  if (input?.batchId) params.set("batchId", input.batchId);
  if (input?.status) params.set("status", input.status);
  const query = params.toString();

  return readJson<{ ok: true; parts: CanonicalManufacturingPartSummary[] }>(
    `/manufacturing-parts${query ? `?${query}` : ""}`
  );
}

export async function getCanonicalManufacturingBatches() {
  return readJson<{ ok: true; batches: CanonicalManufacturingBatchSummary[] }>("/manufacturing-batches");
}

export async function getShelfJobEstimate(shelfJobId: string) {
  return readJson<{ ok: true; estimate: CostEstimateRecord }>(
    `/costing/shelf-jobs/${encodeURIComponent(shelfJobId)}/estimate`
  );
}

export async function recomputeShelfJobEstimate(shelfJobId: string) {
  return sendJson<{ ok: true; estimate: CostEstimateRecord }>(
    `/costing/shelf-jobs/${encodeURIComponent(shelfJobId)}/estimate`,
    { method: "POST" }
  );
}

export async function getSalesOrderEstimate(orderId: string) {
  return readJson<{ ok: true; estimate: CostEstimateRecord }>(
    `/costing/orders/${encodeURIComponent(orderId)}/estimate`
  );
}

export async function recomputeSalesOrderEstimate(orderId: string) {
  return sendJson<{ ok: true; estimate: CostEstimateRecord }>(
    `/costing/orders/${encodeURIComponent(orderId)}/estimate`,
    { method: "POST" }
  );
}

export async function getMachineStageCandidates() {
  return readJson<{ ok: true; candidates: MachineStageCandidateRecord[] }>("/machine-stage-candidates");
}

export async function getScanEvents(input?: {
  result?: "ACCEPTED" | "REJECTED" | "NOOP";
  stationType?: string;
  entityType?: string;
}) {
  const params = new URLSearchParams();
  if (input?.result) params.set("result", input.result);
  if (input?.stationType) params.set("stationType", input.stationType);
  if (input?.entityType) params.set("entityType", input.entityType);
  const query = params.toString();

  return readJson<{ ok: true; events: ScanEventRecord[] }>(`/scan/events${query ? `?${query}` : ""}`);
}

export async function getWorkflowStationRules() {
  return readJson<{ ok: true; rules: WorkflowStationRuleRecord[] }>("/workflow/station-rules");
}

export async function getManagedContainers() {
  return readJson<{ ok: true; containers: ManagedContainerRecord[] }>("/containers");
}

export async function getActiveContainerSessions() {
  return readJson<{ ok: true; sessions: ActiveContainerSessionRecord[] }>("/containers/active-container-sessions");
}

export interface CostProfileSummaryItem {
  id: string;
  orgId: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  isDefault: boolean;
  currency: "USD";
  targetMarginPct: number | null;
  growthMarginPct: number | null;
  updatedAt: string;
}

export interface AmazonFeePresetItem {
  id: string;
  orgId: string;
  costProfileId: string | null;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  referralFeePct: number;
  closingFeeCents: number | null;
  fulfillmentFeeCents: number | null;
  storageAllowanceCents: number | null;
  advertisingAllowancePct: number | null;
  advertisingAllowanceCents: number | null;
  returnReservePct: number | null;
  returnReserveCents: number | null;
  damageReservePct: number | null;
  damageReserveCents: number | null;
  miscMarketplacePct: number | null;
  miscMarketplaceCents: number | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneRuleItem {
  id: string;
  orgId: string;
  costProfileId: string | null;
  name: string;
  zoneCode: string;
  status: "ACTIVE" | "ARCHIVED";
  baseCostCents: number;
  weightAdderCents: number | null;
  dimensionalAdderCents: number | null;
  bufferPct: number | null;
  bufferCents: number | null;
  marketplaceHandlingCents: number | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchTemplateItem {
  id: string;
  orgId: string;
  costProfileId: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  defaultAmazonFeePresetId: string | null;
  defaultAmazonFeePresetName: string | null;
  defaultShippingZoneRuleId: string | null;
  defaultShippingZoneRuleName: string | null;
  defaultPackagingRuleId: string | null;
  defaultPackagingRuleName: string | null;
  defaultShippingRuleId: string | null;
  defaultShippingRuleName: string | null;
  launchStrategy: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN";
  notes: string | null;
  assumptionsSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchGuardrailProfileItem {
  id: string;
  orgId: string;
  costProfileId: string | null;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  minimumMarginPct: number;
  minimumBufferAboveBreakEvenPct: number | null;
  maximumFeeBurdenPct: number | null;
  maximumShippingBurdenPct: number | null;
  maximumReserveBurdenPct: number | null;
  maximumAllowedTargetToFloorGapPct: number | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceMappingTemplateItem {
  id: string;
  orgId: string;
  costProfileId: string | null;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  productLabelFormat: string | null;
  skuFormat: string | null;
  includeWarningNotes: boolean;
  includeOverrideNotes: boolean;
  dimensionsFormat: string | null;
  materialFormat: string | null;
  packagingFormat: string | null;
  pricingFormat: string | null;
  notes: string | null;
  templateSnapshot?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMappingPresetItem {
  id: string;
  orgId: string;
  costProfileId: string | null;
  name: string;
  channelCode: "AMAZON_MANUAL";
  status: "ACTIVE" | "ARCHIVED";
  productLabelFormat: string | null;
  skuFormat: string | null;
  includeWarningNotes: boolean;
  includeOverrideNotes: boolean;
  dimensionsFormat: string | null;
  materialFormat: string | null;
  packagingFormat: string | null;
  pricingFormat: string | null;
  fieldOrderingSnapshot: Record<string, unknown> | null;
  notes: string | null;
  presetSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialCostRuleItem {
  id: string;
  orgId: string;
  costProfileId: string;
  materialCode: string;
  materialName: string;
  thicknessLabel: string | null;
  sheetLengthIn: number;
  sheetWidthIn: number;
  sheetCostCents: number;
  usableYieldPct: number | null;
  wastePct: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EdgeBandCostRuleItem {
  id: string;
  orgId: string;
  costProfileId: string;
  edgeBandCode: string;
  edgeBandName: string;
  costCentsPerLinearFoot: number;
  wastePct: number | null;
  setupAllowanceLinearFt: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagingCostRuleItem {
  id: string;
  orgId: string;
  costProfileId: string;
  packagingCode: string;
  packagingName: string;
  boxCostCents: number | null;
  bubbleWrapCostCents: number | null;
  tapeCostCents: number | null;
  labelCostCents: number | null;
  insertFlyerCostCents: number | null;
  shrinkWrapCostCents: number | null;
  foamCostCents: number | null;
  cornerProtectorCostCents: number | null;
  packingMinutes: number | null;
  packingLaborOverrideCents: number | null;
  packagingOverheadCents: number | null;
  otherPackagingCostCents: number | null;
  sortOrder: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCostRuleItem {
  id: string;
  orgId: string;
  costProfileId: string;
  shippingCode: string;
  shippingName: string;
  baseCostCents: number;
  costPerPoundCents: number | null;
  costPerCubicInchCents: number | null;
  dimensionalDivisor: number | null;
  dimensionalRateCents: number | null;
  shippingBufferPct: number | null;
  shippingBufferCents: number | null;
  marketplaceHandlingCents: number | null;
  sortOrder: number | null;
  flatOverride: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostProfileDetail {
  id: string;
  orgId: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  isDefault: boolean;
  currency: "USD";
  defaultMaterialWastePct: number;
  defaultEdgeBandWastePct: number;
  defaultLaborRateCentsPerHour: number;
  defaultMachineRateCentsPerHour: number;
  defaultOverheadRateCentsPerHour: number | null;
  defaultPackagingAllowanceCents: number | null;
  defaultShippingAllowanceCents: number | null;
  defaultPackingLaborRateCentsPerHour: number | null;
  defaultPackingMinutes: number | null;
  defaultMarketplaceFeePct: number | null;
  defaultReturnReservePct: number | null;
  defaultDamageReservePct: number | null;
  defaultShippingBufferPct: number | null;
  defaultShippingBufferCents: number | null;
  defaultPackagingOverheadCents: number | null;
  defaultRecommendedMinMarginPct: number | null;
  defaultRecommendedTargetMarginPct: number | null;
  targetMarginPct: number | null;
  growthMarginPct: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  materialRules: MaterialCostRuleItem[];
  edgeBandRules: EdgeBandCostRuleItem[];
  packagingRules: PackagingCostRuleItem[];
  shippingRules: ShippingCostRuleItem[];
  amazonFeePresets: AmazonFeePresetItem[];
  shippingZoneRules: ShippingZoneRuleItem[];
  launchTemplates: LaunchTemplateItem[];
  launchGuardrailProfiles: LaunchGuardrailProfileItem[];
  marketplaceMappingTemplates: MarketplaceMappingTemplateItem[];
  channelMappingPresets: ChannelMappingPresetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CostCalculationInput {
  costProfileId: string;
  name?: string | null;
  sku?: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn?: number | null;
  weightLb?: number | null;
  materialCode: string;
  edgeBandCode?: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode?: string | null;
  shippingCode?: string | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes?: number | null;
  packingMinutes?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
}

export interface CostCalculationPreview {
  name: string | null;
  sku: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn: number | null;
  materialCode: string;
  edgeBandCode: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode: string | null;
  shippingCode: string | null;
  amazonFeePresetId: string | null;
  shippingZoneRuleId: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes: number | null;
  packingMinutes: number | null;
  materialCostCents: number;
  edgeBandCostCents: number;
  laborCostCents: number;
  machineCostCents: number;
  packagingCostCents: number;
  packingLaborCostCents: number;
  shippingCostCents: number;
  shippingBufferCostCents: number;
  overheadCostCents: number;
  marketplaceFeeCostCents: number;
  referralFeeCostCents: number;
  closingFeeCostCents: number;
  fulfillmentFeeCostCents: number;
  storageAllowanceCostCents: number;
  advertisingAllowanceCostCents: number;
  returnReserveCostCents: number;
  damageReserveCostCents: number;
  miscMarketplaceCostCents: number;
  subtotalCostCents: number;
  breakEvenPriceCents: number | null;
  recommendedMinSellPriceCents: number | null;
  recommendedTargetSellPriceCents: number | null;
  recommendedInternalPriceCents: number;
  recommendedSellPriceCents: number;
}

export interface CostCalculationResult {
  currency: string;
  quantity: number;
  breakdown: {
    materialCostCents: number;
    edgeBandCostCents: number;
    laborCostCents: number;
    machineCostCents: number;
    packagingCostCents: number;
    packingLaborCostCents: number;
    packagingComponentCostCents: number;
    packagingOverheadCostCents: number;
    shippingCostCents: number;
    shippingBufferCostCents: number;
    overheadCostCents: number;
    subtotalCostCents: number;
    marketplaceFeeCostCents: number;
    referralFeeCostCents: number;
    closingFeeCostCents: number;
    fulfillmentFeeCostCents: number;
    storageAllowanceCostCents: number;
    advertisingAllowanceCostCents: number;
    returnReserveCostCents: number;
    damageReserveCostCents: number;
    miscMarketplaceCostCents: number;
    breakEvenPriceCents: number | null;
    recommendedMinSellPriceCents: number | null;
    recommendedTargetSellPriceCents: number | null;
    recommendedInternalPriceCents: number;
    recommendedSellPriceCents: number;
  };
  geometry: {
    requiredAreaSqFt: number;
    sheetAreaSqFt: number;
    sheetsRequired: number;
    edgeBandLinearFeet: number;
    effectiveEdgeBandLinearFeet: number;
  };
  pricing: {
    targetMarginPct: number | null;
    growthMarginPct: number | null;
    marketplaceFeePct: number | null;
    referralFeePct: number | null;
    advertisingAllowancePct: number | null;
    returnReservePct: number | null;
    damageReservePct: number | null;
    miscMarketplacePct: number | null;
    closingFeeCostCents: number;
    fulfillmentFeeCostCents: number;
    storageAllowanceCostCents: number;
    advertisingAllowanceCostCents: number;
    miscMarketplaceCostCents: number;
    breakEvenPriceCents: number | null;
    recommendedMinSellPriceCents: number | null;
    recommendedTargetSellPriceCents: number | null;
    recommendedInternalPriceCents: number;
    recommendedSellPriceCents: number;
  };
  packaging: {
    componentCostCents: number;
    packingMinutes: number;
    packingLaborCostCents: number;
    packagingOverheadCents: number;
  };
  shipping: {
    baseCostCents: number;
    weightCostCents: number;
    volumeCostCents: number;
    dimensionalCostCents: number;
    marketplaceHandlingCents: number;
    shippingBufferPct: number | null;
    shippingBufferCents: number | null;
    bufferCostCents: number;
    shippingZoneName?: string | null;
    shippingZoneCode?: string | null;
  };
  amazonFees: {
    presetName?: string | null;
    referralFeePct: number | null;
    referralFeeCostCents: number;
    closingFeeCostCents: number;
    fulfillmentFeeCostCents: number;
    storageAllowanceCostCents: number;
    advertisingAllowancePct: number | null;
    advertisingAllowanceCostCents: number;
    returnReservePct: number | null;
    returnReserveCostCents: number;
    damageReservePct: number | null;
    damageReserveCostCents: number;
    miscMarketplacePct: number | null;
    miscMarketplaceCostCents: number;
  };
  shippingZone: {
    id?: string | null;
    name?: string | null;
    zoneCode?: string | null;
    baseCostCents: number;
    weightAdderCostCents: number;
    dimensionalAdderCostCents: number;
    bufferCostCents: number;
    marketplaceHandlingCents: number;
  };
}

export interface ShelfCostCalculationRecord {
  id: string;
  orgId: string;
  costProfileId: string;
  costProfileName: string | null;
  amazonFeePresetId: string | null;
  amazonFeePresetName: string | null;
  shippingZoneRuleId: string | null;
  shippingZoneRuleName: string | null;
  name: string | null;
  sku: string | null;
  quantity: number;
  lengthIn: number;
  depthIn: number;
  thicknessIn: number | null;
  materialCode: string;
  edgeBandCode: string | null;
  edgeBandPattern: "NONE" | "LONG_EDGES" | "SHORT_EDGES" | "ALL_FOUR";
  packagingCode: string | null;
  shippingCode: string | null;
  laborMinutes: number;
  machineMinutes: number;
  overheadMinutes: number | null;
  packingMinutes: number | null;
  materialCostCents: number;
  edgeBandCostCents: number;
  laborCostCents: number;
  machineCostCents: number;
  packagingCostCents: number;
  packingLaborCostCents: number;
  shippingCostCents: number;
  shippingBufferCostCents: number;
  overheadCostCents: number;
  marketplaceFeeCostCents: number;
  referralFeeCostCents: number;
  closingFeeCostCents: number;
  fulfillmentFeeCostCents: number;
  storageAllowanceCostCents: number;
  advertisingAllowanceCostCents: number;
  returnReserveCostCents: number;
  damageReserveCostCents: number;
  miscMarketplaceCostCents: number;
  subtotalCostCents: number;
  breakEvenPriceCents: number | null;
  recommendedMinSellPriceCents: number | null;
  recommendedTargetSellPriceCents: number | null;
  targetMarginPct: number | null;
  growthMarginPct: number | null;
  recommendedInternalPriceCents: number | null;
  recommendedSellPriceCents: number | null;
  assumptionsSnapshot: Record<string, unknown>;
  packagingSnapshot: Record<string, unknown> | null;
  shippingSnapshot: Record<string, unknown> | null;
  pricingSnapshot: Record<string, unknown> | null;
  amazonFeeSnapshot: Record<string, unknown> | null;
  shippingZoneSnapshot: Record<string, unknown> | null;
  resultSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CostScenarioInput {
  name: string;
  launchStrategy?: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN" | null;
  amazonFeePresetId?: string | null;
  shippingZoneRuleId?: string | null;
  packagingCode?: string | null;
  shippingCode?: string | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  marketplaceFeePct?: number | null;
  returnReservePct?: number | null;
  damageReservePct?: number | null;
  shippingBufferPct?: number | null;
  shippingBufferCents?: number | null;
}

export interface CostScenarioResult {
  id: string;
  name: string;
  launchStrategy?: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN" | null;
  calculation: CostCalculationPreview;
  assumptionsSnapshot: Record<string, unknown>;
  result: CostCalculationResult;
  changedAssumptions: {
    packagingCode: string | null;
    shippingCode: string | null;
    amazonFeePresetId: string | null;
    shippingZoneRuleId: string | null;
    targetMarginPct: number | null;
    growthMarginPct: number | null;
    launchStrategy?: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN" | null;
  };
  rankingScore: number | null;
  rankingSummary: Record<string, unknown> | null;
  guardrailProfileId?: string | null;
  guardrailProfileName?: string | null;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  listingReadinessStatus?: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  guardrailSnapshot?: Record<string, unknown> | null;
  warningSnapshot?: Array<Record<string, unknown>> | null;
  riskSummary?: string | null;
  handoffSnapshot?: Record<string, unknown> | null;
  listingReadinessSnapshot?: Record<string, unknown> | null;
  marketplaceFieldSnapshot?: Record<string, unknown> | null;
  strongerAlertSnapshot?: Record<string, unknown> | null;
  exportSnapshot?: Record<string, unknown> | null;
  isRecommendedLaunchScenario: boolean;
  isLaunchApprovedCandidate?: boolean;
  listingPrepPackageId?: string | null;
  priceFloorOverrideRequested?: boolean;
  priceFloorOverrideApproved?: boolean;
  priceFloorOverrideSnapshot?: Record<string, unknown> | null;
  latestOverrideSummarySnapshot?: Record<string, unknown> | null;
  deltas: {
    subtotalCostCents: number;
    breakEvenPriceCents: number;
    recommendedMinSellPriceCents: number;
    recommendedTargetSellPriceCents: number;
  };
}

export interface CostComparisonResult {
  name: string | null;
  notes: string | null;
  baseSpec: CostCalculationInput;
  baselineScenarioId: string;
  ranking?: {
    scenarios: Array<{
      scenarioId: string;
      rankingScore: number;
      rankingSummary: Record<string, unknown>;
    }>;
    recommendation: {
      recommendedScenarioId: string;
      recommendedLaunchPriceCents: number;
      recommendedFloorPriceCents: number;
      recommendedSaferMarginPriceCents: number;
      bestLaunchScenarioLabel: string;
      safestMarginScenarioLabel: string;
      mostAggressiveScenarioLabel: string;
      recommendationSummary: string;
      tradeoffSummary: Record<string, unknown>;
    } | null;
  };
  guardrailProfile?: LaunchGuardrailProfileItem | null;
  selectedLaunchScenarioId?: string | null;
  selectedLaunchSummary?: Record<string, unknown> | null;
  riskSummary?: Record<string, unknown> | null;
  selectedLaunchReadinessStatus?: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  selectedLaunchWarningSnapshot?: Array<Record<string, unknown>> | null;
  selectedLaunchExportSnapshot?: Record<string, unknown> | null;
  selectedListingPrepPackageId?: string | null;
  selectedListingPrepPackageName?: string | null;
  listingPrepSummarySnapshot?: Record<string, unknown> | null;
  selectedListingPrepReadySnapshot?: Record<string, unknown> | null;
  selectedListingPrepExportVersion?: string | null;
  scenarios: CostScenarioResult[];
}

export interface CalculationScenarioRecord {
  id: string;
  orgId: string;
  name: string;
  costProfileId: string;
  amazonFeePresetId: string | null;
  amazonFeePresetName: string | null;
  shippingZoneRuleId: string | null;
  shippingZoneRuleName: string | null;
  packagingRuleId: string | null;
  packagingRuleName: string | null;
  shippingRuleId: string | null;
  shippingRuleName: string | null;
  shelfCostCalculationId: string | null;
  launchStrategy: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN" | null;
  guardrailProfileId: string | null;
  guardrailProfileName: string | null;
  rankingScore: number | null;
  rankingSummary: Record<string, unknown> | null;
  riskScore: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  listingReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  guardrailSnapshot: Record<string, unknown> | null;
  warningSnapshot: Array<Record<string, unknown>> | null;
  handoffSnapshot: Record<string, unknown> | null;
  listingReadinessSnapshot: Record<string, unknown> | null;
  marketplaceFieldSnapshot: Record<string, unknown> | null;
  strongerAlertSnapshot: Record<string, unknown> | null;
  exportSnapshot: Record<string, unknown> | null;
  isRecommendedLaunchScenario: boolean;
  isLaunchApprovedCandidate: boolean;
  listingPrepPackageId: string | null;
  priceFloorOverrideRequested: boolean;
  priceFloorOverrideApproved: boolean;
  priceFloorOverrideSnapshot: Record<string, unknown> | null;
  latestOverrideSummarySnapshot: Record<string, unknown> | null;
  assumptionsSnapshot: Record<string, unknown>;
  resultSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonSetRecord {
  id: string;
  orgId: string;
  name: string;
  notes: string | null;
  baseShelfSpecSnapshot: Record<string, unknown>;
  recommendedScenarioId: string | null;
  recommendedScenarioName: string | null;
  selectedLaunchScenarioId: string | null;
  selectedLaunchScenarioName: string | null;
  rankingSnapshot: Record<string, unknown> | null;
  comparisonSummary: Record<string, unknown> | null;
  selectedLaunchSummary: Record<string, unknown> | null;
  riskSummary: Record<string, unknown> | null;
  selectedLaunchReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  selectedLaunchWarningSnapshot: Array<Record<string, unknown>> | null;
  selectedLaunchExportSnapshot: Record<string, unknown> | null;
  selectedListingPrepPackageId: string | null;
  selectedListingPrepPackageName: string | null;
  listingPrepSummarySnapshot: Record<string, unknown> | null;
  selectedListingPrepReadySnapshot: Record<string, unknown> | null;
  selectedListingPrepExportVersion: string | null;
  selectedListingPrepApprovalSnapshot: Record<string, unknown> | null;
  selectedListingPrepExportContractVersion: string | null;
  scenarios: Array<{
    id: string;
    sortOrder: number | null;
    createdAt: string;
    scenario: CalculationScenarioRecord;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonSetListItem {
  id: string;
  orgId: string;
  name: string;
  notes: string | null;
  scenarioCount: number;
  recommendedScenarioId: string | null;
  recommendedScenarioName: string | null;
  selectedLaunchScenarioId: string | null;
  selectedLaunchScenarioName: string | null;
  comparisonSummary: Record<string, unknown> | null;
  riskSummary: Record<string, unknown> | null;
  selectedLaunchReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingPrepPackageRecord {
  id: string;
  orgId: string;
  comparisonSetId: string | null;
  calculationScenarioId: string;
  name: string;
  status: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
  listingReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED";
  exportSnapshot: Record<string, unknown>;
  marketplaceFieldSnapshot: Record<string, unknown>;
  validationSnapshot: Record<string, unknown>;
  warningSnapshot: Array<Record<string, unknown>> | null;
  overrideSnapshot: Record<string, unknown> | null;
  marketplaceMappingTemplateId: string | null;
  marketplaceMappingTemplateName: string | null;
  channelMappingPresetId: string | null;
  channelMappingPresetName: string | null;
  approvalState: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
  approvalSummarySnapshot: Record<string, unknown> | null;
  exportVersion: string | null;
  exportContractVersion: string | null;
  exportShapeSnapshot: Record<string, unknown> | null;
  overrideHistorySnapshot: Record<string, unknown> | null;
  readyForListingPrep: boolean;
  readyForListingPrepSummary: Record<string, unknown> | null;
  manualAmazonExportSnapshot: Record<string, unknown> | null;
  currentApprovedArtifact: boolean;
  notes: string | null;
  approvedAt: string | null;
  approvedByMembershipId: string | null;
  scenarioName: string | null;
  comparisonSetName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCostProfiles() {
  return readJson<{ ok: true; profiles: CostProfileSummaryItem[] }>("/cost-profiles");
}

export async function getCostProfile(costProfileId: string) {
  return readJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}`
  );
}

export async function createCostProfile(input: {
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  currency?: "USD";
  defaultMaterialWastePct?: number;
  defaultEdgeBandWastePct?: number;
  defaultLaborRateCentsPerHour?: number;
  defaultMachineRateCentsPerHour?: number;
  defaultOverheadRateCentsPerHour?: number | null;
  defaultPackagingAllowanceCents?: number | null;
  defaultShippingAllowanceCents?: number | null;
  defaultPackingLaborRateCentsPerHour?: number | null;
  defaultPackingMinutes?: number | null;
  defaultMarketplaceFeePct?: number | null;
  defaultReturnReservePct?: number | null;
  defaultDamageReservePct?: number | null;
  defaultShippingBufferPct?: number | null;
  defaultShippingBufferCents?: number | null;
  defaultPackagingOverheadCents?: number | null;
  defaultRecommendedMinMarginPct?: number | null;
  defaultRecommendedTargetMarginPct?: number | null;
  targetMarginPct?: number | null;
  growthMarginPct?: number | null;
  notes?: string | null;
}) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>("/cost-profiles", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateCostProfile(costProfileId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function createMaterialCostRule(
  costProfileId: string,
  input: {
    materialCode: string;
    materialName: string;
    thicknessLabel?: string | null;
    sheetLengthIn: number;
    sheetWidthIn: number;
    sheetCostCents: number;
    usableYieldPct?: number | null;
    wastePct?: number | null;
    active?: boolean;
  }
) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/material-rules`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateMaterialCostRule(materialRuleId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true }>(`/material-rules/${encodeURIComponent(materialRuleId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function createEdgeBandCostRule(
  costProfileId: string,
  input: {
    edgeBandCode: string;
    edgeBandName: string;
    costCentsPerLinearFoot: number;
    wastePct?: number | null;
    setupAllowanceLinearFt?: number | null;
    active?: boolean;
  }
) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/edge-band-rules`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateEdgeBandCostRule(edgeBandRuleId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true }>(`/edge-band-rules/${encodeURIComponent(edgeBandRuleId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function createPackagingCostRule(
  costProfileId: string,
  input: {
    packagingCode: string;
    packagingName: string;
    boxCostCents?: number | null;
    bubbleWrapCostCents?: number | null;
    tapeCostCents?: number | null;
    labelCostCents?: number | null;
    insertFlyerCostCents?: number | null;
    shrinkWrapCostCents?: number | null;
    foamCostCents?: number | null;
    cornerProtectorCostCents?: number | null;
    packingMinutes?: number | null;
    packingLaborOverrideCents?: number | null;
    packagingOverheadCents?: number | null;
    otherPackagingCostCents?: number | null;
    sortOrder?: number | null;
    active?: boolean;
  }
) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/packaging-rules`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updatePackagingCostRule(packagingRuleId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true }>(`/packaging-rules/${encodeURIComponent(packagingRuleId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function createShippingCostRule(
  costProfileId: string,
  input: {
    shippingCode: string;
    shippingName: string;
    baseCostCents: number;
    costPerPoundCents?: number | null;
    costPerCubicInchCents?: number | null;
    dimensionalDivisor?: number | null;
    dimensionalRateCents?: number | null;
    shippingBufferPct?: number | null;
    shippingBufferCents?: number | null;
    marketplaceHandlingCents?: number | null;
    sortOrder?: number | null;
    flatOverride?: number | null;
    active?: boolean;
  }
) {
  return sendJson<{ ok: true; profile: CostProfileDetail }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/shipping-rules`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateShippingCostRule(shippingRuleId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true }>(`/shipping-rules/${encodeURIComponent(shippingRuleId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function createAmazonFeePreset(
  costProfileId: string,
  input: {
    name: string;
    status?: "ACTIVE" | "ARCHIVED";
    referralFeePct: number;
    closingFeeCents?: number | null;
    fulfillmentFeeCents?: number | null;
    storageAllowanceCents?: number | null;
    advertisingAllowancePct?: number | null;
    advertisingAllowanceCents?: number | null;
    returnReservePct?: number | null;
    returnReserveCents?: number | null;
    damageReservePct?: number | null;
    damageReserveCents?: number | null;
    miscMarketplacePct?: number | null;
    miscMarketplaceCents?: number | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; preset: AmazonFeePresetItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/amazon-fee-presets`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getAmazonFeePresets(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; presets: AmazonFeePresetItem[] }>(
    `/amazon-fee-presets${query ? `?${query}` : ""}`
  );
}

export async function getAmazonFeePreset(presetId: string) {
  return readJson<{ ok: true; preset: AmazonFeePresetItem }>(
    `/amazon-fee-presets/${encodeURIComponent(presetId)}`
  );
}

export async function updateAmazonFeePreset(presetId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true; preset: AmazonFeePresetItem }>(
    `/amazon-fee-presets/${encodeURIComponent(presetId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function createShippingZoneRule(
  costProfileId: string,
  input: {
    name: string;
    zoneCode: string;
    status?: "ACTIVE" | "ARCHIVED";
    baseCostCents: number;
    weightAdderCents?: number | null;
    dimensionalAdderCents?: number | null;
    bufferPct?: number | null;
    bufferCents?: number | null;
    marketplaceHandlingCents?: number | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; shippingZoneRule: ShippingZoneRuleItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/shipping-zone-rules`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getShippingZoneRules(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; shippingZoneRules: ShippingZoneRuleItem[] }>(
    `/shipping-zone-rules${query ? `?${query}` : ""}`
  );
}

export async function getShippingZoneRule(zoneRuleId: string) {
  return readJson<{ ok: true; shippingZoneRule: ShippingZoneRuleItem }>(
    `/shipping-zone-rules/${encodeURIComponent(zoneRuleId)}`
  );
}

export async function updateShippingZoneRule(zoneRuleId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true; shippingZoneRule: ShippingZoneRuleItem }>(
    `/shipping-zone-rules/${encodeURIComponent(zoneRuleId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function createLaunchTemplate(
  costProfileId: string,
  input: {
    name: string;
    status?: "ACTIVE" | "ARCHIVED";
    defaultAmazonFeePresetId?: string | null;
    defaultShippingZoneRuleId?: string | null;
    defaultPackagingRuleId?: string | null;
    defaultShippingRuleId?: string | null;
    launchStrategy: "BALANCED" | "AGGRESSIVE" | "SAFER_MARGIN";
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; launchTemplate: LaunchTemplateItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/launch-templates`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function createLaunchGuardrailProfile(
  costProfileId: string,
  input: {
    name: string;
    status?: "ACTIVE" | "ARCHIVED";
    minimumMarginPct: number;
    minimumBufferAboveBreakEvenPct?: number | null;
    maximumFeeBurdenPct?: number | null;
    maximumShippingBurdenPct?: number | null;
    maximumReserveBurdenPct?: number | null;
    maximumAllowedTargetToFloorGapPct?: number | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; launchGuardrailProfile: LaunchGuardrailProfileItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/launch-guardrail-profiles`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getLaunchGuardrailProfiles(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; launchGuardrailProfiles: LaunchGuardrailProfileItem[] }>(
    `/launch-guardrail-profiles${query ? `?${query}` : ""}`
  );
}

export async function getLaunchGuardrailProfile(guardrailProfileId: string) {
  return readJson<{ ok: true; launchGuardrailProfile: LaunchGuardrailProfileItem }>(
    `/launch-guardrail-profiles/${encodeURIComponent(guardrailProfileId)}`
  );
}

export async function updateLaunchGuardrailProfile(
  guardrailProfileId: string,
  input: Record<string, unknown>
) {
  return sendJson<{ ok: true; launchGuardrailProfile: LaunchGuardrailProfileItem }>(
    `/launch-guardrail-profiles/${encodeURIComponent(guardrailProfileId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function createMarketplaceMappingTemplate(
  costProfileId: string,
  input: {
    name: string;
    status?: "ACTIVE" | "ARCHIVED";
    productLabelFormat?: string | null;
    skuFormat?: string | null;
    includeWarningNotes?: boolean;
    includeOverrideNotes?: boolean;
    dimensionsFormat?: string | null;
    materialFormat?: string | null;
    packagingFormat?: string | null;
    pricingFormat?: string | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; marketplaceMappingTemplate: MarketplaceMappingTemplateItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/marketplace-mapping-templates`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getMarketplaceMappingTemplates(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; marketplaceMappingTemplates: MarketplaceMappingTemplateItem[] }>(
    `/marketplace-mapping-templates${query ? `?${query}` : ""}`
  );
}

export async function getMarketplaceMappingTemplate(mappingTemplateId: string) {
  return readJson<{ ok: true; marketplaceMappingTemplate: MarketplaceMappingTemplateItem }>(
    `/marketplace-mapping-templates/${encodeURIComponent(mappingTemplateId)}`
  );
}

export async function updateMarketplaceMappingTemplate(
  mappingTemplateId: string,
  input: Record<string, unknown>
) {
  return sendJson<{ ok: true; marketplaceMappingTemplate: MarketplaceMappingTemplateItem }>(
    `/marketplace-mapping-templates/${encodeURIComponent(mappingTemplateId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function createChannelMappingPreset(
  costProfileId: string,
  input: Record<string, unknown>
) {
  return sendJson<{ ok: true; channelMappingPreset: ChannelMappingPresetItem }>(
    `/cost-profiles/${encodeURIComponent(costProfileId)}/channel-mapping-presets`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getChannelMappingPresets(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; channelMappingPresets: ChannelMappingPresetItem[] }>(
    `/channel-mapping-presets${query ? `?${query}` : ""}`
  );
}

export async function getChannelMappingPreset(channelMappingPresetId: string) {
  return readJson<{ ok: true; channelMappingPreset: ChannelMappingPresetItem }>(
    `/channel-mapping-presets/${encodeURIComponent(channelMappingPresetId)}`
  );
}

export async function updateChannelMappingPreset(
  channelMappingPresetId: string,
  input: Record<string, unknown>
) {
  return sendJson<{ ok: true; channelMappingPreset: ChannelMappingPresetItem }>(
    `/channel-mapping-presets/${encodeURIComponent(channelMappingPresetId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function getLaunchTemplates(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) params.set("costProfileId", input.costProfileId);
  const query = params.toString();
  return readJson<{ ok: true; launchTemplates: LaunchTemplateItem[] }>(
    `/launch-templates${query ? `?${query}` : ""}`
  );
}

export async function getLaunchTemplate(templateId: string) {
  return readJson<{ ok: true; launchTemplate: LaunchTemplateItem }>(
    `/launch-templates/${encodeURIComponent(templateId)}`
  );
}

export async function updateLaunchTemplate(templateId: string, input: Record<string, unknown>) {
  return sendJson<{ ok: true; launchTemplate: LaunchTemplateItem }>(
    `/launch-templates/${encodeURIComponent(templateId)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function calculateShelfCost(input: CostCalculationInput) {
  return sendJson<{
    ok: true;
    calculation: CostCalculationPreview;
    assumptions: Record<string, unknown>;
    result: CostCalculationResult;
  }>("/cost-calculations/calculate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function compareShelfCostScenarios(input: {
  name?: string | null;
  notes?: string | null;
  baseSpec: CostCalculationInput;
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
  scenarios: CostScenarioInput[];
}) {
  return sendJson<{ ok: true; comparison: CostComparisonResult }>("/cost-calculations/compare", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function saveShelfCostCalculation(input: CostCalculationInput) {
  return sendJson<{ ok: true; calculation: ShelfCostCalculationRecord }>("/cost-calculations", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getShelfCostCalculations(input?: { costProfileId?: string }) {
  const params = new URLSearchParams();
  if (input?.costProfileId) {
    params.set("costProfileId", input.costProfileId);
  }
  const query = params.toString();
  return readJson<{ ok: true; calculations: ShelfCostCalculationRecord[] }>(
    `/cost-calculations${query ? `?${query}` : ""}`
  );
}

export async function getShelfCostCalculation(calculationId: string) {
  return readJson<{ ok: true; calculation: ShelfCostCalculationRecord }>(
    `/cost-calculations/${encodeURIComponent(calculationId)}`
  );
}

export async function saveCostComparisonSet(input: {
  name: string;
  notes?: string | null;
  baseSpec: CostCalculationInput;
  guardrailProfileId?: string | null;
  selectedScenarioId?: string | null;
  scenarios: CostScenarioInput[];
}) {
  return sendJson<{ ok: true; comparisonSet: ComparisonSetRecord }>("/cost-comparison-sets", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getCostComparisonSets() {
  return readJson<{ ok: true; comparisonSets: ComparisonSetListItem[] }>("/cost-comparison-sets");
}

export async function getCostComparisonSet(comparisonSetId: string) {
  return readJson<{ ok: true; comparisonSet: ComparisonSetRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}`
  );
}

export async function rankCostComparisonSet(
  comparisonSetId: string,
  input?: { guardrailProfileId?: string | null; selectedScenarioId?: string | null }
) {
  return sendJson<{ ok: true; comparisonSet: ComparisonSetRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/rank`,
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

export async function getCostComparisonRecommendation(comparisonSetId: string) {
  return readJson<{ ok: true; recommendation: Record<string, unknown> | null }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/recommendation`
  );
}

export async function evaluateCostComparisonGuardrails(
  comparisonSetId: string,
  input: { guardrailProfileId: string; selectedScenarioId?: string | null }
) {
  return sendJson<{ ok: true; comparisonSet: ComparisonSetRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/guardrails`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function selectCostLaunchScenario(
  comparisonSetId: string,
  input: { scenarioId: string; guardrailProfileId?: string | null }
) {
  return sendJson<{ ok: true; comparisonSet: ComparisonSetRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/select-launch-scenario`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function getCostComparisonHandoffSummary(comparisonSetId: string) {
  return readJson<{
    ok: true;
    handoffSummary: Record<string, unknown> | null;
    selectedLaunchScenarioId: string | null;
    riskSummary: Record<string, unknown> | null;
    selectedLaunchReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
    selectedLaunchWarningSnapshot: Array<Record<string, unknown>> | null;
    exportSummary: Record<string, unknown> | null;
    listingPrepSummary: Record<string, unknown> | null;
    selectedListingPrepPackageId: string | null;
    selectedListingPrepReadySnapshot: Record<string, unknown> | null;
    selectedListingPrepExportVersion: string | null;
  }>(`/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/handoff-summary`);
}

export async function evaluateCostComparisonListingReadiness(
  comparisonSetId: string,
  input?: { selectedScenarioId?: string | null }
) {
  return sendJson<{ ok: true; comparisonSet: ComparisonSetRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/listing-readiness`,
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

export async function getCostComparisonExportSummary(comparisonSetId: string) {
  return readJson<{
    ok: true;
    exportSummary: Record<string, unknown> | null;
    selectedLaunchScenarioId: string | null;
    selectedLaunchReadinessStatus: "READY" | "NEEDS_REVIEW" | "BLOCKED" | null;
    selectedLaunchWarningSnapshot: Array<Record<string, unknown>> | null;
    listingPrepSummary: Record<string, unknown> | null;
    selectedListingPrepPackageId: string | null;
    selectedListingPrepReadySnapshot: Record<string, unknown> | null;
    selectedListingPrepExportVersion: string | null;
  }>(`/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/export-summary`);
}

export async function buildCostListingPrepPackage(
  comparisonSetId: string,
  input?: {
    selectedScenarioId?: string | null;
    marketplaceMappingTemplateId?: string | null;
    channelMappingPresetId?: string | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/cost-comparison-sets/${encodeURIComponent(comparisonSetId)}/listing-prep-package`,
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

export async function refreshListingPrepPackage(
  listingPrepPackageId: string,
  input?: { notes?: string | null }
) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/refresh`,
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

export async function getListingPrepPackages(input?: {
  status?: "DRAFT" | "READY_FOR_REVIEW" | "READY" | "APPROVED" | "APPROVED_WITH_OVERRIDE" | "BLOCKED" | "ARCHIVED";
}) {
  const params = new URLSearchParams();
  if (input?.status) params.set("status", input.status);
  const query = params.toString();
  return readJson<{ ok: true; listingPrepPackages: ListingPrepPackageRecord[] }>(
    `/listing-prep-packages${query ? `?${query}` : ""}`
  );
}

export async function getListingPrepPackage(listingPrepPackageId: string) {
  return readJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}`
  );
}

export async function validateCostListingMarketplaceFields(
  listingPrepPackageId: string,
  input?: { notes?: string | null }
) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/validate-marketplace-fields`,
    { method: "POST", body: JSON.stringify(input ?? {}) }
  );
}

export async function requestCostPriceFloorOverride(
  listingPrepPackageId: string,
  input: { reason: string; approve?: boolean }
) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/price-floor-override`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function applyChannelMappingPresetToListingPrepPackage(
  listingPrepPackageId: string,
  input: { channelMappingPresetId: string }
) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/apply-channel-preset`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function approveCostListingPrepPackage(listingPrepPackageId: string) {
  return sendJson<{ ok: true; listingPrepPackage: ListingPrepPackageRecord }>(
    `/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/approve`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function getListingPrepManualAmazonExport(listingPrepPackageId: string) {
  return readJson<{
    ok: true;
    manualAmazonExport: Record<string, unknown> | null;
    approvalState: string;
    currentApprovedArtifact: boolean;
  }>(`/listing-prep-packages/${encodeURIComponent(listingPrepPackageId)}/manual-amazon-export`);
}

export interface LeadListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rawStatus: string | null;
  rawStage: string | null;
  stageKey: string;
  stageLabel: string;
  isClosed: boolean;
  project: {
    id: string;
    key: string | null;
    name: string;
    status: string | null;
    stage: string | null;
  } | null;
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDetail extends LeadListItem {
  notes: string | null;
  proposals: Array<{
    id: string;
    title: string | null;
    status: string | null;
    version: number;
    publicToken: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ProposalLineItem {
  id: string;
  name: string;
  description: string | null;
  qty: number;
  unit: string | null;
  priceCents: number;
  sortOrder: number;
}

export interface ProposalSectionItem {
  id: string;
  title: string;
  sortOrder: number;
  lines: ProposalLineItem[];
}

export interface LinkedProposalLead {
  id: string;
  name: string;
  status: string | null;
  stage: string | null;
}

export interface LinkedProposalProject {
  id: string;
  key: string | null;
  name: string;
  status: string | null;
  stage: string | null;
}

export interface ProposalListItem {
  id: string;
  title: string | null;
  publicToken: string | null;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  rawStatus: string | null;
  canonicalStatus: string;
  statusLabel: string;
  isFinal: boolean;
  version: number;
  project: LinkedProposalProject | null;
  lead: LinkedProposalLead | null;
  sectionCount: number;
  lineCount: number;
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalDetail {
  id: string;
  title: string | null;
  publicToken: string | null;
  depositPolicy: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  rawStatus: string | null;
  canonicalStatus: string;
  statusLabel: string;
  isFinal: boolean;
  version: number;
  project: LinkedProposalProject | null;
  lead: LinkedProposalLead | null;
  sections: ProposalSectionItem[];
  unsectionedLines: ProposalLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequestItem {
  id: string;
  orgId: string;
  proposalId: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string | null;
  requestedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  externalReference: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
  paidAmountCents: number;
  outstandingAmountCents: number;
}

export interface PaymentItem {
  id: string;
  orgId: string;
  proposalId: string;
  depositRequestId: string | null;
  status: string;
  method: string;
  amountCents: number;
  currency: string;
  direction: string;
  receivedAt: string | null;
  externalReference: string | null;
  provider: string | null;
  note: string | null;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalPaymentSummary {
  requestedAmountCents: number;
  paidAmountCents: number;
  outstandingAmountCents: number;
  depositRequestedAmountCents: number;
  depositPaidAmountCents: number;
  hasOpenDepositRequest: boolean;
}

export interface ProposalAcceptanceIntakeItem {
  id: string;
  orgId: string;
  proposalId: string;
  status: string;
  source: string;
  tokenExpiresAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  handedOffAt: string | null;
  expiredAt: string | null;
  revokedAt: string | null;
  failedAt: string | null;
  externalIdentityName: string | null;
  externalIdentityEmail: string | null;
  externalIp: string | null;
  externalUserAgent: string | null;
  provider: string | null;
  providerReference: string | null;
  note: string | null;
  payload: unknown;
  verificationSnapshot: unknown;
  metadata: unknown;
  createdByMembershipId: string | null;
  updatedByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalAcceptanceItem {
  id: string;
  orgId: string;
  proposalId: string;
  status: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  canceledAt: string | null;
  acceptedByMembershipId: string | null;
  rejectedByMembershipId: string | null;
  canceledByMembershipId: string | null;
  decisionSource: string;
  note: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalConversionItem {
  id: string;
  orgId: string;
  proposalId: string;
  leadId: string | null;
  acceptanceId: string | null;
  status: string;
  eligibilitySnapshot: unknown;
  blockedReasonCode: string | null;
  blockedReasonMessage: string | null;
  convertedAt: string | null;
  projectId: string | null;
  initiatedByMembershipId: string | null;
  completedByMembershipId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalEligibility {
  eligible: boolean;
  reasons: string[];
  requiredActions: string[];
  snapshot: Record<string, unknown>;
}

export interface ProjectListItem {
  id: string;
  key: string | null;
  name: string;
  address: string | null;
  status: string | null;
  stage: string | null;
  scopeSummary: string | null;
  createdAt: string;
  updatedAt: string;
  phaseCount: number;
  taskCount: number;
  openTaskCount: number;
}

export interface ProjectDetail {
  id: string;
  key: string | null;
  name: string;
  address: string | null;
  status: string | null;
  stage: string | null;
  scopeSummary: string | null;
  createdAt: string;
  updatedAt: string;
  phases: Array<{
    id: string;
    name: string;
    status: string;
    summary: string | null;
    sortOrder: number;
    taskCount: number;
    openTaskCount: number;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      dueDate: string | null;
      isRequired: boolean;
      sortOrder: number;
      assignedToUser: {
        id: string;
        email: string;
        name: string | null;
      } | null;
    }>;
  }>;
  backlogTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    isRequired: boolean;
    sortOrder: number;
    assignedToUser: {
      id: string;
      email: string;
      name: string | null;
    } | null;
  }>;
}

export interface PilotFeedbackItem {
  id: string;
  orgId: string;
  membershipId: string | null;
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status: "NEW" | "REVIEWED" | "RESOLVED";
  pagePath: string | null;
  title: string;
  message: string;
  reproductionNotes: string | null;
  screenshotUrl: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface PilotFeedbackSummary {
  openBlockerCount: number;
  openHighSeverityCount: number;
  openCount: number;
  latestSubmittedAt: string | null;
}

export interface PublicProposalSnapshot {
  organizationName: string | null;
  title: string | null;
  summary: string;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    title: string;
    lines: Array<{
      name: string;
      description: string | null;
      qty: number;
      unit: string | null;
      priceCents: number;
      lineTotalCents: number;
    }>;
  }>;
  totals: {
    lineItemCount: number;
    subtotalCents: number;
    totalCents: number;
  };
  depositSummary: {
    policy: string;
    requestedAmountCents: number;
    paidAmountCents: number;
    outstandingAmountCents: number;
    depositRequestedAmountCents: number;
    depositPaidAmountCents: number;
    hasOpenDepositRequest: boolean;
  };
}

export async function getLeads(query?: string) {
  const search = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return readJson<{ ok: true; leads: LeadListItem[] }>(`/leads${search}`);
}

export async function getLead(leadLookup: string) {
  return readJson<{ ok: true; lead: LeadDetail }>(`/leads/${encodeURIComponent(leadLookup)}`);
}

export async function createLead(input: {
  projectId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  stage?: string | null;
  notes?: string | null;
}) {
  return sendJson<{ ok: true; lead: LeadDetail }>("/leads", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateLead(
  leadId: string,
  input: {
    projectId?: string | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    status?: string | null;
    stage?: string | null;
    notes?: string | null;
  }
) {
  return sendJson<{ ok: true; lead: LeadDetail }>(`/leads/${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getProposals(query?: string) {
  const search = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return readJson<{ ok: true; proposals: ProposalListItem[] }>(`/proposals${search}`);
}

export async function getProposal(proposalLookup: string) {
  return readJson<{ ok: true; proposal: ProposalDetail }>(
    `/proposals/${encodeURIComponent(proposalLookup)}`
  );
}

export async function createProposal(input: {
  projectId?: string | null;
  leadId?: string | null;
  title?: string | null;
  status?: string | null;
  depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
  version?: number;
  publicToken?: string | null;
}) {
  return sendJson<{ ok: true; proposal: ProposalDetail }>("/proposals", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateProposal(
  proposalId: string,
  input: {
    projectId?: string | null;
    leadId?: string | null;
    title?: string | null;
    status?: string | null;
    depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
    version?: number;
    publicToken?: string | null;
  }
) {
  return sendJson<{ ok: true; proposal: ProposalDetail }>(
    `/proposals/${encodeURIComponent(proposalId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function createProposalSection(
  proposalId: string,
  input: { title: string; sortOrder?: number }
) {
  return sendJson<{
    ok: true;
    section: { id: string; title: string; sortOrder: number };
  }>(`/proposals/${encodeURIComponent(proposalId)}/sections`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateProposalSection(
  proposalId: string,
  sectionId: string,
  input: { title?: string; sortOrder?: number }
) {
  return sendJson<{
    ok: true;
    section: { id: string; title: string; sortOrder: number };
  }>(`/proposals/${encodeURIComponent(proposalId)}/sections/${encodeURIComponent(sectionId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function createProposalLine(
  proposalId: string,
  input: {
    sectionId?: string | null;
    name: string;
    description?: string | null;
    qty?: number;
    unit?: string | null;
    priceCents?: number;
    sortOrder?: number;
  }
) {
  return sendJson<{ ok: true; line: ProposalLineItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/lines`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateProposalLine(
  proposalId: string,
  lineId: string,
  input: {
    sectionId?: string | null;
    name?: string;
    description?: string | null;
    qty?: number;
    unit?: string | null;
    priceCents?: number;
    sortOrder?: number;
  }
) {
  return sendJson<{ ok: true; line: ProposalLineItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function createDepositRequest(
  proposalId: string,
  input: {
    kind?: string;
    status?: string;
    amountCents: number;
    currency?: string;
    description?: string | null;
    requestedAt?: string | null;
    dueAt?: string | null;
    externalReference?: string | null;
    metadata?: unknown;
  }
) {
  return sendJson<{ ok: true; depositRequest: DepositRequestItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/deposit-requests`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function listDepositRequests(proposalId: string) {
  return readJson<{ ok: true; depositRequests: DepositRequestItem[] }>(
    `/proposals/${encodeURIComponent(proposalId)}/deposit-requests`
  );
}

export async function recordPayment(
  proposalId: string,
  input: {
    depositRequestId?: string | null;
    status?: string;
    method?: string;
    amountCents: number;
    currency?: string;
    direction?: string;
    receivedAt?: string | null;
    externalReference?: string | null;
    provider?: string | null;
    note?: string | null;
    metadata?: unknown;
  }
) {
  return sendJson<{ ok: true; payment: PaymentItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/payments`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function listPayments(proposalId: string) {
  return readJson<{ ok: true; payments: PaymentItem[] }>(
    `/proposals/${encodeURIComponent(proposalId)}/payments`
  );
}

export async function getProposalPaymentSummary(proposalId: string) {
  return readJson<{ ok: true; summary: ProposalPaymentSummary }>(
    `/proposals/${encodeURIComponent(proposalId)}/payment-summary`
  );
}

export async function createAcceptanceIntake(
  proposalId: string,
  input: {
    source?: "PUBLIC_TOKEN" | "PROVIDER_CALLBACK" | "EXTERNAL_MANUAL_ENTRY";
    tokenTtlHours?: number;
    provider?: string;
    providerReference?: string;
    note?: string | null;
    metadata?: unknown;
    confirmed?: boolean;
    signerName?: string;
    signerEmail?: string | null;
  }
) {
  return sendJson<{
    ok: true;
    intake: ProposalAcceptanceIntakeItem;
    publicToken?: string;
    publicTokenExpiresAt?: string | null;
  }>(`/proposals/${encodeURIComponent(proposalId)}/acceptance-intakes`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function listAcceptanceIntakes(proposalId: string) {
  return readJson<{ ok: true; intakes: ProposalAcceptanceIntakeItem[] }>(
    `/proposals/${encodeURIComponent(proposalId)}/acceptance-intakes`
  );
}

export async function getProposalAcceptance(proposalId: string) {
  return readJson<{ ok: true; acceptance: ProposalAcceptanceItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/acceptance`
  );
}

export async function createProposalAcceptance(
  proposalId: string,
  input: {
    decisionSource?: string;
    note?: string | null;
    depositPolicy?: "NO_DEPOSIT_REQUIRED" | "DEPOSIT_REQUIRED_BEFORE_CONVERSION";
    metadata?: unknown;
  }
) {
  return sendJson<{ ok: true; acceptance: ProposalAcceptanceItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/acceptance`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateProposalAcceptance(
  proposalId: string,
  input: {
    action: "accept" | "reject" | "cancel";
    decisionSource?: string;
    note?: string | null;
    metadata?: unknown;
  }
) {
  return sendJson<{ ok: true; acceptance: ProposalAcceptanceItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/acceptance`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function evaluateConversion(proposalId: string) {
  return sendJson<{
    ok: true;
    eligibility: ProposalEligibility;
    conversion: ProposalConversionItem;
  }>(`/proposals/${encodeURIComponent(proposalId)}/conversion-evaluation`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getConversion(proposalId: string) {
  return readJson<{ ok: true; conversion: ProposalConversionItem }>(
    `/proposals/${encodeURIComponent(proposalId)}/conversion`
  );
}

export async function convertProposal(proposalId: string) {
  return sendJson<{
    ok: true;
    eligibility: ProposalEligibility;
    conversion: ProposalConversionItem;
    project: {
      id: string;
      name: string;
    };
  }>(`/proposals/${encodeURIComponent(proposalId)}/convert`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getProjects(query?: string) {
  const search = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return readJson<{ ok: true; projects: ProjectListItem[] }>(`/projects${search}`);
}

export async function getProject(projectLookup: string) {
  return readJson<{ ok: true; project: ProjectDetail }>(
    `/projects/${encodeURIComponent(projectLookup)}`
  );
}

export async function getPublicProposalReview(token: string) {
  return sendJson<{
    ok: true;
    review: {
      reviewAllowed: boolean;
      intakeStatus: string;
      blockedReasons: string[];
      nextActions: string[];
      proposal: PublicProposalSnapshot | null;
    };
  }>("/public/proposal-acceptance/review", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getPublicProposalReviewContext(token: string) {
  return sendJson<{
    ok: true;
    review: {
      reviewAllowed: boolean;
      intakeStatus: string;
      blockedReasons: string[];
      nextActions: string[];
      proposal: PublicProposalSnapshot | null;
    };
  }>("/public/proposal-acceptance/review-context", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function submitPublicProposalAcceptance(input: {
  token: string;
  confirmed: boolean;
  signerName: string;
  signerEmail?: string | null;
  note?: string | null;
  metadata?: unknown;
}) {
  return sendJson<{
    ok: true;
    intake: ProposalAcceptanceIntakeItem;
    verification: {
      verified: boolean;
      reasons: string[];
      normalizedDecisionSource: string;
      evidenceSummary: Array<{ kind: string; value?: string | null }>;
      handoffAllowed: boolean;
    };
    handoff: {
      status: string;
      skipped: boolean;
      acceptance?: ProposalAcceptanceItem;
    };
  }>("/public/proposal-acceptance/submit", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getPublicAcceptancePresentationState(token: string) {
  return sendJson<{
    ok: true;
    presentation: {
      state: string;
      reviewAllowed: boolean;
      blockedReasons: string[];
      nextActions: string[];
      reviewCompleted: boolean;
      submissionCompleted: boolean;
      confirmationCompleted: boolean;
    };
  }>("/public/proposal-acceptance/presentation-state", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getPublicAcceptanceInstructions(token: string) {
  return sendJson<{
    ok: true;
    instructions: {
      state: string;
      reviewAllowed: boolean;
      blockedReasons: string[];
      nextActions: string[];
      instructions: Array<{ key: string; label: string; detail: string }>;
    };
  }>("/public/proposal-acceptance/instructions", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getPublicAcceptanceReadyState(token: string) {
  return sendJson<{
    ok: true;
    ready: {
      state: string;
      reviewAllowed: boolean;
      blockedReasons: string[];
      nextActions: string[];
      reviewCompleted: boolean;
      submissionCompleted: boolean;
      confirmationCompleted: boolean;
    };
  }>("/public/proposal-acceptance/ready-state", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getPublicAcceptanceConfirmation(token: string) {
  return sendJson<{
    ok: true;
    confirmation: {
      state: string;
      submissionCompleted: boolean;
      confirmationSummary: {
        headline: string;
        detail: string;
        submittedAt: string | null;
        confirmedAt: string | null;
      } | null;
      nextActions: string[];
      blockedReasons: string[];
    };
  }>("/public/proposal-acceptance/confirmation", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function trackPublicAcceptancePresentationViewed(token: string) {
  return sendJson<{ ok: true }>("/public/proposal-acceptance/presentation-viewed", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function getPilotFeedback(filters?: {
  area?: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  status?: "NEW" | "REVIEWED" | "RESOLVED";
}) {
  const params = new URLSearchParams();
  if (filters?.area) params.set("area", filters.area);
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();

  return readJson<{ ok: true; feedback: PilotFeedbackItem[]; summary: PilotFeedbackSummary }>(
    `/pilot-feedback${query ? `?${query}` : ""}`
  );
}

export async function createPilotFeedback(input: {
  area: "LEADS" | "PROPOSALS" | "PUBLIC_ACCEPTANCE" | "PROJECTS" | "GENERAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER";
  pagePath?: string | null;
  title: string;
  message: string;
  reproductionNotes?: string | null;
  screenshotUrl?: string | null;
  metadata?: unknown;
}) {
  return sendJson<{ ok: true; feedback: PilotFeedbackItem }>("/pilot-feedback", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePilotFeedback(
  feedbackId: string,
  input: {
    status: "NEW" | "REVIEWED" | "RESOLVED";
  }
) {
  return sendJson<{ ok: true; feedback: PilotFeedbackItem }>(
    `/pilot-feedback/${encodeURIComponent(feedbackId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}
