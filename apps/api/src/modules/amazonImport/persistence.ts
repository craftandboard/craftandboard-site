import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { AmazonImportResult, NormalizedOrderInput } from "./types.js";
import { prisma } from "../../lib/prisma.js";
import { translateShelfToManufacturingPart } from "../configurator/service.js";
import { scanCodeForPartId } from "../parts/scanCode.js";
import { LOCAL_ORG_ID, LOCAL_ORG_NAME, LOCAL_ORG_SLUG } from "../settings/service.js";
import { buildAmazonPartCode } from "./normalization.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureOrganization(organizationId: string, organizationName = LOCAL_ORG_NAME, organizationSlug = LOCAL_ORG_SLUG) {
  await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: organizationName, slug: organizationSlug },
    create: { id: organizationId, name: organizationName, slug: organizationSlug }
  });
}

export async function persistAmazonOrders(
  orders: NormalizedOrderInput[],
  organizationId = LOCAL_ORG_ID
): Promise<Omit<AmazonImportResult, "filesProcessed" | "warnings" | "errors">> {
  await ensureOrganization(organizationId);

  let ordersCreated = 0;
  let orderItemsCreated = 0;
  let partInstancesCreated = 0;
  let jobsCreated = 0;

  const createdOrders: AmazonImportResult["orders"] = [];
  const createdJobs: AmazonImportResult["jobs"] = [];
  const partLookupRows: Array<{
    manufacturingJobId: string;
    orderId: string;
    orderItemId: string;
  }> = [];

  for (const order of orders) {
    const orderRecord = await prisma.order.upsert({
      where: { amazonOrderId: order.amazonOrderId },
      update: {
        externalOrderId: order.externalOrderId,
        externalRef: order.amazonOrderId,
        amazonOrderSource: order.amazonOrderSource,
        orderDate: new Date(order.orderDate),
        purchaseDate: order.purchaseDate ? new Date(order.purchaseDate) : null,
        shipByDate: new Date(order.shipByDate),
        customerName: order.customerName,
        customerFullName: order.customerFullName,
        shipToName: order.shipToName,
        customerLastName: order.customerLastName,
        status: order.status === "ready_for_batch" ? "READY_FOR_BATCH" : "IMPORTED",
        channel: "AMAZON",
        rawPayload: toJsonValue(order.rawPayload)
      },
      create: {
        organizationId,
        externalOrderId: order.externalOrderId,
        amazonOrderId: order.amazonOrderId,
        externalRef: order.amazonOrderId,
        amazonOrderSource: order.amazonOrderSource,
        orderDate: new Date(order.orderDate),
        purchaseDate: order.purchaseDate ? new Date(order.purchaseDate) : null,
        shipByDate: new Date(order.shipByDate),
        customerName: order.customerName,
        customerFullName: order.customerFullName,
        shipToName: order.shipToName,
        customerLastName: order.customerLastName,
        status: order.status === "ready_for_batch" ? "READY_FOR_BATCH" : "IMPORTED",
        channel: "AMAZON",
        rawPayload: toJsonValue(order.rawPayload)
      }
    });

    ordersCreated += 1;
    createdOrders.push({
      id: orderRecord.id,
      source: "AMAZON"
    });

    for (const [itemIndex, item] of order.lineItems.entries()) {
      const orderItemRecord = await prisma.orderItem.upsert({
        where: { externalOrderItemId: item.externalOrderItemId },
        update: {
          orderId: orderRecord.id,
          amazonOrderItemId: item.amazonOrderItemId,
          asin: item.asin,
          sku: item.sku,
          title: item.title,
          productLabel: item.productLabel,
          normalizedLegacyXmlName: item.normalizedLegacyXmlName,
          quantity: item.quantity,
          materialCode: item.materialCode,
          edgeBandPattern: "ALL_FOUR",
          widthIn: decimal(item.widthIn),
          depthIn: decimal(item.depthIn),
          thicknessIn: decimal(item.thicknessIn),
          sourceLengthIn: item.sourceLengthIn ? decimal(item.sourceLengthIn) : null,
          sourceDepthIn: item.sourceDepthIn ? decimal(item.sourceDepthIn) : null,
          sourceEdgeBandText: item.sourceEdgeBandText,
          sourceCustomizationJson: item.sourceCustomizationJson
            ? toJsonValue(item.sourceCustomizationJson)
            : Prisma.JsonNull,
          notes: item.notes,
          rawPayload: toJsonValue(item)
        },
        create: {
          organizationId,
          orderId: orderRecord.id,
          externalOrderItemId: item.externalOrderItemId,
          amazonOrderItemId: item.amazonOrderItemId,
          asin: item.asin,
          sku: item.sku,
          title: item.title,
          productLabel: item.productLabel,
          normalizedLegacyXmlName: item.normalizedLegacyXmlName,
          quantity: item.quantity,
          materialCode: item.materialCode,
          edgeBandPattern: "ALL_FOUR",
          widthIn: decimal(item.widthIn),
          depthIn: decimal(item.depthIn),
          thicknessIn: decimal(item.thicknessIn),
          sourceLengthIn: item.sourceLengthIn ? decimal(item.sourceLengthIn) : null,
          sourceDepthIn: item.sourceDepthIn ? decimal(item.sourceDepthIn) : null,
          sourceEdgeBandText: item.sourceEdgeBandText,
          sourceCustomizationJson: item.sourceCustomizationJson
            ? toJsonValue(item.sourceCustomizationJson)
            : Prisma.JsonNull,
          notes: item.notes,
          rawPayload: toJsonValue(item)
        }
      });

      orderItemsCreated += 1;

      const translated = await translateShelfToManufacturingPart({
        widthIn: item.widthIn,
        depthIn: item.depthIn,
        materialCode: item.materialCode,
        quantity: item.quantity,
        channel: "AMAZON"
      });

      const existingJob = await prisma.manufacturingJob.findFirst({
        where: { organizationId, orderItemId: orderItemRecord.id },
        select: { id: true }
      });

      const manufacturingJobData = {
        organizationId,
        orderId: orderRecord.id,
        orderItemId: orderItemRecord.id,
        batchId: null,
        source: "AMAZON" as const,
        status: "DRAFT" as const,
        channel: "AMAZON" as const,
        partType: translated.partType,
        materialCode: item.materialCode,
        edgeBandPattern: item.edgeBandPattern,
        widthIn: decimal(item.widthIn),
        depthIn: decimal(item.depthIn),
        thicknessIn: decimal(item.thicknessIn),
        quantity: item.quantity,
        unit: translated.unit,
        manufacturingMode: translated.manufacturingMode,
        labelCode: translated.labelCode
      };

      const manufacturingJobRecord = existingJob
        ? await prisma.manufacturingJob.update({
            where: { id: existingJob.id },
            data: manufacturingJobData
          })
        : await prisma.manufacturingJob.create({
            data: manufacturingJobData
          });

      if (!existingJob) {
        jobsCreated += 1;
      }

      createdJobs.push({
        id: manufacturingJobRecord.id,
        status: "DRAFT",
        source: "AMAZON",
        orderId: orderRecord.id,
        orderItemId: orderItemRecord.id
      });

      await prisma.part.deleteMany({
        where: { orderItemId: orderItemRecord.id }
      });

      const materialCode =
        item.materialCode === "WHITE_MELAMINE" || item.materialCode === "MAPLE_MELAMINE"
          ? item.materialCode
          : "WHITE_MELAMINE";

      const parts = Array.from({ length: item.quantity }, (_, index) => {
        const serialNumber = index + 1;
        const partCode = buildAmazonPartCode({
          shipByDate: order.shipByDate,
          materialCode,
          orderItemKey: item.externalOrderItemId,
          sequence: itemIndex * 100 + serialNumber
        });

        return {
          id: randomUUID(),
          organizationId,
          orderId: orderRecord.id,
          orderItemId: orderItemRecord.id,
          manufacturingJobId: manufacturingJobRecord.id,
          scanCode: "",
          name: `${item.productLabel} ${order.customerLastName}`,
          partCode,
          qrPayload: `cb://${partCode}`,
          serialNumber,
          instanceNumber: serialNumber,
          materialCode: item.materialCode,
          edgeBandPattern: "ALL_FOUR" as const,
          widthIn: decimal(item.widthIn),
          depthIn: decimal(item.depthIn),
          thicknessIn: decimal(item.thicknessIn),
          shipByDate: new Date(order.shipByDate),
          customerLastName: order.customerLastName,
          status: "READY_FOR_BATCH" as const
        };
      });

      parts.forEach((part) => {
        part.scanCode = scanCodeForPartId(part.id);
      });

      if (parts.length > 0) {
        await prisma.part.createMany({ data: parts });
      }

      partLookupRows.push({
        manufacturingJobId: manufacturingJobRecord.id,
        orderId: orderRecord.id,
        orderItemId: orderItemRecord.id
      });
      partInstancesCreated += parts.length;
    }
  }

  const persistedParts =
    partLookupRows.length === 0
      ? []
      : await prisma.part.findMany({
        where: {
          organizationId,
          manufacturingJobId: {
            in: partLookupRows.map((row) => row.manufacturingJobId)
          }
          },
          include: {
            manufacturingJob: {
              select: {
              labelCode: true
            }
          }
          },
          orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
        });

  return {
    ordersCreated,
    orderItemsCreated,
    partInstancesCreated,
    jobsCreated,
    orders: createdOrders,
    jobs: createdJobs,
    parts: persistedParts.map((part) => ({
      id: part.id,
      jobId: part.manufacturingJobId ?? "",
      orderId: part.orderId ?? "",
      orderItemId: part.orderItemId ?? "",
      labelCode: `${part.manufacturingJob?.labelCode ?? part.partCode}-P${String(part.instanceNumber).padStart(2, "0")}`,
      scanCode: part.scanCode ?? scanCodeForPartId(part.id),
      source: "AMAZON" as const
    }))
  };
}
