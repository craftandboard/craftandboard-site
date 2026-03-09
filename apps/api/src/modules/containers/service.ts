import type { BatchSortingSummary, ContainerPartRow, ContainerSummary, ContainerType, MaterialCode } from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { syncContainerStatus } from "./assignment.js";
import { buildSortingSummary, mapContainerPartRow, mapContainerSummary, SORTING_ELIGIBLE_PART_STATUSES } from "./selectors.js";

function normalizeContainerCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getNextContainerCode(input: {
  organizationId: string;
  batchCode: string;
  type: ContainerType;
}) {
  const prefix = `${input.batchCode}-${input.type === "BIN" ? "BIN" : "CONT"}`;
  const existingCount = await prisma.container.count({
    where: {
      organizationId: input.organizationId,
      code: {
        startsWith: `${prefix}-`
      }
    }
  });

  return `${prefix}-${String(existingCount + 1).padStart(2, "0")}`;
}

async function loadBatch(batchId: string, organizationId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      organizationId: true,
      code: true,
      materialCode: true
    }
  });

  if (!batch || batch.organizationId !== organizationId) {
    throw new Error("Batch not found.");
  }

  return batch;
}

async function loadContainer(containerId: string, organizationId: string) {
  const container = await prisma.container.findUnique({
    where: { id: containerId },
    include: {
      currentParts: {
        include: {
          manufacturingJob: {
            select: {
              labelCode: true,
              source: true
            }
          }
        },
        orderBy: [{ updatedAt: "desc" }, { instanceNumber: "asc" }]
      }
    }
  });

  if (!container || container.organizationId !== organizationId) {
    throw new Error("Container not found.");
  }

  return container;
}

async function loadPartBySelector(input: {
  organizationId: string;
  batchId?: string;
  partId?: string;
  scanCode?: string;
}) {
  const part = input.partId
    ? await prisma.part.findUnique({
        where: { id: input.partId },
        include: {
          manufacturingJob: {
            select: {
              labelCode: true,
              source: true
            }
          }
        }
      })
    : input.scanCode
      ? await prisma.part.findUnique({
          where: { scanCode: input.scanCode },
          include: {
            manufacturingJob: {
              select: {
                labelCode: true,
                source: true
              }
            }
          }
        })
      : null;

  if (!part || part.organizationId !== input.organizationId) {
    throw new Error(input.scanCode ? `Part scan code ${input.scanCode} was not found.` : "Part not found.");
  }

  if (input.batchId && part.batchId !== input.batchId) {
    throw new Error("Part does not belong to the active batch.");
  }

  if (!SORTING_ELIGIBLE_PART_STATUSES.includes(part.status as (typeof SORTING_ELIGIBLE_PART_STATUSES)[number])) {
    throw new Error(`Part ${part.scanCode} is not eligible for container sorting.`);
  }

  return part;
}

function containerCompletionPct(input: {
  partCount: number;
  scopedPartCount: number;
}) {
  if (input.scopedPartCount === 0) {
    return input.partCount > 0 ? 100 : 0;
  }

  return Math.round((input.partCount / input.scopedPartCount) * 100);
}

async function buildContainerSummary(container: Awaited<ReturnType<typeof loadContainer>>) {
  const distinctOrderIds = new Set(container.currentParts.map((part) => part.orderId).filter(Boolean));
  const distinctJobIds = new Set(container.currentParts.map((part) => part.manufacturingJobId).filter(Boolean));
  const scopedPartCount = await prisma.part.count({
    where: {
      organizationId: container.organizationId,
      batchId: container.batchId,
      status: {
        in: [...SORTING_ELIGIBLE_PART_STATUSES]
      },
      ...(container.orderId ? { orderId: container.orderId } : {}),
      ...(container.manufacturingJobId ? { manufacturingJobId: container.manufacturingJobId } : {})
    }
  });

  return mapContainerSummary({
    id: container.id,
    batchId: container.batchId,
    code: container.code,
    label: container.label,
    type: container.type,
    status: container.status,
    notes: container.notes,
    orderId: container.orderId,
    manufacturingJobId: container.manufacturingJobId,
    partCount: container.currentParts.length,
    completionPct: containerCompletionPct({
      partCount: container.currentParts.length,
      scopedPartCount
    }),
    mixed: distinctOrderIds.size > 1 || distinctJobIds.size > 1,
    createdAt: container.createdAt,
    updatedAt: container.updatedAt
  });
}

