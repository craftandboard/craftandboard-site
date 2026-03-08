import type { Order, OrderItem, PartInstance } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { writeOrderArtifactPdf } from "../../lib/generatedArtifacts.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { buildPackingSlipPdf } from "./pdf.js";

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

async function listOrdersRaw(organizationId = LOCAL_ORG_ID) {
  return prisma.order.findMany({
    where: {
      organizationId
    },
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

export async function listOrders(organizationId = LOCAL_ORG_ID): Promise<Order[]> {
  const orders = await listOrdersRaw(organizationId);
  return orders.map(mapOrder);
}

export async function listCompletedOrders(
  organizationId = LOCAL_ORG_ID
): Promise<
  Array<{
    orderId: string;
    source: "AMAZON" | "CONFIGURATOR";
    status: "READY_FOR_SHIPMENT";
    jobCount: number;
    partCount: number;
    completedAt: string;
  }>
> {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      status: "READY_FOR_SHIPMENT"
    },
    include: {
      manufacturingJobs: {
        select: {
          id: true,
          source: true
        }
      },
      parts: {
        select: {
          id: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return orders.map((order) => ({
    orderId: order.id,
    source: order.manufacturingJobs.every((job) => job.source === "AMAZON") ? "AMAZON" : "CONFIGURATOR",
    status: "READY_FOR_SHIPMENT",
    jobCount: order.manufacturingJobs.length,
    partCount: order.parts.length,
    completedAt: order.updatedAt.toISOString()
  }));
}

export async function markOrderShipped(orderId: string, organizationId = LOCAL_ORG_ID): Promise<{
  id: string;
  status: "SHIPPED";
}> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, organizationId },
    select: {
      id: true,
      status: true
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status !== "READY_FOR_SHIPMENT" && order.status !== "SHIPPED") {
    throw new Error(`Order ${orderId} is not ready to ship.`);
  }

  if (order.status === "SHIPPED") {
    return {
      id: order.id,
      status: "SHIPPED"
    };
  }

  return prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED"
      }
    });

    const existingShipment = await tx.shipment.findFirst({
      where: { orderId, organizationId },
      orderBy: [{ createdAt: "desc" }]
    });

    if (existingShipment) {
      await tx.shipment.update({
        where: { id: existingShipment.id },
        data: {
          status: "SHIPPED"
        }
      });
    } else {
      await tx.shipment.create({
        data: {
          organizationId,
          orderId,
          status: "SHIPPED"
        }
      });
    }

    return {
      id: updatedOrder.id,
      status: "SHIPPED" as const
    };
  });
}

async function getNextOrderArtifactVersion(orderId: string, type: string, organizationId = LOCAL_ORG_ID) {
  const current = await prisma.artifact.findFirst({
    where: {
      orderId,
      organizationId,
      type
    },
    orderBy: [{ version: "desc" }]
  });

  return current ? current.version + 1 : 1;
}

export async function generatePackingSlipPdf(orderId: string, organizationId = LOCAL_ORG_ID): Promise<{
  orderId: string;
  artifact: {
    type: "order-packing-slip-pdf";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      organizationId
    },
    include: {
      manufacturingJobs: {
        select: {
          id: true,
          source: true
        }
      },
      parts: {
        include: {
          batch: {
            select: {
              code: true
            }
          },
          manufacturingJob: {
            select: {
              labelCode: true
            }
          }
        },
        orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
      }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status !== "READY_FOR_SHIPMENT" && order.status !== "SHIPPED") {
    throw new Error(`Order ${order.id} is not ready for fulfillment closeout.`);
  }

  const version = await getNextOrderArtifactVersion(order.id, "order-packing-slip-pdf", organizationId);
  const source =
    order.manufacturingJobs.length > 0 &&
    order.manufacturingJobs.every((job) => job.source === "AMAZON")
      ? "AMAZON"
      : "CONFIGURATOR";
  const uri = await writeOrderArtifactPdf({
    orderId: order.id,
    fileName: `packing-slip-v${version}.pdf`,
    bytes: buildPackingSlipPdf({
      order: {
        id: order.id,
        source,
        status: String(order.status),
        customerName: order.customerName,
        shipByDate: order.shipByDate?.toISOString(),
        jobCount: order.manufacturingJobs.length,
        partCount: order.parts.length
      },
      parts: order.parts.map((part) => ({
        labelCode: `${part.manufacturingJob?.labelCode ?? part.partCode}-P${String(part.instanceNumber).padStart(2, "0")}`,
        scanCode: part.scanCode,
        material: String(part.materialCode ?? "UNKNOWN"),
        width: decimalToNumber(part.widthIn),
        depth: decimalToNumber(part.depthIn),
        thickness: decimalToNumber(part.thicknessIn),
        batchCode: part.batch?.code ?? undefined,
        status: String(part.status)
      }))
    })
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        orderId,
        type: "order-packing-slip-pdf",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        orderId,
        type: "order-packing-slip-pdf",
        uri,
        mimeType: "application/pdf",
        version,
        isCurrent: true,
        generatedFrom: order.id
      }
    });
  });

  return {
    orderId: order.id,
    artifact: {
      type: "order-packing-slip-pdf",
      uri,
      isCurrent: true,
      version
    }
  };
}

export async function getOrderById(orderId: string, organizationId = LOCAL_ORG_ID) {
  const order = await getOrderByIdRaw(orderId, organizationId);

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

export async function getNormalizedOrderById(orderId: string, organizationId = LOCAL_ORG_ID) {
  const order = await getOrderById(orderId, organizationId);

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

async function getOrderByIdRaw(orderId: string, organizationId = LOCAL_ORG_ID) {
  return prisma.order.findFirst({
    where: { id: orderId, organizationId },
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
