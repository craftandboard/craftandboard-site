import { prisma } from "../../lib/prisma.js";
import type { LabelRenderFormat } from "@prisma/client";
import type { LabelRenderJobView, ManufacturingPartLabelPayload } from "./contracts.js";
import { BATCH_SCAN_PREFIX, PART_SCAN_PREFIX } from "./contracts.js";
import { renderManufacturingPartLabelHtml } from "./htmlRenderer.js";

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function mapRenderJob(job: any): LabelRenderJobView {
  return {
    id: job.id,
    entityType: job.entityType,
    entityId: job.entityId,
    templateId: job.templateId ?? undefined,
    renderFormat: job.renderFormat,
    outputHtml: job.outputHtml ?? undefined,
    outputPath: job.outputPath ?? undefined,
    createdAt: job.createdAt.toISOString()
  };
}

async function getManufacturingPartLabelContext(partId: string, organizationId: string) {
  return prisma.manufacturingPart.findFirst({
    where: { id: partId, organizationId },
    include: {
      manufacturingPacket: true,
      batch: true,
      salesOrderItem: { include: { shelfProduct: true } },
      shelfJob: true
    }
  });
}

async function getDefaultLabelTemplate(organizationId: string) {
  return prisma.labelTemplateVersion.findFirst({
    where: { organizationId, isDefault: true },
    orderBy: [{ updatedAt: "desc" }]
  });
}

export async function getManufacturingPartLabelPayload(partId: string, organizationId: string) {
  const part = await getManufacturingPartLabelContext(partId, organizationId);
  if (!part) {
    throw new Error("Manufacturing part not found.");
  }

  const snapshot = asRecord(part.labelDataJson);
  const packetNumber = part.manufacturingPacket.packetNumber;
  const batchNumber = part.batch?.batchNumber ?? undefined;
  const shelfProductName =
    part.salesOrderItem.shelfProduct?.name ??
    asString(snapshot.productName) ??
    part.salesOrderItem.title;
  const barcodeValue = asString(snapshot.barcodeValue) ?? `${PART_SCAN_PREFIX}${part.partNumber}`;
  const qrValue = asString(snapshot.qrValue) ?? barcodeValue;

  const payload: ManufacturingPartLabelPayload = {
    partId: part.id,
    partNumber: part.partNumber,
    packetNumber,
    batchNumber,
    salesOrderId: part.salesOrderId,
    salesOrderItemId: part.salesOrderItemId,
    shelfJobId: part.shelfJobId,
    shelfProductName,
    materialType: part.materialType,
    thicknessIn: decimalToNumber(part.thicknessIn) ?? 0,
    lengthIn: decimalToNumber(part.lengthIn) ?? 0,
    depthIn: decimalToNumber(part.depthIn) ?? 0,
    edgeBandPattern: part.edgeBandPattern,
    unitIndex: part.unitIndex,
    totalQuantity: (snapshot.totalQuantity as number | undefined) ?? part.shelfJob.quantity,
    requiresPackaging: part.requiresPackaging,
    currentStatus: part.status,
    barcodeValue,
    qrValue,
    humanReadableText: [
      `Part ${part.partNumber}`,
      `Packet ${packetNumber}`,
      batchNumber ? `Batch ${batchNumber}` : "Batch pending",
      `Order ${part.salesOrderId}`,
      `Item ${part.salesOrderItemId}`,
      shelfProductName ? `Product ${shelfProductName}` : "Shelf",
      `Material ${part.materialType}`,
      `Size ${decimalToNumber(part.lengthIn)} x ${decimalToNumber(part.depthIn)} x ${decimalToNumber(part.thicknessIn)}`,
      `Edge ${part.edgeBandPattern}`,
      `Unit ${part.unitIndex} of ${(snapshot.totalQuantity as number | undefined) ?? part.shelfJob.quantity}`,
      part.requiresPackaging ? "Packaging required" : "No packaging required"
    ]
  };

  return {
    ok: true as const,
    label: payload
  };
}

export async function getManufacturingPartLabelHtml(partId: string, organizationId: string) {
  const labelResponse = await getManufacturingPartLabelPayload(partId, organizationId);
  const template = await getDefaultLabelTemplate(organizationId);
  const html = renderManufacturingPartLabelHtml({
    label: labelResponse.label,
    templateName: template?.name
  });

  return {
    ok: true as const,
    label: labelResponse.label,
    html,
    template: template
      ? {
          id: template.id,
          name: template.name,
          code: template.code,
          version: template.version
        }
      : undefined
  };
}

export async function reprintManufacturingPartLabel(input: {
  partId: string;
  organizationId: string;
  createdByUserId?: string;
  renderFormat?: LabelRenderFormat;
}) {
  const renderFormat = input.renderFormat ?? "HTML";
  const labelResponse = await getManufacturingPartLabelPayload(input.partId, input.organizationId);
  const template = await getDefaultLabelTemplate(input.organizationId);
  const html =
    renderFormat === "HTML"
      ? renderManufacturingPartLabelHtml({ label: labelResponse.label, templateName: template?.name })
      : null;

  const renderJob = await prisma.labelRenderJob.create({
    data: {
      organizationId: input.organizationId,
      entityType: "MANUFACTURING_PART",
      entityId: input.partId,
      manufacturingPartId: input.partId,
      templateId: template?.id ?? null,
      renderFormat,
      payloadJson: labelResponse.label as unknown as object,
      outputHtml: html,
      outputPath: null,
      createdByUserId: input.createdByUserId ?? null
    }
  });

  return {
    ok: true as const,
    action: "reprint-manufacturing-part-label",
    renderJob: mapRenderJob(renderJob),
    label: labelResponse.label,
    ...(html ? { html } : {})
  };
}

export function buildManufacturingPartScanValue(partNumber: string) {
  return `${PART_SCAN_PREFIX}${partNumber}`;
}

export function buildManufacturingBatchScanValue(batchNumber: string) {
  return `${BATCH_SCAN_PREFIX}${batchNumber}`;
}