export async function createContainer(input: {
  batchId: string;
  type: ContainerType;
  code?: string;
  label?: string;
  orderId?: string;
  manufacturingJobId?: string;
  notes?: string;
}, organizationId = LOCAL_ORG_ID): Promise<{ ok: true; container: ContainerSummary }> {
  const batch = await loadBatch(input.batchId, organizationId);

  if (input.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, organizationId: true }
    });
    if (!order || order.organizationId !== organizationId) {
      throw new Error("Order not found.");
    }
  }

  if (input.manufacturingJobId) {
    const job = await prisma.manufacturingJob.findUnique({
      where: { id: input.manufacturingJobId },
      select: { id: true, organizationId: true, batchId: true }
    });
    if (!job || job.organizationId !== organizationId) {
      throw new Error("Manufacturing job not found.");
    }
    if (job.batchId !== input.batchId) {
      throw new Error("Manufacturing job does not belong to the selected batch.");
    }
  }

  const requestedCode = input.code ? normalizeContainerCode(input.code) : "";
  const code = requestedCode || (await getNextContainerCode({
    organizationId,
    batchCode: batch.code,
    type: input.type
  }));

  const created = await prisma.container.create({
    data: {
      organizationId,
      batchId: input.batchId,
      orderId: input.orderId,
      manufacturingJobId: input.manufacturingJobId,
      code,
      label: input.label?.trim() || code,
      type: input.type,
      notes: input.notes?.trim() || undefined
    }
  });

  return {
    ok: true,
    container: mapContainerSummary({
      id: created.id,
      batchId: created.batchId,
      code: created.code,
      label: created.label,
      type: created.type,
      status: created.status,
      notes: created.notes,
      orderId: created.orderId,
      manufacturingJobId: created.manufacturingJobId,
      partCount: 0,
      completionPct: 0,
      mixed: false,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    })
  };
}

export async function getBatchSortingView(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  ok: true;
  batch: {
    id: string;
    code: string;
    material: MaterialCode;
  };
  summary: BatchSortingSummary;
  containers: Array<ContainerSummary & { parts: ContainerPartRow[] }>;
  unassignedParts: ContainerPartRow[];
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      containers: {
        include: {
          currentParts: {
            include: {
              manufacturingJob: {
                select: {
                  labelCode: true,
                  source: true
                }
              }
            },
            orderBy: [{ updatedAt: "desc" }, { instanceNumber: "asc" }]
          }
        },
        orderBy: [{ createdAt: "asc" }]
      },
      parts: {
        where: {
          status: {
            in: [...SORTING_ELIGIBLE_PART_STATUSES]
          }
        },
        include: {
          manufacturingJob: {
            select: {
              labelCode: true,
              source: true
            }
          }
        },
        orderBy: [{ updatedAt: "asc" }, { instanceNumber: "asc" }]
      }
    }
  });

  if (!batch || batch.organizationId !== organizationId) {
    throw new Error("Batch not found.");
  }

  const containers = await Promise.all(
    batch.containers.map(async (container) => {
      const summary = await buildContainerSummary(container);
      return {
        ...summary,
        parts: container.currentParts.map((part) => mapContainerPartRow(part))
      };
    })
  );

  const unassignedParts = batch.parts
    .filter((part) => !part.currentContainerId)
    .map((part) => mapContainerPartRow(part));

  return {
    ok: true,
    batch: {
      id: batch.id,
      code: batch.code,
      material: batch.materialCode as MaterialCode
    },
    summary: buildSortingSummary({
      batchId: batch.id,
      batchCode: batch.code,
      totalParts: batch.parts.length,
      assignedParts: batch.parts.filter((part) => Boolean(part.currentContainerId)).length,
      openContainers: containers.filter((container) => container.status === "OPEN" || container.status === "SORTING").length
    }),
    containers,
    unassignedParts
  };
}

