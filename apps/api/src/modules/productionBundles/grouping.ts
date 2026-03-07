import type { MaterialCode, ProductionBundleSummary } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { formatDateKey, formatDateLabel } from "../imports/date.js";
import { isSupportedBundleMaterial, productLabel } from "./naming.js";

type OrderItemRecord = Awaited<ReturnType<typeof loadBundleSourceRecords>>[number];

function bundleCodeFor(dateKey: string, materialCode: MaterialCode): string {
  return `${dateKey.replaceAll("-", "")}-${materialCode}`;
}

function orderIdForRecord(record: OrderItemRecord): string {
  return record.order.amazonOrderId ?? record.order.externalOrderId ?? record.order.id;
}

function decimalToNumber(value: { toNumber(): number }): number {
  return value.toNumber();
}

export async function loadBundleSourceRecords() {
  return prisma.orderItem.findMany({
    where: {
      materialCode: {
        in: ["WHITE_MELAMINE", "MAPLE_MELAMINE"]
      },
      order: {
        shipByDate: {
          not: null
        }
      }
    },
    include: {
      order: true,
      parts: {
        orderBy: [{ customerLastName: "asc" }, { partCode: "asc" }]
      }
    },
    orderBy: [
      { order: { shipByDate: "asc" } },
      { materialCode: "asc" },
      { order: { customerLastName: "asc" } },
      { createdAt: "asc" }
    ]
  });
}

export function buildBundleSummaries(
  records: OrderItemRecord[]
): ProductionBundleSummary[] {
  const bundleMap = new Map<string, ProductionBundleSummary>();

  for (const record of records) {
    if (!record.order.shipByDate || !isSupportedBundleMaterial(record.materialCode)) {
      continue;
    }

    const dateKey = formatDateKey(record.order.shipByDate);
    const bundleCode = bundleCodeFor(dateKey, record.materialCode);
    const current = bundleMap.get(bundleCode);

    if (current) {
      current.totalLineItems += 1;
      current.totalPhysicalParts += record.parts.length;
      continue;
    }

    bundleMap.set(bundleCode, {
      bundleCode,
      shipByDate: formatDateLabel(record.order.shipByDate),
      materialCode: record.materialCode,
      productLabel: productLabel(record.materialCode),
      totalLineItems: 1,
      totalPhysicalParts: record.parts.length
    });
  }

  return Array.from(bundleMap.values()).sort((left, right) =>
    left.bundleCode.localeCompare(right.bundleCode)
  );
}

export function filterRecordsForBundle(
  records: OrderItemRecord[],
  bundleCode: string
): OrderItemRecord[] {
  return records.filter((record) => {
    if (!record.order.shipByDate || !isSupportedBundleMaterial(record.materialCode)) {
      return false;
    }

    const dateKey = formatDateKey(record.order.shipByDate);
    return bundleCodeFor(dateKey, record.materialCode) === bundleCode;
  });
}

export function summarizeRecord(record: OrderItemRecord) {
  return {
    shipByDate: record.order.shipByDate ? formatDateLabel(record.order.shipByDate) : "Unknown",
    orderId: orderIdForRecord(record),
    customerLastName: record.order.customerLastName ?? "Unknown",
    widthIn: decimalToNumber(record.widthIn),
    depthIn: decimalToNumber(record.depthIn),
    thicknessIn: decimalToNumber(record.thicknessIn)
  };
}
