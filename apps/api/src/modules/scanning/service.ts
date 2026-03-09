import {
  createScanEvent,
  createWorkflowStationRule,
  findManufacturingBatchByBatchNumber,
  findManufacturingPartById,
  findManufacturingPartByPartNumber,
  getScanEventById,
  listScanEvents,
  listWorkflowStationRules,
  updateManufacturingPartStatus,
  updateWorkflowStationRule
} from "./repository.js";
import { BATCH_SCAN_PREFIX, PART_SCAN_PREFIX } from "../labels/contracts.js";
import { listAllowedActionsForStation, resolveWorkflowRule } from "./workflow.js";

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function normalizeScanValue(scanValue: string) {
  return scanValue.trim();
}

function parseScanValue(scanValue: string) {
  const normalized = normalizeScanValue(scanValue);

  if (normalized.startsWith(PART_SCAN_PREFIX)) {
    return { entityType: "MANUFACTURING_PART" as const, ref: normalized.slice(PART_SCAN_PREFIX.length) };
  }
  if (normalized.startsWith(BATCH_SCAN_PREFIX)) {
    return { entityType: "MANUFACTURING_BATCH" as const, ref: normalized.slice(BATCH_SCAN_PREFIX.length) };
  }

  return { entityType: "MANUFACTURING_PART" as const, ref: normalized };
}

function mapPart(part: any) {
  return {
    id: part.id,
    partNumber: part.partNumber,
    status: part.status,
    materialType: part.materialType,
    thicknessIn: decimalToNumber(part.thicknessIn),
    lengthIn: decimalToNumber(part.lengthIn),
    depthIn: decimalToNumber(part.depthIn),
    edgeBandPattern: part.edgeBandPattern,
    manufacturingPacketId: part.manufacturingPacketId,
    packetNumber: part.manufacturingPacket?.packetNumber,
    batchId: part.batchId ?? undefined,
    batchNumber: part.batch?.batchNumber ?? undefined,
    salesOrderId: part.salesOrderId,
    salesOrderItemId: part.salesOrderItemId,
    shelfJobId: part.shelfJobId,
    shelfProductName: part.salesOrderItem?.shelfProduct?.name ?? part.salesOrderItem?.title ?? undefined,
    barcodeValue: `PART:${part.partNumber}`,
    qrValue: `PART:${part.partNumber}`
  };
}

function mapBatch(batch: any) {
  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    batchType: batch.batchType,
    status: batch.status,
    materialType: batch.materialType ?? undefined,
    thicknessIn: decimalToNumber(batch.thicknessIn),
    partCount: batch.parts?.length ?? 0
  };
}

function mapScanEvent(event: any) {
  return {
    id: event.id,
    entityType: event.entityType ?? undefined,
    entityId: event.entityId ?? undefined,
    scanValue: event.scanValue ?? event.code ?? undefined,
    stationType: event.stationType,
    actionType: event.actionType,
    previousStatus: event.previousStatus ?? undefined,
    nextStatus: event.nextStatus ?? undefined,
    result: event.result,
    resultReason: event.resultReason ?? undefined,
    metadataJson: event.metadataJson ?? undefined,
    scannedByUserId: event.scannedByUserId ?? undefined,
    manufacturingPartId: event.manufacturingPartId ?? undefined,
    manufacturingBatchId: event.manufacturingBatchId ?? undefined,
    createdAt: event.createdAt.toISOString()
  };
}

async function resolveManufacturingEntity(scanValue: string, organizationId: string) {
  const parsed = parseScanValue(scanValue);
  if (parsed.entityType === "MANUFACTURING_BATCH") {
    const batch = await findManufacturingBatchByBatchNumber(parsed.ref, organizationId);
    return { entityType: "MANUFACTURING_BATCH" as const, entity: batch };
  }

  const part = await findManufacturingPartByPartNumber(parsed.ref, organizationId);
  return { entityType: "MANUFACTURING_PART" as const, entity: part };
}

