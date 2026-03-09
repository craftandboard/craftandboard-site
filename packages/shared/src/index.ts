export type MaterialCode =
  | "WHITE_MELAMINE"
  | "MAPLE_MELAMINE"
  | "BIRCH_18"
  | "WALNUT_18"
  | "MAPLE_18"
  | "MDF_18";

export type EdgeBandPattern = "ALL_FOUR";
export type SalesChannel = "AMAZON" | "WEBSITE" | "MANUAL";
export type ProductionBundleStatus =
  | "draft"
  | "ready_for_nesting"
  | "nested"
  | "ready_for_cnc"
  | "cnc_generated"
  | "approved_for_production"
  | "in_production"
  | "cut_complete"
  | "qc_hold"
  | "packed"
  | "shipped"
  | "error";
export type SheetStatus =
  | "planned"
  | "posted"
  | "cutting"
  | "cut_complete"
  | "qc_hold"
  | "scrapped";
export type CncJobStatus =
  | "generated"
  | "approved"
  | "posted"
  | "ran"
  | "failed"
  | "superseded";
export type ArtifactType =
  | "SHEET_MAP_SVG"
  | "SHEET_MAP_HTML"
  | "CNC_FILE"
  | "BUNDLE_PACKET_HTML";
export type OrderStatus =
  | "draft"
  | "imported"
  | "ready_for_batch"
  | "received"
  | "in_production"
  | "ready_for_shipment"
  | "shipped"
  | "complete"
  | "hold"
  | "error";
export type PartStatus =
  | "pending"
  | "ready_for_batch"
  | "batched"
  | "cut"
  | "edgebanded"
  | "packed"
  | "hold"
  | "error";

export type ArtifactJobType =
  | "generate-cnc-csv"
  | "generate-cnc-mosaic"
  | "generate-cnc-json"
  | "deliver-cnc-watch-folder"
  | "generate-label-csv"
  | "generate-label-pdf"
  | "generate-traveler-pdf"
  | "generate-packing-slip";

export type ArtifactJobStatus = "queued" | "active" | "completed" | "failed" | "unknown";

export type ContainerType = "CONTAINER" | "BIN";
export type ContainerStatus = "OPEN" | "SORTING" | "COMPLETE" | "HOLD" | "CLOSED";
export type RemnantStatus = "AVAILABLE" | "RESERVED" | "PARTIAL" | "CONSUMED" | "HOLD" | "SCRAPPED";
export type RemnantSourceType = "FULL_SHEET_LEFTOVER" | "MANUAL" | "IMPORTED";
export type DerivedEdgeBandPattern =
  | "NONE"
  | "ONE_LONG_EDGE"
  | "TWO_LONG_EDGES"
  | "TWO_SHORT_EDGES"
  | "ALL_FOUR";

export interface RawFixtureLineItem {
  externalOrderItemId: string;
  sku: string;
  title: string;
  material?: string;
  quantity: number;
  widthWhole?: number | string | null;
  widthFraction?: number | string | null;
  widthIn?: number | string | null;
  depthWhole?: number | string | null;
  depthFraction?: number | string | null;
  depthIn?: number | string | null;
  edgeBandPattern?: string | null;
  notes?: string | null;
}

export interface RawFixtureOrder {
  externalOrderId: string;
  amazonOrderId: string;
  orderDate: string;
  shipByDate: string;
  customerName: string;
  lineItems: RawFixtureLineItem[];
}

export interface AmazonSellerCentralCustomization {
  lengthInches?: string | number | null;
  lengthFraction?: string | number | null;
  lengthAdjustment?: string | number | null;
  depthInches?: string | number | null;
  depthFraction?: string | number | null;
  depthAdjustment?: string | number | null;
  edgebanding?: string | null;
  contactInfo?: string | null;
  notes?: string | null;
}

