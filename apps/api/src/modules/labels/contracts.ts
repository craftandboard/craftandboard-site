export const PART_SCAN_PREFIX = "PART:";
export const BATCH_SCAN_PREFIX = "BATCH:";

export type ManufacturingPartLabelPayload = {
  partId: string;
  partNumber: string;
  packetNumber: string;
  batchNumber?: string;
  salesOrderId: string;
  salesOrderItemId: string;
  shelfJobId: string;
  shelfProductName?: string;
  materialType: string;
  thicknessIn: number;
  lengthIn: number;
  depthIn: number;
  edgeBandPattern: string;
  unitIndex: number;
  totalQuantity: number;
  requiresPackaging: boolean;
  currentStatus: string;
  barcodeValue: string;
  qrValue: string;
  humanReadableText: string[];
};

export type LabelRenderJobView = {
  id: string;
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH";
  entityId: string;
  templateId?: string;
  renderFormat: "JSON" | "HTML" | "PDF";
  outputHtml?: string;
  outputPath?: string;
  createdAt: string;
};
