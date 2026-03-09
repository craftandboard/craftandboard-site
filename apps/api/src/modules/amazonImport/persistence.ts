import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { AmazonImportResult, NormalizedOrderInput } from "./types.js";
import { prisma } from "../../lib/prisma.js";
import { translateShelfToManufacturingPart } from "../configurator/service.js";
import { createPricingScenarioSnapshot } from "../pricing/service.js";
import { scanCodeForPartId } from "../parts/scanCode.js";
import { ensureDefaultProfiles, LOCAL_ORG_ID, LOCAL_ORG_NAME, LOCAL_ORG_SLUG } from "../settings/service.js";
import { normalizeShelfOrderItem } from "../orderIntake/normalizer.js";
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

async function getCanonicalImportDefaults(organizationId: string) {
  await ensureDefaultProfiles();

  const [costProfile, productionProfile, pricingPolicy, packagingProfile, shelfProducts] = await Promise.all([
    prisma.costProfile.findFirst({
      where: { organizationId, isDefault: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.productionAssumptionProfile.findFirst({
      where: { organizationId, isDefault: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.pricingPolicy.findFirst({
      where: { organizationId, isDefault: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.packagingProfile.findFirst({
      where: { organizationId, isActive: true },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
    }),
    prisma.shelfProduct.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    costProfileId: costProfile?.id,
    productionAssumptionProfileId: productionProfile?.id,
    pricingPolicyId: pricingPolicy?.id,
    packagingProfileId: packagingProfile?.id,
    shelfProducts
  };
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? value.toNumber() : null;
}

function resolveShelfProductId(input: {
  shelfProducts: Array<{
    id: string;
    materialType: string;
    defaultThicknessIn: Prisma.Decimal;
  }>;
  materialType: string;
  thicknessIn: number;
}) {
  const match = input.shelfProducts.find(
    (product) =>
      product.materialType === input.materialType &&
      decimalToNumber(product.defaultThicknessIn) === input.thicknessIn
  );

  return match?.id;
}

export async function persistAmazonOrders(
  orders: NormalizedOrderInput[],
  organizationId = LOCAL_ORG_ID
): Promise<Omit<AmazonImportResult, "filesProcessed" | "warnings" | "errors">> {
  await ensureOrganization(organizationId);
  const canonicalDefaults = await getCanonicalImportDefaults(organizationId);

  let ordersCreated = 0;
  let orderItemsCreated = 0;
  let partInstancesCreated = 0;
  let jobsCreated = 0;
  let salesOrdersCreated = 0;
  let salesOrderItemsCreated = 0;
  let shelfJobsCreated = 0;

  const createdOrders: AmazonImportResult["orders"] = [];
  const createdJobs: AmazonImportResult["jobs"] = [];
  const partLookupRows: Array<{
    manufacturingJobId: string;
    orderId: string;
    orderItemId: string;
  }> = [];

  for (const order of orders) {
    const existingSalesOrder = await prisma.salesOrder.findFirst({
      where: {
        organizationId,
        sourceType: "AMAZON",
        sourceOrderId: order.externalOrderId
      },
      select: { id: true }
    });

    const salesOrderRecord = existingSalesOrder
      ? await prisma.salesOrder.update({
          where: { id: existingSalesOrder.id },
          data: {
            sourceStatus: order.status,
            customerName: order.customerName,
            customerEmail: null,
            shipToName: order.shipToName ?? null,
            orderedAt: new Date(order.orderDate),
            currency: "USD",
            notes: null
          }
        })
      : await prisma.salesOrder.create({
          data: {
            organizationId,
            sourceType: "AMAZON",
            sourceOrderId: order.externalOrderId,
            sourceStatus: order.status,
            customerName: order.customerName,
            customerEmail: null,
            shipToName: order.shipToName ?? null,
            shipToAddressJson: Prisma.JsonNull,
            orderedAt: new Date(order.orderDate),
            currency: "USD"
          }
        });

    if (!existingSalesOrder) {
      salesOrdersCreated += 1;
    }

    const orderRecord = await prisma.order.upsert({
      where: { amazonOrderId: order.amazonOrderId },
      update: {
        salesOrderId: salesOrderRecord.id,
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
        salesOrderId: salesOrderRecord.id,
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
      const shelfProductId = resolveShelfProductId({
        shelfProducts: canonicalDefaults.shelfProducts,
        materialType: item.materialCode,
        thicknessIn: item.thicknessIn
      });

      const existingSalesOrderItem = await prisma.salesOrderItem.findFirst({
        where: {
          organizationId,
          salesOrderId: salesOrderRecord.id,
          sourceLineId: item.externalOrderItemId
        },
        select: { id: true, pricingSnapshotJson: true }
      });

      const salesOrderItemRecord = existingSalesOrderItem
        ? await prisma.salesOrderItem.update({
            where: { id: existingSalesOrderItem.id },
            data: {
              shelfProductId: shelfProductId ?? null,
              sku: item.sku,
              title: item.title,
              quantity: item.quantity,
              lengthIn: decimal(item.widthIn),
              depthIn: decimal(item.depthIn),
              thicknessIn: decimal(item.thicknessIn),
              materialType: item.materialCode,
              edgeBandPattern: item.edgeBandPattern,
              requiresPackaging: true,
              packagingProfileId: canonicalDefaults.packagingProfileId ?? null,
              customizationJson: item.sourceCustomizationJson
                ? toJsonValue(item.sourceCustomizationJson)
                : Prisma.JsonNull,
              notes: item.notes ?? null
            },
            include: { shelfProduct: true }
          })
        : await prisma.salesOrderItem.create({
            data: {
              organizationId,
              salesOrderId: salesOrderRecord.id,
              sourceLineId: item.externalOrderItemId,
              shelfProductId: shelfProductId ?? null,
              sku: item.sku,
              title: item.title,
              quantity: item.quantity,
              lengthIn: decimal(item.widthIn),
              depthIn: decimal(item.depthIn),
              thicknessIn: decimal(item.thicknessIn),
              materialType: item.materialCode,
              edgeBandPattern: item.edgeBandPattern,
              requiresPackaging: true,
              packagingProfileId: canonicalDefaults.packagingProfileId ?? null,
              customizationJson: item.sourceCustomizationJson
                ? toJsonValue(item.sourceCustomizationJson)
                : Prisma.JsonNull,
              notes: item.notes ?? null
            },
            include: { shelfProduct: true }
          });

      if (!existingSalesOrderItem) {
        salesOrderItemsCreated += 1;
      }

      const normalized = normalizeShelfOrderItem({
        item: {
          id: salesOrderItemRecord.id,
          title: salesOrderItemRecord.title,
          quantity: salesOrderItemRecord.quantity,
          lengthIn: decimalToNumber(salesOrderItemRecord.lengthIn),
          depthIn: decimalToNumber(salesOrderItemRecord.depthIn),
          thicknessIn: decimalToNumber(salesOrderItemRecord.thicknessIn),
          materialType: salesOrderItemRecord.materialType as any,
          edgeBandPattern: salesOrderItemRecord.edgeBandPattern as any,
          requiresPackaging: salesOrderItemRecord.requiresPackaging,
          shelfProductId: salesOrderItemRecord.shelfProductId,
          packagingProfileId: salesOrderItemRecord.packagingProfileId
        },
        shelfProduct: salesOrderItemRecord.shelfProduct
          ? {
              id: salesOrderItemRecord.shelfProduct.id,
              name: salesOrderItemRecord.shelfProduct.name,
              materialType: salesOrderItemRecord.shelfProduct.materialType as any,
              defaultThicknessIn: Number(salesOrderItemRecord.shelfProduct.defaultThicknessIn),
              defaultEdgeBandPattern: salesOrderItemRecord.shelfProduct.defaultEdgeBandPattern as any,
              packagingProfileId: salesOrderItemRecord.shelfProduct.packagingProfileId
            }
          : null,
        materialProfile: {
          thicknessIn: item.thicknessIn,
          defaultEdgeBandPattern: item.edgeBandPattern
        },
        defaultCostProfileId: canonicalDefaults.costProfileId,
        defaultProductionAssumptionProfileId: canonicalDefaults.productionAssumptionProfileId,
        defaultPricingPolicyId: canonicalDefaults.pricingPolicyId
      });

      let shelfJobRecord: { id: string } | null = null;
      let pricingScenarioId: string | null = null;

      if (normalized.ok) {
        const spec = normalized.normalizedSpec;
        if (
          !spec.costProfileId ||
          !spec.productionAssumptionProfileId ||
          !spec.pricingPolicyId ||
          typeof spec.lengthIn !== "number" ||
          typeof spec.depthIn !== "number"
        ) {
          throw new Error("Canonical import normalization produced incomplete pricing inputs.");
        }

        const pricing = await createPricingScenarioSnapshot(
          {
            shelfProductId: spec.shelfProductId,
            costProfileId: spec.costProfileId,
            productionAssumptionProfileId: spec.productionAssumptionProfileId,
            packagingProfileId: spec.packagingProfileId,
            pricingPolicyId: spec.pricingPolicyId,
            sourceType: "ORDER",
            sourceId: salesOrderItemRecord.id,
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
            }
          },
          organizationId
        );

        pricingScenarioId = pricing.scenario.id;

        await prisma.salesOrderItem.update({
          where: { id: salesOrderItemRecord.id },
          data: {
            normalizedSpecJson: normalized.normalizedSpec as Prisma.InputJsonValue,
            normalizationStatus: "NORMALIZED",
            normalizationErrorsJson: Prisma.JsonNull,
            pricingStatus: "PRICED",
            pricingSnapshotJson: {
              scenarioId: pricing.scenario.id,
              result: pricing.result
            } as Prisma.InputJsonValue
          }
        });

        const existingShelfJob = await prisma.shelfJob.findFirst({
          where: { organizationId, salesOrderItemId: salesOrderItemRecord.id },
          select: { id: true }
        });

        shelfJobRecord = existingShelfJob
          ? await prisma.shelfJob.update({
              where: { id: existingShelfJob.id },
              data: {
                salesOrderId: salesOrderRecord.id,
                shelfProductId: spec.shelfProductId ?? null,
                costProfileId: spec.costProfileId,
                productionAssumptionProfileId: spec.productionAssumptionProfileId,
                packagingProfileId: spec.packagingProfileId ?? null,
                pricingPolicyId: spec.pricingPolicyId,
                pricingScenarioId: pricing.scenario.id,
                normalizedSpecJson: spec as Prisma.InputJsonValue,
                quantity: spec.quantity,
                jobStatus: "READY"
              }
            })
          : await prisma.shelfJob.create({
              data: {
                organizationId,
                salesOrderId: salesOrderRecord.id,
                salesOrderItemId: salesOrderItemRecord.id,
                shelfProductId: spec.shelfProductId ?? null,
                costProfileId: spec.costProfileId,
                productionAssumptionProfileId: spec.productionAssumptionProfileId,
                packagingProfileId: spec.packagingProfileId ?? null,
                pricingPolicyId: spec.pricingPolicyId,
                pricingScenarioId: pricing.scenario.id,
                normalizedSpecJson: spec as Prisma.InputJsonValue,
                quantity: spec.quantity,
                jobStatus: "READY"
              }
            });

        if (!existingShelfJob) {
          shelfJobsCreated += 1;
        }
      } else {
        await prisma.salesOrderItem.update({
          where: { id: salesOrderItemRecord.id },
          data: {
            normalizedSpecJson: Prisma.JsonNull,
            normalizationStatus: "HOLD",
            normalizationErrorsJson: normalized.errors as Prisma.InputJsonValue,
            pricingStatus: "HOLD"
          }
        });
      }

      const orderItemRecord = await prisma.orderItem.upsert({
        where: { externalOrderItemId: item.externalOrderItemId },
        update: {
          orderId: orderRecord.id,
          salesOrderItemId: salesOrderItemRecord.id,
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
          salesOrderItemId: salesOrderItemRecord.id,
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
        shelfJobId: shelfJobRecord?.id ?? null,
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
    salesOrdersCreated,
    salesOrderItemsCreated,
    shelfJobsCreated,
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
