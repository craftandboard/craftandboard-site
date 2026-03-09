import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeRemnantArtifactPdf } from "../../lib/generatedArtifacts.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { materialDisplayName, materialKeyFor } from "../materialForecast/materialKey.js";
import { buildRemnantLabelPdf } from "./labels.js";
import { renderRemnantLabelHtml } from "./htmlRenderer.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function areaSqIn(lengthIn: number, widthIn: number) {
  return Number((lengthIn * widthIn).toFixed(3));
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
}

function buildRemnantScanValue(remnantCode: string) {
  return `REMNANT:${remnantCode}`;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mapHistoryRow(row: any) {
  return {
    id: row.id,
    actionType: row.actionType,
    usedAreaSqIn: row.usedAreaSqIn ? toNumber(row.usedAreaSqIn) : undefined,
    previousLengthIn: row.previousLengthIn ? toNumber(row.previousLengthIn) : undefined,
    previousWidthIn: row.previousWidthIn ? toNumber(row.previousWidthIn) : undefined,
    newLengthIn: row.newLengthIn ? toNumber(row.newLengthIn) : undefined,
    newWidthIn: row.newWidthIn ? toNumber(row.newWidthIn) : undefined,
    batchId: row.batchId ?? undefined,
    partId: row.partId ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapAllocation(row: any) {
  return {
    id: row.id,
    remnantId: row.remnantId,
    allocationType: row.allocationType,
    targetType: row.targetType,
    targetId: row.targetId,
    reservedAreaSqIn: row.reservedAreaSqIn ? toNumber(row.reservedAreaSqIn) : undefined,
    reservedLengthIn: row.reservedLengthIn ? toNumber(row.reservedLengthIn) : undefined,
    reservedWidthIn: row.reservedWidthIn ? toNumber(row.reservedWidthIn) : undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdByUserId: row.createdByUserId ?? undefined,
    releasedByUserId: row.releasedByUserId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    releasedAt: row.releasedAt?.toISOString()
  };
}

function mapMovement(row: any) {
  return {
    id: row.id,
    remnantId: row.remnantId,
    fromContainerId: row.fromContainerId ?? undefined,
    toContainerId: row.toContainerId ?? undefined,
    fromLocationId: row.fromLocationId ?? undefined,
    toLocationId: row.toLocationId ?? undefined,
    fromContainerCode: row.fromContainer?.containerCode ?? row.fromContainer?.code ?? undefined,
    toContainerCode: row.toContainer?.containerCode ?? row.toContainer?.code ?? undefined,
    fromLocationCode: row.fromLocation?.code ?? undefined,
    toLocationCode: row.toLocation?.code ?? undefined,
    movedByUserId: row.movedByUserId ?? undefined,
    reason: row.reason ?? undefined,
    metadataJson: row.metadataJson ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapRemnantRow(row: any) {
  const code = row.remnantCode ?? row.code;
  return {
    id: row.id,
    code,
    remnantCode: code,
    materialKey: row.materialKey,
    materialCode: row.materialCode,
    materialLabel: row.materialLabel,
    materialName: row.materialName ?? undefined,
    thicknessIn: toNumber(row.thicknessIn),
    edgeBandPattern: row.edgeBandPattern,
    lengthIn: toNumber(row.lengthIn),
    widthIn: toNumber(row.widthIn),
    areaSqIn: toNumber(row.areaSqIn),
    usableAreaSqIn: toNumber(row.usableAreaSqIn ?? row.areaSqIn),
    sourceReferenceId: row.sourceReferenceId ?? undefined,
    sourceBatchId: row.sourceBatchId ?? undefined,
    sourcePacketId: row.sourcePacketId ?? undefined,
    sourcePartId: row.sourcePartId ?? undefined,
    sourceType: row.sourceType,
    status: row.status,
    grainDirection: row.grainDirection ?? undefined,
    edgeCondition: row.edgeCondition ?? undefined,
    qualityGrade: row.qualityGrade ?? undefined,
    barcodeValue: row.barcodeValue ?? buildRemnantScanValue(code),
    qrValue: row.qrValue ?? buildRemnantScanValue(code),
    currentContainerId: row.currentContainerId ?? undefined,
    currentContainerCode: row.currentContainer?.containerCode ?? row.currentContainer?.code ?? undefined,
    currentContainerName: row.currentContainer?.displayName ?? row.currentContainer?.label ?? undefined,
    currentLocationId: row.currentLocationId ?? undefined,
    currentLocationCode: row.currentLocation?.code ?? undefined,
    currentLocationName: row.currentLocation?.name ?? undefined,
    locationLabel: row.locationLabel ?? row.currentLocation?.name ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function buildRemnantLabelPayload(remnant: any) {
  const mapped = mapRemnantRow(remnant);
  return {
    remnantId: remnant.id,
    remnantCode: mapped.remnantCode,
    materialType: mapped.materialCode,
    materialLabel: mapped.materialLabel,
    thicknessIn: mapped.thicknessIn,
    lengthIn: mapped.lengthIn,
    widthIn: mapped.widthIn,
    areaSqIn: mapped.areaSqIn,
    usableAreaSqIn: mapped.usableAreaSqIn,
    status: mapped.status,
    grainDirection: mapped.grainDirection,
    edgeCondition: mapped.edgeCondition,
    qualityGrade: mapped.qualityGrade,
    currentContainerId: mapped.currentContainerId,
    currentContainerCode: mapped.currentContainerCode,
    currentContainerName: mapped.currentContainerName,
    currentLocationId: mapped.currentLocationId,
    currentLocationCode: mapped.currentLocationCode,
    currentLocationName: mapped.currentLocationName,
    barcodeValue: mapped.barcodeValue,
    qrValue: mapped.qrValue,
    humanReadableText: [
      `Remnant ${mapped.remnantCode}`,
      `Material ${mapped.materialLabel}`,
      `Size ${mapped.lengthIn}" x ${mapped.widthIn}" x ${mapped.thicknessIn}"`,
      `Status ${mapped.status}`,
      mapped.currentLocationName ? `Location ${mapped.currentLocationName}` : "Location unassigned",
      mapped.currentContainerCode ? `Container ${mapped.currentContainerCode}` : "Container unassigned"
    ]
  };
}

async function nextRemnantCode(organizationId: string) {
  const count = await prisma.remnant.count({
    where: { organizationId }
  });

  return `REM-${String(count + 1).padStart(4, "0")}`;
}

async function getNextRemnantArtifactVersion(remnantId: string, type: string, organizationId: string) {
  const latest = await prisma.artifact.findFirst({
    where: {
      organizationId,
      remnantId,
      type
    },
    orderBy: [{ version: "desc" }]
  });

  return (latest?.version ?? 0) + 1;
}

async function getNextRemnantRenderJobTemplate(organizationId: string) {
  return prisma.labelTemplateVersion.findFirst({
    where: { organizationId, isDefault: true },
    orderBy: [{ updatedAt: "desc" }]
  });
}

async function getRemnantRecord(remnantId: string, organizationId: string) {
  return prisma.remnant.findFirst({
    where: { id: remnantId, organizationId },
    include: {
      currentContainer: true,
      currentLocation: true,
      usages: { orderBy: [{ createdAt: "desc" }] },
      allocations: { orderBy: [{ createdAt: "desc" }] },
      movements: {
        include: {
          fromContainer: true,
          toContainer: true,
          fromLocation: true,
          toLocation: true
        },
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });
}

async function resolveContainer(input: { containerId?: string; containerCode?: string; organizationId: string }) {
  if (!input.containerId && !input.containerCode) {
    return null;
  }

  return prisma.container.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(input.containerId ? [{ id: input.containerId }] : []),
        ...(input.containerCode
          ? [{ containerCode: input.containerCode }, { code: input.containerCode }, { barcodeValue: `CONTAINER:${input.containerCode}` }]
          : [])
      ]
    },
    include: {
      currentLocation: true
    }
  });
}

async function resolveLocation(input: { locationId?: string; locationCode?: string; organizationId: string }) {
  if (!input.locationId && !input.locationCode) {
    return null;
  }

  return prisma.containerLocation.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(input.locationId ? [{ id: input.locationId }] : []),
        ...(input.locationCode ? [{ code: input.locationCode }] : [])
      ]
    }
  });
}

async function createMovement(input: {
  organizationId: string;
  remnantId: string;
  fromContainerId?: string | null;
  toContainerId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  movedByUserId?: string | null;
  reason?: string | null;
  metadataJson?: Record<string, unknown>;
}) {
  return prisma.remnantMovement.create({
    data: {
      organizationId: input.organizationId,
      remnantId: input.remnantId,
      fromContainerId: input.fromContainerId ?? null,
      toContainerId: input.toContainerId ?? null,
      fromLocationId: input.fromLocationId ?? null,
      toLocationId: input.toLocationId ?? null,
      movedByUserId: input.movedByUserId ?? null,
      reason: input.reason ?? null,
      metadataJson: input.metadataJson ? (input.metadataJson as Prisma.InputJsonValue) : undefined
    }
  });
}

function assertRemnantCanBeAvailable(input: {
  materialCode: string;
  thicknessIn: number;
  lengthIn: number;
  widthIn: number;
  usableAreaSqIn: number;
  status: string;
}) {
  if (input.status !== "AVAILABLE") {
    return;
  }

  if (!input.materialCode || input.thicknessIn <= 0 || input.lengthIn <= 0 || input.widthIn <= 0 || input.usableAreaSqIn <= 0) {
    throw new Error("Available remnants require material, thickness, positive dimensions, and positive usable area.");
  }
}

async function loadActiveAllocation(remnantId: string, organizationId: string) {
  return prisma.remnantAllocation.findFirst({
    where: {
      organizationId,
      remnantId,
      status: "ACTIVE"
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function createRemnant(input: any, organizationId = LOCAL_ORG_ID) {
  assertPositive(input.lengthIn, "Length");
  assertPositive(input.widthIn, "Width");
  const thicknessIn = Number(input.thicknessIn);
  assertPositive(thicknessIn, "Thickness");

  const computedArea = areaSqIn(input.lengthIn, input.widthIn);
  const computedUsableArea = input.usableAreaSqIn ?? computedArea;

  if (computedUsableArea > computedArea) {
    throw new Error("Usable area cannot exceed total remnant area.");
  }

  const status = input.status ?? "AVAILABLE";
  assertRemnantCanBeAvailable({
    materialCode: input.materialCode,
    thicknessIn,
    lengthIn: input.lengthIn,
    widthIn: input.widthIn,
    usableAreaSqIn: computedUsableArea,
    status
  });

  const container = await resolveContainer({
    organizationId,
    containerId: input.currentContainerId,
    containerCode: input.currentContainerCode
  });
  const location =
    (await resolveLocation({
      organizationId,
      locationId: input.currentLocationId,
      locationCode: input.currentLocationCode
    })) ?? container?.currentLocation ?? null;

  const code = await nextRemnantCode(organizationId);
  const materialLabel = input.materialLabel?.trim() || materialDisplayName(input.materialCode, thicknessIn);
  const materialKey = materialKeyFor({
    materialCode: input.materialCode,
    thicknessIn,
    edgeBandPattern: input.edgeBandPattern ?? "ALL_FOUR"
  });
  const barcodeValue = input.barcodeValue?.trim() || buildRemnantScanValue(code);
  const qrValue = input.qrValue?.trim() || barcodeValue;

  const created = await prisma.remnant.create({
    data: {
      organizationId,
      code,
      remnantCode: code,
      materialKey,
      materialCode: input.materialCode,
      materialLabel,
      materialName: input.materialName?.trim() || null,
      thicknessIn: decimal(thicknessIn),
      edgeBandPattern: input.edgeBandPattern ?? "ALL_FOUR",
      lengthIn: decimal(input.lengthIn),
      widthIn: decimal(input.widthIn),
      areaSqIn: decimal(computedArea),
      usableAreaSqIn: decimal(computedUsableArea),
      sourceReferenceId: input.sourceReferenceId?.trim() || null,
      sourceBatchId: input.sourceBatchId ?? null,
      sourcePacketId: input.sourcePacketId ?? null,
      sourcePartId: input.sourcePartId ?? null,
      sourceType: input.sourceType ?? "MANUAL_ENTRY",
      grainDirection: input.grainDirection ?? null,
      edgeCondition: input.edgeCondition ?? null,
      status,
      qualityGrade: input.qualityGrade ?? null,
      barcodeValue,
      qrValue,
      currentContainerId: container?.id ?? null,
      currentLocationId: location?.id ?? null,
      locationLabel: input.locationLabel?.trim() || location?.name || null,
      notes: input.notes?.trim() || null,
      usages: {
        create: {
          organizationId,
          actionType: "CREATED",
          usedAreaSqIn: decimal(0),
          newLengthIn: decimal(input.lengthIn),
          newWidthIn: decimal(input.widthIn),
          notes: input.notes?.trim() || null
        }
      }
    },
    include: {
      currentContainer: true,
      currentLocation: true,
      usages: { orderBy: [{ createdAt: "desc" }] },
      allocations: { orderBy: [{ createdAt: "desc" }] },
      movements: {
        include: {
          fromContainer: true,
          toContainer: true,
          fromLocation: true,
          toLocation: true
        },
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  if (container?.id || location?.id) {
    await createMovement({
      organizationId,
      remnantId: created.id,
      toContainerId: container?.id ?? null,
      toLocationId: location?.id ?? null,
      reason: "INITIAL_PLACEMENT"
    });
  }

  const fresh = await getRemnantRecord(created.id, organizationId);

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(fresh),
      history: fresh?.usages.map(mapHistoryRow) ?? [],
      allocations: fresh?.allocations.map(mapAllocation) ?? [],
      movements: fresh?.movements.map(mapMovement) ?? []
    }
  };
}

export async function listRemnants(input: any, organizationId = LOCAL_ORG_ID) {
  const remnants = await prisma.remnant.findMany({
    where: {
      organizationId,
      materialCode: input.materialCode ? input.materialCode : undefined,
      status: input.status ? input.status : undefined,
      locationLabel: input.location
        ? {
            contains: input.location,
            mode: "insensitive"
          }
        : undefined,
      lengthIn: input.minimumLengthIn ? { gte: decimal(input.minimumLengthIn) } : undefined,
      widthIn: input.minimumWidthIn ? { gte: decimal(input.minimumWidthIn) } : undefined
    },
    include: {
      currentContainer: true,
      currentLocation: true,
      allocations: {
        where: { status: "ACTIVE" }
      }
    },
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }]
  });

  const mapped = remnants.map(mapRemnantRow);
  const available = mapped.filter((remnant) => remnant.status === "AVAILABLE");
  const topMaterials = new Map<string, { materialKey: string; materialCode: string; materialLabel: string; remnantCount: number; totalAreaSqIn: number }>();

  for (const remnant of available) {
    const current = topMaterials.get(remnant.materialKey) ?? {
      materialKey: remnant.materialKey,
      materialCode: remnant.materialCode,
      materialLabel: remnant.materialLabel,
      remnantCount: 0,
      totalAreaSqIn: 0
    };
    current.remnantCount += 1;
    current.totalAreaSqIn = Number((current.totalAreaSqIn + remnant.usableAreaSqIn).toFixed(3));
    topMaterials.set(remnant.materialKey, current);
  }

  return {
    ok: true,
    summary: {
      totalAvailableRemnants: available.length,
      totalAvailableAreaSqIn: Number(available.reduce((sum, remnant) => sum + remnant.usableAreaSqIn, 0).toFixed(3)),
      heldCount: mapped.filter((remnant) => remnant.status === "HOLD").length,
      scrappedCount: mapped.filter((remnant) => remnant.status === "SCRAP" || remnant.status === "SCRAPPED").length,
      topMaterials: [...topMaterials.values()].sort((left, right) => right.totalAreaSqIn - left.totalAreaSqIn).slice(0, 5)
    },
    remnants: mapped
  };
}

export async function getRemnantDetail(remnantId: string, organizationId = LOCAL_ORG_ID) {
  const remnant = await getRemnantRecord(remnantId, organizationId);
  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(remnant),
      history: remnant.usages.map(mapHistoryRow),
      allocations: remnant.allocations.map(mapAllocation),
      movements: remnant.movements.map(mapMovement)
    }
  };
}

export async function updateRemnant(remnantId: string, input: any, organizationId = LOCAL_ORG_ID) {
  const existing = await prisma.remnant.findFirst({
    where: { id: remnantId, organizationId },
    include: {
      currentLocation: true
    }
  });
  if (!existing) {
    throw new Error("Remnant not found.");
  }

  const nextLengthIn = input.lengthIn ?? toNumber(existing.lengthIn);
  const nextWidthIn = input.widthIn ?? toNumber(existing.widthIn);
  assertPositive(nextLengthIn, "Length");
  assertPositive(nextWidthIn, "Width");
  const nextAreaSqIn = areaSqIn(nextLengthIn, nextWidthIn);
  const nextUsableAreaSqIn = input.usableAreaSqIn ?? Math.min(toNumber(existing.usableAreaSqIn ?? existing.areaSqIn), nextAreaSqIn);

  if (nextUsableAreaSqIn < 0 || nextUsableAreaSqIn > nextAreaSqIn) {
    throw new Error("Usable area must be between 0 and the remnant area.");
  }

  const nextStatus = input.status ?? existing.status;
  assertRemnantCanBeAvailable({
    materialCode: existing.materialCode,
    thicknessIn: toNumber(existing.thicknessIn),
    lengthIn: nextLengthIn,
    widthIn: nextWidthIn,
    usableAreaSqIn: nextUsableAreaSqIn,
    status: nextStatus
  });

  const updated = await prisma.remnant.update({
    where: { id: remnantId },
    data: {
      status: nextStatus,
      materialName: input.materialName === undefined ? undefined : input.materialName?.trim() || null,
      grainDirection: input.grainDirection === undefined ? undefined : input.grainDirection ?? null,
      edgeCondition: input.edgeCondition === undefined ? undefined : input.edgeCondition ?? null,
      qualityGrade: input.qualityGrade === undefined ? undefined : input.qualityGrade ?? null,
      lengthIn: decimal(nextLengthIn),
      widthIn: decimal(nextWidthIn),
      areaSqIn: decimal(nextAreaSqIn),
      usableAreaSqIn: decimal(nextUsableAreaSqIn),
      locationLabel: input.locationLabel !== undefined ? input.locationLabel.trim() || null : undefined,
      notes: input.notes !== undefined ? input.notes.trim() || null : undefined,
      usages: {
        create: {
          organizationId,
          actionType: "UPDATED",
          previousLengthIn: existing.lengthIn,
          previousWidthIn: existing.widthIn,
          newLengthIn: decimal(nextLengthIn),
          newWidthIn: decimal(nextWidthIn),
          notes: input.notes?.trim() || null
        }
      }
    }
  });

  return getRemnantDetail(updated.id, organizationId);
}

export async function updateRemnantStatus(input: {
  remnantId: string;
  organizationId?: string;
  status: string;
  notes?: string;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  return updateRemnant(input.remnantId, { status: input.status, notes: input.notes }, organizationId);
}

export async function moveRemnant(input: {
  remnantId: string;
  organizationId?: string;
  containerId?: string;
  containerCode?: string;
  locationId?: string;
  locationCode?: string;
  movedByUserId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const remnant = await prisma.remnant.findFirst({
    where: { id: input.remnantId, organizationId }
  });
  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  const container = await resolveContainer({
    organizationId,
    containerId: input.containerId,
    containerCode: input.containerCode
  });
  if ((input.containerId || input.containerCode) && !container) {
    throw new Error("Container not found.");
  }
  if (container && (!container.isActive || container.status === "RETIRED" || container.status === "CLOSED")) {
    throw new Error(`Container ${container.containerCode ?? container.code} is not active for remnant storage.`);
  }

  const location =
    (await resolveLocation({
      organizationId,
      locationId: input.locationId,
      locationCode: input.locationCode
    })) ?? container?.currentLocation ?? null;
  if ((input.locationId || input.locationCode) && !location) {
    throw new Error("Container location not found.");
  }
  if (location && !location.isActive) {
    throw new Error(`Location ${location.code} is not active.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.remnant.update({
      where: { id: remnant.id },
      data: {
        currentContainerId: container?.id ?? null,
        currentLocationId: location?.id ?? null,
        locationLabel: location?.name ?? remnant.locationLabel
      }
    });

    await tx.remnantMovement.create({
      data: {
        organizationId,
        remnantId: remnant.id,
        fromContainerId: remnant.currentContainerId ?? null,
        toContainerId: container?.id ?? null,
        fromLocationId: remnant.currentLocationId ?? null,
        toLocationId: location?.id ?? null,
        movedByUserId: input.movedByUserId ?? null,
        reason: input.reason ?? "MANUAL_MOVE",
        metadataJson: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    return next;
  });

  return getRemnantDetail(updated.id, organizationId);
}

export async function assignRemnantToContainer(input: {
  remnantId: string;
  organizationId?: string;
  containerId?: string;
  containerCode?: string;
  movedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  return moveRemnant({
    ...input,
    reason: "ASSIGN_CONTAINER"
  });
}

export async function unassignRemnantFromContainer(input: {
  remnantId: string;
  organizationId?: string;
  movedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const remnant = await prisma.remnant.findFirst({
    where: { id: input.remnantId, organizationId },
    include: { currentContainer: { include: { currentLocation: true } } }
  });
  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  return moveRemnant({
    remnantId: remnant.id,
    organizationId,
    locationId: remnant.currentContainer?.currentLocationId ?? remnant.currentLocationId ?? undefined,
    movedByUserId: input.movedByUserId,
    reason: "UNASSIGN_CONTAINER",
    metadata: input.metadata
  });
}

export async function reserveRemnant(input: {
  remnantId: string;
  organizationId?: string;
  targetType: string;
  targetId: string;
  reservedAreaSqIn?: number;
  reservedLengthIn?: number;
  reservedWidthIn?: number;
  notes?: string;
  createdByUserId?: string;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const remnant = await prisma.remnant.findFirst({
    where: { id: input.remnantId, organizationId }
  });
  if (!remnant) {
    throw new Error("Remnant not found.");
  }
  if (remnant.status !== "AVAILABLE") {
    throw new Error(`Remnant ${remnant.code} is not available for reservation.`);
  }
  const activeAllocation = await loadActiveAllocation(remnant.id, organizationId);
  if (activeAllocation) {
    throw new Error(`Remnant ${remnant.code} already has an active reservation or allocation.`);
  }

  const allocation = await prisma.$transaction(async (tx) => {
    const created = await tx.remnantAllocation.create({
      data: {
        organizationId,
        remnantId: remnant.id,
        allocationType: "RESERVE",
        targetType: input.targetType as any,
        targetId: input.targetId,
        reservedAreaSqIn: input.reservedAreaSqIn ? decimal(input.reservedAreaSqIn) : undefined,
        reservedLengthIn: input.reservedLengthIn ? decimal(input.reservedLengthIn) : undefined,
        reservedWidthIn: input.reservedWidthIn ? decimal(input.reservedWidthIn) : undefined,
        status: "ACTIVE",
        notes: input.notes?.trim() || null,
        createdByUserId: input.createdByUserId ?? null
      }
    });

    await tx.remnant.update({
      where: { id: remnant.id },
      data: { status: "RESERVED" }
    });

    await tx.remnantUsage.create({
      data: {
        organizationId,
        remnantId: remnant.id,
        actionType: "RESERVED",
        usedAreaSqIn: input.reservedAreaSqIn ? decimal(input.reservedAreaSqIn) : undefined,
        notes: input.notes?.trim() || null
      }
    });

    return created;
  });

  return {
    ok: true,
    action: "reserve-remnant",
    allocation: mapAllocation(allocation),
    remnant: (await getRemnantDetail(remnant.id, organizationId)).remnant
  };
}

export async function allocateRemnant(input: {
  remnantId: string;
  organizationId?: string;
  targetType: string;
  targetId: string;
  reservedAreaSqIn?: number;
  reservedLengthIn?: number;
  reservedWidthIn?: number;
  notes?: string;
  createdByUserId?: string;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const remnant = await prisma.remnant.findFirst({
    where: { id: input.remnantId, organizationId }
  });
  if (!remnant) {
    throw new Error("Remnant not found.");
  }
  if (!["AVAILABLE", "RESERVED"].includes(remnant.status)) {
    throw new Error(`Remnant ${remnant.code} is not eligible for allocation.`);
  }

  const activeAllocation = await loadActiveAllocation(remnant.id, organizationId);
  if (activeAllocation && activeAllocation.allocationType === "ALLOCATE") {
    throw new Error(`Remnant ${remnant.code} is already actively allocated.`);
  }

  const allocation = await prisma.$transaction(async (tx) => {
    if (activeAllocation) {
      await tx.remnantAllocation.update({
        where: { id: activeAllocation.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          releasedByUserId: input.createdByUserId ?? null
        }
      });
    }

    const created = await tx.remnantAllocation.create({
      data: {
        organizationId,
        remnantId: remnant.id,
        allocationType: "ALLOCATE",
        targetType: input.targetType as any,
        targetId: input.targetId,
        reservedAreaSqIn: input.reservedAreaSqIn ? decimal(input.reservedAreaSqIn) : undefined,
        reservedLengthIn: input.reservedLengthIn ? decimal(input.reservedLengthIn) : undefined,
        reservedWidthIn: input.reservedWidthIn ? decimal(input.reservedWidthIn) : undefined,
        status: "ACTIVE",
        notes: input.notes?.trim() || null,
        createdByUserId: input.createdByUserId ?? null
      }
    });

    await tx.remnant.update({
      where: { id: remnant.id },
      data: { status: "ALLOCATED" }
    });

    await tx.remnantUsage.create({
      data: {
        organizationId,
        remnantId: remnant.id,
        actionType: "ALLOCATED",
        usedAreaSqIn: input.reservedAreaSqIn ? decimal(input.reservedAreaSqIn) : undefined,
        notes: input.notes?.trim() || null
      }
    });

    return created;
  });

  return {
    ok: true,
    action: "allocate-remnant",
    allocation: mapAllocation(allocation),
    remnant: (await getRemnantDetail(remnant.id, organizationId)).remnant
  };
}

export async function releaseRemnantAllocation(input: {
  allocationId: string;
  organizationId?: string;
  notes?: string;
  releasedByUserId?: string;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const allocation = await prisma.remnantAllocation.findFirst({
    where: { id: input.allocationId, organizationId }
  });
  if (!allocation) {
    throw new Error("Remnant allocation not found.");
  }
  if (allocation.status !== "ACTIVE") {
    throw new Error("Only active remnant allocations can be released.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const released = await tx.remnantAllocation.update({
      where: { id: allocation.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releasedByUserId: input.releasedByUserId ?? null,
        notes: input.notes === undefined ? allocation.notes : input.notes.trim() || null
      }
    });

    await tx.remnant.update({
      where: { id: allocation.remnantId },
      data: { status: "AVAILABLE" }
    });

    await tx.remnantUsage.create({
      data: {
        organizationId,
        remnantId: allocation.remnantId,
        actionType: "RELEASED",
        notes: input.notes?.trim() || null
      }
    });

    return released;
  });

  return {
    ok: true,
    action: "release-remnant-allocation",
    allocation: mapAllocation(updated),
    remnant: (await getRemnantDetail(updated.remnantId, organizationId)).remnant
  };
}

export async function listRemnantAllocations(input: { organizationId?: string; remnantId?: string; status?: string }) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const allocations = await prisma.remnantAllocation.findMany({
    where: {
      organizationId,
      ...(input.remnantId ? { remnantId: input.remnantId } : {}),
      ...(input.status ? { status: input.status as any } : {})
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true,
    allocations: allocations.map(mapAllocation)
  };
}

export async function getRemnantAllocationDetail(allocationId: string, organizationId = LOCAL_ORG_ID) {
  const allocation = await prisma.remnantAllocation.findFirst({
    where: { id: allocationId, organizationId }
  });
  if (!allocation) {
    throw new Error("Remnant allocation not found.");
  }

  return {
    ok: true,
    allocation: mapAllocation(allocation)
  };
}

export async function consumeRemnant(remnantId: string, input: any, organizationId = LOCAL_ORG_ID) {
  const remnant = await prisma.remnant.findFirst({
    where: { id: remnantId, organizationId }
  });

  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  if (!["AVAILABLE", "PARTIAL", "RESERVED", "ALLOCATED"].includes(remnant.status)) {
    throw new Error(`Remnant ${remnant.code} is not available for consumption.`);
  }

  assertPositive(input.usedAreaSqIn, "Used area");
  const availableAreaSqIn = toNumber(remnant.usableAreaSqIn ?? remnant.areaSqIn);

  if (input.usedAreaSqIn > availableAreaSqIn) {
    throw new Error(`Remnant ${remnant.code} only has ${availableAreaSqIn.toFixed(3)} sq in available.`);
  }

  const widthIn = toNumber(remnant.widthIn);
  const remainingAreaSqIn = Number((availableAreaSqIn - input.usedAreaSqIn).toFixed(3));
  const fullyConsumed = remainingAreaSqIn <= 0.001;
  const nextLengthIn = fullyConsumed ? toNumber(remnant.lengthIn) : Number((remainingAreaSqIn / widthIn).toFixed(3));
  const nextStatus = fullyConsumed ? "CONSUMED" : "PARTIAL";

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.remnant.update({
      where: { id: remnantId },
      data: {
        status: nextStatus as any,
        lengthIn: fullyConsumed ? remnant.lengthIn : decimal(nextLengthIn),
        widthIn: remnant.widthIn,
        areaSqIn: fullyConsumed ? remnant.areaSqIn : decimal(remainingAreaSqIn),
        usableAreaSqIn: decimal(fullyConsumed ? 0 : remainingAreaSqIn)
      }
    });

    await tx.remnantUsage.create({
      data: {
        organizationId,
        remnantId,
        batchId: input.batchId,
        partId: input.partId,
        actionType: fullyConsumed ? "CONSUMED" : "PARTIAL_CONSUME",
        usedAreaSqIn: decimal(input.usedAreaSqIn),
        previousLengthIn: remnant.lengthIn,
        previousWidthIn: remnant.widthIn,
        newLengthIn: fullyConsumed ? remnant.lengthIn : decimal(nextLengthIn),
        newWidthIn: remnant.widthIn,
        notes: input.notes?.trim() || null
      }
    });

    await tx.remnantAllocation.updateMany({
      where: { organizationId, remnantId, status: "ACTIVE" },
      data: {
        status: "CONSUMED",
        releasedAt: new Date(),
        notes: input.notes?.trim() || null
      }
    });

    return next;
  });

  return getRemnantDetail(updated.id, organizationId);
}

export async function getRemnantLabelPayload(remnantId: string, organizationId = LOCAL_ORG_ID) {
  const remnant = await prisma.remnant.findFirst({
    where: { id: remnantId, organizationId },
    include: {
      currentContainer: true,
      currentLocation: true
    }
  });
  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  return {
    ok: true,
    label: buildRemnantLabelPayload(remnant)
  };
}

export async function getRemnantLabelHtml(remnantId: string, organizationId = LOCAL_ORG_ID) {
  const payload = await getRemnantLabelPayload(remnantId, organizationId);
  const template = await getNextRemnantRenderJobTemplate(organizationId);
  const html = renderRemnantLabelHtml({
    templateName: template?.name,
    label: payload.label
  });

  return {
    ok: true,
    label: payload.label,
    html,
    template: template
      ? {
          id: template.id,
          name: template.name,
          code: template.code,
          version: template.version
        }
      : undefined
  };
}

export async function reprintRemnantLabel(input: {
  remnantId: string;
  organizationId?: string;
  createdByUserId?: string;
  renderFormat?: "JSON" | "HTML" | "PDF";
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const renderFormat = input.renderFormat ?? "HTML";
  const payload = await getRemnantLabelPayload(input.remnantId, organizationId);
  const template = await getNextRemnantRenderJobTemplate(organizationId);
  const html =
    renderFormat === "HTML"
      ? renderRemnantLabelHtml({
          templateName: template?.name,
          label: payload.label
        })
      : null;

  const job = await prisma.labelRenderJob.create({
    data: {
      organizationId,
      entityType: "REMNANT",
      entityId: input.remnantId,
      remnantId: input.remnantId,
      templateId: template?.id ?? null,
      renderFormat: renderFormat as any,
      payloadJson: payload.label as unknown as Prisma.InputJsonValue,
      outputHtml: html,
      outputPath: null,
      createdByUserId: input.createdByUserId ?? null
    }
  });

  return {
    ok: true,
    action: "reprint-remnant-label",
    renderJob: {
      id: job.id,
      entityType: job.entityType,
      entityId: job.entityId,
      templateId: job.templateId ?? undefined,
      renderFormat: job.renderFormat,
      outputHtml: job.outputHtml ?? undefined,
      outputPath: job.outputPath ?? undefined,
      createdAt: job.createdAt.toISOString()
    },
    label: payload.label,
    ...(html ? { html } : {})
  };
}

export async function generateRemnantLabel(remnantId: string, organizationId = LOCAL_ORG_ID) {
  const remnant = await prisma.remnant.findFirst({
    where: { id: remnantId, organizationId },
    include: { currentLocation: true }
  });

  if (!remnant) {
    throw new Error("Remnant not found.");
  }

  const version = await getNextRemnantArtifactVersion(remnant.id, "remnant-label-pdf", organizationId);
  const fileName = `remnant-label-v${version}.pdf`;
  const bytes = buildRemnantLabelPdf({
    code: remnant.remnantCode ?? remnant.code,
    materialLabel: remnant.materialLabel,
    lengthIn: toNumber(remnant.lengthIn),
    widthIn: toNumber(remnant.widthIn),
    status: remnant.status,
    locationLabel: remnant.locationLabel ?? remnant.currentLocation?.name ?? undefined,
    createdDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(remnant.createdAt)
  });
  const uri = await writeRemnantArtifactPdf({
    remnantId,
    fileName,
    bytes
  });

  await prisma.$transaction([
    prisma.artifact.updateMany({
      where: {
        organizationId,
        remnantId,
        type: "remnant-label-pdf",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    }),
    prisma.artifact.create({
      data: {
        organizationId,
        remnantId,
        type: "remnant-label-pdf",
        uri,
        mimeType: "application/pdf",
        version,
        isCurrent: true,
        generatedFrom: remnant.remnantCode ?? remnant.code
      }
    })
  ]);

  const artifact = await prisma.artifact.findFirstOrThrow({
    where: {
      organizationId,
      remnantId,
      type: "remnant-label-pdf",
      version
    }
  });

  return {
    ok: true,
    action: "generate-remnant-label",
    remnantId,
    artifact: {
      id: artifact.id,
      type: "remnant-label-pdf",
      uri: artifact.uri,
      isCurrent: true,
      version: artifact.version
    }
  };
}

export async function checkRemnantCandidates(input: {
  organizationId?: string;
  materialType: string;
  thicknessIn: number;
  requiredLengthIn: number;
  requiredWidthIn: number;
  quantity?: number;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;
  const candidates = await prisma.remnant.findMany({
    where: {
      organizationId,
      materialCode: input.materialType as any,
      thicknessIn: decimal(input.thicknessIn),
      status: "AVAILABLE",
      lengthIn: { gte: decimal(input.requiredLengthIn) },
      widthIn: { gte: decimal(input.requiredWidthIn) },
      allocations: {
        none: {
          status: "ACTIVE"
        }
      }
    },
    include: {
      currentContainer: true,
      currentLocation: true
    },
    orderBy: [{ usableAreaSqIn: "asc" }, { createdAt: "asc" }]
  });

  return {
    ok: true,
    requested: {
      materialType: input.materialType,
      thicknessIn: input.thicknessIn,
      requiredLengthIn: input.requiredLengthIn,
      requiredWidthIn: input.requiredWidthIn,
      quantity: input.quantity ?? 1
    },
    candidates: candidates.map((remnant) => ({
      ...mapRemnantRow(remnant),
      fitAreaDeltaSqIn: Number(
        (
          toNumber(remnant.usableAreaSqIn ?? remnant.areaSqIn) -
          areaSqIn(input.requiredLengthIn, input.requiredWidthIn)
        ).toFixed(3)
      )
    }))
  };
}
