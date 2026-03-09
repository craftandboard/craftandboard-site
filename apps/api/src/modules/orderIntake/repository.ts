import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

export async function listSalesOrders(organizationId: string) {
  return prisma.salesOrder.findMany({
    where: { organizationId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      shelfJobs: { orderBy: { createdAt: "asc" } }
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getSalesOrderById(id: string, organizationId: string) {
  return prisma.salesOrder.findFirst({
    where: { id, organizationId },
    include: {
      items: {
        include: {
          shelfProduct: true,
          packagingProfile: true
        },
        orderBy: { createdAt: "asc" }
      },
      shelfJobs: { orderBy: { createdAt: "asc" } }
    }
  });
}

export async function createSalesOrder(input: {
  organizationId: string;
  sourceType: "MANUAL" | "AMAZON" | "CSV" | "CONFIGURATOR";
  sourceOrderId?: string;
  sourceStatus?: string;
  customerName?: string;
  customerEmail?: string;
  shipToName?: string;
  shipToAddressJson?: Record<string, unknown>;
  orderedAt?: string;
  currency: string;
  notes?: string;
}) {
  return prisma.salesOrder.create({
    data: {
      organizationId: input.organizationId,
      sourceType: input.sourceType,
      sourceOrderId: input.sourceOrderId ?? null,
      sourceStatus: input.sourceStatus ?? null,
      customerName: input.customerName ?? null,
      customerEmail: input.customerEmail ?? null,
      shipToName: input.shipToName ?? null,
      shipToAddressJson: input.shipToAddressJson as Prisma.InputJsonValue | undefined,
      orderedAt: input.orderedAt ? new Date(input.orderedAt) : null,
      currency: input.currency,
      notes: input.notes?.trim() || null
    }
  });
}

export async function createSalesOrderItems(input: {
  organizationId: string;
  salesOrderId: string;
  items: Array<{
    sourceLineId?: string;
    shelfProductId?: string;
    sku?: string;
    title: string;
    quantity: number;
    lengthIn?: number;
    depthIn?: number;
    thicknessIn?: number;
    materialType?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
    edgeBandPattern?: "ALL_FOUR";
    requiresPackaging?: boolean;
    packagingProfileId?: string;
    customizationJson?: Record<string, unknown>;
    notes?: string;
  }>;
}) {
  return prisma.$transaction(
    input.items.map((item) =>
      prisma.salesOrderItem.create({
        data: {
          organizationId: input.organizationId,
          salesOrderId: input.salesOrderId,
          sourceLineId: item.sourceLineId ?? null,
          shelfProductId: item.shelfProductId ?? null,
          sku: item.sku ?? null,
          title: item.title.trim(),
          quantity: item.quantity,
          lengthIn: item.lengthIn !== undefined ? decimal(item.lengthIn) : null,
          depthIn: item.depthIn !== undefined ? decimal(item.depthIn) : null,
          thicknessIn: item.thicknessIn !== undefined ? decimal(item.thicknessIn) : null,
          materialType: item.materialType ?? null,
          edgeBandPattern: item.edgeBandPattern ?? null,
          requiresPackaging: item.requiresPackaging ?? true,
          packagingProfileId: item.packagingProfileId ?? null,
          customizationJson: item.customizationJson as Prisma.InputJsonValue | undefined,
          notes: item.notes?.trim() || null
        }
      })
    )
  );
}

export async function updateSalesOrderItem(id: string, data: Prisma.SalesOrderItemUpdateInput) {
  return prisma.salesOrderItem.update({
    where: { id },
    data,
    include: {
      shelfProduct: true,
      packagingProfile: true
    }
  });
}

export async function createShelfJob(input: {
  organizationId: string;
  salesOrderId: string;
  salesOrderItemId: string;
  shelfProductId?: string;
  costProfileId: string;
  productionAssumptionProfileId: string;
  packagingProfileId?: string;
  pricingPolicyId: string;
  pricingScenarioId?: string;
  normalizedSpecJson: unknown;
  quantity: number;
}) {
  return prisma.shelfJob.create({
    data: {
      organizationId: input.organizationId,
      salesOrderId: input.salesOrderId,
      salesOrderItemId: input.salesOrderItemId,
      shelfProductId: input.shelfProductId ?? null,
      costProfileId: input.costProfileId,
      productionAssumptionProfileId: input.productionAssumptionProfileId,
      packagingProfileId: input.packagingProfileId ?? null,
      pricingPolicyId: input.pricingPolicyId,
      pricingScenarioId: input.pricingScenarioId ?? null,
      normalizedSpecJson: input.normalizedSpecJson as Prisma.InputJsonValue,
      quantity: input.quantity
    }
  });
}

export async function listShelfJobs(organizationId: string) {
  return prisma.shelfJob.findMany({
    where: { organizationId },
    include: {
      salesOrder: true,
      salesOrderItem: true
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getShelfJobById(id: string, organizationId: string) {
  return prisma.shelfJob.findFirst({
    where: { id, organizationId },
    include: {
      salesOrder: true,
      salesOrderItem: true
    }
  });
}

export async function createManufacturingPacket(input: {
  organizationId: string;
  packetNumber: string;
  sourceType: "SALES_ORDER" | "SHELF_JOB";
  sourceIdsJson: unknown;
  summaryJson: unknown;
  createdByUserId?: string;
}) {
  return prisma.manufacturingPacket.create({
    data: {
      organizationId: input.organizationId,
      packetNumber: input.packetNumber,
      sourceType: input.sourceType,
      sourceIdsJson: input.sourceIdsJson as Prisma.InputJsonValue,
      summaryJson: input.summaryJson as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? null
    }
  });
}

export async function listManufacturingPackets(organizationId: string) {
  return prisma.manufacturingPacket.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getManufacturingPacketById(id: string, organizationId: string) {
  return prisma.manufacturingPacket.findFirst({
    where: { id, organizationId }
  });
}
