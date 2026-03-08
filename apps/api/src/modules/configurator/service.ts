import type {
  PersistedShelfManufacturingJob,
  PersistedShelfManufacturingPart,
  ShelfConfiguratorInput,
  ShelfManufacturingPart,
  ShelfNormalizedSpec,
  ShelfQuoteRequest,
  ShelfQuoteResult,
  ShelfValidationResult
} from '@craft-and-board/shared';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { LOCAL_ORG_ID } from '../settings/service.js';
import { getMaterialProfile } from '../settings/service.js';
import { productLabel } from '../productionBundles/naming.js';
import { scanCodeForPartId } from '../parts/scanCode.js';

function roundToNearestEighth(value: number) {
  return Math.round(value * 8) / 8;
}

function validateBounds(widthIn: number, depthIn: number) {
  const errors: string[] = [];

  if (widthIn < 8 || widthIn > 35) {
    errors.push('Width must be between 8 and 35 inches.');
  }

  if (depthIn < 8 || depthIn > 24) {
    errors.push('Depth must be between 8 and 24 inches.');
  }

  return errors;
}

function formatDimension(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, '');
}

function materialLabelCode(materialCode: ShelfNormalizedSpec['materialCode']) {
  switch (materialCode) {
    case 'WHITE_MELAMINE':
      return 'WM';
    case 'MAPLE_MELAMINE':
      return 'MM';
    default:
      return 'GEN';
  }
}

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function validateShelfConfiguratorInput(
  input: ShelfConfiguratorInput,
  organizationId = LOCAL_ORG_ID
): Promise<ShelfValidationResult> {
  if (process.env.DATABASE_URL) {
    try {
      await getMaterialProfile(input.materialCode, organizationId);
    } catch {
      if (!['WHITE_MELAMINE', 'MAPLE_MELAMINE'].includes(input.materialCode)) {
        throw new Error(`Unsupported material code: ${input.materialCode}`);
      }
    }
  } else if (!['WHITE_MELAMINE', 'MAPLE_MELAMINE'].includes(input.materialCode)) {
    throw new Error(`Unsupported material code: ${input.materialCode}`);
  }

  const normalizedWidthIn = Number(roundToNearestEighth(input.widthIn).toFixed(3));
  const normalizedDepthIn = Number(roundToNearestEighth(input.depthIn).toFixed(3));
  const errors = validateBounds(normalizedWidthIn, normalizedDepthIn);
  const warnings: string[] = [];

  if (input.quantity < 1) {
    errors.push('Quantity must be at least 1.');
  }

  return {
    valid: errors.length === 0,
    normalizedWidthIn,
    normalizedDepthIn,
    materialCode: input.materialCode,
    errors,
    warnings
  };
}

export async function normalizeShelfConfiguratorInput(
  input: ShelfConfiguratorInput,
  organizationId = LOCAL_ORG_ID
): Promise<ShelfNormalizedSpec> {
  const validation = await validateShelfConfiguratorInput(input, organizationId);

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  return {
    widthIn: validation.normalizedWidthIn,
    depthIn: validation.normalizedDepthIn,
    thicknessIn: 0.75,
    materialCode: input.materialCode,
    edgeBandPattern: 'ALL_FOUR',
    quantity: input.quantity,
    channel: input.channel,
    productLabel: productLabel(input.materialCode as 'WHITE_MELAMINE' | 'MAPLE_MELAMINE')
  };
}

export async function quoteShelf(
  input: ShelfQuoteRequest,
  organizationId = LOCAL_ORG_ID
): Promise<ShelfQuoteResult> {
  const spec = await normalizeShelfConfiguratorInput(input, organizationId);
  const areaSqFt = (spec.widthIn * spec.depthIn) / 144;
  const baseRate = spec.materialCode === 'MAPLE_MELAMINE' ? 18 : 14;
  const unitPrice = Number((baseRate + areaSqFt * 9.5).toFixed(2));

  return {
    spec,
    unitPrice,
    totalPrice: Number((unitPrice * spec.quantity).toFixed(2)),
    estimatedLeadTimeDays: 7,
    pricingVersion: 'v1-local'
  };
}

export async function translateShelfToManufacturingPart(
  input: ShelfConfiguratorInput,
  organizationId = LOCAL_ORG_ID
): Promise<ShelfManufacturingPart> {
  const spec = await normalizeShelfConfiguratorInput(input, organizationId);

  return {
    partType: 'SHELF',
    width: spec.widthIn,
    depth: spec.depthIn,
    thickness: spec.thicknessIn,
    material: spec.materialCode,
    edgeBandPattern: spec.edgeBandPattern,
    quantity: spec.quantity,
    unit: 'IN',
    manufacturingMode: 'CUT_AND_EDGE',
    labelCode: `SHELF-${materialLabelCode(spec.materialCode)}-${formatDimension(spec.widthIn)}x${formatDimension(spec.depthIn)}`,
    grainDirection: 'WIDTH',
    cutMethod: 'RECTANGLE_CUT',
    source: 'CONFIGURATOR'
  };
}

