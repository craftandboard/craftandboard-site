import { Prisma } from "@prisma/client";
import type { AmazonImportResult, NormalizedOrderInput } from "./types.js";
import { prisma } from "../../lib/prisma.js";
import { buildAmazonPartCode } from "./normalization.js";

const LOCAL_ORG_ID = "org_local_craft_board";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureOrganization() {
  await prisma.organization.upsert({
    where: { id: LOCAL_ORG_ID },
    update: { name: "Craft & Board Local" },
    create: { id: LOCAL_ORG_ID, name: "Craft & Board Local" }
  });
}

export async function persistAmazonOrders(orders: NormalizedOrderInput[]): Promise<Omit<AmazonImportResult, "filesProcessed" | "warnings" | "errors">> {
  await ensureOrganization();

  let ordersCreated = 0;
  let orderItemsCreated = 0;
  let partInstancesCreated = 0;

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
        rawPayload: toJsonValue(order.rawPayload)
      },
      create: {
        organizationId: LOCAL_ORG_ID,
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
        rawPayload: toJsonValue(order.rawPayload)
      }
    });
    ordersCreated += 1;

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
          sequence: itemIndex * 100 + serialNumber
        });

        return {
          orderId: orderRecord.id,
          orderItemId: orderItemRecord.id,
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

      if (parts.length > 0) {
        await prisma.part.createMany({ data: parts });
      }

      partInstancesCreated += parts.length;
    }
  }

  return {
    ordersCreated,
    orderItemsCreated,
    partInstancesCreated
  };
}
