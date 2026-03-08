import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const generatedArtifactsMocks = vi.hoisted(() => ({
  writeOrderArtifactPdf: vi.fn()
}));

const txMock = vi.hoisted(() => ({
  artifact: {
    updateMany: vi.fn(),
    create: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  order: {
    findFirst: vi.fn()
  },
  artifact: {
    findFirst: vi.fn()
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock))
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/generatedArtifacts.js", () => generatedArtifactsMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import { generatePackingSlipPdf } from "../modules/orders/service.js";

describe("order fulfillment artifacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.artifact.findFirst.mockResolvedValue(null);
    generatedArtifactsMocks.writeOrderArtifactPdf.mockResolvedValue(
      "/generated-artifacts/orders/order_123/packing-slip-v1.pdf"
    );
    txMock.artifact.updateMany.mockResolvedValue({ count: 0 });
    txMock.artifact.create.mockResolvedValue({ id: "artifact_1" });
  });

  it("generates and persists a packing slip pdf artifact", async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: "order_123",
      organizationId: "org_local_craft_board",
      status: "READY_FOR_SHIPMENT",
      customerName: "Activation Tyler",
      shipByDate: new Date("2026-03-10T00:00:00.000Z"),
      manufacturingJobs: [{ id: "job_1", source: "CONFIGURATOR" }],
      parts: [
        {
          id: "part_1",
          partCode: "CFG-1-P01",
          scanCode: "PART-part_1",
          instanceNumber: 1,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          status: "PACKED",
          batch: {
            code: "20260308-WHITE_MELAMINE-01"
          },
          manufacturingJob: {
            labelCode: "SHELF-WM-19.25x12.5"
          }
        }
      ]
    });

    const result = await generatePackingSlipPdf("order_123");

    expect(generatedArtifactsMocks.writeOrderArtifactPdf).toHaveBeenCalledTimes(1);
    expect(txMock.artifact.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: "order_123",
        type: "order-packing-slip-pdf",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: expect.any(Date)
      }
    });
    expect(txMock.artifact.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        orderId: "order_123",
        type: "order-packing-slip-pdf",
        uri: "/generated-artifacts/orders/order_123/packing-slip-v1.pdf",
        mimeType: "application/pdf",
        version: 1,
        isCurrent: true,
        generatedFrom: "order_123"
      }
    });
    expect(result).toEqual({
      orderId: "order_123",
      artifact: {
        type: "order-packing-slip-pdf",
        uri: "/generated-artifacts/orders/order_123/packing-slip-v1.pdf",
        isCurrent: true,
        version: 1
      }
    });
  });
});
