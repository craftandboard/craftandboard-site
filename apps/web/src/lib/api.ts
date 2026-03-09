const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";
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
    throw new Error(message);
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
