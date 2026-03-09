import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { createScanEvent } from "../scanning/repository.js";

const CONTAINER_SCAN_PREFIX = "CONTAINER:";
const LOCATION_SCAN_PREFIX = "LOCATION:";

const ASSIGNABLE_MANUFACTURING_PART_STATUSES = new Set([
  "READY_FOR_BATCH",
  "BATCHED",
  "CUT_PENDING",
  "CUT_IN_PROGRESS",
  "CUT_COMPLETE",
  "EDGEBAND_PENDING",
  "EDGEBAND_IN_PROGRESS",
  "EDGEBAND_COMPLETE",
  "PACKAGING_PENDING",
  "PACKAGING_IN_PROGRESS"
]);

function decimalToNumber(value: Prisma.Decimal | { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : null;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mapContainer(container: any) {
  return {
    id: container.id,
    containerCode: container.containerCode ?? container.code,
    displayName: container.displayName ?? container.label,
    description: container.description ?? undefined,
    containerType: container.type,
    barcodeValue: container.barcodeValue ?? `${CONTAINER_SCAN_PREFIX}${container.containerCode ?? container.code}`,
    qrValue: container.qrValue ?? `${CONTAINER_SCAN_PREFIX}${container.containerCode ?? container.code}`,
    capacityNotes: container.capacityNotes ?? undefined,
    status: container.status,
    currentLocationId: container.currentLocationId ?? undefined,
    currentLocationCode: container.currentLocation?.code ?? undefined,
    currentLocationName: container.currentLocation?.name ?? undefined,
    manufacturingBatchId: container.manufacturingBatchId ?? undefined,
    batchId: container.batchId ?? undefined,
    isActive: container.isActive,
    activePartCount:
      container._count?.manufacturingAssignments ??
      container.manufacturingAssignments?.filter((assignment: any) => !assignment.unassignedAt).length ??
      0,
    createdAt: container.createdAt.toISOString(),
    updatedAt: container.updatedAt.toISOString()
  };
}

function mapLocation(location: any) {
  return {
    id: location.id,
    code: location.code,
    name: location.name,
    zone: location.zone ?? undefined,
    notes: location.notes ?? undefined,
    isActive: location.isActive,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString()
  };
}

function mapManufacturingPart(part: any) {
  return {
    id: part.id,
    partNumber: part.partNumber,
    status: part.status,
    materialType: part.materialType,
    thicknessIn: decimalToNumber(part.thicknessIn),
    lengthIn: decimalToNumber(part.lengthIn),
    depthIn: decimalToNumber(part.depthIn),
    edgeBandPattern: part.edgeBandPattern,
    packetNumber: part.manufacturingPacket?.packetNumber ?? undefined,
    batchNumber: part.batch?.batchNumber ?? undefined,
    salesOrderId: part.salesOrderId,
    salesOrderItemId: part.salesOrderItemId,
    shelfJobId: part.shelfJobId,
    currentContainerId: part.currentContainerId ?? undefined,
    currentContainerCode: part.currentContainer?.containerCode ?? part.currentContainer?.code ?? undefined,
    currentContainerName: part.currentContainer?.displayName ?? part.currentContainer?.label ?? undefined,
    barcodeValue: `PART:${part.partNumber}`,
    qrValue: `PART:${part.partNumber}`
  };
}

function mapContainerAssignment(assignment: any) {
  return {
    id: assignment.id,
    containerId: assignment.containerId,
    manufacturingPartId: assignment.manufacturingPartId,
    assignedAt: assignment.assignedAt.toISOString(),
    unassignedAt: assignment.unassignedAt?.toISOString(),
    assignmentReason: assignment.assignmentReason ?? undefined,
    metadataJson: assignment.metadataJson ?? undefined,
    part: assignment.manufacturingPart ? mapManufacturingPart(assignment.manufacturingPart) : undefined,
    container: assignment.container ? mapContainer(assignment.container) : undefined
  };
}

function mapSession(session: any) {
  return {
    id: session.id,
    containerId: session.containerId,
    stationType: session.stationType ?? undefined,
    startedByUserId: session.startedByUserId ?? undefined,
    endedByUserId: session.endedByUserId ?? undefined,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString(),
    isActive: session.isActive,
    metadataJson: session.metadataJson ?? undefined,
    container: session.container ? mapContainer(session.container) : undefined
  };
}

async function loadContainerById(containerId: string, organizationId: string) {
  return prisma.container.findFirst({
    where: { id: containerId, organizationId },
    include: {
      currentLocation: true,
      manufacturingAssignments: {
        where: { unassignedAt: null }
      }
    }
  });
}

async function loadContainerByScanValue(scanValue: string, organizationId: string) {
  const normalized = scanValue.trim();
  const code = normalized.startsWith(CONTAINER_SCAN_PREFIX)
    ? normalized.slice(CONTAINER_SCAN_PREFIX.length)
    : normalized;
  return prisma.container.findFirst({
    where: {
      organizationId,
      OR: [{ containerCode: code }, { code }, { barcodeValue: normalized }, { qrValue: normalized }]
    },
    include: {
      currentLocation: true,
      manufacturingAssignments: {
        where: { unassignedAt: null }
      }
    }
  });
}

async function loadLocationByRef(input: {
  organizationId: string;
  locationId?: string;
  locationCode?: string;
  locationScanValue?: string;
}) {
  const normalizedCode = input.locationScanValue
    ? input.locationScanValue.trim().startsWith(LOCATION_SCAN_PREFIX)
      ? input.locationScanValue.trim().slice(LOCATION_SCAN_PREFIX.length)
      : input.locationScanValue.trim()
    : input.locationCode?.trim();

  return prisma.containerLocation.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(input.locationId ? [{ id: input.locationId }] : []),
        ...(normalizedCode ? [{ code: normalizedCode }] : [])
      ]
    }
  });
}

