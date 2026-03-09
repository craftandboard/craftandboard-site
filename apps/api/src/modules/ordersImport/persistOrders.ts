import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { NormalizedOrderInput } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { createPricingScenarioSnapshot } from "../pricing/service.js";
import { scanCodeForPartId } from "../parts/scanCode.js";
import { ensureDefaultProfiles, LOCAL_ORG_ID, LOCAL_ORG_NAME, LOCAL_ORG_SLUG } from "../settings/service.js";
import { normalizeShelfOrderItem } from "../orderIntake/normalizer.js";
import { buildPartInstances } from "./buildPartInstances.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? value.toNumber() : null;
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

export async function persistNormalizedOrders(
  orders: NormalizedOrderInput[],
  organizationId = LOCAL_ORG_ID
) {
  const canonicalDefaults = await getCanonicalImportDefaults(organizationId);

  await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: LOCAL_ORG_NAME, slug: LOCAL_ORG_SLUG },
    create: { id: organizationId, name: LOCAL_ORG_NAME, slug: LOCAL_ORG_SLUG }
  });

  let lineItemsCreated = 0;
  let partsCreated = 0;

  for (const normalizedOrder of orders) {
    const sourceType = normalizedOrder.amazonOrderId ? "AMAZON" : "CSV";

    const existingSalesOrder = await prisma.salesOrder.findFirst({
      where: {
        organizationId,
        sourceType,
        sourceOrderId: normalizedOrder.externalOrderId
      },
      select: { id: true }
    });

    const salesOrderRecord = existingSalesOrder
      ? await prisma.salesOrder.update({
          where: { id: existingSalesOrder.id },
          data: {
            sourceStatus: normalizedOrder.status,
            customerName: normalizedOrder.customerName,
            shipToName: normalizedOrder.shipToName ?? null,
            orderedAt: new Date(normalizedOrder.orderDate),
            currency: "USD"
          }
        })
      : await prisma.salesOrder.create({
          data: {
            organizationId,
            sourceType,
            sourceOrderId: normalizedOrder.externalOrderId,
            sourceStatus: normalizedOrder.status,
            customerName: normalizedOrder.customerName,
            shipToName: normalizedOrder.shipToName ?? null,
            orderedAt: new Date(normalizedOrder.orderDate),
            currency: "USD"
          }
        });

    const orderRecord = await prisma.order.upsert({
      where: { externalOrderId: normalizedOrder.externalOrderId },
      update: {
        salesOrderId: salesOrderRecord.id,
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
        organizationId,
        salesOrderId: salesOrderRecord.id,
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
        select: { id: true }
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

      let shelfJobId: string | null = null;
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

        const shelfJob = existingShelfJob
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

        shelfJobId = shelfJob.id;
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
        const partRows = partInstances
          .map((part) => ({
            id: randomUUID(),
            organizationId,
            orderId: orderRecord.id,
            orderItemId: orderItemRecord.id,
            scanCode: "",
            name: part.name,
            partCode: part.partCode,
            qrPayload: part.qrPayload,
            instanceNumber: part.instanceNumber,
            materialCode: part.materialCode,
            edgeBandPattern: "ALL_FOUR" as const,
            widthIn: decimal(part.widthIn),
            depthIn: decimal(part.depthIn),
            thicknessIn: decimal(part.thicknessIn),
            serialNumber: part.instanceNumber,
            shipByDate: part.shipByDate,
            customerLastName: part.customerLastName,
            status: part.status
          }))
          .map((part) => ({
            ...part,
            scanCode: scanCodeForPartId(part.id)
          }));

        await prisma.part.createMany({
          data: partRows
        });
      }

      lineItemsCreated += 1;
      partsCreated += partInstances.length;

      if (shelfJobId) {
        await prisma.manufacturingJob.upsert({
          where: { shelfJobId },
          update: {
            organizationId,
            orderId: orderRecord.id,
            orderItemId: orderItemRecord.id,
            source: "AMAZON",
            status: "DRAFT",
            channel: "AMAZON",
            partType: "SHELF",
            materialCode: item.materialCode,
            edgeBandPattern: item.edgeBandPattern,
            widthIn: decimal(item.widthIn),
            depthIn: decimal(item.depthIn),
            thicknessIn: decimal(item.thicknessIn),
            quantity: item.quantity,
            unit: "IN",
            manufacturingMode: "CUT_AND_EDGE",
            labelCode: `${item.productLabel}-${item.materialCode}`
          },
          create: {
            organizationId,
            orderId: orderRecord.id,
            orderItemId: orderItemRecord.id,
            shelfJobId,
            source: "AMAZON",
            status: "DRAFT",
            channel: "AMAZON",
            partType: "SHELF",
            materialCode: item.materialCode,
            edgeBandPattern: item.edgeBandPattern,
            widthIn: decimal(item.widthIn),
            depthIn: decimal(item.depthIn),
            thicknessIn: decimal(item.thicknessIn),
            quantity: item.quantity,
            unit: "IN",
            manufacturingMode: "CUT_AND_EDGE",
            labelCode: `${item.productLabel}-${item.materialCode}`
          }
        });
      }
    }
  }

  return {
    ordersImported: orders.length,
    lineItemsImported: lineItemsCreated,
    partsExpanded: partsCreated
  };
}
