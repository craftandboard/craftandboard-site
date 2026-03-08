import { beforeEach, describe, expect, it, vi } from "vitest";

const txMock = vi.hoisted(() => ({
  part: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn()
  },
  manufacturingJob: {
    update: vi.fn(),
    count: vi.fn()
  },
  order: {
    update: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  ...txMock,
  $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prismaMock))
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

import { transitionPartStatusById, transitionPartStatusByLabelCode } from "../modules/parts/service.js";

describe("part shop-floor transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => callback(txMock));
  });

  it("advances a valid part transition by id", async () => {
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "READY_FOR_BATCH",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });
    txMock.part.update.mockResolvedValue({
      id: "part_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "CUT",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });

    const result = await transitionPartStatusById("part_1", "cut");

    expect(txMock.part.update).toHaveBeenCalledWith({
      where: { id: "part_1" },
      data: { status: "CUT" },
      include: { manufacturingJob: true }
    });
    expect(result).toEqual({
      part: {
        id: "part_1",
        labelCode: "SHELF-WM-19.25x12.5-P01",
        scanCode: "PART-part_1",
        status: "cut",
        availableNextActions: ["edgebanded", "packed"]
      }
    });
  });

  it("rejects an invalid part transition", async () => {
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "READY_FOR_BATCH",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });

    await expect(transitionPartStatusById("part_1", "packed")).rejects.toThrow(
      "Part SHELF-WM-19.25x12.5-P01 cannot move from READY_FOR_BATCH to PACKED."
    );
  });

  it("finds a part by generated label code", async () => {
    prismaMock.part.findMany.mockResolvedValue([
      {
        id: "part_1",
        partCode: "CFG-1-P01",
        instanceNumber: 1,
        status: "CUT",
        manufacturingJob: {
          labelCode: "SHELF-WM-19.25x12.5"
        }
      }
    ]);
    txMock.part.update.mockResolvedValue({
      id: "part_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "EDGEBANDED",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });

    const result = await transitionPartStatusByLabelCode("SHELF-WM-19.25x12.5-P01", "edgebanded");

    expect(result.part.status).toBe("edgebanded");
    expect(result.part.scanCode).toBe("PART-part_1");
    expect(result.part.availableNextActions).toEqual(["packed"]);
  });

  it("rejects ambiguous label-code transitions", async () => {
    prismaMock.part.findMany.mockResolvedValue([
      {
        id: "part_1",
        partCode: "CFG-1-P01",
        instanceNumber: 1,
        status: "CUT",
        manufacturingJob: {
          labelCode: "SHELF-WM-19.25x12.5"
        }
      },
      {
        id: "part_2",
        partCode: "CFG-2-P01",
        instanceNumber: 1,
        status: "CUT",
        manufacturingJob: {
          labelCode: "SHELF-WM-19.25x12.5"
        }
      }
    ]);

    await expect(
      transitionPartStatusByLabelCode("SHELF-WM-19.25x12.5-P01", "packed")
    ).rejects.toThrow(
      "Label code SHELF-WM-19.25x12.5-P01 matches multiple parts. Use part id for an unambiguous update."
    );
  });

  it("marks the manufacturing job and order complete when the last part is packed", async () => {
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "EDGEBANDED",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });
    txMock.part.update.mockResolvedValue({
      id: "part_1",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "PACKED",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });
    txMock.part.count.mockResolvedValue(0);
    txMock.manufacturingJob.update.mockResolvedValue({
      id: "job_1",
      status: "COMPLETE"
    });
    txMock.manufacturingJob.count.mockResolvedValue(0);
    txMock.order.update.mockResolvedValue({
      id: "order_1",
      status: "READY_FOR_SHIPMENT"
    });

    const { transitionPartStatusById } = await import("../modules/parts/service.js");
    const result = await transitionPartStatusById("part_1", "packed");

    expect(txMock.manufacturingJob.update).toHaveBeenCalledWith({
      where: { id: "job_1" },
      data: { status: "COMPLETE" }
    });
    expect(txMock.order.update).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { status: "READY_FOR_SHIPMENT" }
    });
    expect(result).toEqual({
      part: {
        id: "part_1",
        labelCode: "SHELF-WM-19.25x12.5-P01",
        scanCode: "PART-part_1",
        status: "packed",
        availableNextActions: []
      },
      jobStatus: "COMPLETE",
      orderStatus: "READY_FOR_SHIPMENT"
    });
  });

  it("does not mark the order complete while sibling jobs remain open", async () => {
    prismaMock.part.findUnique.mockResolvedValue({
      id: "part_1",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "EDGEBANDED",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });
    txMock.part.update.mockResolvedValue({
      id: "part_1",
      orderId: "order_1",
      manufacturingJobId: "job_1",
      partCode: "CFG-1-P01",
      instanceNumber: 1,
      status: "PACKED",
      manufacturingJob: {
        labelCode: "SHELF-WM-19.25x12.5"
      }
    });
    txMock.part.count.mockResolvedValue(0);
    txMock.manufacturingJob.update.mockResolvedValue({
      id: "job_1",
      status: "COMPLETE"
    });
    txMock.manufacturingJob.count.mockResolvedValue(1);

    const { transitionPartStatusById } = await import("../modules/parts/service.js");
    const result = await transitionPartStatusById("part_1", "packed");

    expect(txMock.order.update).not.toHaveBeenCalled();
    expect(result.jobStatus).toBe("COMPLETE");
    expect(result.orderStatus).toBeUndefined();
  });
});
