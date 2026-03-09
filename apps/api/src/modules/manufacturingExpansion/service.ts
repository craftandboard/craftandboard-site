import { prisma } from "../../lib/prisma.js";
import { buildManufacturingBatchNumber } from "./batching.js";
import { buildManufacturingPartsForPacket } from "./partBuilder.js";
import {
  addPartsToManufacturingBatch,
  createLabelTemplateVersion,
  createManufacturingBatch,
  createManufacturingParts,
  createPacketExpansionRun,
  getManufacturingBatchById,
  getManufacturingPacketForExpansion,
  getManufacturingPartById,
  getReadyManufacturingPartsByIds,
  listLabelTemplateVersions,
  listManufacturingBatches,
  listManufacturingParts,
  updateLabelTemplateVersion
} from "./repository.js";

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function mapManufacturingPart(part: any) {
  return {
    id: part.id,
    manufacturingPacketId: part.manufacturingPacketId,
    shelfJobId: part.shelfJobId,
    salesOrderId: part.salesOrderId,
    salesOrderItemId: part.salesOrderItemId,
    batchId: part.batchId ?? undefined,
    partNumber: part.partNumber,
    serialNumber: part.serialNumber ?? undefined,
    unitIndex: part.unitIndex,
    quantity: part.quantity,
    partType: part.partType,
    materialType: part.materialType,
    thicknessIn: decimalToNumber(part.thicknessIn),
    lengthIn: decimalToNumber(part.lengthIn),
    depthIn: decimalToNumber(part.depthIn),
    edgeBandPattern: part.edgeBandPattern,
    requiresPackaging: part.requiresPackaging,
    labelDataJson: part.labelDataJson,
    status: part.status,
    statusReason: part.statusReason ?? undefined,
    sortGroup: part.sortGroup ?? undefined,
    createdAt: part.createdAt.toISOString(),
    updatedAt: part.updatedAt.toISOString()
  };
}

function mapManufacturingBatch(batch: any) {
  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    batchType: batch.batchType,
    materialType: batch.materialType ?? undefined,
    thicknessIn: decimalToNumber(batch.thicknessIn) ?? undefined,
    status: batch.status,
    notes: batch.notes ?? undefined,
    partCount: batch.parts?.length ?? 0,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    parts: batch.parts?.map(mapManufacturingPart) ?? []
  };
}

