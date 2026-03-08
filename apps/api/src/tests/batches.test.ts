import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const generatedArtifactsMocks = vi.hoisted(() => ({
  writeBatchArtifactFile: vi.fn(),
  writeBatchArtifactPdf: vi.fn()
}));

const txMock = vi.hoisted(() => ({
  batch: {
    create: vi.fn(),
    update: vi.fn()
  },
  manufacturingJob: {
    updateMany: vi.fn()
  },
  part: {
    updateMany: vi.fn()
  },
  sheet: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn()
  },
  sheetPlacement: {
    create: vi.fn(),
    deleteMany: vi.fn()
  },
  artifact: {
    updateMany: vi.fn(),
    create: vi.fn()
  }
}));

const prismaMock = vi.hoisted(() => ({
  batch: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn()
  },
  manufacturingJob: {
    findMany: vi.fn()
  },
  artifact: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock))
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/generatedArtifacts.js", () => generatedArtifactsMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import {
  createBatchForMaterial,
  generateBatchCncCsv,
  generateBatchCncJson,
  generateBatchCncMosaic,
  generateBatchCncPacket,
  generateBatchLabelCsv,
  generateBatchLabelPdf,
  generateBatchTravelerPdf,
  nestBatch,
  transitionBatchStatus
} from "../modules/batches/service.js";

