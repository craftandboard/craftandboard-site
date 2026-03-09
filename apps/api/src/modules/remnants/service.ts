import type {
  ConsumeRemnantRequest,
  CreateRemnantRequest,
  RemnantDetail,
  RemnantListResponse,
  RemnantSummary,
  RemnantUsageRow,
  RemnantLabelArtifactResponse,
  UpdateRemnantRequest
} from "@craft-and-board/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeRemnantArtifactPdf } from "../../lib/generatedArtifacts.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { materialDisplayName, materialKeyFor } from "../materialForecast/materialKey.js";
import { buildRemnantLabelPdf } from "./labels.js";

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function toNumber(value: { toString(): string } | null | undefined) {
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

function mapHistoryRow(row: {
  id: string;
  actionType: string;
  usedAreaSqIn: { toString(): string } | null;
  previousLengthIn: { toString(): string } | null;
  previousWidthIn: { toString(): string } | null;
  newLengthIn: { toString(): string } | null;
  newWidthIn: { toString(): string } | null;
  batchId: string | null;
  partId: string | null;
  notes: string | null;
  createdAt: Date;
}): RemnantUsageRow {
  return {
    id: row.id,
    actionType: row.actionType as RemnantUsageRow["actionType"],
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

function mapRemnantRow(row: {
  id: string;
  code: string;
  materialKey: string;
  materialCode: string;
  materialLabel: string;
  thicknessIn: { toString(): string };
  edgeBandPattern: string;
  lengthIn: { toString(): string };
  widthIn: { toString(): string };
  areaSqIn: { toString(): string };
  usableAreaSqIn: { toString(): string } | null;
  sourceBatchId: string | null;
  sourceType: string;
  status: string;
  locationLabel: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RemnantSummary {
  return {
    id: row.id,
    code: row.code,
    materialKey: row.materialKey,
    materialCode: row.materialCode as RemnantSummary["materialCode"],
    materialLabel: row.materialLabel,
    thicknessIn: toNumber(row.thicknessIn),
    edgeBandPattern: row.edgeBandPattern as RemnantSummary["edgeBandPattern"],
    lengthIn: toNumber(row.lengthIn),
    widthIn: toNumber(row.widthIn),
    areaSqIn: toNumber(row.areaSqIn),
    usableAreaSqIn: toNumber(row.usableAreaSqIn ?? row.areaSqIn),
    sourceBatchId: row.sourceBatchId ?? undefined,
    sourceType: row.sourceType as RemnantSummary["sourceType"],
    status: row.status as RemnantSummary["status"],
    locationLabel: row.locationLabel ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
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

export async function createRemnant(
  input: CreateRemnantRequest,
  organizationId = LOCAL_ORG_ID
): Promise<{ ok: true; remnant: RemnantDetail }> {
  assertPositive(input.lengthIn, "Length");
  assertPositive(input.widthIn, "Width");

  const thicknessIn = Number(input.thicknessIn);
  assertPositive(thicknessIn, "Thickness");
  const computedArea = areaSqIn(input.lengthIn, input.widthIn);
  const computedUsableArea = input.usableAreaSqIn ?? computedArea;

  if (computedUsableArea > computedArea) {
    throw new Error("Usable area cannot exceed total remnant area.");
  }

  const code = await nextRemnantCode(organizationId);
  const materialLabel = input.materialLabel?.trim() || materialDisplayName(input.materialCode, thicknessIn);
  const materialKey = materialKeyFor({
    materialCode: input.materialCode,
    thicknessIn,
    edgeBandPattern: input.edgeBandPattern ?? "ALL_FOUR"
  });

  const created = await prisma.remnant.create({
    data: {
      organizationId,
      code,
      materialKey,
      materialCode: input.materialCode,
      materialLabel,
      thicknessIn: decimal(thicknessIn),
      edgeBandPattern: input.edgeBandPattern ?? "ALL_FOUR",
      lengthIn: decimal(input.lengthIn),
      widthIn: decimal(input.widthIn),
      areaSqIn: decimal(computedArea),
      usableAreaSqIn: decimal(computedUsableArea),
      sourceBatchId: input.sourceBatchId,
      sourceType: input.sourceType ?? "MANUAL",
      status: computedUsableArea < computedArea ? "PARTIAL" : "AVAILABLE",
      locationLabel: input.locationLabel?.trim() || null,
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
      usages: {
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(created),
      history: created.usages.map(mapHistoryRow)
    }
  };
}

export async function listRemnants(
  input: {
    materialCode?: string;
    status?: string;
    location?: string;
    minimumLengthIn?: number;
    minimumWidthIn?: number;
  },
  organizationId = LOCAL_ORG_ID
): Promise<RemnantListResponse> {
  const remnants = await prisma.remnant.findMany({
    where: {
      organizationId,
      materialCode: input.materialCode ? (input.materialCode as never) : undefined,
      status: input.status ? (input.status as never) : undefined,
      locationLabel: input.location
        ? {
            contains: input.location,
            mode: "insensitive"
          }
        : undefined,
      lengthIn: input.minimumLengthIn ? { gte: decimal(input.minimumLengthIn) } : undefined,
      widthIn: input.minimumWidthIn ? { gte: decimal(input.minimumWidthIn) } : undefined
    },
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }]
  });

  const mapped = remnants.map(mapRemnantRow);
  const available = mapped.filter((remnant) => remnant.status === "AVAILABLE" || remnant.status === "PARTIAL");
  const topMaterials = new Map<
    string,
    { materialKey: string; materialCode: RemnantSummary["materialCode"]; materialLabel: string; remnantCount: number; totalAreaSqIn: number }
  >();

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
      scrappedCount: mapped.filter((remnant) => remnant.status === "SCRAPPED").length,
      topMaterials: [...topMaterials.values()]
        .sort((left, right) => right.totalAreaSqIn - left.totalAreaSqIn)
        .slice(0, 5)
    },
    remnants: mapped
  };
}

export async function getRemnantDetail(remnantId: string, organizationId = LOCAL_ORG_ID): Promise<{ ok: true; remnant: RemnantDetail }> {
  const remnant = await prisma.remnant.findUnique({
    where: { id: remnantId },
    include: {
      usages: {
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  if (!remnant || remnant.organizationId !== organizationId) {
    throw new Error("Remnant not found.");
  }

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(remnant),
      history: remnant.usages.map(mapHistoryRow)
    }
  };
}

export async function updateRemnant(
  remnantId: string,
  input: UpdateRemnantRequest,
  organizationId = LOCAL_ORG_ID
): Promise<{ ok: true; remnant: RemnantDetail }> {
  const existing = await prisma.remnant.findUnique({
    where: { id: remnantId }
  });

  if (!existing || existing.organizationId !== organizationId) {
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

  const nextStatus =
    input.status ??
    (nextUsableAreaSqIn === 0 ? "CONSUMED" : nextUsableAreaSqIn < nextAreaSqIn ? "PARTIAL" : existing.status);

  const updated = await prisma.remnant.update({
    where: { id: remnantId },
    data: {
      status: nextStatus,
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
    },
    include: {
      usages: {
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(updated),
      history: updated.usages.map(mapHistoryRow)
    }
  };
}

export async function consumeRemnant(
  remnantId: string,
  input: ConsumeRemnantRequest,
  organizationId = LOCAL_ORG_ID
): Promise<{ ok: true; remnant: RemnantDetail }> {
  const remnant = await prisma.remnant.findUnique({
    where: { id: remnantId }
  });

  if (!remnant || remnant.organizationId !== organizationId) {
    throw new Error("Remnant not found.");
  }

  if (!["AVAILABLE", "PARTIAL", "RESERVED"].includes(remnant.status)) {
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

  const updated = await prisma.remnant.update({
    where: { id: remnantId },
    data: {
      status: nextStatus,
      lengthIn: fullyConsumed ? remnant.lengthIn : decimal(nextLengthIn),
      widthIn: remnant.widthIn,
      areaSqIn: fullyConsumed ? remnant.areaSqIn : decimal(remainingAreaSqIn),
      usableAreaSqIn: decimal(fullyConsumed ? 0 : remainingAreaSqIn),
      usages: {
        create: {
          organizationId,
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
      }
    },
    include: {
      usages: {
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  return {
    ok: true,
    remnant: {
      ...mapRemnantRow(updated),
      history: updated.usages.map(mapHistoryRow)
    }
  };
}

export async function generateRemnantLabel(
  remnantId: string,
  organizationId = LOCAL_ORG_ID
): Promise<RemnantLabelArtifactResponse> {
  const remnant = await prisma.remnant.findUnique({
    where: { id: remnantId }
  });

  if (!remnant || remnant.organizationId !== organizationId) {
    throw new Error("Remnant not found.");
  }

  const version = await getNextRemnantArtifactVersion(remnant.id, "remnant-label-pdf", organizationId);
  const fileName = `remnant-label-v${version}.pdf`;
  const bytes = buildRemnantLabelPdf({
    code: remnant.code,
    materialLabel: remnant.materialLabel,
    lengthIn: toNumber(remnant.lengthIn),
    widthIn: toNumber(remnant.widthIn),
    status: remnant.status,
    locationLabel: remnant.locationLabel ?? undefined,
    createdDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
      remnant.createdAt
    )
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
        generatedFrom: remnant.code
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