export async function createManufacturingJobFromConfigurator(
  input: ShelfConfiguratorInput,
  organizationId = LOCAL_ORG_ID
): Promise<{
  job: PersistedShelfManufacturingJob;
  parts: PersistedShelfManufacturingPart[];
}> {
  const spec = await normalizeShelfConfiguratorInput(input, organizationId);
  const translated = await translateShelfToManufacturingPart(input, organizationId);
  const shipByDate = startOfTodayUtc();

  return prisma.$transaction(async (tx) => {
    const jobRecord = await tx.manufacturingJob.create({
      data: {
        organizationId,
        source: 'CONFIGURATOR',
        status: 'DRAFT',
        channel: spec.channel,
        partType: translated.partType,
        materialCode: spec.materialCode,
        edgeBandPattern: spec.edgeBandPattern,
        widthIn: decimal(spec.widthIn),
        depthIn: decimal(spec.depthIn),
        thicknessIn: decimal(spec.thicknessIn),
        quantity: spec.quantity,
        unit: translated.unit,
        manufacturingMode: translated.manufacturingMode,
        labelCode: translated.labelCode
      }
    });

    const orderExternalId = `CFG-${jobRecord.id}`;
    const orderRecord = await tx.order.create({
      data: {
        organizationId,
        externalOrderId: orderExternalId,
        externalRef: orderExternalId,
        orderDate: shipByDate,
        purchaseDate: shipByDate,
        shipByDate,
        customerName: `Configurator ${spec.channel}`,
        customerFullName: `Configurator ${spec.channel}`,
        customerLastName: 'Configurator',
        status: 'READY_FOR_BATCH',
        channel: spec.channel,
        rawPayload: toJsonValue({
          source: 'CONFIGURATOR',
          input,
          translated
        })
      }
    });

    const orderItemRecord = await tx.orderItem.create({
      data: {
        organizationId,
        orderId: orderRecord.id,
        externalOrderItemId: `${orderExternalId}-ITEM-01`,
        sku: translated.labelCode,
        title: spec.productLabel,
        productLabel: spec.productLabel,
        quantity: spec.quantity,
        materialCode: spec.materialCode,
        edgeBandPattern: spec.edgeBandPattern,
        widthIn: decimal(spec.widthIn),
        depthIn: decimal(spec.depthIn),
        thicknessIn: decimal(spec.thicknessIn),
        sourceLengthIn: decimal(spec.widthIn),
        sourceDepthIn: decimal(spec.depthIn),
        sourceEdgeBandText: spec.edgeBandPattern,
        sourceCustomizationJson: toJsonValue({
          source: 'CONFIGURATOR'
        }),
        notes: 'Generated from configurator input.',
        rawPayload: toJsonValue({
          source: 'CONFIGURATOR',
          jobId: jobRecord.id,
          translated
        })
      }
    });

    await tx.manufacturingJob.update({
      where: { id: jobRecord.id },
      data: {
        orderId: orderRecord.id,
        orderItemId: orderItemRecord.id
      }
    });

    const createdParts = await Promise.all(
      Array.from({ length: spec.quantity }, async (_, index) => {
        const instanceNumber = index + 1;
        const partId = randomUUID();
        const partCode = `CFG-${jobRecord.id}-P${String(instanceNumber).padStart(2, '0')}`;
        const labelCode = `${translated.labelCode}-P${String(instanceNumber).padStart(2, '0')}`;

        return tx.part.create({
          data: {
            organizationId,
            id: partId,
            orderId: orderRecord.id,
            orderItemId: orderItemRecord.id,
            manufacturingJobId: jobRecord.id,
            scanCode: scanCodeForPartId(partId),
            name: `${spec.productLabel} Configurator`,
            partCode,
            qrPayload: `cb://${partCode}`,
            serialNumber: instanceNumber,
            instanceNumber,
            materialCode: spec.materialCode,
            edgeBandPattern: spec.edgeBandPattern,
            widthIn: decimal(spec.widthIn),
            depthIn: decimal(spec.depthIn),
            thicknessIn: decimal(spec.thicknessIn),
            shipByDate,
            customerLastName: 'Configurator',
            status: 'READY_FOR_BATCH'
          }
        }).then((part) => ({
          id: part.id,
          partType: translated.partType,
          width: spec.widthIn,
          depth: spec.depthIn,
          thickness: spec.thicknessIn,
          material: spec.materialCode,
          edgeBandPattern: spec.edgeBandPattern,
          quantity: 1,
          scanCode: part.scanCode ?? scanCodeForPartId(part.id),
          unit: translated.unit,
          manufacturingMode: translated.manufacturingMode,
          labelCode,
          grainDirection: translated.grainDirection,
          cutMethod: translated.cutMethod,
          source: translated.source
        }));
      })
    );

    return {
      job: {
        id: jobRecord.id,
        status: 'DRAFT',
        source: 'CONFIGURATOR'
      },
      parts: createdParts
    };
  });
}
