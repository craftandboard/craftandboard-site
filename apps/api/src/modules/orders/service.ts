import type { Order, OrderItem, PartInstance } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";

function decimalToNumber(value: { toNumber(): number }): number {
  return value.toNumber();
}

type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderByIdRaw>>>;
type BarePart = OrderWithItems["items"][number]["parts"][number];

function mapBarePartInstance(part: BarePart): PartInstance {
  return {
    id: part.id,
    orderId: part.orderId ?? undefined,
    orderItemId: part.orderItemId ?? undefined,
    partCode: part.partCode,
    qrPayload: part.qrPayload,
    serialNumber: part.serialNumber ?? undefined,
    instanceNumber: part.instanceNumber,
    materialCode: part.materialCode ?? undefined,
    edgeBandPattern: part.edgeBandPattern ?? undefined,
    widthIn: decimalToNumber(part.widthIn),
    depthIn: decimalToNumber(part.depthIn),
    thicknessIn: decimalToNumber(part.thicknessIn),
    shipByDate: part.shipByDate?.toISOString(),
    customerLastName: part.customerLastName ?? undefined,
    status: String(part.status).toLowerCase() as PartInstance["status"]
  };
}

function mapOrderItem(item: Awaited<ReturnType<typeof listOrdersRaw>>[number]["items"][number]): OrderItem {
  return {
    id: item.id,
    orderId: item.orderId,
    externalOrderItemId: item.externalOrderItemId ?? undefined,
    amazonOrderItemId: item.amazonOrderItemId ?? undefined,
    asin: item.asin ?? undefined,
    sku: item.sku,
    title: item.title,
    productLabel: item.productLabel,
    normalizedLegacyXmlName: item.normalizedLegacyXmlName ?? undefined,
    quantity: item.quantity,
    materialCode: item.materialCode ?? undefined,
    edgeBandPattern: item.edgeBandPattern ?? undefined,
    widthIn: decimalToNumber(item.widthIn),
    depthIn: decimalToNumber(item.depthIn),
    thicknessIn: decimalToNumber(item.thicknessIn),
    sourceLengthIn: item.sourceLengthIn ? decimalToNumber(item.sourceLengthIn) : undefined,
    sourceDepthIn: item.sourceDepthIn ? decimalToNumber(item.sourceDepthIn) : undefined,
    sourceEdgeBandText: item.sourceEdgeBandText ?? undefined,
    sourceCustomizationJson: item.sourceCustomizationJson ?? undefined,
    notes: item.notes ?? undefined
  };
}

async function listOrdersRaw() {
  return prisma.order.findMany({
    orderBy: [{ shipByDate: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

function mapOrder(order: Awaited<ReturnType<typeof listOrdersRaw>>[number]): Order {
  const items = order.items.map(mapOrderItem);

  return {
    id: order.id,
    organizationId: order.organizationId,
    externalRef: order.externalRef ?? undefined,
    externalOrderId: order.externalOrderId ?? undefined,
    amazonOrderId: order.amazonOrderId ?? undefined,
    amazonOrderSource: order.amazonOrderSource ?? undefined,
    orderDate: order.orderDate?.toISOString(),
    purchaseDate: order.purchaseDate?.toISOString(),
    shipByDate: order.shipByDate?.toISOString(),
    status: String(order.status).toLowerCase() as Order["status"],
    customerName: order.customerName,
    customerFullName: order.customerFullName ?? undefined,
    shipToName: order.shipToName ?? undefined,
    customerLastName: order.customerLastName ?? undefined,
    materialSummary: Array.from(new Set(items.map((item) => item.materialCode).filter(Boolean))) as Order["materialSummary"],
    quantityTotal: items.reduce((sum, item) => sum + item.quantity, 0),
    rawPayload: order.rawPayload ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items
  };
}

export async function listOrders(): Promise<Order[]> {
  const orders = await listOrdersRaw();
  return orders.map(mapOrder);
}

export async function getOrderById(orderId: string) {
  const order = await getOrderByIdRaw(orderId);

  if (!order) {
    return null;
  }

  return {
    ...mapOrder(order),
    items: order.items.map((item) => ({
      ...mapOrderItem(item),
      partInstances: item.parts.map(mapBarePartInstance)
    }))
  };
}

export async function getNormalizedOrderById(orderId: string) {
  const order = await getOrderById(orderId);

  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    amazonOrderId: order.amazonOrderId,
    customerLastName: order.customerLastName,
    shipByDate: order.shipByDate,
    items: order.items.map((item) => ({
      amazonOrderItemId: item.amazonOrderItemId,
      sku: item.sku,
      productLabel: item.productLabel,
      materialCode: item.materialCode,
      widthIn: item.widthIn,
      depthIn: item.depthIn,
      thicknessIn: item.thicknessIn,
      edgeBandPattern: item.edgeBandPattern,
      sourceLengthIn: item.sourceLengthIn,
      sourceDepthIn: item.sourceDepthIn,
      sourceEdgeBandText: item.sourceEdgeBandText,
      partInstances: "partInstances" in item ? item.partInstances : []
    }))
  };
}

async function getOrderByIdRaw(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          parts: {
            orderBy: { instanceNumber: "asc" }
          }
        }
      }
    }
  });
}
