const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";

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

async function readJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${input}`, {
      ...init,
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
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
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
  return sendJson<{ result: ShelfValidationResult }>("/configurator/validate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function normalizeConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<{ result: ShelfNormalizedSpec }>("/configurator/normalize", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function quoteConfigurator(input: ShelfConfiguratorInput) {
  return sendJson<{ result: ShelfQuoteResult }>("/configurator/quote", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