async function loadManufacturingPartByRef(input: {
  organizationId: string;
  partId?: string;
  partScanValue?: string;
}) {
  const normalizedScan = input.partScanValue?.trim();
  const partNumber = normalizedScan?.startsWith("PART:") ? normalizedScan.slice("PART:".length) : normalizedScan;

  return prisma.manufacturingPart.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(input.partId ? [{ id: input.partId }] : []),
        ...(partNumber ? [{ partNumber }] : [])
      ]
    },
    include: {
      manufacturingPacket: true,
      batch: true,
      currentContainer: true
    }
  });
}

async function syncContainerAvailability(tx: any, containerId: string) {
  const container = await tx.container.findUnique({
    where: { id: containerId },
    include: {
      manufacturingAssignments: {
        where: { unassignedAt: null }
      }
    }
  });

  if (!container) {
    return;
  }
  if (!container.isActive || container.status === "RETIRED" || container.status === "HOLD" || container.status === "CLOSED") {
    return;
  }

  await tx.container.update({
    where: { id: containerId },
    data: {
      status: container.manufacturingAssignments.length > 0 ? "IN_USE" : "AVAILABLE"
    }
  });
}

function assertContainerUsable(container: any) {
  if (!container) {
    throw new Error("Container not found.");
  }
  if (!container.isActive || container.status === "RETIRED" || container.status === "CLOSED") {
    throw new Error(`Container ${(container.containerCode ?? container.code)} is not active for sorting.`);
  }
  if (container.status === "HOLD") {
    throw new Error(`Container ${(container.containerCode ?? container.code)} is on hold.`);
  }
}

function assertPartAssignable(part: any) {
  if (!part) {
    throw new Error("Manufacturing part not found.");
  }
  if (!ASSIGNABLE_MANUFACTURING_PART_STATUSES.has(part.status)) {
    throw new Error(`Manufacturing part ${part.partNumber} is not eligible for container assignment.`);
  }
}

async function createContainerScanAudit(input: {
  organizationId: string;
  entityType: "CONTAINER" | "MANUFACTURING_PART" | "CONTAINER_LOCATION";
  entityId?: string;
  scanValue: string;
  actionType: "CHECK_IN" | "CHECK_OUT" | "MOVE" | "ASSIGN_CONTAINER";
  result: "ACCEPTED" | "REJECTED" | "NOOP";
  resultReason?: string;
  scannedByUserId?: string;
  stationType?: "CONTAINER" | "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "UNKNOWN";
  manufacturingPartId?: string;
  manufacturingBatchId?: string;
  metadataJson?: Record<string, unknown>;
}) {
  return createScanEvent({
    organizationId: input.organizationId,
    entityType: input.entityType,
    entityId: input.entityId,
    scanValue: input.scanValue,
    stationType: input.stationType ?? "CONTAINER",
    actionType: input.actionType,
    result: input.result,
    resultReason: input.resultReason ?? null,
    scannedByUserId: input.scannedByUserId,
    manufacturingPartId: input.manufacturingPartId,
    manufacturingBatchId: input.manufacturingBatchId,
    metadataJson: input.metadataJson
  });
}