function mapLabelTemplate(template: any) {
  return {
    id: template.id,
    name: template.name,
    code: template.code,
    version: template.version,
    isDefault: template.isDefault,
    templateJson: template.templateJson,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export async function expandManufacturingPacket(input: {
  manufacturingPacketId: string;
  organizationId: string;
  createdByUserId?: string;
}) {
  const packet = await getManufacturingPacketForExpansion(input.manufacturingPacketId, input.organizationId);
  if (!packet) {
    throw new Error("Manufacturing packet not found.");
  }
  if (packet.expansionRun || packet.parts.length > 0) {
    throw new Error("Manufacturing packet has already been expanded.");
  }
  if (packet.shelfJobs.length === 0) {
    throw new Error("Manufacturing packet has no shelf jobs to expand.");
  }

  const built = buildManufacturingPartsForPacket({
    packetId: packet.id,
    packetNumber: packet.packetNumber,
    jobs: packet.shelfJobs.map((job) => ({
      id: job.id,
      salesOrderId: job.salesOrderId,
      salesOrderItemId: job.salesOrderItemId,
      quantity: job.quantity,
      normalizedSpecJson: job.normalizedSpecJson as Record<string, unknown>,
      salesOrderItem: { title: job.salesOrderItem.title }
    }))
  });

  if (!built.ok) {
    throw new Error(built.errors.join(" "));
  }

  const createdParts = await createManufacturingParts({
    organizationId: input.organizationId,
    parts: built.parts as any
  });

  const expansionRun = await createPacketExpansionRun({
    organizationId: input.organizationId,
    manufacturingPacketId: packet.id,
    sourceJobCount: packet.shelfJobs.length,
    createdPartCount: createdParts.length,
    resultJson: {
      packetNumber: packet.packetNumber,
      sourceJobCount: packet.shelfJobs.length,
      createdPartCount: createdParts.length,
      partNumbers: createdParts.map((part) => part.partNumber)
    },
    createdByUserId: input.createdByUserId
  });

  return {
    ok: true as const,
    action: "expand-manufacturing-packet",
    packet: {
      id: packet.id,
      packetNumber: packet.packetNumber
    },
    expansionRun: {
      id: expansionRun.id,
      sourceJobCount: expansionRun.sourceJobCount,
      createdPartCount: expansionRun.createdPartCount,
      createdAt: expansionRun.createdAt.toISOString()
    },
    parts: createdParts.map(mapManufacturingPart)
  };
}

export async function getManufacturingPacketParts(packetId: string, organizationId: string) {
  const packet = await getManufacturingPacketForExpansion(packetId, organizationId);
  if (!packet) {
    throw new Error("Manufacturing packet not found.");
  }
  const parts = await listManufacturingParts({ organizationId, packetId });
  return {
    ok: true as const,
    packet: {
      id: packet.id,
      packetNumber: packet.packetNumber
    },
    parts: parts.map(mapManufacturingPart)
  };
}

export async function getManufacturingPartsView(input: {
  organizationId: string;
  packetId?: string;
  batchId?: string;
  status?: string;
}) {
  const parts = await listManufacturingParts(input);
  return {
    ok: true as const,
    parts: parts.map(mapManufacturingPart)
  };
}

export async function getManufacturingPart(partId: string, organizationId: string) {
  const part = await getManufacturingPartById(partId, organizationId);
  if (!part) {
    throw new Error("Manufacturing part not found.");
  }
  return {
    ok: true as const,
    part: mapManufacturingPart(part)
  };
}

export async function getManufacturingPartLabel(partId: string, organizationId: string) {
  const part = await getManufacturingPartById(partId, organizationId);
  if (!part) {
    throw new Error("Manufacturing part not found.");
  }
  return {
    ok: true as const,
    label: part.labelDataJson
  };
}

function validateBatchableParts(parts: any[]) {
  if (parts.length === 0) {
    throw new Error("No manufacturing parts were found for the requested selection.");
  }
  const invalid = parts.filter((part) => part.status !== "READY_FOR_BATCH");
  if (invalid.length > 0) {
    throw new Error("Only READY_FOR_BATCH manufacturing parts can be batched.");
  }
}

export async function createManufacturingBatchRecord(input: {
  organizationId: string;
  batchType: "CUT" | "EDGEBAND" | "PACKAGING";
  partIds: string[];
  materialType?: "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "BIRCH_18" | "WALNUT_18" | "MAPLE_18" | "MDF_18";
  thicknessIn?: number;
  notes?: string;
}) {
  const parts = await getReadyManufacturingPartsByIds(input.partIds, input.organizationId);
  if (parts.length !== input.partIds.length) {
    throw new Error("One or more manufacturing parts were not found.");
  }
  validateBatchableParts(parts);

  const inferredMaterialType = input.materialType ?? parts[0]?.materialType;
  const inferredThickness = input.thicknessIn ?? decimalToNumber(parts[0]?.thicknessIn) ?? undefined;
  const mixedMaterial = parts.some((part) => part.materialType !== inferredMaterialType);
  if (mixedMaterial) {
    throw new Error("Selected manufacturing parts must share the same materialType.");
  }

  const batchCount = await prisma.manufacturingBatch.count({
    where: { organizationId: input.organizationId, batchType: input.batchType }
  });
  const batchNumber = buildManufacturingBatchNumber({
    batchType: input.batchType,
    count: batchCount
  });

  const batch = await createManufacturingBatch({
    organizationId: input.organizationId,
    batchNumber,
    batchType: input.batchType,
    materialType: inferredMaterialType as any,
    thicknessIn: inferredThickness,
    notes: input.notes
  });

  const updatedBatch = await addPartsToManufacturingBatch({
    organizationId: input.organizationId,
    batchId: batch.id,
    parts: parts.map((part, index) => ({
      id: part.id,
      sequence: index + 1
    }))
  });

  return {
    ok: true as const,
    action: "create-manufacturing-batch",
    batch: mapManufacturingBatch(updatedBatch)
  };
}

export async function addManufacturingPartsToBatch(input: {
  organizationId: string;
  batchId: string;
  partIds: string[];
}) {
  const batch = await getManufacturingBatchById(input.batchId, input.organizationId);
  if (!batch) {
    throw new Error("Manufacturing batch not found.");
  }

  const parts = await getReadyManufacturingPartsByIds(input.partIds, input.organizationId);
  if (parts.length !== input.partIds.length) {
    throw new Error("One or more manufacturing parts were not found.");
  }
  validateBatchableParts(parts);

  const updatedBatch = await addPartsToManufacturingBatch({
    organizationId: input.organizationId,
    batchId: batch.id,
    parts: parts.map((part, index) => ({
      id: part.id,
      sequence: (batch.parts?.length ?? 0) + index + 1
    }))
  });

  return {
    ok: true as const,
    action: "add-parts-to-manufacturing-batch",
    batch: mapManufacturingBatch(updatedBatch)
  };
}

export async function getManufacturingBatches(organizationId: string) {
  const batches = await listManufacturingBatches(organizationId);
  return {
    ok: true as const,
    batches: batches.map(mapManufacturingBatch)
  };
}

export async function getManufacturingBatch(batchId: string, organizationId: string) {
  const batch = await getManufacturingBatchById(batchId, organizationId);
  if (!batch) {
    throw new Error("Manufacturing batch not found.");
  }
  return {
    ok: true as const,
    batch: mapManufacturingBatch(batch)
  };
}

export async function getLabelTemplates(organizationId: string) {
  const templates = await listLabelTemplateVersions(organizationId);
  return {
    ok: true as const,
    templates: templates.map(mapLabelTemplate)
  };
}

export async function createLabelTemplateRecord(input: {
  organizationId: string;
  name: string;
  code: string;
  version: number;
  isDefault?: boolean;
  templateJson: Record<string, unknown>;
}) {
  const template = await createLabelTemplateVersion(input);
  return {
    ok: true as const,
    template: mapLabelTemplate(template)
  };
}

export async function updateLabelTemplateRecord(id: string, input: {
  organizationId: string;
  name?: string;
  isDefault?: boolean;
  templateJson?: Record<string, unknown>;
}) {
  const template = await updateLabelTemplateVersion(id, input);
  return {
    ok: true as const,
    template: mapLabelTemplate(template)
  };
}
