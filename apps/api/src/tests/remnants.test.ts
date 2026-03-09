import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  remnant: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  artifact: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirstOrThrow: vi.fn()
  },
  $transaction: vi.fn(async (operations: unknown) => operations)
}));

const artifactMocks = vi.hoisted(() => ({
  writeRemnantArtifactPdf: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/generatedArtifacts.js", () => artifactMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import { createRemnant, consumeRemnant, generateRemnantLabel, listRemnants } from "../modules/remnants/service.js";
import { getForecastRemnantCandidates } from "../modules/remnants/matching.js";

describe("remnant service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue(undefined);
  });

  it("creates a remnant with computed area and deterministic material key", async () => {
    prismaMock.remnant.count.mockResolvedValue(0);
    prismaMock.remnant.create.mockResolvedValue({
      id: "rem_1",
      code: "REM-0001",
      materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
      materialCode: "WHITE_MELAMINE",
      materialLabel: "WHITE MELAMINE · 0.75 in",
      thicknessIn: new Prisma.Decimal("0.750"),
      edgeBandPattern: "ALL_FOUR",
      lengthIn: new Prisma.Decimal("48"),
      widthIn: new Prisma.Decimal("12"),
      areaSqIn: new Prisma.Decimal("576"),
      usableAreaSqIn: new Prisma.Decimal("576"),
      sourceBatchId: null,
      sourceType: "MANUAL",
      status: "AVAILABLE",
      locationLabel: "Rack A",
      notes: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      usages: []
    });

    const result = await createRemnant({
      materialCode: "WHITE_MELAMINE",
      thicknessIn: 0.75,
      lengthIn: 48,
      widthIn: 12,
      locationLabel: "Rack A"
    });

    expect(prismaMock.remnant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: "REM-0001",
        materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
        areaSqIn: expect.any(Prisma.Decimal)
      }),
      include: expect.any(Object)
    });
    expect(result.remnant.areaSqIn).toBe(576);
  });

  it("lists and filters remnants by material, status, and location", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([
      {
        id: "rem_1",
        code: "REM-0001",
        materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
        materialCode: "WHITE_MELAMINE",
        materialLabel: "WHITE MELAMINE · 0.75 in",
        thicknessIn: new Prisma.Decimal("0.750"),
        edgeBandPattern: "ALL_FOUR",
        lengthIn: new Prisma.Decimal("48"),
        widthIn: new Prisma.Decimal("12"),
        areaSqIn: new Prisma.Decimal("576"),
        usableAreaSqIn: new Prisma.Decimal("400"),
        sourceBatchId: null,
        sourceType: "MANUAL",
        status: "AVAILABLE",
        locationLabel: "Rack A",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const result = await listRemnants({
      materialCode: "WHITE_MELAMINE",
      status: "AVAILABLE",
      location: "Rack"
    });

    expect(prismaMock.remnant.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        materialCode: "WHITE_MELAMINE",
        status: "AVAILABLE",
        locationLabel: expect.objectContaining({ contains: "Rack" })
      }),
      orderBy: expect.any(Array)
    });
    expect(result.summary.totalAvailableRemnants).toBe(1);
  });

  it("excludes consumed and scrapped remnants from forecast candidates and reduces sheet need heuristically", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([
      {
        id: "rem_1",
        code: "REM-0001",
        materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
        materialCode: "WHITE_MELAMINE",
        materialLabel: "WHITE MELAMINE · 0.75 in",
        thicknessIn: new Prisma.Decimal("0.750"),
        edgeBandPattern: "ALL_FOUR",
        lengthIn: new Prisma.Decimal("48"),
        widthIn: new Prisma.Decimal("18"),
        areaSqIn: new Prisma.Decimal("864"),
        usableAreaSqIn: new Prisma.Decimal("864"),
        status: "AVAILABLE",
        locationLabel: "Rack A",
        createdAt: new Date("2026-03-01T00:00:00.000Z")
      },
      {
        id: "rem_2",
        code: "REM-0002",
        materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
        materialCode: "WHITE_MELAMINE",
        materialLabel: "WHITE MELAMINE · 0.75 in",
        thicknessIn: new Prisma.Decimal("0.750"),
        edgeBandPattern: "ALL_FOUR",
        lengthIn: new Prisma.Decimal("30"),
        widthIn: new Prisma.Decimal("12"),
        areaSqIn: new Prisma.Decimal("360"),
        usableAreaSqIn: new Prisma.Decimal("360"),
        status: "PARTIAL",
        locationLabel: null,
        createdAt: new Date("2026-03-02T00:00:00.000Z")
      }
    ]);

    const result = await getForecastRemnantCandidates({
      organizationId: "org_local_craft_board",
      materialCode: "WHITE_MELAMINE",
      thicknessIn: 0.75,
      edgeBandPattern: "ALL_FOUR",
      demandAreaSqIn: 1500
    });

    expect(result.candidateRemnantsCount).toBe(2);
    expect(result.candidateRemnantsAreaSqIn).toBe(1224);
    expect(result.recommendedCoverageAreaSqIn).toBe(1224);
    expect(result.estimatedNewSheetReduction).toBeGreaterThanOrEqual(0);
    expect(result.candidateRemnantsPreview[0].code).toBe("REM-0001");
  });

  it("prevents false material matches for forecast candidates", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([]);

    const result = await getForecastRemnantCandidates({
      organizationId: "org_local_craft_board",
      materialCode: "MAPLE_MELAMINE",
      thicknessIn: 0.75,
      edgeBandPattern: "ALL_FOUR",
      demandAreaSqIn: 500
    });

    expect(result.candidateRemnantsCount).toBe(0);
    expect(result.estimatedNewSheetReduction).toBe(0);
  });

  it("partially consumes a remnant and updates remaining dimensions/status", async () => {
    prismaMock.remnant.findUnique.mockResolvedValue({
      id: "rem_1",
      organizationId: "org_local_craft_board",
      code: "REM-0001",
      lengthIn: new Prisma.Decimal("48"),
      widthIn: new Prisma.Decimal("12"),
      areaSqIn: new Prisma.Decimal("576"),
      usableAreaSqIn: new Prisma.Decimal("576"),
      status: "AVAILABLE"
    });
    prismaMock.remnant.update.mockResolvedValue({
      id: "rem_1",
      code: "REM-0001",
      materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
      materialCode: "WHITE_MELAMINE",
      materialLabel: "WHITE MELAMINE · 0.75 in",
      thicknessIn: new Prisma.Decimal("0.750"),
      edgeBandPattern: "ALL_FOUR",
      lengthIn: new Prisma.Decimal("28"),
      widthIn: new Prisma.Decimal("12"),
      areaSqIn: new Prisma.Decimal("336"),
      usableAreaSqIn: new Prisma.Decimal("336"),
      sourceBatchId: null,
      sourceType: "MANUAL",
      status: "PARTIAL",
      locationLabel: "Rack A",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      usages: []
    });

    const result = await consumeRemnant("rem_1", {
      usedAreaSqIn: 240
    });

    expect(prismaMock.remnant.update).toHaveBeenCalledWith({
      where: { id: "rem_1" },
      data: expect.objectContaining({
        status: "PARTIAL",
        areaSqIn: expect.any(Prisma.Decimal),
        usableAreaSqIn: expect.any(Prisma.Decimal)
      }),
      include: expect.any(Object)
    });
    expect(result.remnant.status).toBe("PARTIAL");
    expect(result.remnant.areaSqIn).toBe(336);
  });

  it("rejects impossible remnant consume attempts", async () => {
    prismaMock.remnant.findUnique.mockResolvedValue({
      id: "rem_1",
      organizationId: "org_local_craft_board",
      code: "REM-0001",
      lengthIn: new Prisma.Decimal("48"),
      widthIn: new Prisma.Decimal("12"),
      areaSqIn: new Prisma.Decimal("576"),
      usableAreaSqIn: new Prisma.Decimal("100"),
      status: "AVAILABLE"
    });

    await expect(
      consumeRemnant("rem_1", {
        usedAreaSqIn: 200
      })
    ).rejects.toThrow("Remnant REM-0001 only has 100.000 sq in available.");
  });

  it("generates and persists a current remnant label artifact", async () => {
    prismaMock.remnant.findUnique.mockResolvedValue({
      id: "rem_1",
      organizationId: "org_local_craft_board",
      code: "REM-0001",
      materialLabel: "WHITE MELAMINE · 0.75 in",
      lengthIn: new Prisma.Decimal("48"),
      widthIn: new Prisma.Decimal("12"),
      status: "AVAILABLE",
      locationLabel: "Rack A",
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    });
    prismaMock.artifact.findFirst.mockResolvedValue(null);
    artifactMocks.writeRemnantArtifactPdf.mockResolvedValue("/generated-artifacts/remnants/rem_1/remnant-label-v1.pdf");
    prismaMock.artifact.findFirstOrThrow.mockResolvedValue({
      id: "artifact_1",
      uri: "/generated-artifacts/remnants/rem_1/remnant-label-v1.pdf",
      version: 1
    });

    const result = await generateRemnantLabel("rem_1");

    expect(artifactMocks.writeRemnantArtifactPdf).toHaveBeenCalled();
    expect(prismaMock.artifact.updateMany).toHaveBeenCalled();
    expect(prismaMock.artifact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        remnantId: "rem_1",
        type: "remnant-label-pdf",
        version: 1
      })
    });
    expect(result.artifact.type).toBe("remnant-label-pdf");
  });
});