export async function assignPartToContainer(input: {
  containerId: string;
  partId?: string;
  scanCode?: string;
  allowReassign?: boolean;
}, organizationId = LOCAL_ORG_ID): Promise<{
  ok: true;
  action: "assign-part-to-container";
  container: ContainerSummary;
  part: ContainerPartRow & {
    currentContainerId?: string;
    currentContainerCode?: string;
    currentContainerLabel?: string;
  };
}> {
  const container = await loadContainer(input.containerId, organizationId);

  if (container.status === "CLOSED") {
    throw new Error(`Container ${container.code} is closed and cannot accept new parts.`);
  }

  const part = await loadPartBySelector({
    organizationId,
    batchId: container.batchId ?? undefined,
    partId: input.partId,
    scanCode: input.scanCode
  });

  if (container.manufacturingJobId && part.manufacturingJobId !== container.manufacturingJobId) {
    throw new Error(`Part ${part.scanCode} does not belong to the active job scope for container ${container.code}.`);
  }

  if (container.orderId && part.orderId !== container.orderId) {
    throw new Error(`Part ${part.scanCode} does not belong to the active order scope for container ${container.code}.`);
  }

  if (part.currentContainerId === container.id) {
    const summary = await buildContainerSummary(container);
    return {
      ok: true,
      action: "assign-part-to-container",
      container: summary,
      part: {
        ...mapContainerPartRow(part),
        currentContainerId: container.id,
        currentContainerCode: container.code,
        currentContainerLabel: container.label
      }
    };
  }

  if (part.currentContainerId && part.currentContainerId !== container.id && !input.allowReassign) {
    throw new Error(`Part ${part.scanCode} is already assigned to a different container.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (part.currentContainerId && part.currentContainerId !== container.id) {
      await tx.partContainerAssignment.updateMany({
        where: {
          organizationId,
          partId: part.id,
          removedAt: null
        },
        data: {
          removedAt: new Date()
        }
      });
    }

    await tx.part.update({
      where: { id: part.id },
      data: {
        currentContainerId: container.id
      }
    });

    await tx.partContainerAssignment.create({
      data: {
        organizationId,
        partId: part.id,
        containerId: container.id
      }
    });

    if (part.currentContainerId && part.currentContainerId !== container.id) {
      await syncContainerStatus(tx, part.currentContainerId);
    }
    await syncContainerStatus(tx, container.id);

    const updatedContainer = await tx.container.findUnique({
      where: { id: container.id },
      include: {
        currentParts: {
          include: {
            manufacturingJob: {
              select: {
                labelCode: true,
                source: true
              }
            }
          }
        }
      }
    });

    return updatedContainer;
  });

  if (!result) {
    throw new Error("Container not found.");
  }

  return {
    ok: true,
    action: "assign-part-to-container",
    container: await buildContainerSummary(result),
    part: {
      ...mapContainerPartRow(part),
      currentContainerId: result.id,
      currentContainerCode: result.code,
      currentContainerLabel: result.label
    }
  };
}

export async function removePartFromContainer(input: {
  containerId: string;
  partId?: string;
  scanCode?: string;
}, organizationId = LOCAL_ORG_ID) {
  const container = await loadContainer(input.containerId, organizationId);
  const part = await loadPartBySelector({
    organizationId,
    batchId: container.batchId ?? undefined,
    partId: input.partId,
    scanCode: input.scanCode
  });

  if (part.currentContainerId !== container.id) {
    throw new Error(`Part ${part.scanCode} is not assigned to container ${container.code}.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.part.update({
      where: { id: part.id },
      data: {
        currentContainerId: null
      }
    });

    await tx.partContainerAssignment.updateMany({
      where: {
        organizationId,
        partId: part.id,
        containerId: container.id,
        removedAt: null
      },
      data: {
        removedAt: new Date()
      }
    });

    await syncContainerStatus(tx, container.id);
  });

  const updatedContainer = await loadContainer(container.id, organizationId);

  return {
    ok: true as const,
    action: "remove-part-from-container" as const,
    container: await buildContainerSummary(updatedContainer),
    part: {
      ...mapContainerPartRow(part),
      currentContainerId: undefined,
      currentContainerCode: undefined,
      currentContainerLabel: undefined
    }
  };
}
