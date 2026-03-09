import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    manufacturingPart: {
      findFirst: vi.fn()
    },
    labelTemplateVersion: {
      findFirst: vi.fn()
    },
    labelRenderJob: {
      create: vi.fn()
    }
  }
}));

vi.mock("../lib/prisma.js", () => prismaMocks);

import {
  getManufacturingPartLabelHtml,
  getManufacturingPartLabelPayload,
  reprintManufacturingPartLabel
} from "../modules/labels/service.js";

describe("manufacturing labels service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMocks.prisma.manufacturingPart.findFirst.mockResolvedValue({
      id: "part_1",
      partNumber: "MP-20260308-001-P0001",
      manufacturingPacketId: "packet_1",
      shelfJobId: "shelf_job_1",
      salesOrderId: "sales_order_1",
      salesOrderItemId: "item_1",
      batchId: "batch_1",
      materialType: "WHITE_MELAMINE",
      thicknessIn: { toNumber: () => 0.75 },
      lengthIn: { toNumber: () => 30 },
      depthIn: { toNumber: () => 12 },
      edgeBandPattern: "ALL_FOUR",
      requiresPackaging: true,
      status: "READY_FOR_BATCH",
      unitIndex: 1,
      labelDataJson: {
        totalQuantity: 2,
        barcodeValue: "PART:MP-20260308-001-P0001",
        qrValue: "PART:MP-20260308-001-P0001",
        productName: "3/4 White Melamine Shelf"
      },
      manufacturingPacket: { packetNumber: "MP-20260308-001" },
      batch: { batchNumber: "CUT-20260308-001" },
      shelfJob: { quantity: 2 },
      salesOrderItem: {
        title: "30 x 12 White Shelf",
        shelfProduct: { name: "3/4 White Melamine Shelf" }
      }
    });
    prismaMocks.prisma.labelTemplateVersion.findFirst.mockResolvedValue({
      id: "template_1",
      name: "Starter Shelf Part Backbone Label",
      code: "SHELF_PART_BACKBONE",
      version: 1
    });
    prismaMocks.prisma.labelRenderJob.create.mockResolvedValue({
      id: "render_1",
      entityType: "MANUFACTURING_PART",
      entityId: "part_1",
      templateId: "template_1",
      renderFormat: "HTML",
      outputHtml: "<html>ok</html>",
      outputPath: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });
  });

  it("returns the manufacturing part label payload shape", async () => {
    const result = await getManufacturingPartLabelPayload("part_1", "org_local_craft_board");

    expect(result.ok).toBe(true);
    expect(result.label.partId).toBe("part_1");
    expect(result.label.packetNumber).toBe("MP-20260308-001");
    expect(result.label.batchNumber).toBe("CUT-20260308-001");
    expect(result.label.barcodeValue).toBe("PART:MP-20260308-001-P0001");
    expect(result.label.humanReadableText).toContain("Material WHITE_MELAMINE");
  });

  it("renders printable HTML with key manufacturing data", async () => {
    const result = await getManufacturingPartLabelHtml("part_1", "org_local_craft_board");

    expect(result.html).toContain("MP-20260308-001-P0001");
    expect(result.html).toContain("WHITE_MELAMINE");
    expect(result.html).toContain("CUT-20260308-001");
    expect(result.html).toContain("PART:MP-20260308-001-P0001");
  });

  it("creates a label render job audit entry when reprinting", async () => {
    const result = await reprintManufacturingPartLabel({
      partId: "part_1",
      organizationId: "org_local_craft_board",
      createdByUserId: "user_1"
    });

    expect(prismaMocks.prisma.labelRenderJob.create).toHaveBeenCalledTimes(1);
    expect(result.action).toBe("reprint-manufacturing-part-label");
    expect(result.renderJob.id).toBe("render_1");
  });
});