export interface AmazonSellerCentralFixture {
  amazonOrderId: string;
  amazonOrderItemId: string;
  asin?: string | null;
  quantity: number;
  buyerName: string;
  shipToName?: string | null;
  purchaseDate?: string | null;
  shipByDate: string;
  productTitle: string;
  sku: string;
  material?: MaterialCode | string | null;
  customizations: AmazonSellerCentralCustomization;
}

export interface NormalizedOrderItemInput {
  externalOrderItemId: string;
  amazonOrderItemId?: string;
  asin?: string;
  sku: string;
  title: string;
  productLabel: string;
  normalizedLegacyXmlName?: string;
  materialCode: MaterialCode;
  materialLabel: string;
  quantity: number;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
  edgeBandLabel: string;
  sourceLengthIn?: number;
  sourceDepthIn?: number;
  sourceEdgeBandText?: string;
  sourceCustomizationJson?: unknown;
  notes?: string;
}

export interface NormalizedOrderInput {
  externalOrderId: string;
  amazonOrderId?: string;
  amazonOrderSource?: string;
  orderDate: string;
  purchaseDate?: string;
  shipByDate: string;
  customerName: string;
  customerFullName?: string;
  shipToName?: string;
  customerLastName: string;
  status: OrderStatus;
  channel?: SalesChannel;
  rawPayload: unknown;
  lineItems: NormalizedOrderItemInput[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  externalOrderItemId?: string;
  amazonOrderItemId?: string;
  asin?: string;
  sku: string;
  title: string;
  productLabel: string;
  normalizedLegacyXmlName?: string;
  quantity: number;
  materialCode?: MaterialCode;
  edgeBandPattern?: EdgeBandPattern;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  sourceLengthIn?: number;
  sourceDepthIn?: number;
  sourceEdgeBandText?: string;
  sourceCustomizationJson?: unknown;
  notes?: string;
}

export interface PartInstance {
  id: string;
  orderId?: string;
  orderItemId?: string;
  partCode: string;
  qrPayload: string;
  serialNumber?: number;
  instanceNumber: number;
  materialCode?: MaterialCode;
  edgeBandPattern?: EdgeBandPattern;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  shipByDate?: string;
  customerLastName?: string;
  status: PartStatus;
}

export interface Order {
  id: string;
  organizationId: string;
  externalRef?: string;
  externalOrderId?: string;
  amazonOrderId?: string;
  amazonOrderSource?: string;
  orderDate?: string;
  purchaseDate?: string;
  shipByDate?: string;
  status: OrderStatus;
  channel?: SalesChannel;
  customerName: string;
  customerFullName?: string;
  shipToName?: string;
  customerLastName?: string;
  materialSummary?: MaterialCode[];
  quantityTotal?: number;
  rawPayload?: unknown;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Batch {
  id: string;
  organizationId: string;
  code?: string;
  name: string;
  status:
    | "draft"
    | "planned"
    | "released"
    | "cutting"
    | "cut_complete"
    | "ready_for_next_stage"
    | "completed";
  materialCode?: MaterialCode;
  source?: "CONFIGURATOR" | "AMAZON";
  partCount?: number;
  jobCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedBatchPart {
  id: string;
  partType: "SHELF";
  labelCode: string;
}

export interface CreatedBatchSummary {
  id: string;
  batchCode: string;
  status: "DRAFT";
  material: MaterialCode;
  partCount: number;
  jobCount: number;
}

export interface ContainerSummary {
  id: string;
  batchId: string;
  code: string;
  label: string;
  type: ContainerType;
  status: ContainerStatus;
  notes?: string;
  orderId?: string;
  manufacturingJobId?: string;
  partCount: number;
  completionPct: number;
  mixed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerPartRow {
  partId: string;
  jobId?: string;
  orderId?: string;
  labelCode: string;
  scanCode: string;
  material: MaterialCode;
  width: number;
  depth: number;
  thickness: number;
  status: PartStatus;
  source: "CONFIGURATOR" | "AMAZON";
}

export interface BatchSortingSummary {
  batchId: string;
  batchCode: string;
  totalParts: number;
  assignedParts: number;
  unassignedParts: number;
  openContainers: number;
  completionPct: number;
}

export interface MaterialForecastRemnantCandidatePreview {
  id: string;
  code: string;
  label: string;
  locationLabel?: string;
  status: RemnantStatus;
  lengthIn: number;
  widthIn: number;
  availableAreaSqIn: number;
}

export interface MaterialForecastPartRow {
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
  status: PartStatus;
  edgeBandPattern: EdgeBandPattern;
  source: "CONFIGURATOR" | "AMAZON";
}

export interface MaterialForecastJobRow {
  jobId: string;
  orderId?: string;
  orderItemId?: string;
  source: "CONFIGURATOR" | "AMAZON";
  channel: SalesChannel;
  shipByDate?: string;
  customerName: string;
  partCount: number;
  totalAreaSqIn: number;
  parts: MaterialForecastPartRow[];
}

export interface MaterialForecastMaterialGroup {
  materialKey: string;
  materialCode: MaterialCode;
  materialDisplayName: string;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
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
  candidateRemnantsPreview: MaterialForecastRemnantCandidatePreview[];
  jobs: MaterialForecastJobRow[];
}

export interface MaterialForecastSummary {
  totalPendingMaterials: number;
  totalPendingParts: number;
  estimatedTotalSheets: number;
  materialsWithRemnantCandidates: number;
}

export interface MaterialForecastResponse {
  ok: true;
  summary: MaterialForecastSummary;
  materials: MaterialForecastMaterialGroup[];
}

export interface CreateForecastBatchRequest {
  materialCode?: MaterialCode;
  jobIds?: string[];
  partIds?: string[];
  batchName?: string;
}

export interface CreateForecastBatchResponse {
  ok: true;
  action: "create-forecast-batch";
  batch: CreatedBatchSummary;
  parts: CreatedBatchPart[];
}

export interface RemnantSummary {
  id: string;
  code: string;
  materialKey: string;
  materialCode: MaterialCode;
  materialLabel: string;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
  lengthIn: number;
  widthIn: number;
  areaSqIn: number;
  usableAreaSqIn: number;
  sourceBatchId?: string;
  sourceType: RemnantSourceType;
  status: RemnantStatus;
  locationLabel?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemnantUsageRow {
  id: string;
  actionType:
    | "CREATED"
    | "RESERVED"
    | "CONSUMED"
    | "PARTIAL_CONSUME"
    | "RELEASED"
    | "SCRAPPED"
    | "HOLD"
    | "UPDATED";
  usedAreaSqIn?: number;
  previousLengthIn?: number;
  previousWidthIn?: number;
  newLengthIn?: number;
  newWidthIn?: number;
  batchId?: string;
  partId?: string;
  notes?: string;
  createdAt: string;
}

export interface RemnantDetail extends RemnantSummary {
  history: RemnantUsageRow[];
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
      materialCode: MaterialCode;
      materialLabel: string;
      remnantCount: number;
      totalAreaSqIn: number;
    }>;
  };
  remnants: RemnantSummary[];
}

export interface CreateRemnantRequest {
  materialCode: MaterialCode;
  materialLabel?: string;
  thicknessIn: number;
  edgeBandPattern?: EdgeBandPattern;
  lengthIn: number;
  widthIn: number;
  usableAreaSqIn?: number;
  sourceBatchId?: string;
  sourceType?: RemnantSourceType;
  locationLabel?: string;
  notes?: string;
}

export interface UpdateRemnantRequest {
  status?: RemnantStatus;
  lengthIn?: number;
  widthIn?: number;
  usableAreaSqIn?: number;
  locationLabel?: string;
  notes?: string;
}

export interface ConsumeRemnantRequest {
  usedAreaSqIn: number;
  batchId?: string;
  partId?: string;
  notes?: string;
}

export interface UpsertRemnantResponse {
  ok: true;
  remnant: RemnantDetail;
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

export interface EdgeBandPartEstimate {
  partId: string;
  orderId?: string;
  jobId?: string;
  labelCode: string;
  materialCode?: MaterialCode;
  derivedPattern: DerivedEdgeBandPattern;
  rawLinearFt: number;
  adjustedLinearFt: number;
  source: "CONFIGURATOR" | "AMAZON";
  sourceEdgeBandText?: string;
}

export interface EdgeBandMaterialDemandBucket {
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
  parts: EdgeBandPartEstimate[];
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
  materials: EdgeBandMaterialDemandBucket[];
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
    materialCode: MaterialCode | null;
  };
}

export interface OrderEdgeBandEstimateResponse extends EdgeBandEstimateSummary {
  ok: true;
  scope: "order";
  order: {
    id: string;
    customerName: string;
  };
}

export interface Sheet {
  id: string;
  batchId?: string;
  productionBundleId?: string;
  productionBundleCode?: string;
  materialCode: MaterialCode;
  sheetNumber: number;
  version?: number;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  usableXIn: number;
  usableYIn: number;
  usableWidthIn: number;
  usableHeightIn: number;
  utilizationPct: number;
  status: SheetStatus;
  isCurrent?: boolean;
  approvedAt?: string;
  postedAt?: string;
  completedAt?: string;
  scrapReason?: string;
}

export interface Station {
  id: string;
  organizationId: string;
  name: string;
  type: "scan" | "assembly" | "pack" | "ship";
  createdAt: string;
  updatedAt: string;
}

export interface LabelData {
  code: string;
  orderId?: string;
  batchId?: string;
  partId?: string;
}

export interface LabelRow {
  shipByDate: string;
  productLabel: string;
  quantityDisplay: string;
  customerLastName: string;
  orderCode: string;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  materialLabel: string;
  edgeBandLabel: string;
  jobNumber: string;
  partCode: string;
  qrPayload: string;
}

export interface OptimizerRow {
  shipByDate: string;
  partCode: string;
  materialCode: MaterialCode;
  customerLastName: string;
  widthMm: number;
  depthMm: number;
  edgeBandPattern: EdgeBandPattern;
}

export interface ProductionReportRow {
  orderCode: string;
  customerLastName: string;
  productLabel: string;
  materialCode: MaterialCode;
  widthIn: number;
  depthIn: number;
  quantity: number;
  partCodes: string[];
}

export interface ProductionReport {
  shipByDate: string;
  materialFilter?: MaterialCode;
  totalPhysicalParts: number;
  ordersIncluded: number;
  lineItemsIncluded: number;
  partsExpanded: number;
  countsByMaterial: Array<{
    materialCode: MaterialCode;
    materialLabel: string;
    partCount: number;
  }>;
  rows: ProductionReportRow[];
}

export interface LegacyXmlExportResult {
  shipByDate: string;
  partCount: number;
  xml: string;
  warning: string;
}

export interface ProductionBundleSummary {
  id?: string;
  bundleCode: string;
  shipByDate: string;
  materialCode: MaterialCode;
  productLabel: string;
  totalLineItems: number;
  totalPhysicalParts: number;
  status?: ProductionBundleStatus;
  releasedAt?: string;
  nestingApprovedAt?: string;
  cncApprovedAt?: string;
  currentNestVersion?: number;
  currentCncVersion?: number;
  notes?: string;
}

export interface PickListRow {
  shipByDate: string;
  productLabel: string;
  quantity: number;
  customerLastName: string;
  orderId: string;
  boxCode: string | null;
  totalShelfLengthIn: number;
  totalShelfDepthIn: number;
  materialCode: MaterialCode;
  orderItemId: string;
}

export interface ProductionPickList {
  bundleCode: string;
  shipByDate: string;
  materialCode: MaterialCode;
  productLabel: string;
  totalLineItems: number;
  totalQuantity: number;
  rows: PickListRow[];
}

export interface LabelExportRow {
  shipByDate: string;
  productLabel: string;
  quantityDisplay: string;
  customerLastName: string;
  orderId: string;
  boxCode: string | null;
  totalShelfLengthIn: number;
  totalShelfDepthIn: number;
  thicknessIn: number;
  materialCode: MaterialCode;
  jobNumber: number;
  partCode: string;
  qrPayload: string;
}

export interface OptimizerExportRow {
  rowType: "1";
  depthMm: number;
  widthMm: number;
  customerLastName: string;
  sequenceNumber: number;
  field6: "None";
  field7: "None";
  field8: "None";
  field9: "None";
  partCode: string;
  materialCode: MaterialCode;
}

export interface LegacyXmlProductRow {
  quantity: number;
  name: string;
  library: string;
  description: string;
  depthIn: number;
  heightIn: number;
  widthIn: number;
}

export interface LegacyXmlBundleExport {
  bundleCode: string;
  shipByDate: string;
  materialCode: MaterialCode;
  products: LegacyXmlProductRow[];
  xml: string;
  warning: string;
}

export interface ShelfLabelData {
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
}

export interface ShelfLabelBatch {
  bundleCode: string;
  labelCount: number;
  labels: ShelfLabelData[];
}

export interface ShelfLabelRenderOptions {
  showDebug?: boolean;
  includePrintControls?: boolean;
  includeCutGuides?: boolean;
}

export interface NestingPartInput {
  id: string;
  partCode: string;
  orderId?: string;
  orderItemId?: string;
  customerLastName?: string;
  materialCode: MaterialCode;
  shipByDate?: string;
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  sequenceHint?: number;
}

export interface SheetPlacementView {
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
}

export interface SheetSummary {
  id?: string;
  productionBundleCode: string;
  materialCode: MaterialCode;
  sheetNumber: number;
  version?: number;
  widthIn: number;
  heightIn: number;
  usableXIn: number;
  usableYIn: number;
  usableWidthIn: number;
  usableHeightIn: number;
  utilizationPct: number;
  status?: SheetStatus;
  isCurrent?: boolean;
  approvedAt?: string;
  postedAt?: string;
  completedAt?: string;
  scrapReason?: string;
  totalParts: number;
  placements: SheetPlacementView[];
}

export interface NestingResult {
  bundleCode: string;
  materialCode: MaterialCode;
  sheetCount: number;
  totalParts: number;
  totalPartAreaSqIn: number;
  onionSkinPartCount: number;
  utilizationPct: number;
  sheets: SheetSummary[];
  warnings: string[];
}

export interface CncJobSummary {
  id?: string;
  version?: number;
  isCurrent?: boolean;
  code: string;
  bundleCode: string;
  materialCode: MaterialCode;
  sheetId?: string;
  sheetNumber: number;
  controllerType: string;
  fileExtension: string;
  status: CncJobStatus;
  toolDiameterIn: number;
  spindleRpm: number;
  feedRateIpm: number;
  plungeRateIpm: number;
  lineCount: number;
  fileName: string;
  approvedAt?: string;
  approvedBy?: string;
  postedAt?: string;
  ranAt?: string;
  supersededAt?: string;
  failureReason?: string;
}

export interface ManufacturingBundleSummary {
  id?: string;
  bundleCode: string;
  shipByDate: string;
  materialCode: MaterialCode;
  productLabel: string;
  totalPhysicalParts: number;
  nestingBuilt: boolean;
  cncGenerated: boolean;
  totalSheets: number;
  utilizationPct?: number;
  onionSkinPartCount: number;
  status?: ProductionBundleStatus;
  currentNestVersion?: number;
  currentCncVersion?: number;
}

export interface SheetMapArtifact {
  sheetId?: string;
  bundleCode: string;
  sheetNumber: number;
  svg: string;
  html: string;
  manifest: {
    bundleCode: string;
    materialCode: MaterialCode;
    sheetNumber: number;
    utilizationPct: number;
    placements: SheetPlacementView[];
  };
}

export interface ShelfConfiguratorInput {
  widthIn: number;
  depthIn: number;
  thicknessIn?: number;
  materialCode: MaterialCode;
  edgeBandPattern?: EdgeBandPattern;
  quantity: number;
  channel: SalesChannel;
}

export interface ShelfValidationResult {
  valid: boolean;
  normalizedWidthIn: number;
  normalizedDepthIn: number;
  materialCode: MaterialCode;
  errors: string[];
  warnings: string[];
}

export interface ShelfNormalizedSpec {
  widthIn: number;
  depthIn: number;
  thicknessIn: number;
  materialCode: MaterialCode;
  edgeBandPattern: EdgeBandPattern;
  quantity: number;
  channel: SalesChannel;
  productLabel: string;
}

export interface ShelfQuoteRequest extends ShelfConfiguratorInput {}

export interface ShelfQuoteResult {
  spec: ShelfNormalizedSpec;
  unitPrice: number;
  totalPrice: number;
  estimatedLeadTimeDays: number;
  pricingVersion: string;
}

export interface ShelfManufacturingPart {
  partType: "SHELF";
  width: number;
  depth: number;
  thickness: number;
  material: MaterialCode;
  edgeBandPattern: EdgeBandPattern;
  quantity: number;
  unit: "IN";
  manufacturingMode: "CUT_AND_EDGE";
  labelCode: string;
  grainDirection: "WIDTH";
  cutMethod: "RECTANGLE_CUT";
  source: "CONFIGURATOR" | "AMAZON";
}

export interface PersistedShelfManufacturingJob {
  id: string;
  status: "DRAFT";
  source: "CONFIGURATOR" | "AMAZON";
}

export interface PersistedShelfManufacturingPart extends ShelfManufacturingPart {
  id: string;
  scanCode?: string;
}

export interface BundleLifecycleView {
  bundleCode: string;
  status: ProductionBundleStatus;
  currentNestVersion?: number;
  currentCncVersion?: number;
  releasedAt?: string;
  nestingApprovedAt?: string;
  cncApprovedAt?: string;
  nextAllowedActions: string[];
}

export interface BundleActionResult {
  bundleCode: string;
  status: ProductionBundleStatus;
  message: string;
  version?: number;
}

export interface NestVersionSummary {
  version: number;
  isCurrent: boolean;
  sheetCount: number;
  utilizationPct: number;
  createdAt?: string;
  approvedAt?: string;
}

export interface CncVersionSummary {
  version: number;
  isCurrent: boolean;
  jobCount: number;
  createdAt?: string;
  approvedAt?: string;
  postedAt?: string;
  ranAt?: string;
  failureReason?: string;
}

export interface ArtifactVersionSummary {
  id?: string;
  artifactType: ArtifactType;
  version: number;
  isCurrent: boolean;
  uri: string;
  mimeType?: string;
  supersededAt?: string;
}

export interface CustomerOrderStatusView {
  orderId: string;
  customerStatus:
    | "order_received"
    | "in_production"
    | "preparing_shipment"
    | "shipped"
    | "issue_detected";
  detail: string;
}

export interface ApiHealthResponse {
  status: "ok" | "error";
  service: "api";
  timestamp: string;
  scope: string;
}

export type MachineType = "CNC" | "EDGEBANDER" | "LABEL_PRINTER" | "SCANNER_STATION" | "OTHER";
export type MachineStatus = "ACTIVE" | "INACTIVE" | "HOLD" | "MAINTENANCE";
export type MachineEventSourceType = "MANUAL_SIMULATION" | "API" | "FILE_IMPORT" | "PLC_BRIDGE" | "WEBHOOK" | "OTHER";
export type MachineEventProcessingStatus = "RECEIVED" | "PARSED" | "LINKED" | "UNMATCHED" | "ERROR";
export type MachineEventType =
  | "RUN_STARTED"
  | "RUN_COMPLETED"
  | "SHEET_STARTED"
  | "SHEET_COMPLETED"
  | "PART_SCANNED"
  | "EDGEBAND_RUN_STARTED"
  | "EDGEBAND_RUN_COMPLETED"
  | "MACHINE_HEARTBEAT"
  | "FAULT"
  | "STOPPED";

export interface MachineSummary {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  locationLabel?: string;
  adapterType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedMachineEventBatchRef {
  id: string;
  code: string;
}

export interface LinkedMachineEventJobRef {
  id: string;
  labelCode: string;
}

export interface LinkedMachineEventPartRef {
  id: string;
  scanCode: string;
  partCode: string;
}

export interface MachineEventRecord {
  id: string;
  machineId: string;
  machine?: Pick<MachineSummary, "id" | "code" | "name" | "type">;
  eventType: MachineEventType | string;
  eventTs: string;
  sourceType: MachineEventSourceType;
  sourceEventId?: string;
  payloadJson: unknown;
  normalizedBatchRef?: string;
  normalizedJobRef?: string;
  normalizedPartRef?: string;
  sheetRef?: string;
  severity?: string;
  processingStatus: MachineEventProcessingStatus;
  linkedBatch?: LinkedMachineEventBatchRef;
  linkedManufacturingJob?: LinkedMachineEventJobRef;
  linkedPart?: LinkedMachineEventPartRef;
  notes?: string;
  createdAt: string;
}

export type StageCandidateTargetType = "PART" | "BATCH" | "MANUFACTURING_JOB";
export type StageCandidateStatus = "OPEN" | "APPLIED" | "REJECTED" | "SUPERSEDED";
export type StageCandidateAction =
  | "MARK_PART_CUT"
  | "MARK_PART_EDGEBANDED"
  | "MARK_BATCH_CUT_IN_PROGRESS"
  | "MARK_BATCH_CUT_COMPLETE"
  | "MARK_JOB_EDGE_IN_PROGRESS"
  | "MARK_JOB_EDGE_COMPLETE";
export type StageCandidateConfidence = "HIGH" | "MEDIUM";
export type StageCandidateAppliedMode = "MANUAL" | "AUTO";

export interface TrustedAutoApplyRuleRecord {
  id: string;
  organizationId: string;
  machineId?: string;
  machineType?: MachineType;
  candidateAction: StageCandidateAction;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  machine?: Pick<MachineSummary, "id" | "code" | "name" | "type" | "status">;
}

export interface StageCandidateSignalRecord {
  id: string;
  targetType: StageCandidateTargetType;
  candidateStage: string;
  currentStage?: string;
  recommendedAction: StageCandidateAction;
  confidence: StageCandidateConfidence;
  rationale: string;
  status: StageCandidateStatus;
  appliedMode?: StageCandidateAppliedMode;
  rejectionReason?: string;
  notes?: string;
  reviewedAt?: string;
  appliedAt?: string;
  autoAppliedAt?: string;
  autoApplyRationale?: string;
  rejectedAt?: string;
  createdAt: string;
  canApply: boolean;
  sourceMachine?: Pick<MachineSummary, "id" | "code" | "name" | "type">;
  sourceMachineEvent?: Pick<MachineEventRecord, "id" | "eventType" | "eventTs" | "processingStatus">;
  targetBatch?: LinkedMachineEventBatchRef & { status: string };
  targetManufacturingJob?: LinkedMachineEventJobRef & { status: string };
  targetPart?: LinkedMachineEventPartRef & { status: string };
  autoAppliedByRule?: {
    id: string;
    candidateAction: StageCandidateAction;
    machineId?: string;
    machineType?: MachineType;
  };
}