export async function createManagedContainer(input: {
  organizationId: string;
  containerCode?: string;
  containerType?: "BIN" | "CART" | "TOTE" | "PALLET" | "RACK_SLOT" | "STAGING_AREA" | "CONTAINER";
  displayName?: string;
  description?: string;
  barcodeValue?: string;
  qrValue?: string;
  capacityNotes?: string;
  status?: "AVAILABLE" | "IN_USE" | "HOLD" | "RETIRED" | "OPEN" | "SORTING" | "COMPLETE" | "CLOSED";
  currentLocationId?: string;
  manufacturingBatchId?: string;
  batchId?: string;
  isActive?: boolean;
}) {
  if (input.currentLocationId) {
    const location = await prisma.containerLocation.findFirst({
      where: { id: input.currentLocationId, organizationId: input.organizationId }
    });
    if (!location) {
      throw new Error("Container location not found.");
    }
  }

  if (input.manufacturingBatchId) {
    const batch = await prisma.manufacturingBatch.findFirst({
      where: { id: input.manufacturingBatchId, organizationId: input.organizationId }
    });
    if (!batch) {
      throw new Error("Manufacturing batch not found.");
    }
  }

  const containerType = input.containerType ?? "BIN";
  const count = await prisma.container.count({ where: { organizationId: input.organizationId, type: containerType } });
  const containerCode = normalizeCode(input.containerCode ?? `${containerType}-${String(count + 1).padStart(3, "0")}`);
  const displayName = input.displayName?.trim() || containerCode;
  const barcodeValue = input.barcodeValue?.trim() || `${CONTAINER_SCAN_PREFIX}${containerCode}`;
  const qrValue = input.qrValue?.trim() || barcodeValue;

  const container = await prisma.container.create({
    data: {
      organizationId: input.organizationId,
      batchId: input.batchId ?? null,
      manufacturingBatchId: input.manufacturingBatchId ?? null,
      code: containerCode,
      containerCode,
      label: displayName,
      displayName,
      description: input.description?.trim() || null,
      type: containerType,
      status: input.status ?? "AVAILABLE",
      barcodeValue,
      qrValue,
      capacityNotes: input.capacityNotes?.trim() || null,
      currentLocationId: input.currentLocationId ?? null,
      isActive: input.isActive ?? true
    },
    include: {
      currentLocation: true,
      manufacturingAssignments: { where: { unassignedAt: null } },
      _count: { select: { manufacturingAssignments: true } }
    }
  });

  return {
    ok: true as const,
    container: mapContainer(container)
  };
}