describe("batch generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
      callback(txMock)
    );
    prismaMock.batch.count.mockResolvedValue(0);
    prismaMock.batch.update.mockResolvedValue({ id: "batch_123", code: "20260308-WHITE_MELAMINE-01", status: "RELEASED" });
    txMock.batch.create.mockResolvedValue({ id: "batch_123" });
    txMock.batch.update.mockResolvedValue({ id: "batch_123" });
    txMock.manufacturingJob.updateMany.mockResolvedValue({ count: 3 });
    txMock.part.updateMany.mockResolvedValue({ count: 6 });
    txMock.sheet.findMany.mockResolvedValue([]);
    txMock.sheet.deleteMany.mockResolvedValue({ count: 0 });
    txMock.sheetPlacement.deleteMany.mockResolvedValue({ count: 0 });
    txMock.sheet.create.mockResolvedValue({ id: "sheet_1" });
    txMock.sheetPlacement.create.mockResolvedValue({ id: "placement_1" });
    txMock.artifact.updateMany.mockResolvedValue({ count: 0 });
    txMock.artifact.create.mockResolvedValue({ id: "artifact_1" });
    prismaMock.artifact.findFirst.mockResolvedValue(null);
    generatedArtifactsMocks.writeBatchArtifactFile.mockResolvedValue(
      "/generated-artifacts/batches/batch_123/output.csv"
    );
    generatedArtifactsMocks.writeBatchArtifactPdf.mockResolvedValue("/generated-artifacts/batches/batch_123/output.pdf");
  });

  it("creates a deterministic persisted batch from eligible configurator jobs", async () => {
    prismaMock.manufacturingJob.findMany.mockResolvedValue([
      {
        id: "job_1",
        labelCode: "SHELF-WM-19.25x12.5",
        parts: [
          { id: "part_1", instanceNumber: 1 },
          { id: "part_2", instanceNumber: 2 }
        ]
      },
      {
        id: "job_2",
        labelCode: "SHELF-WM-24x12",
        parts: [
          { id: "part_3", instanceNumber: 1 }
        ]
      }
    ]);

    const result = await createBatchForMaterial("WHITE_MELAMINE");

    expect(txMock.batch.create).toHaveBeenCalledTimes(1);
    expect(txMock.manufacturingJob.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["job_1", "job_2"] } },
      data: { batchId: "batch_123" }
    });
    expect(txMock.part.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["part_1", "part_2", "part_3"] } },
      data: { batchId: "batch_123" }
    });
    expect(result.batch.id).toBe("batch_123");
    expect(result.batch.status).toBe("DRAFT");
    expect(result.batch.material).toBe("WHITE_MELAMINE");
    expect(result.batch.partCount).toBe(3);
    expect(result.batch.jobCount).toBe(2);
    expect(result.batch.batchCode).toMatch(/^\d{8}-WHITE_MELAMINE-01$/);
    expect(result.parts).toEqual([
      { id: "part_1", partType: "SHELF", labelCode: "SHELF-WM-19.25x12.5-P01" },
      { id: "part_2", partType: "SHELF", labelCode: "SHELF-WM-19.25x12.5-P02" },
      { id: "part_3", partType: "SHELF", labelCode: "SHELF-WM-24x12-P01" }
    ]);
  });

  it("returns a clear error when no eligible draft parts exist", async () => {
    prismaMock.manufacturingJob.findMany.mockResolvedValue([]);

    await expect(createBatchForMaterial("WHITE_MELAMINE")).rejects.toThrow(
      "No eligible draft parts found for WHITE_MELAMINE."
    );
  });

  it("creates an amazon batch when the eligible jobs came from amazon import", async () => {
    prismaMock.manufacturingJob.findMany.mockResolvedValue([
      {
        id: "job_amz_1",
        source: "AMAZON",
        labelCode: "SHELF-WM-19.25x12.5",
        parts: [{ id: "part_amz_1", instanceNumber: 1 }]
      }
    ]);

    await createBatchForMaterial("WHITE_MELAMINE");

    expect(txMock.batch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "DRAFT",
        materialCode: "WHITE_MELAMINE",
        source: "AMAZON"
      })
    });
  });

  it("creates persisted sheet layouts from batch parts", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      materialCode: "WHITE_MELAMINE",
      parts: [
        {
          id: "part_1",
          partCode: "CFG-1-P01",
          orderId: "order_1",
          orderItemId: "item_1",
          customerLastName: "Configurator",
          shipByDate: new Date("2026-03-08T00:00:00.000Z"),
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          materialCode: "WHITE_MELAMINE"
        },
        {
          id: "part_2",
          partCode: "CFG-1-P02",
          orderId: "order_1",
          orderItemId: "item_1",
          customerLastName: "Configurator",
          shipByDate: new Date("2026-03-08T00:00:00.000Z"),
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          materialCode: "WHITE_MELAMINE"
        }
      ]
    });

    const result = await nestBatch("batch_123");

    expect(txMock.sheet.create).toHaveBeenCalledTimes(1);
    expect(txMock.sheetPlacement.create).toHaveBeenCalledTimes(2);
    expect(txMock.batch.update).toHaveBeenCalledWith({
      where: { id: "batch_123" },
      data: { status: "PLANNED" }
    });
    expect(result.batchId).toBe("batch_123");
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetIndex).toBe(1);
    expect(result.sheets[0].material).toBe("WHITE_MELAMINE");
    expect(result.sheets[0].parts[0]).toMatchObject({
      partId: "part_1",
      x: 0.25,
      y: 0.25,
      width: 19.25,
      depth: 12.5
    });
  });

  it("creates a deterministic cnc packet from persisted nested sheets", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      sheets: [
        {
          sheetNumber: 1,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("48"),
          heightIn: new Prisma.Decimal("96"),
          placements: [
            {
              partId: "part_1",
              xIn: new Prisma.Decimal("0.25"),
              yIn: new Prisma.Decimal("0.25"),
              widthIn: new Prisma.Decimal("19.25"),
              depthIn: new Prisma.Decimal("12.5"),
              part: {
                partCode: "CFG-1-P01",
                instanceNumber: 1,
                manufacturingJob: {
                  labelCode: "SHELF-WM-19.25x12.5"
                }
              }
            }
          ]
        }
      ]
    });

    const result = await generateBatchCncPacket("batch_123");

    expect(txMock.artifact.updateMany).toHaveBeenCalledTimes(1);
    expect(txMock.artifact.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-cnc-packet",
        uri: "/batches/batch_123/cnc-packet",
        mimeType: "application/json",
        version: 1,
        isCurrent: true,
        generatedFrom: "CNC-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result.packet).toEqual({
      packetCode: "CNC-20260308-WHITE_MELAMINE-01",
      sheetCount: 1,
      partCount: 1,
      format: "FOUNDATION_JSON"
    });
    expect(result.sheets[0].placements[0]).toEqual({
      partId: "part_1",
      labelCode: "SHELF-WM-19.25x12.5-P01",
      x: 0.25,
      y: 0.25,
      width: 19.25,
      depth: 12.5,
      cutMethod: "RECTANGLE_CUT"
    });
  });

  it("creates a CNC CSV export artifact from the current CNC packet", async () => {
    prismaMock.batch.findUnique
      .mockResolvedValueOnce({
        id: "batch_123",
        code: "20260308-WHITE_MELAMINE-01",
        organizationId: "org_local_craft_board",
        artifacts: [{ type: "batch-cnc-packet" }],
        sheets: [
          {
            sheetNumber: 1,
            materialCode: "WHITE_MELAMINE",
            widthIn: new Prisma.Decimal("48"),
            heightIn: new Prisma.Decimal("96"),
            placements: [
              {
                partId: "part_1",
                xIn: new Prisma.Decimal("0.25"),
                yIn: new Prisma.Decimal("0.25"),
                widthIn: new Prisma.Decimal("19.25"),
                depthIn: new Prisma.Decimal("12.5"),
                part: {
                  id: "part_1",
                  scanCode: "PART-part_1",
                  partCode: "CFG-1-P01",
                  instanceNumber: 1,
                  thicknessIn: new Prisma.Decimal("0.75"),
                  edgeBandPattern: "ALL_FOUR",
                  materialCode: "WHITE_MELAMINE",
                  manufacturingJob: {
                    source: "CONFIGURATOR",
                    labelCode: "SHELF-WM-19.25x12.5"
                  }
                }
              }
            ]
          }
        ]
      });

    const result = await generateBatchCncCsv("batch_123");

    expect(generatedArtifactsMocks.writeBatchArtifactFile).toHaveBeenCalledTimes(1);
    const [{ fileName, bytes }] = generatedArtifactsMocks.writeBatchArtifactFile.mock.calls[0];
    expect(fileName).toBe("cnc-export-v1.csv");
    expect(bytes.toString("utf8")).toContain(
      "\"batchCode\",\"sheetIndex\",\"material\",\"sheetWidth\",\"sheetHeight\",\"partId\",\"labelCode\",\"scanCode\",\"x\",\"y\",\"width\",\"depth\",\"cutMethod\",\"partType\""
    );
    expect(bytes.toString("utf8")).toContain("\"20260308-WHITE_MELAMINE-01\",\"1\",\"WHITE_MELAMINE\",\"48\",\"96\",\"part_1\"");
    expect(bytes.toString("utf8")).toContain("\"SHELF-WM-19.25x12.5-P01\"");
    expect(bytes.toString("utf8")).toContain("\"PART-part_1\"");
    expect(txMock.artifact.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-cnc-csv",
        uri: "/generated-artifacts/batches/batch_123/output.csv",
        mimeType: "text/csv",
        version: 1,
        isCurrent: true,
        generatedFrom: "CNC-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result).toEqual({
      batchId: "batch_123",
      artifact: {
        type: "batch-cnc-csv",
        uri: "/generated-artifacts/batches/batch_123/output.csv",
        isCurrent: true,
        version: 1
      }
    });
  });

  it("creates a Mosaic CNC export artifact from the current CNC packet", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      organizationId: "org_local_craft_board",
      artifacts: [{ type: "batch-cnc-packet" }],
      sheets: [
        {
          sheetNumber: 1,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("48"),
          heightIn: new Prisma.Decimal("96"),
          placements: [
            {
              xIn: new Prisma.Decimal("0.25"),
              yIn: new Prisma.Decimal("0.25"),
              widthIn: new Prisma.Decimal("19.25"),
              depthIn: new Prisma.Decimal("12.5"),
              part: {
                id: "part_1",
                scanCode: "PART-part_1",
                partCode: "CFG-1-P01",
                instanceNumber: 1,
                thicknessIn: new Prisma.Decimal("0.75"),
                edgeBandPattern: "ALL_FOUR",
                materialCode: "WHITE_MELAMINE",
                manufacturingJob: {
                  source: "CONFIGURATOR",
                  labelCode: "SHELF-WM-19.25x12.5"
                }
              }
            }
          ]
        }
      ]
    });

    const result = await generateBatchCncMosaic("batch_123");

    const [{ fileName, bytes }] = generatedArtifactsMocks.writeBatchArtifactFile.mock.calls[0];
    expect(fileName).toBe("cnc-mosaic-v1.csv");
    expect(bytes.toString("utf8")).toContain(
      "\"batchCode\",\"sheetIndex\",\"partId\",\"labelCode\",\"material\",\"quantity\",\"width\",\"depth\",\"thickness\",\"grain\",\"edgeBandTop\",\"edgeBandBottom\",\"edgeBandLeft\",\"edgeBandRight\""
    );
    expect(bytes.toString("utf8")).toContain("\"part_1\"");
    expect(bytes.toString("utf8")).toContain("\"WIDTH\"");
    expect(bytes.toString("utf8")).toContain("\"true\",\"true\",\"true\",\"true\"");
    expect(txMock.artifact.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-cnc-mosaic",
        uri: "/generated-artifacts/batches/batch_123/output.csv",
        mimeType: "text/csv",
        version: 1,
        isCurrent: true,
        generatedFrom: "MOSAIC-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result.artifact.type).toBe("batch-cnc-mosaic");
  });

  it("creates a CNC JSON export artifact from the current CNC packet", async () => {
    generatedArtifactsMocks.writeBatchArtifactFile.mockResolvedValue(
      "/generated-artifacts/batches/batch_123/output.json"
    );
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      organizationId: "org_local_craft_board",
      artifacts: [{ type: "batch-cnc-packet" }],
      sheets: [
        {
          sheetNumber: 1,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("48"),
          heightIn: new Prisma.Decimal("96"),
          placements: [
            {
              xIn: new Prisma.Decimal("0.25"),
              yIn: new Prisma.Decimal("0.25"),
              widthIn: new Prisma.Decimal("19.25"),
              depthIn: new Prisma.Decimal("12.5"),
              part: {
                id: "part_1",
                scanCode: "PART-part_1",
                partCode: "CFG-1-P01",
                instanceNumber: 1,
                thicknessIn: new Prisma.Decimal("0.75"),
                edgeBandPattern: "ALL_FOUR",
                materialCode: "WHITE_MELAMINE",
                manufacturingJob: {
                  source: "CONFIGURATOR",
                  labelCode: "SHELF-WM-19.25x12.5"
                }
              }
            }
          ]
        }
      ]
    });

    const result = await generateBatchCncJson("batch_123");

    const [{ fileName, bytes }] = generatedArtifactsMocks.writeBatchArtifactFile.mock.calls[0];
    expect(fileName).toBe("cnc-export-v1.json");
    expect(bytes.toString("utf8")).toContain("\"batchCode\": \"20260308-WHITE_MELAMINE-01\"");
    expect(bytes.toString("utf8")).toContain("\"sheetCount\": 1");
    expect(bytes.toString("utf8")).toContain("\"scanCode\": \"PART-part_1\"");
    expect(txMock.artifact.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-cnc-json",
        uri: "/generated-artifacts/batches/batch_123/output.json",
        mimeType: "application/json",
        version: 1,
        isCurrent: true,
        generatedFrom: "CNC_JSON-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result.artifact.type).toBe("batch-cnc-json");
  });

  it("returns a clear error when cnc is requested before nesting", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      sheets: []
    });

    await expect(generateBatchCncPacket("batch_123")).rejects.toThrow(
      "Batch 20260308-WHITE_MELAMINE-01 must be nested before CNC generation."
    );
  });

  it("advances a batch through a valid next status", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      status: "PLANNED"
    });
    prismaMock.batch.update.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      status: "RELEASED"
    });

    const result = await transitionBatchStatus("batch_123", "released");

    expect(prismaMock.batch.update).toHaveBeenCalledWith({
      where: { id: "batch_123" },
      data: { status: "RELEASED" }
    });
    expect(result).toEqual({
      batch: {
        id: "batch_123",
        code: "20260308-WHITE_MELAMINE-01",
        status: "released",
        availableNextActions: ["cutting"]
      }
    });
  });

  it("rejects an invalid batch status transition", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      status: "DRAFT"
    });

    await expect(transitionBatchStatus("batch_123", "cut_complete")).rejects.toThrow(
      "Batch 20260308-WHITE_MELAMINE-01 cannot move from DRAFT to CUT_COMPLETE."
    );
  });

  it("creates a deterministic label packet from batch parts", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      materialCode: "WHITE_MELAMINE",
      parts: [
        {
          id: "part_1",
          scanCode: "PART-part_1",
          manufacturingJobId: "job_1",
          partCode: "CFG-1-P01",
          instanceNumber: 1,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          edgeBandPattern: "ALL_FOUR",
          manufacturingJob: {
            labelCode: "SHELF-WM-19.25x12.5"
          },
          placements: [
            {
              xIn: new Prisma.Decimal("0.25"),
              yIn: new Prisma.Decimal("0.25"),
              sheet: {
                sheetNumber: 1
              }
            }
          ]
        },
        {
          id: "part_2",
          scanCode: "PART-part_2",
          manufacturingJobId: "job_1",
          partCode: "CFG-1-P02",
          instanceNumber: 2,
          materialCode: "WHITE_MELAMINE",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          edgeBandPattern: "ALL_FOUR",
          manufacturingJob: {
            labelCode: "SHELF-WM-19.25x12.5"
          },
          placements: []
        }
      ]
    });

    const { generateBatchLabelPacket } = await import("../modules/batches/service.js");
    const result = await generateBatchLabelPacket("batch_123");

    expect(txMock.artifact.updateMany).toHaveBeenCalledTimes(1);
    expect(txMock.artifact.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-label-packet",
        uri: "/batches/batch_123/labels-packet",
        mimeType: "application/json",
        version: 1,
        isCurrent: true,
        generatedFrom: "LABELS-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result.packet).toEqual({
      packetCode: "LABELS-20260308-WHITE_MELAMINE-01",
      labelCount: 2,
      format: "FOUNDATION_JSON"
    });
    expect(result.labels[0]).toEqual({
      partId: "part_1",
      jobId: "job_1",
      batchId: "batch_123",
      labelCode: "SHELF-WM-19.25x12.5-P01",
      scanCode: "PART-part_1",
      partType: "SHELF",
      material: "WHITE_MELAMINE",
      width: 19.25,
      depth: 12.5,
      thickness: 0.75,
      edgeBandPattern: "ALL_FOUR",
      quantity: 1,
      source: "CONFIGURATOR",
      currentStatus: "pending",
      sheetIndex: 1,
      x: 0.25,
      y: 0.25
    });
  });

  it("creates a label CSV export artifact from the current label packet", async () => {
    prismaMock.batch.findUnique
      .mockResolvedValueOnce({
        id: "batch_123",
        code: "20260308-WHITE_MELAMINE-01",
        materialCode: "WHITE_MELAMINE",
        parts: [
          {
            id: "part_1",
            scanCode: "PART-part_1",
            status: "CUT",
            manufacturingJobId: "job_1",
            partCode: "CFG-1-P01",
            instanceNumber: 1,
            materialCode: "WHITE_MELAMINE",
            widthIn: new Prisma.Decimal("19.25"),
            depthIn: new Prisma.Decimal("12.5"),
            thicknessIn: new Prisma.Decimal("0.75"),
            edgeBandPattern: "ALL_FOUR",
            manufacturingJob: {
              source: "CONFIGURATOR",
              labelCode: "SHELF-WM-19.25x12.5"
            },
            placements: []
          }
        ]
      })
      .mockResolvedValueOnce({
        code: "20260308-WHITE_MELAMINE-01",
        organizationId: "org_local_craft_board"
      });

    const result = await generateBatchLabelCsv("batch_123");

    expect(generatedArtifactsMocks.writeBatchArtifactFile).toHaveBeenCalledTimes(1);
    const [{ fileName, bytes }] = generatedArtifactsMocks.writeBatchArtifactFile.mock.calls[0];
    expect(fileName).toBe("label-export-v1.csv");
    expect(bytes.toString("utf8")).toContain(
      "\"batchCode\",\"partId\",\"jobId\",\"labelCode\",\"scanCode\",\"partType\",\"material\",\"width\",\"depth\",\"thickness\",\"edgeBandPattern\",\"source\",\"currentStatus\""
    );
    expect(bytes.toString("utf8")).toContain("\"20260308-WHITE_MELAMINE-01\",\"part_1\",\"job_1\"");
    expect(bytes.toString("utf8")).toContain("\"SHELF-WM-19.25x12.5-P01\"");
    expect(bytes.toString("utf8")).toContain("\"PART-part_1\"");
    expect(bytes.toString("utf8")).toContain("\"cut\"");
    expect(txMock.artifact.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-label-csv",
        uri: "/generated-artifacts/batches/batch_123/output.csv",
        mimeType: "text/csv",
        version: 1,
        isCurrent: true,
        generatedFrom: "LABELS-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result).toEqual({
      batchId: "batch_123",
      artifact: {
        type: "batch-label-csv",
        uri: "/generated-artifacts/batches/batch_123/output.csv",
        isCurrent: true,
        version: 1
      }
    });
  });

  it("returns a clear error when label generation is requested for an empty batch", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      parts: []
    });

    const { generateBatchLabelPacket } = await import("../modules/batches/service.js");
    await expect(generateBatchLabelPacket("batch_123")).rejects.toThrow(
      "Batch 20260308-WHITE_MELAMINE-01 has no parts available for label generation."
    );
  });

  it("creates a printable label pdf artifact", async () => {
    prismaMock.batch.findUnique
      .mockResolvedValueOnce({
        id: "batch_123",
        code: "20260308-WHITE_MELAMINE-01",
        materialCode: "WHITE_MELAMINE",
        parts: [
          {
            id: "part_1",
            scanCode: "PART-part_1",
            manufacturingJobId: "job_1",
            partCode: "CFG-1-P01",
            instanceNumber: 1,
            materialCode: "WHITE_MELAMINE",
            widthIn: new Prisma.Decimal("19.25"),
            depthIn: new Prisma.Decimal("12.5"),
            thicknessIn: new Prisma.Decimal("0.75"),
            edgeBandPattern: "ALL_FOUR",
            manufacturingJob: {
              labelCode: "SHELF-WM-19.25x12.5"
            },
            placements: []
          }
        ]
      })
      .mockResolvedValueOnce({
        code: "20260308-WHITE_MELAMINE-01"
      });

    const result = await generateBatchLabelPdf("batch_123");

    expect(generatedArtifactsMocks.writeBatchArtifactPdf).toHaveBeenCalledTimes(1);
    expect(txMock.artifact.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-label-pdf",
        uri: "/generated-artifacts/batches/batch_123/output.pdf",
        mimeType: "application/pdf",
        version: 1,
        isCurrent: true,
        generatedFrom: "LABELS-20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result).toEqual({
      batchId: "batch_123",
      artifact: {
        type: "batch-label-pdf",
        uri: "/generated-artifacts/batches/batch_123/output.pdf",
        isCurrent: true,
        version: 1
      }
    });
  });

  it("creates a printable traveler pdf artifact", async () => {
    prismaMock.batch.findUnique.mockResolvedValue({
      id: "batch_123",
      code: "20260308-WHITE_MELAMINE-01",
      status: "PLANNED",
      materialCode: "WHITE_MELAMINE",
      source: "CONFIGURATOR",
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      manufacturingJobs: [
        {
          id: "job_1",
          source: "CONFIGURATOR",
          channel: "WEBSITE",
          partType: "SHELF",
          materialCode: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          quantity: 1,
          labelCode: "SHELF-WM-19.25x12.5",
          parts: [{ id: "part_1" }]
        }
      ],
      parts: [
        {
          id: "part_1",
          manufacturingJobId: "job_1",
          partCode: "CFG-1-P01",
          instanceNumber: 1,
          scanCode: "PART-part_1",
          status: "CUT",
          materialCode: "WHITE_MELAMINE",
          edgeBandPattern: "ALL_FOUR",
          widthIn: new Prisma.Decimal("19.25"),
          depthIn: new Prisma.Decimal("12.5"),
          thicknessIn: new Prisma.Decimal("0.75"),
          manufacturingJob: {
            source: "CONFIGURATOR",
            labelCode: "SHELF-WM-19.25x12.5"
          },
          placements: []
        }
      ],
      sheets: [],
      artifacts: []
    });

    const result = await generateBatchTravelerPdf("batch_123");

    expect(generatedArtifactsMocks.writeBatchArtifactPdf).toHaveBeenCalledTimes(1);
    expect(txMock.artifact.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_local_craft_board",
        batchId: "batch_123",
        type: "batch-traveler-pdf",
        uri: "/generated-artifacts/batches/batch_123/output.pdf",
        mimeType: "application/pdf",
        version: 1,
        isCurrent: true,
        generatedFrom: "20260308-WHITE_MELAMINE-01"
      }
    });
    expect(result).toEqual({
      batchId: "batch_123",
      artifact: {
        type: "batch-traveler-pdf",
        uri: "/generated-artifacts/batches/batch_123/output.pdf",
        isCurrent: true,
        version: 1
      }
    });
  });
});
