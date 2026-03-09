import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { createPricingScenarioSnapshot } from "../pricing/service.js";
import { getMaterialProfile } from "../settings/service.js";
import { buildManufacturingPacketSummary } from "./packetBuilder.js";
import { normalizeShelfOrderItem } from "./normalizer.js";
import {
  createManufacturingPacket,
  createSalesOrder,
  createSalesOrderItems,
  createShelfJob,
  getManufacturingPacketById,
  getSalesOrderById,
  getShelfJobById,
  listManufacturingPackets,
  listSalesOrders,
  listShelfJobs,
  updateSalesOrderItem
} from "./repository.js";

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function isValidationError(message: string) {
  return (
    message.includes("greater than zero") ||
    message.includes("Valid lengthIn") ||
    message.includes("Valid depthIn")
  );
}

function mapSalesOrder(order: any) {
  if (!order) {
    return null;
  }
  return {
    id: order.id,
    sourceType: order.sourceType,
    sourceOrderId: order.sourceOrderId ?? undefined,
    sourceStatus: order.sourceStatus ?? undefined,
    customerName: order.customerName ?? undefined,
    customerEmail: order.customerEmail ?? undefined,
    shipToName: order.shipToName ?? undefined,
    orderedAt: order.orderedAt?.toISOString(),
    currency: order.currency,
    status: order.status,
    notes: order.notes ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item: any) => ({
      id: item.id,
      salesOrderId: item.salesOrderId,
      sourceLineId: item.sourceLineId ?? undefined,
      shelfProductId: item.shelfProductId ?? undefined,
      sku: item.sku ?? undefined,
      title: item.title,
      quantity: item.quantity,
      lengthIn: decimalToNumber(item.lengthIn) ?? undefined,
      depthIn: decimalToNumber(item.depthIn) ?? undefined,
      thicknessIn: decimalToNumber(item.thicknessIn) ?? undefined,
      materialType: item.materialType ?? undefined,
      edgeBandPattern: item.edgeBandPattern ?? undefined,
      requiresPackaging: item.requiresPackaging,
      packagingProfileId: item.packagingProfileId ?? undefined,
      normalizationStatus: item.normalizationStatus,
      pricingStatus: item.pricingStatus,
      normalizedSpecJson: item.normalizedSpecJson ?? undefined,
      normalizationErrorsJson: item.normalizationErrorsJson ?? undefined,
      pricingSnapshotJson: item.pricingSnapshotJson ?? undefined,
      notes: item.notes ?? undefined
    })),
    shelfJobs: order.shelfJobs.map((job: any) => ({
      id: job.id,
      salesOrderItemId: job.salesOrderItemId,
      quantity: job.quantity,
      jobStatus: job.jobStatus,
      createdAt: job.createdAt.toISOString()
    }))
  };
}