export async function listManagedContainers(organizationId: string) {
  const containers = await prisma.container.findMany({
    where: { organizationId },
    include: {
      currentLocation: true,
      manufacturingAssignments: { where: { unassignedAt: null } },
      _count: { select: { manufacturingAssignments: true } }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return {
    ok: true as const,
    containers: containers.map(mapContainer)
  };
}

export async function getManagedContainer(containerId: string, organizationId: string) {
  const container = await prisma.container.findFirst({
    where: { id: containerId, organizationId },
    include: {
      currentLocation: true,
      manufacturingAssignments: {
        where: { unassignedAt: null },
        include: {
          manufacturingPart: {
            include: {
              manufacturingPacket: true,
              batch: true,
              currentContainer: true
            }
          }
        }
      },
      _count: { select: { manufacturingAssignments: true } }
    }
  });

  if (!container) {
    throw new Error("Container not found.");
  }

  return {
    ok: true as const,
    container: mapContainer(container),
    parts: container.manufacturingAssignments.map((assignment) => mapManufacturingPart(assignment.manufacturingPart))
  };
}

export async function updateManagedContainer(input: {
  organizationId: string;
  containerId: string;
  containerCode?: string;
  containerType?: "BIN" | "CART" | "TOTE" | "PALLET" | "RACK_SLOT" | "STAGING_AREA" | "CONTAINER";
  displayName?: string;
  description?: string;
  barcodeValue?: string;
  qrValue?: string;
  capacityNotes?: string;
  status?: "AVAILABLE" | "IN_USE" | "HOLD" | "RETIRED" | "OPEN" | "SORTING" | "COMPLETE" | "CLOSED";
  currentLocationId?: string;
  isActive?: boolean;
}) {
  const existing = await loadContainerById(input.containerId, input.organizationId);
  if (!existing) {
    throw new Error("Container not found.");
  }

  if (input.currentLocationId) {
    const location = await prisma.containerLocation.findFirst({
      where: { id: input.currentLocationId, organizationId: input.organizationId }
    });
    if (!location) {
      throw new Error("Container location not found.");
    }
  }

  const containerCode = input.containerCode ? normalizeCode(input.containerCode) : undefined;
  const updated = await prisma.container.update({
    where: { id: existing.id },
    data: {
      containerCode,
      code: containerCode,
      label: input.displayName?.trim() || undefined,
      displayName: input.displayName?.trim() || undefined,
      description: input.description === undefined ? undefined : input.description.trim() || null,
      type: input.containerType,
      status: input.status,
      barcodeValue: input.barcodeValue?.trim() || undefined,
      qrValue: input.qrValue?.trim() || undefined,
      capacityNotes: input.capacityNotes === undefined ? undefined : input.capacityNotes.trim() || null,
      currentLocationId: input.currentLocationId === undefined ? undefined : input.currentLocationId || null,
      isActive: input.isActive
    },
    include: {
      currentLocation: true,
      manufacturingAssignments: { where: { unassignedAt: null } },
      _count: { select: { manufacturingAssignments: true } }
    }
  });

  return {
    ok: true as const,
    container: mapContainer(updated)
  };
}

export async function listContainerLocations(organizationId: string) {
  const locations = await prisma.containerLocation.findMany({
    where: { organizationId },
    orderBy: [{ code: "asc" }]
  });

  return {
    ok: true as const,
    locations: locations.map(mapLocation)
  };
}

export async function createContainerLocationRecord(input: {
  organizationId: string;
  code: string;
  name: string;
  zone?: string;
  notes?: string;
  isActive?: boolean;
}) {
  const code = normalizeCode(input.code);
  const location = await prisma.containerLocation.create({
    data: {
      organizationId: input.organizationId,
      code,
      name: input.name.trim(),
      zone: input.zone?.trim() || null,
      notes: input.notes?.trim() || null,
      isActive: input.isActive ?? true
    }
  });

  return {
    ok: true as const,
    location: mapLocation(location)
  };
}

export async function updateContainerLocationRecord(input: {
  organizationId: string;
  locationId: string;
  code?: string;
  name?: string;
  zone?: string;
  notes?: string;
  isActive?: boolean;
}) {
  const existing = await prisma.containerLocation.findFirst({
    where: { id: input.locationId, organizationId: input.organizationId }
  });
  if (!existing) {
    throw new Error("Container location not found.");
  }

  const location = await prisma.containerLocation.update({
    where: { id: existing.id },
    data: {
      code: input.code ? normalizeCode(input.code) : undefined,
      name: input.name?.trim() || undefined,
      zone: input.zone === undefined ? undefined : input.zone.trim() || null,
      notes: input.notes === undefined ? undefined : input.notes.trim() || null,
      isActive: input.isActive
    }
  });

  return {
    ok: true as const,
    location: mapLocation(location)
  };
}

export async function activateContainerSessionRecord(input: {
  organizationId: string;
  containerId: string;
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  startedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const container = await loadContainerById(input.containerId, input.organizationId);
  assertContainerUsable(container);

  const session = await prisma.$transaction(async (tx) => {
    if (input.startedByUserId) {
      await tx.activeContainerSession.updateMany({
        where: {
          organizationId: input.organizationId,
          startedByUserId: input.startedByUserId,
          isActive: true
        },
        data: {
          isActive: false,
          endedAt: new Date(),
          endedByUserId: input.startedByUserId
        }
      });
    }

    const created = await tx.activeContainerSession.create({
      data: {
        organizationId: input.organizationId,
        containerId: container!.id,
        stationType: input.stationType ?? "CONTAINER",
        startedByUserId: input.startedByUserId ?? null,
        isActive: true,
        metadataJson: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      },
      include: {
        container: {
          include: {
            currentLocation: true,
            manufacturingAssignments: { where: { unassignedAt: null } },
            _count: { select: { manufacturingAssignments: true } }
          }
        }
      }
    });

    await tx.container.update({
      where: { id: container!.id },
      data: {
        status: container!.status === "AVAILABLE" ? "IN_USE" : container!.status
      }
    });

    return created;
  });

  const event = await createContainerScanAudit({
    organizationId: input.organizationId,
    entityType: "CONTAINER",
    entityId: container!.id,
    scanValue: container!.barcodeValue ?? `${CONTAINER_SCAN_PREFIX}${container!.containerCode ?? container!.code}`,
    actionType: "CHECK_IN",
    result: "ACCEPTED",
    scannedByUserId: input.startedByUserId,
    stationType: input.stationType ?? "CONTAINER",
    metadataJson: {
      ...(input.metadata ?? {}),
      sessionId: session.id
    }
  });

  return {
    ok: true as const,
    action: "activate-container-session",
    session: mapSession(session),
    container: mapContainer(session.container),
    event: {
      id: event.id,
      result: event.result
    }
  };
}

export async function deactivateContainerSessionRecord(input: {
  organizationId: string;
  containerId: string;
  endedByUserId?: string;
}) {
  const container = await loadContainerById(input.containerId, input.organizationId);
  if (!container) {
    throw new Error("Container not found.");
  }

  await prisma.activeContainerSession.updateMany({
    where: {
      organizationId: input.organizationId,
      containerId: input.containerId,
      isActive: true
    },
    data: {
      isActive: false,
      endedAt: new Date(),
      endedByUserId: input.endedByUserId ?? null
    }
  });

  await syncContainerAvailability(prisma, input.containerId);

  const event = await createContainerScanAudit({
    organizationId: input.organizationId,
    entityType: "CONTAINER",
    entityId: container.id,
    scanValue: container.barcodeValue ?? `${CONTAINER_SCAN_PREFIX}${container.containerCode ?? container.code}`,
    actionType: "CHECK_OUT",
    result: "ACCEPTED",
    scannedByUserId: input.endedByUserId,
    stationType: "CONTAINER"
  });

  return {
    ok: true as const,
    action: "deactivate-container-session",
    container: mapContainer(container),
    event: {
      id: event.id,
      result: event.result
    }
  };
}

export async function listActiveContainerSessionsView(organizationId: string) {
  const sessions = await prisma.activeContainerSession.findMany({
    where: { organizationId, isActive: true },
    include: {
      container: {
        include: {
          currentLocation: true,
          manufacturingAssignments: { where: { unassignedAt: null } },
          _count: { select: { manufacturingAssignments: true } }
        }
      }
    },
    orderBy: [{ startedAt: "desc" }]
  });

  return {
    ok: true as const,
    sessions: sessions.map(mapSession)
  };
}

export async function assignManufacturingPartToContainer(input: {
  organizationId: string;
  containerId?: string;
  containerScanValue?: string;
  partId?: string;
  partScanValue?: string;
  assignedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const container = input.containerId
    ? await loadContainerById(input.containerId, input.organizationId)
    : await loadContainerByScanValue(input.containerScanValue ?? "", input.organizationId);
  assertContainerUsable(container);

  const part = await loadManufacturingPartByRef({
    organizationId: input.organizationId,
    partId: input.partId,
    partScanValue: input.partScanValue
  });
  assertPartAssignable(part);

  const activeAssignment = await prisma.containerAssignment.findFirst({
    where: {
      organizationId: input.organizationId,
      manufacturingPartId: part!.id,
      unassignedAt: null
    },
    include: {
      container: true
    }
  });

  if (activeAssignment && activeAssignment.containerId === container!.id) {
    const event = await createContainerScanAudit({
      organizationId: input.organizationId,
      entityType: "MANUFACTURING_PART",
      entityId: part!.id,
      scanValue: input.partScanValue ?? `PART:${part!.partNumber}`,
      actionType: "ASSIGN_CONTAINER",
      result: "NOOP",
      resultReason: `Manufacturing part ${part!.partNumber} is already assigned to container ${container!.containerCode ?? container!.code}.`,
      scannedByUserId: input.assignedByUserId,
      stationType: "CONTAINER",
      manufacturingPartId: part!.id,
      manufacturingBatchId: part!.batchId ?? undefined,
      metadataJson: {
        containerId: container!.id
      }
    });

    return {
      ok: true as const,
      action: "assign-part-to-container",
      container: mapContainer(container),
      part: mapManufacturingPart(part),
      event: {
        id: event.id,
        result: event.result,
        resultReason: event.resultReason ?? undefined
      }
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (activeAssignment) {
      await tx.containerAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          unassignedAt: new Date(),
          unassignedByUserId: input.assignedByUserId ?? null
        }
      });
    }

    await tx.manufacturingPart.update({
      where: { id: part!.id },
      data: {
        currentContainerId: container!.id
      }
    });

    await tx.containerAssignment.create({
      data: {
        organizationId: input.organizationId,
        containerId: container!.id,
        manufacturingPartId: part!.id,
        assignedByUserId: input.assignedByUserId ?? null,
        assignmentReason: "SORTING",
        metadataJson: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    if (activeAssignment) {
      await syncContainerAvailability(tx, activeAssignment.containerId);
    }
    await syncContainerAvailability(tx, container!.id);

    return tx.manufacturingPart.findFirst({
      where: { id: part!.id, organizationId: input.organizationId },
      include: {
        manufacturingPacket: true,
        batch: true,
        currentContainer: true
      }
    });
  });

  const refreshedContainer = await loadContainerById(container!.id, input.organizationId);
  const event = await createContainerScanAudit({
    organizationId: input.organizationId,
    entityType: "MANUFACTURING_PART",
    entityId: part!.id,
    scanValue: input.partScanValue ?? `PART:${part!.partNumber}`,
    actionType: "ASSIGN_CONTAINER",
    result: "ACCEPTED",
    scannedByUserId: input.assignedByUserId,
    stationType: "CONTAINER",
    manufacturingPartId: part!.id,
    manufacturingBatchId: part!.batchId ?? undefined,
    metadataJson: {
      ...(input.metadata ?? {}),
      containerId: container!.id,
      previousContainerId: activeAssignment?.containerId ?? null
    }
  });

  return {
    ok: true as const,
    action: "assign-part-to-container",
    container: mapContainer(refreshedContainer),
    part: mapManufacturingPart(updated),
    event: {
      id: event.id,
      result: event.result
    }
  };
}

export async function assignManufacturingPartToActiveContainer(input: {
  organizationId: string;
  partId?: string;
  partScanValue?: string;
  assignedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const activeSession = await prisma.activeContainerSession.findFirst({
    where: {
      organizationId: input.organizationId,
      startedByUserId: input.assignedByUserId ?? null,
      isActive: true
    },
    orderBy: [{ startedAt: "desc" }]
  });

  if (!activeSession) {
    const scanValue = input.partScanValue ?? input.partId ?? "UNKNOWN";
    const event = await createContainerScanAudit({
      organizationId: input.organizationId,
      entityType: "MANUFACTURING_PART",
      scanValue,
      actionType: "ASSIGN_CONTAINER",
      result: "REJECTED",
      resultReason: "No active container session is available for this user.",
      scannedByUserId: input.assignedByUserId,
      stationType: "CONTAINER",
      metadataJson: input.metadata
    });

    throw Object.assign(new Error("No active container session is available for this user."), {
      scanEvent: {
        id: event.id,
        result: event.result
      }
    });
  }

  return assignManufacturingPartToContainer({
    organizationId: input.organizationId,
    containerId: activeSession.containerId,
    partId: input.partId,
    partScanValue: input.partScanValue,
    assignedByUserId: input.assignedByUserId,
    metadata: {
      ...(input.metadata ?? {}),
      activeSessionId: activeSession.id
    }
  });
}

export async function unassignManufacturingPartFromContainer(input: {
  organizationId: string;
  containerId?: string;
  partId?: string;
  partScanValue?: string;
  unassignedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const part = await loadManufacturingPartByRef({
    organizationId: input.organizationId,
    partId: input.partId,
    partScanValue: input.partScanValue
  });
  if (!part) {
    throw new Error("Manufacturing part not found.");
  }

  const activeAssignment = await prisma.containerAssignment.findFirst({
    where: {
      organizationId: input.organizationId,
      manufacturingPartId: part.id,
      unassignedAt: null
    }
  });
  if (!activeAssignment) {
    throw new Error(`Manufacturing part ${part.partNumber} is not assigned to any container.`);
  }
  if (input.containerId && activeAssignment.containerId !== input.containerId) {
    throw new Error("Manufacturing part is not assigned to the specified container.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.containerAssignment.update({
      where: { id: activeAssignment.id },
      data: {
        unassignedAt: new Date(),
        unassignedByUserId: input.unassignedByUserId ?? null,
        metadataJson: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    await tx.manufacturingPart.update({
      where: { id: part.id },
      data: {
        currentContainerId: null
      }
    });

    await syncContainerAvailability(tx, activeAssignment.containerId);
  });

  const event = await createContainerScanAudit({
    organizationId: input.organizationId,
    entityType: "MANUFACTURING_PART",
    entityId: part.id,
    scanValue: input.partScanValue ?? `PART:${part.partNumber}`,
    actionType: "CHECK_OUT",
    result: "ACCEPTED",
    scannedByUserId: input.unassignedByUserId,
    stationType: "CONTAINER",
    manufacturingPartId: part.id,
    manufacturingBatchId: part.batchId ?? undefined,
    metadataJson: {
      ...(input.metadata ?? {}),
      previousContainerId: activeAssignment.containerId
    }
  });

  return {
    ok: true as const,
    action: "unassign-part-from-container",
    part: {
      ...mapManufacturingPart(part),
      currentContainerId: undefined,
      currentContainerCode: undefined,
      currentContainerName: undefined
    },
    event: {
      id: event.id,
      result: event.result
    }
  };
}

export async function moveContainerToLocation(input: {
  organizationId: string;
  containerId?: string;
  containerScanValue?: string;
  toLocationId?: string;
  toLocationCode?: string;
  locationScanValue?: string;
  movedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const container = input.containerId
    ? await loadContainerById(input.containerId, input.organizationId)
    : input.containerScanValue
      ? await loadContainerByScanValue(input.containerScanValue, input.organizationId)
      : input.movedByUserId
        ? (await prisma.activeContainerSession.findFirst({
            where: {
              organizationId: input.organizationId,
              startedByUserId: input.movedByUserId,
              isActive: true
            },
            include: {
              container: {
                include: {
                  currentLocation: true,
                  manufacturingAssignments: { where: { unassignedAt: null } }
                }
              }
            },
            orderBy: [{ startedAt: "desc" }]
          }))?.container
        : null;
  assertContainerUsable(container);

  const location = await loadLocationByRef({
    organizationId: input.organizationId,
    locationId: input.toLocationId,
    locationCode: input.toLocationCode,
    locationScanValue: input.locationScanValue
  });
  if (!location) {
    throw new Error("Container location not found.");
  }
  if (!location.isActive) {
    throw new Error(`Location ${location.code} is not active.`);
  }

  const previousLocationId = container!.currentLocationId ?? null;
  const updatedContainer = await prisma.$transaction(async (tx) => {
    await tx.containerMoveEvent.create({
      data: {
        organizationId: input.organizationId,
        containerId: container!.id,
        fromLocationId: previousLocationId,
        toLocationId: location.id,
        movedByUserId: input.movedByUserId ?? null,
        moveReason: "MANUAL_MOVE",
        metadataJson: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    return tx.container.update({
      where: { id: container!.id },
      data: { currentLocationId: location.id },
      include: {
        currentLocation: true,
        manufacturingAssignments: { where: { unassignedAt: null } },
        _count: { select: { manufacturingAssignments: true } }
      }
    });
  });

  const event = await createContainerScanAudit({
    organizationId: input.organizationId,
    entityType: "CONTAINER",
    entityId: container!.id,
    scanValue: input.containerScanValue ?? container!.barcodeValue ?? `${CONTAINER_SCAN_PREFIX}${container!.containerCode ?? container!.code}`,
    actionType: "MOVE",
    result: "ACCEPTED",
    scannedByUserId: input.movedByUserId,
    stationType: "CONTAINER",
    metadataJson: {
      ...(input.metadata ?? {}),
      fromLocationId: previousLocationId,
      toLocationId: location.id
    }
  });

  return {
    ok: true as const,
    action: "move-container",
    container: mapContainer(updatedContainer),
    location: mapLocation(location),
    event: {
      id: event.id,
      result: event.result
    }
  };
}

export async function listContainerAssignmentsView(input: {
  organizationId: string;
  containerId?: string;
  manufacturingPartId?: string;
  activeOnly?: boolean;
}) {
  const assignments = await prisma.containerAssignment.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.containerId ? { containerId: input.containerId } : {}),
      ...(input.manufacturingPartId ? { manufacturingPartId: input.manufacturingPartId } : {}),
      ...(input.activeOnly ? { unassignedAt: null } : {})
    },
    include: {
      container: {
        include: {
          currentLocation: true,
          manufacturingAssignments: { where: { unassignedAt: null } },
          _count: { select: { manufacturingAssignments: true } }
        }
      },
      manufacturingPart: {
        include: {
          manufacturingPacket: true,
          batch: true,
          currentContainer: true
        }
      }
    },
    orderBy: [{ assignedAt: "desc" }]
  });

  return {
    ok: true as const,
    assignments: assignments.map(mapContainerAssignment)
  };
}

export async function getContainerAssignmentView(assignmentId: string, organizationId: string) {
  const assignment = await prisma.containerAssignment.findFirst({
    where: { id: assignmentId, organizationId },
    include: {
      container: {
        include: {
          currentLocation: true,
          manufacturingAssignments: { where: { unassignedAt: null } },
          _count: { select: { manufacturingAssignments: true } }
        }
      },
      manufacturingPart: {
        include: {
          manufacturingPacket: true,
          batch: true,
          currentContainer: true
        }
      }
    }
  });

  if (!assignment) {
    throw new Error("Container assignment not found.");
  }

  return {
    ok: true as const,
    assignment: mapContainerAssignment(assignment)
  };
}

export async function getContainerPartsView(containerId: string, organizationId: string) {
  const container = await prisma.container.findFirst({
    where: { id: containerId, organizationId },
    include: {
      currentLocation: true,
      manufacturingAssignments: {
        where: { unassignedAt: null },
        include: {
          manufacturingPart: {
            include: {
              manufacturingPacket: true,
              batch: true,
              currentContainer: true
            }
          }
        },
        orderBy: [{ assignedAt: "asc" }]
      },
      _count: { select: { manufacturingAssignments: true } }
    }
  });

  if (!container) {
    throw new Error("Container not found.");
  }

  return {
    ok: true as const,
    container: mapContainer(container),
    parts: container.manufacturingAssignments.map((assignment) => mapManufacturingPart(assignment.manufacturingPart))
  };
}

export async function scanContainerForActivation(input: {
  organizationId: string;
  scanValue: string;
  stationType?: "CUT" | "EDGEBAND" | "PACKAGING" | "QC" | "SHIPPING" | "STAGING" | "CONTAINER" | "UNKNOWN";
  startedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const container = await loadContainerByScanValue(input.scanValue, input.organizationId);
  if (!container) {
    const event = await createContainerScanAudit({
      organizationId: input.organizationId,
      entityType: "CONTAINER",
      scanValue: input.scanValue,
      actionType: "CHECK_IN",
      result: "REJECTED",
      resultReason: "Container was not found.",
      scannedByUserId: input.startedByUserId,
      stationType: input.stationType ?? "CONTAINER",
      metadataJson: input.metadata
    });
    throw Object.assign(new Error("Container was not found."), { scanEvent: { id: event.id, result: event.result } });
  }

  return activateContainerSessionRecord({
    organizationId: input.organizationId,
    containerId: container.id,
    stationType: input.stationType,
    startedByUserId: input.startedByUserId,
    metadata: input.metadata
  });
}

export async function scanLocationForContainerMove(input: {
  organizationId: string;
  locationScanValue?: string;
  locationCode?: string;
  toLocationId?: string;
  containerId?: string;
  containerScanValue?: string;
  movedByUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  return moveContainerToLocation({
    organizationId: input.organizationId,
    locationScanValue: input.locationScanValue,
    toLocationCode: input.locationCode,
    toLocationId: input.toLocationId,
    containerId: input.containerId,
    containerScanValue: input.containerScanValue,
    movedByUserId: input.movedByUserId,
    metadata: input.metadata
  });
}
