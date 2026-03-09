import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  remnant: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn()
  },
  remnantMovement: {
    create: vi.fn()
  },
  remnantAllocation: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  },
  remnantUsage: {
    create: vi.fn()
  },
  container: {
    findFirst: vi.fn()
  },
  containerLocation: {
    findFirst: vi.fn()
  },
  labelTemplateVersion: {
    findFirst: vi.fn()
  },
  labelRenderJob: {
    create: vi.fn()
  },
  artifact: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirstOrThrow: vi.fn()
  },
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return await (arg as any)(prismaMock);
    }
    return arg;
  })
}));

const artifactMocks = vi.hoisted(() => ({
  writeRemnantArtifactPdf: vi.fn()
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/generatedArtifacts.js", () => artifactMocks);
vi.mock("../modules/settings/service.js", () => ({
  LOCAL_ORG_ID: "org_local_craft_board"
}));

import {
  allocateRemnant,
  assignRemnantToContainer,
  checkRemnantCandidates,
  consumeRemnant,
  createRemnant,
  generateRemnantLabel,
  getRemnantLabelHtml,
  getRemnantLabelPayload,
  listRemnants,
  moveRemnant,
  releaseRemnantAllocation,
  reserveRemnant
} from "../modules/remnants/service.js";
import { getForecastRemnantCandidates } from "../modules/remnants/matching.js";

function d(value: number | string) {
  return new Prisma.Decimal(value);
}

function remnantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "rem_1",
    organizationId: "org_local_craft_board",
    code: "REM-0001",
    remnantCode: "REM-0001",
    materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
    materialCode: "WHITE_MELAMINE",
    materialLabel: "WHITE MELAMINE · 0.75 in",
    materialName: "White Melamine",
    thicknessIn: d("0.750"),
    edgeBandPattern: "ALL_FOUR",
    lengthIn: d("48"),
    widthIn: d("12"),
    areaSqIn: d("576"),
    usableAreaSqIn: d("576"),
    sourceReferenceId: null,
    sourceBatchId: null,
    sourcePacketId: null,
    sourcePartId: null,
    sourceType: "MANUAL_ENTRY",
    grainDirection: "NONE",
    edgeCondition: "RAW",
    status: "AVAILABLE",
    qualityGrade: "A",
    barcodeValue: "REMNANT:REM-0001",
    qrValue: "REMNANT:REM-0001",
    currentContainerId: null,
    currentLocationId: null,
    locationLabel: "Rack A",
    notes: null,
    createdAt: new Date("2026-03-08T00:00:00.000Z"),
    updatedAt: new Date("2026-03-08T00:00:00.000Z"),
    currentContainer: null,
    currentLocation: null,
    usages: [],
    allocations: [],
    movements: [],
    ...overrides
  };
}

describe("remnant service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        return await (arg as any)(prismaMock);
      }
      return arg;
    });
  });

  it("creates a remnant with computed area, stable scan values, and deterministic material key", async () => {
    prismaMock.remnant.count.mockResolvedValue(0);
    prismaMock.container.findFirst.mockResolvedValue(null);
    prismaMock.containerLocation.findFirst.mockResolvedValue(null);
    prismaMock.remnant.create.mockResolvedValue(remnantRow());
    prismaMock.remnant.findFirst.mockResolvedValue(remnantRow());

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
        remnantCode: "REM-0001",
        materialKey: "WHITE_MELAMINE:0.750:ALL_FOUR",
        barcodeValue: "REMNANT:REM-0001",
        qrValue: "REMNANT:REM-0001",
        areaSqIn: expect.any(Prisma.Decimal)
      }),
      include: expect.any(Object)
    });
    expect(result.remnant.areaSqIn).toBe(576);
    expect(result.remnant.barcodeValue).toBe("REMNANT:REM-0001");
  });

  it("rejects AVAILABLE remnants without valid required fields", async () => {
    await expect(
      createRemnant({
        materialCode: "WHITE_MELAMINE",
        thicknessIn: 0.75,
        lengthIn: 0,
        widthIn: 12,
        status: "AVAILABLE"
      })
    ).rejects.toThrow("Length must be greater than 0.");
  });

  it("lists and filters remnants by material, status, and location", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([remnantRow()]);

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
      include: expect.any(Object),
      orderBy: expect.any(Array)
    });
    expect(result.summary.totalAvailableRemnants).toBe(1);
  });

  it("returns remnant label payload and html with key metadata", async () => {
    prismaMock.remnant.findFirst.mockResolvedValue(
      remnantRow({
        currentContainer: { containerCode: "BIN-CNC-001", code: "BIN-CNC-001", displayName: "CNC Bin 001" },
        currentLocation: { code: "CNC_OUTFEED", name: "CNC Outfeed" }
      })
    );
    prismaMock.labelTemplateVersion.findFirst.mockResolvedValue({
      id: "template_1",
      name: "Starter Remnant Label",
      code: "REMNANT_DEFAULT",
      version: 1
    });

    const payload = await getRemnantLabelPayload("rem_1");
    const html = await getRemnantLabelHtml("rem_1");

    expect(payload.label.remnantCode).toBe("REM-0001");
    expect(payload.label.barcodeValue).toBe("REMNANT:REM-0001");
    expect(html.html).toContain("REM-0001");
    expect(html.html).toContain("WHITE MELAMINE");
  });

  it("moves a remnant to a new container/location and records movement", async () => {
    prismaMock.remnant.findFirst
      .mockResolvedValueOnce(remnantRow({ currentContainerId: null, currentLocationId: null }))
      .mockResolvedValueOnce(
        remnantRow({
          currentContainerId: "container_1",
          currentLocationId: "location_1",
          currentContainer: { containerCode: "BIN-CNC-001", code: "BIN-CNC-001", displayName: "CNC Bin 001" },
          currentLocation: { code: "CNC_OUTFEED", name: "CNC Outfeed" },
          movements: [
            {
              id: "move_1",
              remnantId: "rem_1",
              fromContainerId: null,
              toContainerId: "container_1",
              fromLocationId: null,
              toLocationId: "location_1",
              fromContainer: null,
              toContainer: { containerCode: "BIN-CNC-001", code: "BIN-CNC-001" },
              fromLocation: null,
              toLocation: { code: "CNC_OUTFEED", name: "CNC Outfeed" },
              movedByUserId: "user_1",
              reason: "ASSIGN_CONTAINER",
              metadataJson: null,
              createdAt: new Date("2026-03-08T00:00:00.000Z")
            }
          ]
        })
      );
    prismaMock.container.findFirst.mockResolvedValue({
      id: "container_1",
      organizationId: "org_local_craft_board",
      containerCode: "BIN-CNC-001",
      code: "BIN-CNC-001",
      displayName: "CNC Bin 001",
      status: "AVAILABLE",
      isActive: true,
      currentLocationId: "location_1",
      currentLocation: { id: "location_1", code: "CNC_OUTFEED", name: "CNC Outfeed", isActive: true }
    });
    prismaMock.containerLocation.findFirst.mockResolvedValue({
      id: "location_1",
      code: "CNC_OUTFEED",
      name: "CNC Outfeed",
      isActive: true
    });
    prismaMock.remnant.update.mockResolvedValue(remnantRow({ currentContainerId: "container_1", currentLocationId: "location_1" }));
    prismaMock.remnantMovement.create.mockResolvedValue({ id: "move_1" });

    const result = await assignRemnantToContainer({
      remnantId: "rem_1",
      containerId: "container_1",
      movedByUserId: "user_1"
    });

    expect(prismaMock.remnant.update).toHaveBeenCalledWith({
      where: { id: "rem_1" },
      data: expect.objectContaining({
        currentContainerId: "container_1",
        currentLocationId: "location_1"
      })
    });
    expect(prismaMock.remnantMovement.create).toHaveBeenCalled();
    expect(result.remnant.currentContainerCode).toBe("BIN-CNC-001");
  });

  it("reserves an AVAILABLE remnant and rejects a second active reservation", async () => {
    prismaMock.remnant.findFirst.mockResolvedValue(remnantRow());
    prismaMock.remnantAllocation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "alloc_1",
        remnantId: "rem_1",
        allocationType: "RESERVE",
        targetType: "SHELF_JOB",
        targetId: "job_1",
        status: "ACTIVE",
        createdAt: new Date("2026-03-08T00:00:00.000Z")
      });
    prismaMock.remnantAllocation.create.mockResolvedValue({
      id: "alloc_1",
      remnantId: "rem_1",
      allocationType: "RESERVE",
      targetType: "SHELF_JOB",
      targetId: "job_1",
      status: "ACTIVE",
      reservedAreaSqIn: d("120"),
      reservedLengthIn: null,
      reservedWidthIn: null,
      notes: null,
      createdByUserId: "user_1",
      releasedByUserId: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      releasedAt: null
    });
    prismaMock.remnant.update.mockResolvedValue(remnantRow({ status: "RESERVED" }));
    prismaMock.remnantUsage.create.mockResolvedValue({ id: "usage_1" });
    prismaMock.remnant.findFirst.mockResolvedValueOnce(remnantRow()).mockResolvedValueOnce(
      remnantRow({
        status: "RESERVED",
        allocations: [
          {
            id: "alloc_1",
            remnantId: "rem_1",
            allocationType: "RESERVE",
            targetType: "SHELF_JOB",
            targetId: "job_1",
            status: "ACTIVE",
            reservedAreaSqIn: d("120"),
            reservedLengthIn: null,
            reservedWidthIn: null,
            notes: null,
            createdByUserId: "user_1",
            releasedByUserId: null,
            createdAt: new Date("2026-03-08T00:00:00.000Z"),
            releasedAt: null
          }
        ]
      })
    );

    const reserved = await reserveRemnant({
      remnantId: "rem_1",
      targetType: "SHELF_JOB",
      targetId: "job_1",
      reservedAreaSqIn: 120,
      createdByUserId: "user_1"
    });

    expect(reserved.allocation.allocationType).toBe("RESERVE");
    await expect(
      reserveRemnant({
        remnantId: "rem_1",
        targetType: "SHELF_JOB",
        targetId: "job_2",
        createdByUserId: "user_1"
      })
    ).rejects.toThrow("already has an active reservation or allocation");
  });

  it("allocates and releases a remnant with explicit state transitions", async () => {
    prismaMock.remnant.findFirst
      .mockResolvedValueOnce(remnantRow({ status: "AVAILABLE" }))
      .mockResolvedValueOnce(
        remnantRow({
          status: "ALLOCATED",
          allocations: [
            {
              id: "alloc_2",
              remnantId: "rem_1",
              allocationType: "ALLOCATE",
              targetType: "MANUFACTURING_BATCH",
              targetId: "batch_1",
              status: "ACTIVE",
              reservedAreaSqIn: null,
              reservedLengthIn: null,
              reservedWidthIn: null,
              notes: null,
              createdByUserId: "user_1",
              releasedByUserId: null,
              createdAt: new Date("2026-03-08T00:00:00.000Z"),
              releasedAt: null
            }
          ]
        })
      )
      .mockResolvedValueOnce(remnantRow({ status: "AVAILABLE" }));
    prismaMock.remnantAllocation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "alloc_2",
        organizationId: "org_local_craft_board",
        remnantId: "rem_1",
        allocationType: "ALLOCATE",
        targetType: "MANUFACTURING_BATCH",
        targetId: "batch_1",
        status: "ACTIVE",
        notes: null,
        createdAt: new Date("2026-03-08T00:00:00.000Z")
      });
    prismaMock.remnantAllocation.create.mockResolvedValue({
      id: "alloc_2",
      remnantId: "rem_1",
      allocationType: "ALLOCATE",
      targetType: "MANUFACTURING_BATCH",
      targetId: "batch_1",
      status: "ACTIVE",
      reservedAreaSqIn: null,
      reservedLengthIn: null,
      reservedWidthIn: null,
      notes: null,
      createdByUserId: "user_1",
      releasedByUserId: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      releasedAt: null
    });
    prismaMock.remnant.update.mockResolvedValue(remnantRow({ status: "ALLOCATED" }));
    prismaMock.remnantUsage.create.mockResolvedValue({ id: "usage_1" });
    prismaMock.remnantAllocation.update.mockResolvedValue({
      id: "alloc_2",
      remnantId: "rem_1",
      allocationType: "ALLOCATE",
      targetType: "MANUFACTURING_BATCH",
      targetId: "batch_1",
      status: "RELEASED",
      reservedAreaSqIn: null,
      reservedLengthIn: null,
      reservedWidthIn: null,
      notes: "Released",
      createdByUserId: "user_1",
      releasedByUserId: "user_2",
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      releasedAt: new Date("2026-03-08T01:00:00.000Z")
    });

    const allocated = await allocateRemnant({
      remnantId: "rem_1",
      targetType: "MANUFACTURING_BATCH",
      targetId: "batch_1",
      createdByUserId: "user_1"
    });
    expect(allocated.remnant.status).toBe("ALLOCATED");

    const released = await releaseRemnantAllocation({
      allocationId: "alloc_2",
      releasedByUserId: "user_2",
      notes: "Released"
    });
    expect(released.remnant.status).toBe("AVAILABLE");
  });

  it("partially consumes a remnant and updates remaining dimensions/status", async () => {
    prismaMock.remnant.findFirst
      .mockResolvedValueOnce(
        remnantRow({
          lengthIn: d("48"),
          widthIn: d("12"),
          areaSqIn: d("576"),
          usableAreaSqIn: d("576"),
          status: "AVAILABLE"
        })
      )
      .mockResolvedValueOnce(
        remnantRow({
          lengthIn: d("28"),
          widthIn: d("12"),
          areaSqIn: d("336"),
          usableAreaSqIn: d("336"),
          status: "PARTIAL"
        })
      );
    prismaMock.remnant.update.mockResolvedValue(
      remnantRow({
        lengthIn: d("28"),
        widthIn: d("12"),
        areaSqIn: d("336"),
        usableAreaSqIn: d("336"),
        status: "PARTIAL"
      })
    );
    prismaMock.remnantUsage.create.mockResolvedValue({ id: "usage_1" });
    prismaMock.remnantAllocation.updateMany.mockResolvedValue({ count: 0 });

    const result = await consumeRemnant("rem_1", {
      usedAreaSqIn: 240
    });

    expect(prismaMock.remnant.update).toHaveBeenCalledWith({
      where: { id: "rem_1" },
      data: expect.objectContaining({
        status: "PARTIAL",
        areaSqIn: expect.any(Prisma.Decimal),
        usableAreaSqIn: expect.any(Prisma.Decimal)
      })
    });
    expect(result.remnant.status).toBe("PARTIAL");
    expect(result.remnant.areaSqIn).toBe(336);
  });

  it("returns only qualifying AVAILABLE remnants for remnant-check ordered by smallest fit", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([
      remnantRow({
        id: "rem_small",
        remnantCode: "REM-0002",
        code: "REM-0002",
        lengthIn: d("30"),
        widthIn: d("20"),
        areaSqIn: d("600"),
        usableAreaSqIn: d("600")
      }),
      remnantRow({
        id: "rem_large",
        remnantCode: "REM-0003",
        code: "REM-0003",
        lengthIn: d("36"),
        widthIn: d("24"),
        areaSqIn: d("864"),
        usableAreaSqIn: d("864")
      })
    ]);

    const result = await checkRemnantCandidates({
      materialType: "WHITE_MELAMINE",
      thicknessIn: 0.75,
      requiredLengthIn: 24,
      requiredWidthIn: 18
    });

    expect(prismaMock.remnant.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        materialCode: "WHITE_MELAMINE",
        status: "AVAILABLE"
      }),
      include: expect.any(Object),
      orderBy: [{ usableAreaSqIn: "asc" }, { createdAt: "asc" }]
    });
    expect(result.candidates[0].remnantCode).toBe("REM-0002");
  });

  it("uses live remnant data for forecast candidate summaries", async () => {
    prismaMock.remnant.findMany.mockResolvedValue([
      remnantRow({
        id: "rem_1",
        remnantCode: "REM-0001",
        code: "REM-0001",
        lengthIn: d("48"),
        widthIn: d("18"),
        areaSqIn: d("864"),
        usableAreaSqIn: d("864"),
        locationLabel: null,
        currentLocation: { code: "CNC_OUTFEED", name: "CNC Outfeed" }
      })
    ]);

    const result = await getForecastRemnantCandidates({
      organizationId: "org_local_craft_board",
      materialCode: "WHITE_MELAMINE",
      thicknessIn: 0.75,
      edgeBandPattern: "ALL_FOUR",
      demandAreaSqIn: 1500
    });

    expect(result.candidateRemnantsCount).toBe(1);
    expect(result.candidateRemnantsPreview[0].code).toBe("REM-0001");
    expect(result.candidateRemnantsPreview[0].locationLabel).toBe("CNC Outfeed");
  });

  it("generates and persists a current remnant label pdf artifact", async () => {
    prismaMock.remnant.findFirst.mockResolvedValue(
      remnantRow({
        currentLocation: { code: "CNC_OUTFEED", name: "CNC Outfeed" }
      })
    );
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