function mapShelfJob(job: any) {
  if (!job) {
    return null;
  }
  return {
    id: job.id,
    salesOrderId: job.salesOrderId,
    salesOrderItemId: job.salesOrderItemId,
    shelfProductId: job.shelfProductId ?? undefined,
    costProfileId: job.costProfileId,
    productionAssumptionProfileId: job.productionAssumptionProfileId,
    packagingProfileId: job.packagingProfileId ?? undefined,
    pricingPolicyId: job.pricingPolicyId,
    pricingScenarioId: job.pricingScenarioId ?? undefined,
    quantity: job.quantity,
    jobStatus: job.jobStatus,
    normalizedSpecJson: job.normalizedSpecJson,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

function mapPacket(packet: any) {
  if (!packet) {
    return null;
  }
  return {
    id: packet.id,
    packetNumber: packet.packetNumber,
    sourceType: packet.sourceType,
    sourceIdsJson: packet.sourceIdsJson,
    summaryJson: packet.summaryJson,
    createdAt: packet.createdAt.toISOString()
  };
}

async function getDefaultPricingContext(organizationId: string) {
  const [costProfile, productionProfile, pricingPolicy] = await Promise.all([
    prisma.costProfile.findFirst({ where: { organizationId, isDefault: true }, orderBy: { createdAt: "asc" } }),
    prisma.productionAssumptionProfile.findFirst({ where: { organizationId, isDefault: true }, orderBy: { createdAt: "asc" } }),
    prisma.pricingPolicy.findFirst({ where: { organizationId, isDefault: true }, orderBy: { createdAt: "asc" } })
  ]);

  return {
    costProfileId: costProfile?.id,
    productionAssumptionProfileId: productionProfile?.id,
    pricingPolicyId: pricingPolicy?.id
  };
}

function deriveOrderStatus(items: Array<{ normalizationStatus: string; pricingStatus: string }>, hasShelfJobs: boolean) {
  if (hasShelfJobs) {
    return "READY" as const;
  }
  const anyError = items.some((item) => item.normalizationStatus === "ERROR" || item.pricingStatus === "ERROR");
  const anyHold = items.some((item) => item.normalizationStatus === "HOLD" || item.pricingStatus === "HOLD");
  const anyPriced = items.some((item) => item.pricingStatus === "PRICED");
  if (anyPriced) {
    return "READY" as const;
  }
  if (anyError) {
    return "ERROR" as const;
  }
  if (anyHold) {
    return "HOLD" as const;
  }
  return "DRAFT" as const;
}

export async function getSalesOrders(organizationId: string) {
  const orders = await listSalesOrders(organizationId);
  return { ok: true as const, orders: orders.map(mapSalesOrder) };
}

export async function getSalesOrder(orderId: string, organizationId: string) {
  const order = await getSalesOrderById(orderId, organizationId);
  if (!order) {
    throw new Error("Sales order not found.");
  }
  return { ok: true as const, order: mapSalesOrder(order) };
}

export async function createSalesOrderRecord(input: Parameters<typeof createSalesOrder>[0]) {
  const order = await createSalesOrder(input);
  return {
    ok: true as const,
    order: {
      id: order.id,
      status: order.status,
      sourceType: order.sourceType,
      createdAt: order.createdAt.toISOString()
    }
  };
}

export async function addSalesOrderItemsRecord(
  orderId: string,
  input: {
    organizationId: string;
    items: Parameters<typeof createSalesOrderItems>[0]["items"];
  }
) {
  const order = await getSalesOrderById(orderId, input.organizationId);
  if (!order) {
    throw new Error("Sales order not found.");
  }
  const items = await createSalesOrderItems({ ...input, salesOrderId: orderId });
  return {
    ok: true as const,
    itemsCreated: items.length
  };
}

export async function normalizeSalesOrder(orderId: string, organizationId: string) {
  const order = await getSalesOrderById(orderId, organizationId);
  if (!order) {
    throw new Error("Sales order not found.");
  }

  const defaults = await getDefaultPricingContext(organizationId);
  const normalizedItems = [];

  for (const item of order.items) {
    const materialProfile = item.materialType
      ? await getMaterialProfile(item.materialType, organizationId).catch(() => null)
      : item.shelfProduct?.materialType
        ? await getMaterialProfile(item.shelfProduct.materialType, organizationId).catch(() => null)
        : null;

    const normalized = normalizeShelfOrderItem({
      item: {
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        lengthIn: decimalToNumber(item.lengthIn),
        depthIn: decimalToNumber(item.depthIn),
        thicknessIn: decimalToNumber(item.thicknessIn),
        materialType: item.materialType as any,
        edgeBandPattern: item.edgeBandPattern as any,
        requiresPackaging: item.requiresPackaging,
        shelfProductId: item.shelfProductId,
        packagingProfileId: item.packagingProfileId
      },
      shelfProduct: item.shelfProduct
        ? {
            id: item.shelfProduct.id,
            name: item.shelfProduct.name,
            materialType: item.shelfProduct.materialType as any,
            defaultThicknessIn: Number(item.shelfProduct.defaultThicknessIn),
            defaultEdgeBandPattern: item.shelfProduct.defaultEdgeBandPattern as any,
            packagingProfileId: item.shelfProduct.packagingProfileId
          }
        : null,
      materialProfile: materialProfile
        ? {
            thicknessIn: Number(materialProfile.thicknessIn),
            defaultEdgeBandPattern: materialProfile.defaultEdgeBandPattern as any
          }
        : null,
      defaultCostProfileId: defaults.costProfileId,
      defaultProductionAssumptionProfileId: defaults.productionAssumptionProfileId,
      defaultPricingPolicyId: defaults.pricingPolicyId
    });

    if (normalized.ok) {
      await updateSalesOrderItem(item.id, {
        normalizedSpecJson: normalized.normalizedSpec as any,
        normalizationStatus: "NORMALIZED",
        normalizationErrorsJson: Prisma.JsonNull,
        pricingStatus: "PENDING"
      });
      normalizedItems.push({ itemId: item.id, ok: true });
    } else {
      await updateSalesOrderItem(item.id, {
        normalizedSpecJson: Prisma.JsonNull,
        normalizationStatus: normalized.errors.some(isValidationError) ? "ERROR" : "HOLD",
        normalizationErrorsJson: normalized.errors as any,
        pricingStatus: "HOLD"
      });
      normalizedItems.push({ itemId: item.id, ok: false, errors: normalized.errors });
    }
  }

  const refreshed = await getSalesOrderById(orderId, organizationId);
  if (refreshed) {
    await prisma.salesOrder.update({
      where: { id: refreshed.id },
      data: {
        status: deriveOrderStatus(refreshed.items, refreshed.shelfJobs.length > 0)
      }
    });
  }

  return { ok: true as const, items: normalizedItems };
}

export async function priceSalesOrder(orderId: string, organizationId: string, createdByUserId?: string) {
  const order = await getSalesOrderById(orderId, organizationId);
  if (!order) {
    throw new Error("Sales order not found.");
  }

  const results = [];

  for (const item of order.items) {
    if (item.normalizationStatus !== "NORMALIZED" || !item.normalizedSpecJson) {
      continue;
    }

    const spec = item.normalizedSpecJson as Record<string, any>;

    try {
      const pricing = await createPricingScenarioSnapshot(
        {
          costProfileId: spec.costProfileId,
          productionAssumptionProfileId: spec.productionAssumptionProfileId,
          packagingProfileId: spec.packagingProfileId,
          pricingPolicyId: spec.pricingPolicyId,
          sourceType: "ORDER",
          sourceId: item.id,
          input: {
            shelfProductId: spec.shelfProductId,
            costProfileId: spec.costProfileId,
            productionAssumptionProfileId: spec.productionAssumptionProfileId,
            packagingProfileId: spec.packagingProfileId,
            pricingPolicyId: spec.pricingPolicyId,
            lengthIn: spec.lengthIn,
            depthIn: spec.depthIn,
            thicknessIn: spec.thicknessIn,
            quantity: spec.quantity,
            materialType: spec.materialType,
            edgeBandPattern: spec.edgeBandPattern,
            requiresPackaging: spec.requiresPackaging
          },
          createdByUserId
        },
        organizationId
      );

      await updateSalesOrderItem(item.id, {
        pricingStatus: "PRICED",
        pricingSnapshotJson: {
          scenarioId: pricing.scenario.id,
          result: pricing.result
        } as any
      });
      results.push({ itemId: item.id, ok: true });
    } catch (error) {
      await updateSalesOrderItem(item.id, {
        pricingStatus: error instanceof Error && error.message.includes("not found") ? "HOLD" : "ERROR",
        pricingSnapshotJson: {
          error: error instanceof Error ? error.message : "Unknown pricing error."
        } as any
      });
      results.push({ itemId: item.id, ok: false, error: error instanceof Error ? error.message : "Unknown pricing error." });
    }
  }

  const refreshed = await getSalesOrderById(orderId, organizationId);
  if (refreshed) {
    await prisma.salesOrder.update({
      where: { id: refreshed.id },
      data: {
        status: deriveOrderStatus(refreshed.items, refreshed.shelfJobs.length > 0)
      }
    });
  }

  return { ok: true as const, items: results };
}

export async function createShelfJobsFromSalesOrder(orderId: string, organizationId: string) {
  const order = await getSalesOrderById(orderId, organizationId);
  if (!order) {
    throw new Error("Sales order not found.");
  }

  const created = [];
  for (const item of order.items) {
    if (item.pricingStatus !== "PRICED" || item.normalizationStatus !== "NORMALIZED" || !item.normalizedSpecJson) {
      continue;
    }
    const existing = await prisma.shelfJob.findFirst({
      where: { salesOrderItemId: item.id, organizationId }
    });
    if (existing) {
      continue;
    }

    const spec = item.normalizedSpecJson as Record<string, any>;
    const pricingSnapshot = (item.pricingSnapshotJson ?? {}) as Record<string, any>;
    const job = await createShelfJob({
      organizationId,
      salesOrderId: order.id,
      salesOrderItemId: item.id,
      shelfProductId: spec.shelfProductId,
      costProfileId: spec.costProfileId,
      productionAssumptionProfileId: spec.productionAssumptionProfileId,
      packagingProfileId: spec.packagingProfileId,
      pricingPolicyId: spec.pricingPolicyId,
      pricingScenarioId: pricingSnapshot.scenarioId,
      normalizedSpecJson: spec,
      quantity: spec.quantity
    });
    created.push(job.id);
  }

  const refreshed = await getSalesOrderById(orderId, organizationId);
  if (refreshed) {
    const totalShelfJobs = refreshed.shelfJobs.length + created.length;
    await prisma.salesOrder.update({
      where: { id: refreshed.id },
      data: {
        status: totalShelfJobs > 0 ? "READY" : deriveOrderStatus(refreshed.items, false)
      }
    });
  }

  return { ok: true as const, shelfJobIds: created };
}

export async function getShelfJobs(organizationId: string) {
  const jobs = await listShelfJobs(organizationId);
  return { ok: true as const, shelfJobs: jobs.map(mapShelfJob) };
}

export async function getShelfJob(jobId: string, organizationId: string) {
  const job = await getShelfJobById(jobId, organizationId);
  if (!job) {
    throw new Error("Shelf job not found.");
  }
  return { ok: true as const, shelfJob: mapShelfJob(job) };
}

export async function convertShelfJobsToManufacturingPacket(input: {
  shelfJobIds: string[];
  organizationId: string;
  createdByUserId?: string;
}) {
  const shelfJobs = await prisma.shelfJob.findMany({
    where: {
      organizationId: input.organizationId,
      id: { in: input.shelfJobIds }
    },
    orderBy: { createdAt: "asc" }
  });

  const readyJobs = shelfJobs.filter((job) => job.jobStatus === "READY");
  if (readyJobs.length === 0) {
    throw new Error("No READY shelf jobs available for manufacturing packet conversion.");
  }
  if (readyJobs.length !== input.shelfJobIds.length) {
    throw new Error("Only READY shelf jobs can be converted into a manufacturing packet.");
  }

  const packetCount = await prisma.manufacturingPacket.count({
    where: { organizationId: input.organizationId }
  });
  const packetNumber = `MP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(packetCount + 1).padStart(3, "0")}`;
  const summary = buildManufacturingPacketSummary({
    packetNumber,
    shelfJobs: readyJobs.map((job) => ({
      id: job.id,
      salesOrderId: job.salesOrderId,
      salesOrderItemId: job.salesOrderItemId,
      quantity: job.quantity,
      normalizedSpecJson: job.normalizedSpecJson as Record<string, unknown>
    }))
  });

  const packet = await createManufacturingPacket({
    organizationId: input.organizationId,
    packetNumber,
    sourceType: "SHELF_JOB",
    sourceIdsJson: readyJobs.map((job) => job.id),
    summaryJson: summary,
    createdByUserId: input.createdByUserId
  });

  await prisma.$transaction(async (tx) => {
    await tx.shelfJob.updateMany({
      where: { id: { in: readyJobs.map((job) => job.id) } },
      data: {
        jobStatus: "CONVERTED_TO_MANUFACTURING",
        manufacturingPacketId: packet.id
      }
    });

    const salesOrderIds = Array.from(new Set(readyJobs.map((job) => job.salesOrderId)));
    for (const salesOrderId of salesOrderIds) {
      const remainingReadyJobs = await tx.shelfJob.count({
        where: {
          organizationId: input.organizationId,
          salesOrderId,
          jobStatus: "READY"
        }
      });

      await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: {
          status: remainingReadyJobs === 0 ? "CONVERTED" : "READY"
        }
      });
    }
  });

  return {
    ok: true as const,
    packet: mapPacket(packet)
  };
}

export async function getManufacturingPackets(organizationId: string) {
  const packets = await listManufacturingPackets(organizationId);
  return {
    ok: true as const,
    packets: packets.map(mapPacket)
  };
}

export async function getManufacturingPacket(packetId: string, organizationId: string) {
  const packet = await getManufacturingPacketById(packetId, organizationId);
  if (!packet) {
    throw new Error("Manufacturing packet not found.");
  }
  return {
    ok: true as const,
    packet: mapPacket(packet)
  };
}
