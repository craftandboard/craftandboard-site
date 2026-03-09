import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const syncContainerStatusMock = vi.hoisted(() => vi.fn());

const txMock = vi.hoisted(() => ({
  part: {
    update: vi.fn()
  },
  container: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  partContainerAssignment: {
    create: vi.fn(),
    updateMany: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  batch: {
    findUnique: vi.fn()
  },
  container: {
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn()
  },
  order: {
    findUnique: vi.fn()
  },
  manufacturingJob: {
    findUnique: vi.fn()
  },
  part: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn()
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock))
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));
vi.mock("../modules/containers/assignment.js", () => ({
  syncContainerStatus: syncContainerStatusMock
}));

import { assignPartToContainer, createContainer, getBatchSortingView } from "../modules/containers/service.js";

describe("container workflow service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock)
    );
    syncContainerStatusMock.mockResolvedValue(undefined);
    prismaMock.part.count.mockResolvedValue(2);
  });

  it("creates a batch container with a deterministic generated code", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      organizationId: "org_local_craft_board",
      code: "20260308-WHITE_MELAMINE-01",
      materialCode: "WHITE_MELAMINE"
    });
    prismaMock.container.count.mockResolvedValue(0);
    prismaMock.container.create.mockResolvedValue({
      id: "container_1",
      batchId: "batch_123",
      code: "20260308-WHITE_MELAMINE-01-BIN-01",
      label: "Tyler Bin",
      type: "BIN",
      status: "OPEN",
      notes: null,
      orderId: null,
      manufacturingJobId: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z")
    });

    const result = await createContainer({
      batchId: "batch_123",
      type: "BIN",
      label: "Tyler Bin"
    });

    expect(result.ok).toBe(true);
    expect(prismaMock.container.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: "20260308-WHITE_MELAMINE-01-BIN-01",
        label: "Tyler Bin",
        type: "BIN"
      })
    });
  });

  it("assigns a part to a container by part id", async () => {
    prismaMock.container.findUnique.mockResolvedValueOnce({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      status: "OPEN",
      orderId: null,
      manufacturingJobId: null,
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      currentParts: []
    });
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      currentContainerId: null,
      orderId: "order_1",
      manufacturingJobId: "job_1",
      scanCode: "PART-part_1",
      materialCode: "WHITE_MELAMINE",
      widthIn: new Prisma.Decimal("19.25"),
      depthIn: new Prisma.Decimal("12.5"),
      thicknessIn: new Prisma.Decimal("0.75"),
      status: "CUT",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5",
        source: "CONFIGURATOR"
      }
    });
    txMock.part.update.mockResolvedValue({});
    txMock.partContainerAssignment.create.mockResolvedValue({});
    txMock.container.findUnique.mockResolvedValue({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      type: "BIN",
      status: "SORTING",
      notes: null,
      orderId: null,
      manufacturingJobId: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:05:00.000Z"),
      currentParts: [{ id: "part_1", orderId: "order_1", manufacturingJobId: "job_1" }]
    });

    const result = await assignPartToContainer({
      containerId: "container_1",
      partId: "part_1"
    });

    expect(txMock.part.update).toHaveBeenCalledWith({
      where: { id: "part_1" },
      data: {
        currentContainerId: "container_1"
      }
    });
    expect(result.container.code).toBe("BIN-01");
    expect(result.part.currentContainerCode).toBe("BIN-01");
  });

  it("assigns a part to a container by scan code", async () => {
    prismaMock.container.findUnique.mockResolvedValueOnce({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      status: "OPEN",
      orderId: null,
      manufacturingJobId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: []
    });
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      currentContainerId: null,
      orderId: "order_1",
      manufacturingJobId: "job_1",
      scanCode: "PART-part_1",
      materialCode: "WHITE_MELAMINE",
      widthIn: new Prisma.Decimal("19.25"),
      depthIn: new Prisma.Decimal("12.5"),
      thicknessIn: new Prisma.Decimal("0.75"),
      status: "CUT",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5",
        source: "CONFIGURATOR"
      }
    });
    txMock.part.update.mockResolvedValue({});
    txMock.partContainerAssignment.create.mockResolvedValue({});
    txMock.container.findUnique.mockResolvedValue({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      type: "BIN",
      status: "SORTING",
      notes: null,
      orderId: null,
      manufacturingJobId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: [{ id: "part_1", orderId: "order_1", manufacturingJobId: "job_1" }]
    });

    const result = await assignPartToContainer({
      containerId: "container_1",
      scanCode: "PART-part_1"
    });

    expect(result.part.scanCode).toBe("PART-part_1");
  });

  it("rejects conflicting assignment without explicit reassign", async () => {
    prismaMock.container.findUnique.mockResolvedValueOnce({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      status: "OPEN",
      orderId: null,
      manufacturingJobId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: []
    });
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      currentContainerId: "container_2",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      scanCode: "PART-part_1",
      materialCode: "WHITE_MELAMINE",
      widthIn: new Prisma.Decimal("19.25"),
      depthIn: new Prisma.Decimal("12.5"),
      thicknessIn: new Prisma.Decimal("0.75"),
      status: "CUT",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5",
        source: "CONFIGURATOR"
      }
    });

    await expect(
      assignPartToContainer({
        containerId: "container_1",
        partId: "part_1"
      })
    ).rejects.toThrow("Part PART-part_1 is already assigned to a different container.");
  });

  it("supports reassignment when explicitly allowed", async () => {
    prismaMock.container.findUnique.mockResolvedValueOnce({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      status: "OPEN",
      orderId: null,
      manufacturingJobId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: []
    });
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      currentContainerId: "container_2",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      scanCode: "PART-part_1",
      materialCode: "WHITE_MELAMINE",
      widthIn: new Prisma.Decimal("19.25"),
      depthIn: new Prisma.Decimal("12.5"),
      thicknessIn: new Prisma.Decimal("0.75"),
      status: "CUT",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5",
        source: "CONFIGURATOR"
      }
    });
    txMock.partContainerAssignment.updateMany.mockResolvedValue({ count: 1 });
    txMock.part.update.mockResolvedValue({});
    txMock.partContainerAssignment.create.mockResolvedValue({});
    txMock.container.findUnique.mockResolvedValue({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      type: "BIN",
      status: "SORTING",
      notes: null,
      orderId: null,
      manufacturingJobId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: [{ id: "part_1", orderId: "order_1", manufacturingJobId: "job_1" }]
    });

    const result = await assignPartToContainer({
      containerId: "container_1",
      partId: "part_1",
      allowReassign: true
    });

    expect(txMock.partContainerAssignment.updateMany).toHaveBeenCalled();
    expect(syncContainerStatusMock).toHaveBeenCalled();
    expect(result.part.currentContainerId).toBe("container_1");
  });

  it("rejects parts from outside the active batch", async () => {
    prismaMock.container.findUnique.mockResolvedValueOnce({
      id: "container_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_123",
      code: "BIN-01",
      label: "Bin 01",
      status: "OPEN",
      orderId: null,
      manufacturingJobId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParts: []
    });
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      organizationId: "org_local_craft_board",
      batchId: "batch_999",
      currentContainerId: null,
      orderId: "order_1",
      manufacturingJobId: "job_1",
      scanCode: "PART-part_1",
      materialCode: "WHITE_MELAMINE",
      widthIn: new Prisma.Decimal("19.25"),
      depthIn: new Prisma.Decimal("12.5"),
      thicknessIn: new Prisma.Decimal("0.75"),
      status: "CUT",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5",
        source: "CONFIGURATOR"
      }
    });

    await expect(
      assignPartToContainer({
        containerId: "container_1",
        partId: "part_1"
      })
    ).rejects.toThrow("Part does not belong to the active batch.");
  });

  it("returns assigned and unassigned counts for a batch sorting view", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      organizationId: "org_local_craft_board",
      code: "20260308-WHITE_MELAMINE-01",
      materialCode: "WHITE_MELAMINE",
      containers: [
        {
          id: "container_1",
          batchId: "batch_123",
          organizationId: "org_local_craft_board",
          code: "BIN-01",
          label: "Bin 01",
          type: "BIN",
          status: "SORTING",
          notes: null,
          orderId: null,
          manufacturingJobId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentParts: [
            {
              id: "part_1",
              orderId: "order_1",
              manufacturingJobId: "job_1",
              partCode: "CFG-1-P01",
              instanceNumber: 1,
              scanCode: "PART-part_1",
              materialCode: "WHITE_MELAMINE",
              widthIn: new Prisma.Decimal("19.25"),
              depthIn: new Prisma.Decimal("12.5"),
              thicknessIn: new Prisma.Decimal("0.75"),
              status: "CUT",
              manufacturingJob: {
                labelCode: "SHELF-WM-19.25x12.5",
                source: "CONFIGURATOR"
              }
            }
          ]
        }
      ],
      parts: [
        {
          id: "part_1",
          orderId: "order_1",
          manufacturingJobId: "job_1",
          partCode: "CFG-1-P01",
          instanceNumber: 1,
          scanCode: "PART-part_1",
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          status: "CUT",
          currentContainerId: "container_1",
          manufacturingJob: {
            labelCode: "SHELF-WM-19.25x12.5",
            source: "CONFIGURATOR"
          }
        },
        {
          id: "part_2",
          orderId: "order_1",
          manufacturingJobId: "job_1",
          partCode: "CFG-1-P02",
          instanceNumber: 2,
          scanCode: "PART-part_2",
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          status: "CUT",
          currentContainerId: null,
          manufacturingJob: {
            labelCode: "SHELF-WM-19.25x12.5",
            source: "CONFIGURATOR"
          }
        }
      ]
    });
    prismaMock.part.count.mockResolvedValue(2);

    const result = await getBatchSortingView("batch_123");

    expect(result.summary.totalParts).toBe(2);
    expect(result.summary.assignedParts).toBe(1);
    expect(result.summary.unassignedParts).toBe(1);
    expect(result.containers[0].parts).toHaveLength(1);
    expect(result.unassignedParts[0].partId).toBe("part_2");
  });
});