export async function lookupScan(input: {
  organizationId: string;
  scanValue: string;
  stationType: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  metadata?: Record<string, unknown>;
  scannedByUserId?: string;
}) {
  const resolved = await resolveManufacturingEntity(input.scanValue, input.organizationId);

  if (!resolved.entity) {
    const event = await createScanEvent({
      organizationId: input.organizationId,
      scanValue: input.scanValue,
      stationType: input.stationType,
      actionType: "LOOKUP",
      result: "REJECTED",
      resultReason: "Scanned entity was not found.",
      metadataJson: input.metadata,
      scannedByUserId: input.scannedByUserId
    });
    throw Object.assign(new Error("Scanned entity was not found."), {
      scanEvent: mapScanEvent(event)
    });
  }

  const rules = await listWorkflowStationRules(input.organizationId);
  const currentStatus = resolved.entityType === "MANUFACTURING_PART" ? resolved.entity.status : resolved.entity.status;
  const allowedActions = listAllowedActionsForStation({
    stationType: input.stationType,
    entityType: resolved.entityType,
    fromStatus: currentStatus,
    configuredRules: rules as any
  }).map((rule) => ({
    actionType: rule.actionType,
    nextStatus: rule.toStatus,
    source: rule.source
  }));

  const event = await createScanEvent({
    organizationId: input.organizationId,
    entityType: resolved.entityType,
    entityId: resolved.entity.id,
    scanValue: input.scanValue,
    stationType: input.stationType,
    actionType: "LOOKUP",
    previousStatus: currentStatus,
    nextStatus: currentStatus,
    result: "ACCEPTED",
    metadataJson: input.metadata,
    scannedByUserId: input.scannedByUserId,
    manufacturingPartId: resolved.entityType === "MANUFACTURING_PART" ? resolved.entity.id : undefined,
    manufacturingBatchId: resolved.entityType === "MANUFACTURING_BATCH" ? resolved.entity.id : undefined
  });

  return {
    ok: true as const,
    entityType: resolved.entityType,
    stationType: input.stationType,
    entity: resolved.entityType === "MANUFACTURING_PART" ? mapPart(resolved.entity) : mapBatch(resolved.entity),
    allowedActions,
    event: mapScanEvent(event)
  };
}

export async function scanManufacturingPart(input: {
  organizationId: string;
  scanValue: string;
  stationType: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  actionType: "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  metadata?: Record<string, unknown>;
  scannedByUserId?: string;
}) {
  const resolved = await resolveManufacturingEntity(input.scanValue, input.organizationId);
  if (resolved.entityType !== "MANUFACTURING_PART" || !resolved.entity) {
    const event = await createScanEvent({
      organizationId: input.organizationId,
      scanValue: input.scanValue,
      stationType: input.stationType,
      actionType: input.actionType,
      result: "REJECTED",
      resultReason: "Manufacturing part was not found for the provided scan value.",
      metadataJson: input.metadata,
      scannedByUserId: input.scannedByUserId
    });
    throw Object.assign(new Error("Manufacturing part was not found for the provided scan value."), {
      scanEvent: mapScanEvent(event)
    });
  }

  const part = resolved.entity;
  const rules = await listWorkflowStationRules(input.organizationId);
  const matchedRule = resolveWorkflowRule({
    stationType: input.stationType,
    entityType: "MANUFACTURING_PART",
    fromStatus: part.status,
    actionType: input.actionType,
    configuredRules: rules as any
  });

  if (!matchedRule) {
    const event = await createScanEvent({
      organizationId: input.organizationId,
      entityType: "MANUFACTURING_PART",
      entityId: part.id,
      scanValue: input.scanValue,
      stationType: input.stationType,
      actionType: input.actionType,
      previousStatus: part.status,
      nextStatus: part.status,
      result: "REJECTED",
      resultReason: `No workflow transition exists for ${part.status} at ${input.stationType}.`,
      metadataJson: input.metadata,
      scannedByUserId: input.scannedByUserId,
      manufacturingPartId: part.id
    });
    throw Object.assign(new Error(`No workflow transition exists for ${part.status} at ${input.stationType}.`), {
      scanEvent: mapScanEvent(event)
    });
  }

  if (matchedRule.toStatus === part.status) {
    const event = await createScanEvent({
      organizationId: input.organizationId,
      entityType: "MANUFACTURING_PART",
      entityId: part.id,
      scanValue: input.scanValue,
      stationType: input.stationType,
      actionType: input.actionType,
      previousStatus: part.status,
      nextStatus: part.status,
      result: "NOOP",
      resultReason: "Manufacturing part is already at the requested status.",
      metadataJson: input.metadata,
      scannedByUserId: input.scannedByUserId,
      manufacturingPartId: part.id
    });

    return {
      ok: true as const,
      action: "scan-manufacturing-part",
      part: mapPart(part),
      event: mapScanEvent(event)
    };
  }

  const updated = await updateManufacturingPartStatus({
    partId: part.id,
    organizationId: input.organizationId,
    nextStatus: matchedRule.toStatus
  });

  const event = await createScanEvent({
    organizationId: input.organizationId,
    entityType: "MANUFACTURING_PART",
    entityId: updated.id,
    scanValue: input.scanValue,
    stationType: input.stationType,
    actionType: input.actionType,
    previousStatus: part.status,
    nextStatus: matchedRule.toStatus,
    result: "ACCEPTED",
    resultReason: matchedRule.source === "workflow_rule" ? "Applied configured workflow station rule." : "Applied default workflow rule.",
    metadataJson: {
      ...(input.metadata ?? {}),
      ruleSource: matchedRule.source
    },
    scannedByUserId: input.scannedByUserId,
    manufacturingPartId: updated.id
  });

  return {
    ok: true as const,
    action: "scan-manufacturing-part",
    part: mapPart(updated),
    event: mapScanEvent(event)
  };
}

