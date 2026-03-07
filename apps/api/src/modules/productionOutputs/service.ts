import type {
  EdgeBandPattern,
  LabelRow,
  MaterialCode,
  OptimizerRow,
  PartInstance,
  ProductionReport
} from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { formatDateKey, formatDateLabel, parseInputDate } from "../imports/date.js";
import { inchesToMillimeters } from "../imports/dimension.js";
import { renderLegacyXml } from "./legacyXmlContracts.js";
import { renderOptimizerCsv } from "./optimizerContracts.js";
import type { ShipBySummaryRow } from "./reportContracts.js";

type PartRecord = Awaited<ReturnType<typeof loadPartsForShipByDate>>[number];

function materialLabel(code: MaterialCode): string {
  switch (code) {
    case "MAPLE_MELAMINE":
      return "Maple Melamine";
    case "WHITE_MELAMINE":
      return "White Melamine";
    case "BIRCH_18":
      return "Birch 18";
    case "WALNUT_18":
      return "Walnut 18";
    case "MAPLE_18":
      return "Maple 18";
    case "MDF_18":
      return "MDF 18";
  }
}

function edgeBandLabel(pattern: EdgeBandPattern): string {
  switch (pattern) {
    case "ALL_FOUR":
      return "All four sides";
  }
}

function decimalToNumber(value: { toNumber(): number }): number {
  return value.toNumber();
}

function orderCode(part: PartRecord): string {
  return part.order?.amazonOrderId ?? part.order?.externalOrderId ?? part.order?.id ?? "unknown-order";
}

