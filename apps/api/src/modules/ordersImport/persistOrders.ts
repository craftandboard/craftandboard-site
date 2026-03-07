import { Prisma } from "@prisma/client";
import type { NormalizedOrderInput } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { buildPartInstances } from "./buildPartInstances.js";

const LOCAL_ORG_ID = "org_local_craft_board";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistNormalizedOrders(orders: NormalizedOrderInput[]) {
  await prisma.organization.upsert({
    where: { id: LOCAL_ORG_ID },
    update: { name: "Craft & Board Local" },
    create: { id: LOCAL_ORG_ID, name: "Craft & Board Local" }
  });

  let lineItemsCreated = 0;
  let partsCreated = 0;

  for (const normalizedOrder of orders) {
    const orderRecord = await prisma.order.upsert({
      where: { externalOrderId: normalizedOrder.externalOrderId },
      update: {
        amazonOrderId: normalizedOrder.amazonOrderId,
        externalRef: normalizedOrder.amazonOrderId,
        orderDate: new Date(normalizedOrder.orderDate),
        shipByDate: new Date(normalizedOrder.shipByDate),
        customerName: normalizedOrder.customerName,
        customerLastName: normalizedOrder.customerLastName,
        customerFullName: normalizedOrder.customerFullName ?? normalizedOrder.customerName,
        shipToName: normalizedOrder.shipToName ?? null,
        purchaseDate: normalizedOrder.purchaseDate ? new Date(normalizedOrder.purchaseDate) : null,
        amazonOrderSource: normalizedOrder.amazonOrderSource ?? null,
        status: normalizedOrder.status === "ready_for_batch" ? "READY_FOR_BATCH" : "IMPORTED",
        rawPayload: toJsonValue(normalizedOrder.rawPayload)
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        externalOrderId: normalizedOrder.externalOrderId,
        amazonOrderId: normalizedOrder.amazonOrderId,
        externalRef: normalizedOrder.amazonOrderId,
        orderDate: new Date(normalizedOrder.orderDate),
        shipByDate: new Date(normalizedOrder.shipByDate),
        customerName: normalizedOrder.customerName,
        customerLastName: normalizedOrder.customerLastName,
        customerFullName: normalizedOrder.customerFullName ?? normalizedOrder.customerName,
        shipToName: normalizedOrder.shipToName ?? null,
        purchaseDate: normalizedOrder.purchaseDate ? new Date(normalizedOrder.purchaseDate) : null,
        amazonOrderSource: normalizedOrder.amazonOrderSource ?? null,
        status: normalizedOrder.status === "ready_for_batch" ? "READY_FOR_BATCH" : "IMPORTED",
        rawPayload: toJsonValue(normalizedOrder.rawPayload)
      }
    });

    for (const [itemIndex, item] of normalizedOrder.lineItems.entries()) {
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

      await prisma.part.deleteMany({
        where: { orderItemId: orderItemRecord.id }
      });

      const partInstances = buildPartInstances({
        order: normalizedOrder,
        orderItem: item,
        orderCode: orderRecord.amazonOrderId ?? orderRecord.externalOrderId ?? orderRecord.id,
        itemIndex: itemIndex + 1
      });

      if (partInstances.length > 0) {
        await prisma.part.createMany({
          data: partInstances.map((part) => ({
            orderId: orderRecord.id,
            orderItemId: orderItemRecord.id,
            name: part.name,
            partCode: part.partCode,
            qrPayload: part.qrPayload,
            instanceNumber: part.instanceNumber,
            materialCode: part.materialCode,
            edgeBandPattern: "ALL_FOUR",
            widthIn: decimal(part.widthIn),
            depthIn: decimal(part.depthIn),
            thicknessIn: decimal(part.thicknessIn),
            serialNumber: part.instanceNumber,
            shipByDate: part.shipByDate,
            customerLastName: part.customerLastName,
            status: part.status
          }))
        });
      }

      lineItemsCreated += 1;
      partsCreated += partInstances.length;
    }
  }

  return {
    ordersImported: orders.length,
    lineItemsImported: lineItemsCreated,
    partsExpanded: partsCreated
  };
}