export async function getScanEventsView(input: {
  organizationId: string;
  result?: "ACCEPTED" | "REJECTED" | "NOOP";
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType?: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
}) {
  const events = await listScanEvents(input);
  return {
    ok: true as const,
    events: events.map(mapScanEvent)
  };
}

export async function getScanEventView(id: string, organizationId: string) {
  const event = await getScanEventById(id, organizationId);
  if (!event) {
    throw new Error("Scan event not found.");
  }
  return {
    ok: true as const,
    event: mapScanEvent(event)
  };
}

export async function getWorkflowStationRulesView(organizationId: string) {
  const rules = await listWorkflowStationRules(organizationId);
  return {
    ok: true as const,
    rules: rules.map((rule) => ({
      id: rule.id,
      stationType: rule.stationType,
      entityType: rule.entityType,
      fromStatus: rule.fromStatus,
      actionType: rule.actionType,
      toStatus: rule.toStatus,
      isActive: rule.isActive,
      notes: rule.notes ?? undefined,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString()
    }))
  };
}

export async function createWorkflowStationRuleRecord(input: {
  organizationId: string;
  stationType: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  fromStatus: string;
  actionType: "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  toStatus: string;
  isActive?: boolean;
  notes?: string;
}) {
  const rule = await createWorkflowStationRule(input);
  return {
    ok: true as const,
    rule: {
      id: rule.id,
      stationType: rule.stationType,
      entityType: rule.entityType,
      fromStatus: rule.fromStatus,
      actionType: rule.actionType,
      toStatus: rule.toStatus,
      isActive: rule.isActive,
      notes: rule.notes ?? undefined,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString()
    }
  };
}

export async function updateWorkflowStationRuleRecord(input: {
  id: string;
  organizationId: string;
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  entityType?: "MANUFACTURING_PART" | "MANUFACTURING_BATCH" | "CONTAINER" | "CONTAINER_LOCATION";
  fromStatus?: string;
  actionType?: "LOOKUP" | "CHECK_IN" | "CHECK_OUT" | "MARK_STAGE_COMPLETE" | "MOVE" | "ASSIGN_CONTAINER" | "REPRINT_LABEL";
  toStatus?: string;
  isActive?: boolean;
  notes?: string;
}) {
  const rule = await updateWorkflowStationRule(input);
  return {
    ok: true as const,
    rule: {
      id: rule.id,
      stationType: rule.stationType,
      entityType: rule.entityType,
      fromStatus: rule.fromStatus,
      actionType: rule.actionType,
      toStatus: rule.toStatus,
      isActive: rule.isActive,
      notes: rule.notes ?? undefined,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString()
    }
  };
}