async function loadPartsForShipByDate(shipByDate: string, materialCode?: MaterialCode) {
  const targetDate = parseInputDate(shipByDate);
  const nextDate = new Date(targetDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  return prisma.part.findMany({
    where: {
      shipByDate: {
        gte: new Date(`${formatDateKey(targetDate)}T00:00:00.000Z`),
        lt: new Date(`${formatDateKey(nextDate)}T00:00:00.000Z`)
      },
      ...(materialCode ? { materialCode } : {})
    },
    orderBy: [{ customerLastName: "asc" }, { partCode: "asc" }],
    include: {
      order: true,
      orderItem: true
    }
  });
}

export async function buildDailyProductionReport(input: {
  shipByDate: string;
  materialCode?: MaterialCode;
}): Promise<ProductionReport> {
  const parts = await loadPartsForShipByDate(input.shipByDate, input.materialCode);
  const countsByMaterial = new Map<MaterialCode, number>();
  const rowMap = new Map<string, ProductionReport["rows"][number]>();

  for (const part of parts) {
    const code = part.materialCode as MaterialCode;
    countsByMaterial.set(code, (countsByMaterial.get(code) ?? 0) + 1);

    const key = `${part.orderItemId}:${part.customerLastName}`;
    const existing = rowMap.get(key);

    if (existing) {
      existing.quantity += 1;
      existing.partCodes.push(part.partCode);
    } else if (part.orderItem) {
      rowMap.set(key, {
        orderCode: orderCode(part),
        customerLastName: part.customerLastName ?? "Unknown",
        productLabel: part.orderItem.productLabel,
        materialCode: code,
        widthIn: decimalToNumber(part.widthIn),
        depthIn: decimalToNumber(part.depthIn),
        quantity: 1,
        partCodes: [part.partCode]
      });
    }
  }

  return {
    shipByDate: formatDateLabel(parseInputDate(input.shipByDate)),
    materialFilter: input.materialCode,
    totalPhysicalParts: parts.length,
    ordersIncluded: new Set(parts.map((part) => part.orderId).filter(Boolean)).size,
    lineItemsIncluded: new Set(parts.map((part) => part.orderItemId).filter(Boolean)).size,
    partsExpanded: parts.length,
    countsByMaterial: Array.from(countsByMaterial.entries()).map(([materialCode, partCount]) => ({
      materialCode,
      materialLabel: materialLabel(materialCode),
      partCount
    })),
    rows: Array.from(rowMap.values())
  };
}

export async function buildLabelJob(input: {
  shipByDate: string;
  materialCode?: MaterialCode;
}): Promise<LabelRow[]> {
  const parts = await loadPartsForShipByDate(input.shipByDate, input.materialCode);
  const partTotals = new Map<string, number>();

  for (const part of parts) {
    if (part.orderItemId) {
      partTotals.set(part.orderItemId, (partTotals.get(part.orderItemId) ?? 0) + 1);
    }
  }

  return parts.map((part) => ({
    shipByDate: formatDateLabel(parseInputDate(input.shipByDate)),
    productLabel: part.orderItem?.productLabel ?? part.name,
    quantityDisplay: `${part.instanceNumber} of ${part.orderItemId ? partTotals.get(part.orderItemId) ?? 1 : 1}`,
    customerLastName: part.customerLastName ?? "Unknown",
    orderCode: orderCode(part),
    widthIn: decimalToNumber(part.widthIn),
    depthIn: decimalToNumber(part.depthIn),
    thicknessIn: decimalToNumber(part.thicknessIn),
    materialLabel: materialLabel(part.materialCode as MaterialCode),
    edgeBandLabel: edgeBandLabel(part.edgeBandPattern as EdgeBandPattern),
    jobNumber: formatDateKey(parseInputDate(input.shipByDate)).replaceAll("-", ""),
    partCode: part.partCode,
    qrPayload: part.qrPayload
  }));
}

export async function buildOptimizerExport(input: {
  shipByDate: string;
  materialCode?: MaterialCode;
}) {
  const parts = await loadPartsForShipByDate(input.shipByDate, input.materialCode);
  const rows: OptimizerRow[] = parts.map((part) => ({
    shipByDate: formatDateLabel(parseInputDate(input.shipByDate)),
    partCode: part.partCode,
    materialCode: part.materialCode as MaterialCode,
    customerLastName: part.customerLastName ?? "Unknown",
    widthMm: inchesToMillimeters(decimalToNumber(part.widthIn)),
    depthMm: inchesToMillimeters(decimalToNumber(part.depthIn)),
    edgeBandPattern: part.edgeBandPattern as EdgeBandPattern
  }));

  return {
    shipByDate: formatDateLabel(parseInputDate(input.shipByDate)),
    rows,
    csv: renderOptimizerCsv(rows)
  };
}

export async function buildLegacyXmlExport(input: {
  shipByDate: string;
  materialCode?: MaterialCode;
}) {
  const optimizerExport = await buildOptimizerExport(input);

  return renderLegacyXml({
    shipByDate: optimizerExport.shipByDate,
    rows: optimizerExport.rows
  });
}

export async function buildShipBySummary(input: {
  shipByDate: string;
  materialCode?: MaterialCode;
}): Promise<{
  shipByDate: string;
  rows: ShipBySummaryRow[];
}> {
  const parts = await loadPartsForShipByDate(input.shipByDate, input.materialCode);
  const summaryMap = new Map<string, ShipBySummaryRow & { orderIds: Set<string>; itemIds: Set<string> }>();

  for (const part of parts) {
    const key = part.customerLastName ?? "Unknown";
    const entry = summaryMap.get(key) ?? {
      customerLastName: key,
      orders: 0,
      lineItems: 0,
      physicalParts: 0,
      orderIds: new Set<string>(),
      itemIds: new Set<string>()
    };

    if (part.orderId) {
      entry.orderIds.add(part.orderId);
    }
    if (part.orderItemId) {
      entry.itemIds.add(part.orderItemId);
    }
    entry.physicalParts += 1;
    entry.orders = entry.orderIds.size;
    entry.lineItems = entry.itemIds.size;
    summaryMap.set(key, entry);
  }

  return {
    shipByDate: formatDateLabel(parseInputDate(input.shipByDate)),
    rows: Array.from(summaryMap.values()).map(({ orderIds: _orderIds, itemIds: _itemIds, ...row }) => row)
  };
}

export function parseShipByDateParam(value: string): string {
  return formatDateKey(parseInputDate(value));
}

export function mapPartInstance(part: PartRecord): PartInstance {
  return {
    id: part.id,
    orderId: part.orderId ?? undefined,
    orderItemId: part.orderItemId ?? undefined,
    partCode: part.partCode,
    qrPayload: part.qrPayload,
    instanceNumber: part.instanceNumber,
    materialCode: (part.materialCode as MaterialCode | null) ?? undefined,
    edgeBandPattern: (part.edgeBandPattern as EdgeBandPattern | null) ?? undefined,
    widthIn: decimalToNumber(part.widthIn),
    depthIn: decimalToNumber(part.depthIn),
    thicknessIn: decimalToNumber(part.thicknessIn),
    shipByDate: part.shipByDate?.toISOString(),
    customerLastName: part.customerLastName ?? undefined,
    status: String(part.status).toLowerCase() as PartInstance["status"]
  };
}
