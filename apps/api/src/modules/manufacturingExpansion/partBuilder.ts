import { randomUUID } from "node:crypto";

function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function validateExpandableShelfJob(job: {
  id: string;
  quantity: number;
  normalizedSpecJson: Record<string, unknown>;
}) {
  const spec = job.normalizedSpecJson ?? {};
  const errors: string[] = [];

  const lengthIn = asNumber(spec.lengthIn);
  const depthIn = asNumber(spec.depthIn);
  const thicknessIn = asNumber(spec.thicknessIn);
  const materialType = asString(spec.materialType);
  const edgeBandPattern = asString(spec.edgeBandPattern);

  if (!Number.isInteger(job.quantity) || job.quantity <= 0) {
    errors.push(`Shelf job ${job.id} has invalid quantity.`);
  }
  if (!lengthIn || lengthIn <= 0) {
    errors.push(`Shelf job ${job.id} is missing valid lengthIn.`);
  }
  if (!depthIn || depthIn <= 0) {
    errors.push(`Shelf job ${job.id} is missing valid depthIn.`);
  }
  if (!thicknessIn || thicknessIn <= 0) {
    errors.push(`Shelf job ${job.id} is missing valid thicknessIn.`);
  }
  if (!materialType) {
    errors.push(`Shelf job ${job.id} is missing materialType.`);
  }
  if (!edgeBandPattern) {
    errors.push(`Shelf job ${job.id} is missing edgeBandPattern.`);
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    spec: {
      title: asString(spec.title),
      lengthIn: lengthIn!,
      depthIn: depthIn!,
      thicknessIn: thicknessIn!,
      materialType: materialType! as any,
      edgeBandPattern: edgeBandPattern! as any,
      requiresPackaging: spec.requiresPackaging === true,
      shelfProductId: asString(spec.shelfProductId)
    }
  };
}

export function buildManufacturingPartsForPacket(input: {
  packetId: string;
  packetNumber: string;
  jobs: Array<{
    id: string;
    salesOrderId: string;
    salesOrderItemId: string;
    quantity: number;
    normalizedSpecJson: Record<string, unknown>;
    salesOrderItem: { title: string };
  }>;
}) {
  const parts: Array<Record<string, unknown>> = [];
  let sequence = 1;

  for (const job of input.jobs) {
    const validation = validateExpandableShelfJob(job);
    if (!validation.ok) {
      return validation;
    }

    for (let unitIndex = 1; unitIndex <= job.quantity; unitIndex += 1) {
      const partNumber = `${input.packetNumber}-P${String(sequence).padStart(4, "0")}`;
      const id = randomUUID();
      const labelDataJson = {
        partId: id,
        partNumber,
        packetNumber: input.packetNumber,
        batchNumber: null,
        salesOrderId: job.salesOrderId,
        salesOrderItemId: job.salesOrderItemId,
        shelfJobId: job.id,
        productName: validation.spec.title ?? job.salesOrderItem.title,
        material: validation.spec.materialType,
        thicknessIn: validation.spec.thicknessIn,
        lengthIn: validation.spec.lengthIn,
        depthIn: validation.spec.depthIn,
        edgeBandPattern: validation.spec.edgeBandPattern,
        unitIndex,
        totalQuantity: job.quantity,
        requiresPackaging: validation.spec.requiresPackaging,
        barcodeValue: `PART:${partNumber}`,
        qrValue: `PART:${partNumber}`
      };

      parts.push({
        id,
        manufacturingPacketId: input.packetId,
        shelfJobId: job.id,
        salesOrderId: job.salesOrderId,
        salesOrderItemId: job.salesOrderItemId,
        partNumber,
        serialNumber: null,
        unitIndex,
        quantity: 1,
        partType: "SHELF",
        materialType: validation.spec.materialType,
        thicknessIn: validation.spec.thicknessIn,
        lengthIn: validation.spec.lengthIn,
        depthIn: validation.spec.depthIn,
        edgeBandPattern: validation.spec.edgeBandPattern,
        requiresPackaging: validation.spec.requiresPackaging,
        labelDataJson,
        sortGroup: job.salesOrderId
      });
      sequence += 1;
    }
  }

  return {
    ok: true as const,
    parts
  };
}
