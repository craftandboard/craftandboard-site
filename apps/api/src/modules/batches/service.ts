import type { Batch, CreatedBatchPart, CreatedBatchSummary, MaterialCode } from "@craft-and-board/shared";
import { BatchStatus as PrismaBatchStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeBatchArtifactFile, writeBatchArtifactPdf } from "../../lib/generatedArtifacts.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { buildNestingResult } from "../nesting/service.js";
import { SHEET_HEIGHT_IN, SHEET_WIDTH_IN, USABLE_HEIGHT_IN, USABLE_WIDTH_IN, USABLE_X_IN, USABLE_Y_IN } from "../nesting/constants.js";
import { getAvailableNextPartActions, mapPartStatus } from "../parts/service.js";
import { scanCodeForPartId } from "../parts/scanCode.js";
import { buildBatchLabelCsv } from "./exports.js";
import { cncJsonAdapter, defaultCncCsvAdapter, mosaicCncAdapter, type CncExportAdapter, type CncExportInput } from "./cncAdapters.js";
import { buildLabelPdf, buildTravelerPdf } from "./pdf.js";

const ELIGIBLE_BATCH_MATERIALS = ["WHITE_MELAMINE", "MAPLE_MELAMINE"] as const satisfies readonly MaterialCode[];
type EligibleBatchMaterial = (typeof ELIGIBLE_BATCH_MATERIALS)[number];
const BATCH_TRANSITIONS = {
  draft: ["planned"],
  planned: ["released"],
  released: ["cutting"],
  cutting: ["cut_complete"],
  cut_complete: ["ready_for_next_stage"],
  ready_for_next_stage: [],
  completed: []
} as const satisfies Record<Batch["status"], readonly Batch["status"][]>;

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

function dateCodeFor(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function labelCodeFor(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

function mapBatchStatus(status: string): Batch["status"] {
  return String(status).toLowerCase() as Batch["status"];
}

function getAvailableNextActions(status: Batch["status"]) {
  return [...BATCH_TRANSITIONS[status]];
}

async function getNextArtifactVersion(batchId: string, type: string, organizationId = LOCAL_ORG_ID) {
  const latest = await prisma.artifact.findFirst({
    where: {
      organizationId,
      batchId,
      type
    },
    orderBy: [{ version: "desc" }]
  });

  return (latest?.version ?? 0) + 1;
}

async function getBatchCncExportInput(batchId: string, organizationId = LOCAL_ORG_ID): Promise<CncExportInput> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      artifacts: {
        where: {
          isCurrent: true,
          type: "batch-cnc-packet"
        }
      },
      sheets: {
        include: {
          placements: {
            include: {
              part: {
                include: {
                  manufacturingJob: true
                }
              }
            },
            orderBy: [{ sequenceNumber: "asc" }]
          }
        },
        orderBy: [{ sheetNumber: "asc" }]
      }
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  if (!batch.artifacts.some((artifact) => artifact.type === "batch-cnc-packet")) {
    throw new Error(`Batch ${batch.code} must have a current CNC packet before export.`);
  }

  if (batch.sheets.length === 0) {
    throw new Error(`Batch ${batch.code} must be nested before CNC generation.`);
  }

  return {
    batchId,
    batchCode: batch.code,
    sheets: batch.sheets.map((sheet) => ({
      sheetIndex: sheet.sheetNumber,
      material: sheet.materialCode,
      sheetWidth: Number(sheet.widthIn.toString()),
      sheetHeight: Number(sheet.heightIn.toString()),
      placements: sheet.placements.map((placement) => {
        const part = placement.part;
        const edgeBandPattern = String(part.edgeBandPattern);
        const allFour = edgeBandPattern === "ALL_FOUR";

        return {
          partId: part.id,
          labelCode: labelCodeFor(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber),
          scanCode: part.scanCode ?? scanCodeForPartId(part.id),
          x: Number(placement.xIn.toString()),
          y: Number(placement.yIn.toString()),
          width: Number(placement.widthIn.toString()),
          depth: Number(placement.depthIn.toString()),
          thickness: Number(part.thicknessIn.toString()),
          material: part.materialCode ?? sheet.materialCode,
          cutMethod: "RECTANGLE_CUT",
          partType: "SHELF",
          quantity: 1,
          grain: "WIDTH" as const,
          edgeBandPattern,
          edgeBandTop: allFour,
          edgeBandBottom: allFour,
          edgeBandLeft: allFour,
          edgeBandRight: allFour,
          source: (part.manufacturingJob?.source ?? "CONFIGURATOR") as "CONFIGURATOR" | "AMAZON"
        };
      })
    }))
  };
}

async function generateBatchCncExport(
  batchId: string,
  adapter: CncExportAdapter,
  organizationId = LOCAL_ORG_ID
): Promise<{
  batchId: string;
  artifact: {
    type: "batch-cnc-csv" | "batch-cnc-mosaic" | "batch-cnc-json";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const input = await getBatchCncExportInput(batchId, organizationId);
  const version = await getNextArtifactVersion(batchId, adapter.artifactType, organizationId);
  const uri = await writeBatchArtifactFile({
    batchId,
    fileName: adapter.fileName(version),
    bytes: adapter.generate(input)
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: adapter.artifactType,
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: adapter.artifactType,
        uri,
        mimeType: adapter.mimeType,
        version,
        isCurrent: true,
        generatedFrom: `${adapter.generatedFromPrefix}-${input.batchCode}`
      }
    });
  });

  return {
    batchId,
    artifact: {
      type: adapter.artifactType,
      uri,
      isCurrent: true,
      version
    }
  };
}

export async function listBatches(organizationId = LOCAL_ORG_ID): Promise<Batch[]> {
  const batches = await prisma.batch.findMany({
    where: {
      organizationId
    },
    include: {
      parts: {
        select: { id: true }
      },
      manufacturingJobs: {
        select: { id: true }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return batches.map((batch) => ({
    id: batch.id,
    organizationId: batch.organizationId,
    code: batch.code,
    name: batch.name,
    status: mapBatchStatus(batch.status),
    materialCode: batch.materialCode,
    source: batch.source as Batch["source"],
    partCount: batch.parts.length,
    jobCount: batch.manufacturingJobs.length,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString()
  }));
}

export async function getBatchDetail(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batch: {
    id: string;
    code: string;
    status: Batch["status"];
    material: MaterialCode;
    source: "CONFIGURATOR" | "AMAZON";
    partCount: number;
    jobCount: number;
    createdAt: string;
    updatedAt: string;
    availableNextActions: Batch["status"][];
    progress: {
      totalParts: number;
      cutCount: number;
      edgebandedCount: number;
      packedCount: number;
    };
  };
  jobs: Array<{
    id: string;
    source: "CONFIGURATOR" | "AMAZON";
    status: "DRAFT";
    channel: string;
    labelCode: string;
    partType: string;
    material: MaterialCode;
    edgeBandPattern: string;
    width: number;
    depth: number;
    thickness: number;
    quantity: number;
    partIds: string[];
  }>;
  parts: Array<{
    id: string;
    jobId?: string;
    source: "CONFIGURATOR" | "AMAZON";
    labelCode: string;
    scanCode: string;
    status: "pending" | "cut" | "edgebanded" | "packed";
    availableNextActions: Array<"cut" | "edgebanded" | "packed">;
    material: MaterialCode;
    edgeBandPattern: string;
    width: number;
    depth: number;
    thickness: number;
    instanceNumber: number;
  }>;
  sheets: Array<{
    id: string;
    sheetIndex: number;
    material: MaterialCode;
    sheetWidth: number;
    sheetHeight: number;
    status: string;
    placements: Array<{
      id: string;
      partId: string;
      labelCode: string;
      x: number;
      y: number;
      width: number;
      depth: number;
      sequenceNumber: number;
    }>;
  }>;
  artifacts: {
    cnc: {
      artifact?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
      packet?: {
        packetCode: string;
        sheetCount: number;
        partCount: number;
        format: "FOUNDATION_JSON";
      };
      sheets?: Array<{
        sheetIndex: number;
        material: MaterialCode;
        sheetWidth: number;
        sheetHeight: number;
        placements: Array<{
          partId: string;
          labelCode: string;
          x: number;
          y: number;
          width: number;
          depth: number;
          cutMethod: "RECTANGLE_CUT";
        }>;
      }>;
      csv?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
      mosaic?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
      json?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
    };
    labels: {
      artifact?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
      packet?: {
        packetCode: string;
        labelCount: number;
        format: "FOUNDATION_JSON";
      };
      labels?: Array<{
        partId: string;
        jobId?: string;
        batchId: string;
        labelCode: string;
        scanCode: string;
        partType: "SHELF";
        material: MaterialCode;
        width: number;
        depth: number;
        thickness: number;
        edgeBandPattern: string;
        quantity: 1;
        source: "CONFIGURATOR" | "AMAZON";
        currentStatus: string;
        sheetIndex?: number;
        x?: number;
        y?: number;
      }>;
      csv?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
      pdf?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
    };
    traveler: {
      pdf?: {
        id: string;
        type: string;
        uri: string;
        version: number;
        isCurrent: boolean;
        generatedFrom?: string;
        createdAt: string;
      };
    };
  };
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      manufacturingJobs: {
        include: {
          parts: {
            orderBy: [{ instanceNumber: "asc" }]
          }
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }]
      },
      parts: {
        include: {
          manufacturingJob: true,
          placements: {
            include: {
              sheet: true
            },
            orderBy: [{ sequenceNumber: "asc" }]
          }
        },
        orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
      },
      sheets: {
        include: {
          placements: {
            include: {
              part: {
                include: {
                  manufacturingJob: true
                }
              }
            },
            orderBy: [{ sequenceNumber: "asc" }]
          }
        },
        orderBy: [{ sheetNumber: "asc" }]
      },
      artifacts: {
        where: {
          isCurrent: true,
          type: {
            in: [
              "batch-cnc-packet",
              "batch-label-packet",
              "batch-label-pdf",
              "batch-traveler-pdf",
              "batch-cnc-csv",
              "batch-cnc-mosaic",
              "batch-cnc-json",
              "batch-label-csv"
            ]
          }
        },
        orderBy: [{ createdAt: "desc" }]
      }
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error("Batch not found.");
  }

  const currentCncArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-cnc-packet");
  const currentLabelArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-label-packet");
  const currentLabelPdfArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-label-pdf");
  const currentTravelerPdfArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-traveler-pdf");
  const currentCncCsvArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-cnc-csv");
  const currentCncMosaicArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-cnc-mosaic");
  const currentCncJsonArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-cnc-json");
  const currentLabelCsvArtifact = batch.artifacts.find((artifact) => artifact.type === "batch-label-csv");
  const progress = batch.parts.reduce(
    (summary, part) => {
      const status = mapPartStatus(part.status);

      if (status === "cut") {
        summary.cutCount += 1;
      }
      if (status === "edgebanded") {
        summary.edgebandedCount += 1;
      }
      if (status === "packed") {
        summary.packedCount += 1;
      }

      return summary;
    },
    {
      totalParts: batch.parts.length,
      cutCount: 0,
      edgebandedCount: 0,
      packedCount: 0
    }
  );

  const cncSheets = batch.sheets.map((sheet) => ({
    sheetIndex: sheet.sheetNumber,
    material: sheet.materialCode as MaterialCode,
    sheetWidth: Number(sheet.widthIn.toString()),
    sheetHeight: Number(sheet.heightIn.toString()),
    placements: sheet.placements.map((placement) => ({
      partId: placement.partId,
      labelCode: labelCodeFor(
        placement.part.manufacturingJob?.labelCode ?? placement.part.partCode,
        placement.part.instanceNumber
      ),
      x: Number(placement.xIn.toString()),
      y: Number(placement.yIn.toString()),
      width: Number(placement.widthIn.toString()),
      depth: Number(placement.depthIn.toString()),
      cutMethod: "RECTANGLE_CUT" as const
    }))
  }));

  const labelRows = batch.parts.map((part) => {
    const placement = part.placements[0];
    return {
      partId: part.id,
      jobId: part.manufacturingJobId ?? undefined,
      batchId,
      labelCode: labelCodeFor(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber),
      scanCode: part.scanCode ?? scanCodeForPartId(part.id),
      partType: "SHELF" as const,
      material: (part.materialCode ?? batch.materialCode) as MaterialCode,
      width: Number(part.widthIn.toString()),
      depth: Number(part.depthIn.toString()),
      thickness: Number(part.thicknessIn.toString()),
      edgeBandPattern: String(part.edgeBandPattern),
      quantity: 1 as const,
      source: (part.manufacturingJob?.source ?? "CONFIGURATOR") as "CONFIGURATOR" | "AMAZON",
      currentStatus: mapPartStatus(part.status),
      sheetIndex: placement?.sheet?.sheetNumber,
      x: placement ? Number(placement.xIn.toString()) : undefined,
      y: placement ? Number(placement.yIn.toString()) : undefined
    };
  });

  return {
    batch: {
      id: batch.id,
      code: batch.code,
      status: mapBatchStatus(batch.status),
      material: batch.materialCode as MaterialCode,
      source: batch.source as "CONFIGURATOR" | "AMAZON",
      partCount: batch.parts.length,
      jobCount: batch.manufacturingJobs.length,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      availableNextActions: getAvailableNextActions(mapBatchStatus(batch.status)),
      progress
    },
    jobs: batch.manufacturingJobs.map((job) => ({
      id: job.id,
      source: job.source as "CONFIGURATOR" | "AMAZON",
      status: "DRAFT" as const,
      channel: String(job.channel),
      labelCode: job.labelCode,
      partType: job.partType,
      material: job.materialCode as MaterialCode,
      edgeBandPattern: String(job.edgeBandPattern),
      width: Number(job.widthIn.toString()),
      depth: Number(job.depthIn.toString()),
      thickness: Number(job.thicknessIn.toString()),
      quantity: job.quantity,
      partIds: job.parts.map((part) => part.id)
    })),
    parts: batch.parts.map((part) => ({
      id: part.id,
      jobId: part.manufacturingJobId ?? undefined,
      source: (part.manufacturingJob?.source ?? "CONFIGURATOR") as "CONFIGURATOR" | "AMAZON",
      labelCode: labelCodeFor(part.manufacturingJob?.labelCode ?? part.partCode, part.instanceNumber),
      scanCode: part.scanCode ?? scanCodeForPartId(part.id),
      status: mapPartStatus(part.status),
      availableNextActions: getAvailableNextPartActions(mapPartStatus(part.status)),
      material: (part.materialCode ?? batch.materialCode) as MaterialCode,
      edgeBandPattern: String(part.edgeBandPattern),
      width: Number(part.widthIn.toString()),
      depth: Number(part.depthIn.toString()),
      thickness: Number(part.thicknessIn.toString()),
      instanceNumber: part.instanceNumber
    })),
    sheets: batch.sheets.map((sheet) => ({
      id: sheet.id,
      sheetIndex: sheet.sheetNumber,
      material: sheet.materialCode as MaterialCode,
      sheetWidth: Number(sheet.widthIn.toString()),
      sheetHeight: Number(sheet.heightIn.toString()),
      status: String(sheet.status).toLowerCase(),
      placements: sheet.placements.map((placement) => ({
        id: placement.id,
        partId: placement.partId,
        labelCode: labelCodeFor(
          placement.part.manufacturingJob?.labelCode ?? placement.part.partCode,
          placement.part.instanceNumber
        ),
        x: Number(placement.xIn.toString()),
        y: Number(placement.yIn.toString()),
        width: Number(placement.widthIn.toString()),
        depth: Number(placement.depthIn.toString()),
        sequenceNumber: placement.sequenceNumber
      }))
    })),
    artifacts: {
      cnc: {
        artifact: currentCncArtifact
          ? {
              id: currentCncArtifact.id,
              type: currentCncArtifact.type,
              uri: currentCncArtifact.uri,
              version: currentCncArtifact.version,
              isCurrent: currentCncArtifact.isCurrent,
              generatedFrom: currentCncArtifact.generatedFrom ?? undefined,
              createdAt: currentCncArtifact.createdAt.toISOString()
            }
          : undefined,
        packet:
          batch.sheets.length > 0
            ? {
                packetCode: `CNC-${batch.code}`,
                sheetCount: cncSheets.length,
                partCount: cncSheets.reduce((sum, sheet) => sum + sheet.placements.length, 0),
                format: "FOUNDATION_JSON" as const
              }
            : undefined,
        sheets: batch.sheets.length > 0 ? cncSheets : undefined,
        csv: currentCncCsvArtifact
          ? {
              id: currentCncCsvArtifact.id,
              type: currentCncCsvArtifact.type,
              uri: currentCncCsvArtifact.uri,
              version: currentCncCsvArtifact.version,
              isCurrent: currentCncCsvArtifact.isCurrent,
              generatedFrom: currentCncCsvArtifact.generatedFrom ?? undefined,
              createdAt: currentCncCsvArtifact.createdAt.toISOString()
            }
          : undefined,
        mosaic: currentCncMosaicArtifact
          ? {
              id: currentCncMosaicArtifact.id,
              type: currentCncMosaicArtifact.type,
              uri: currentCncMosaicArtifact.uri,
              version: currentCncMosaicArtifact.version,
              isCurrent: currentCncMosaicArtifact.isCurrent,
              generatedFrom: currentCncMosaicArtifact.generatedFrom ?? undefined,
              createdAt: currentCncMosaicArtifact.createdAt.toISOString()
            }
          : undefined,
        json: currentCncJsonArtifact
          ? {
              id: currentCncJsonArtifact.id,
              type: currentCncJsonArtifact.type,
              uri: currentCncJsonArtifact.uri,
              version: currentCncJsonArtifact.version,
              isCurrent: currentCncJsonArtifact.isCurrent,
              generatedFrom: currentCncJsonArtifact.generatedFrom ?? undefined,
              createdAt: currentCncJsonArtifact.createdAt.toISOString()
            }
          : undefined
      },
      labels: {
        artifact: currentLabelArtifact
          ? {
              id: currentLabelArtifact.id,
              type: currentLabelArtifact.type,
              uri: currentLabelArtifact.uri,
              version: currentLabelArtifact.version,
              isCurrent: currentLabelArtifact.isCurrent,
              generatedFrom: currentLabelArtifact.generatedFrom ?? undefined,
              createdAt: currentLabelArtifact.createdAt.toISOString()
            }
          : undefined,
        packet:
          batch.parts.length > 0
            ? {
                packetCode: `LABELS-${batch.code}`,
                labelCount: labelRows.length,
                format: "FOUNDATION_JSON" as const
              }
            : undefined,
        labels: batch.parts.length > 0 ? labelRows : undefined,
        csv: currentLabelCsvArtifact
          ? {
              id: currentLabelCsvArtifact.id,
              type: currentLabelCsvArtifact.type,
              uri: currentLabelCsvArtifact.uri,
              version: currentLabelCsvArtifact.version,
              isCurrent: currentLabelCsvArtifact.isCurrent,
              generatedFrom: currentLabelCsvArtifact.generatedFrom ?? undefined,
              createdAt: currentLabelCsvArtifact.createdAt.toISOString()
            }
          : undefined,
        pdf: currentLabelPdfArtifact
          ? {
              id: currentLabelPdfArtifact.id,
              type: currentLabelPdfArtifact.type,
              uri: currentLabelPdfArtifact.uri,
              version: currentLabelPdfArtifact.version,
              isCurrent: currentLabelPdfArtifact.isCurrent,
              generatedFrom: currentLabelPdfArtifact.generatedFrom ?? undefined,
              createdAt: currentLabelPdfArtifact.createdAt.toISOString()
            }
          : undefined
      },
      traveler: {
        pdf: currentTravelerPdfArtifact
          ? {
              id: currentTravelerPdfArtifact.id,
              type: currentTravelerPdfArtifact.type,
              uri: currentTravelerPdfArtifact.uri,
              version: currentTravelerPdfArtifact.version,
              isCurrent: currentTravelerPdfArtifact.isCurrent,
              generatedFrom: currentTravelerPdfArtifact.generatedFrom ?? undefined,
              createdAt: currentTravelerPdfArtifact.createdAt.toISOString()
            }
          : undefined
      }
    }
  };
}

export async function transitionBatchStatus(
  batchId: string,
  nextStatus: Exclude<Batch["status"], "draft" | "completed">,
  organizationId = LOCAL_ORG_ID
): Promise<{
  batch: {
    id: string;
    code: string;
    status: Batch["status"];
    availableNextActions: Batch["status"][];
  };
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      code: true,
      status: true,
      organizationId: true
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error("Batch not found.");
  }

  const currentStatus = mapBatchStatus(batch.status);
  const allowed = getAvailableNextActions(currentStatus);

  if (!allowed.includes(nextStatus)) {
    throw new Error(`Batch ${batch.code} cannot move from ${String(batch.status)} to ${String(nextStatus).toUpperCase()}.`);
  }

  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: String(nextStatus).toUpperCase() as PrismaBatchStatus
    }
  });

  const updatedStatus = mapBatchStatus(updated.status);

  return {
    batch: {
      id: updated.id,
      code: updated.code,
      status: updatedStatus,
      availableNextActions: getAvailableNextActions(updatedStatus)
    }
  };
}

export async function createBatchForMaterial(
  materialCode: EligibleBatchMaterial,
  organizationId = LOCAL_ORG_ID
): Promise<{
  batch: CreatedBatchSummary;
  parts: CreatedBatchPart[];
}> {
  const eligibleJobs = await prisma.manufacturingJob.findMany({
    where: {
      organizationId,
      source: {
        in: ["CONFIGURATOR", "AMAZON"]
      },
      status: "DRAFT",
      batchId: null,
      materialCode,
      parts: {
        some: {
          batchId: null
        }
      }
    },
    include: {
      parts: {
        where: { batchId: null },
        orderBy: [{ instanceNumber: "asc" }]
      }
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  });

  const eligibleParts = eligibleJobs.flatMap((job) =>
    job.parts.map((part) => ({
      id: part.id,
      labelCode: labelCodeFor(job.labelCode, part.instanceNumber)
    }))
  );

  if (eligibleParts.length === 0) {
    throw new Error(`No eligible draft parts found for ${materialCode}.`);
  }

  const batchDateCode = dateCodeFor(new Date());
  const batchCodePrefix = `${batchDateCode}-${materialCode}`;
  const existingCount = await prisma.batch.count({
    where: {
      organizationId,
      code: {
        startsWith: `${batchCodePrefix}-`
      }
    }
  });
  const batchCode = `${batchCodePrefix}-${String(existingCount + 1).padStart(2, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const batchSource = eligibleJobs.every((job) => job.source === "AMAZON") ? "AMAZON" : "CONFIGURATOR";
    const batch = await tx.batch.create({
      data: {
        organizationId,
        code: batchCode,
        name: batchCode,
        status: "DRAFT",
        materialCode,
        source: batchSource
      }
    });

    const jobIds = eligibleJobs.map((job) => job.id);
    const partIds = eligibleParts.map((part) => part.id);

    await tx.manufacturingJob.updateMany({
      where: { id: { in: jobIds } },
      data: { batchId: batch.id }
    });

    await tx.part.updateMany({
      where: { id: { in: partIds } },
      data: { batchId: batch.id }
    });

    return { batch, jobIds, partIds };
  });

  return {
    batch: {
      id: result.batch.id,
      batchCode,
      status: "DRAFT",
      material: materialCode,
      partCount: eligibleParts.length,
      jobCount: eligibleJobs.length
    },
    parts: eligibleJobs.flatMap((job) =>
      job.parts.map((part) => ({
        id: part.id,
        partType: "SHELF" as const,
        labelCode: labelCodeFor(job.labelCode, part.instanceNumber)
      }))
    )
  };
}

export async function nestBatch(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  sheets: Array<{
    sheetIndex: number;
    material: MaterialCode;
    parts: Array<{
      partId: string;
      x: number;
      y: number;
      width: number;
      depth: number;
    }>;
  }>;
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      parts: {
        orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
      }
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  if (batch.parts.length === 0) {
    throw new Error(`Batch ${batch.code} has no parts to nest.`);
  }

  const nestingInput = {
    bundleCode: batch.code,
    materialCode: batch.materialCode,
    parts: batch.parts.map((part, index) => ({
      id: part.id,
      partCode: part.partCode,
      orderId: part.orderId ?? undefined,
      orderItemId: part.orderItemId ?? undefined,
      customerLastName: part.customerLastName ?? undefined,
      materialCode: (part.materialCode ?? batch.materialCode) as MaterialCode,
      shipByDate: part.shipByDate?.toISOString(),
      widthIn: Number(part.widthIn.toString()),
      depthIn: Number(part.depthIn.toString()),
      thicknessIn: Number(part.thicknessIn.toString()),
      sequenceHint: index + 1
    }))
  } as const;

  const result = buildNestingResult(nestingInput);

  await prisma.$transaction(async (tx) => {
    const existingSheets = await tx.sheet.findMany({
      where: { batchId, organizationId },
      select: { id: true }
    });
    const existingSheetIds = existingSheets.map((sheet) => sheet.id);

    if (existingSheetIds.length > 0) {
      await tx.sheetPlacement.deleteMany({
        where: { sheetId: { in: existingSheetIds } }
      });
      await tx.sheet.deleteMany({
        where: { id: { in: existingSheetIds } }
      });
    }

    for (const sheet of result.sheets) {
      const createdSheet = await tx.sheet.create({
        data: {
          organizationId,
          batchId,
          materialCode: sheet.materialCode,
          sheetNumber: sheet.sheetNumber,
          version: 1,
          widthMm: Math.round(sheet.widthIn * 25.4),
          heightMm: Math.round(sheet.heightIn * 25.4),
          widthIn: decimal(sheet.widthIn),
          heightIn: decimal(sheet.heightIn),
          usableXIn: decimal(sheet.usableXIn),
          usableYIn: decimal(sheet.usableYIn),
          usableWidthIn: decimal(sheet.usableWidthIn),
          usableHeightIn: decimal(sheet.usableHeightIn),
          utilizationPct: decimal(sheet.utilizationPct),
          status: "PLANNED",
          isCurrent: true
        }
      });

      for (const placement of sheet.placements) {
        await tx.sheetPlacement.create({
          data: {
            organizationId,
            sheetId: createdSheet.id,
            partId: placement.partId,
            xMm: Math.round(placement.xIn * 25.4),
            yMm: Math.round(placement.yIn * 25.4),
            xIn: decimal(placement.xIn),
            yIn: decimal(placement.yIn),
            widthIn: decimal(placement.widthIn),
            depthIn: decimal(placement.depthIn),
            rotation: placement.rotationDeg,
            rotationDeg: placement.rotationDeg,
            sequenceNumber: placement.sequenceNumber,
            onionSkin: placement.onionSkin
          }
        });
      }
    }

    await tx.batch.update({
      where: { id: batchId },
      data: { status: "PLANNED" }
    });
  });

  return {
    batchId,
    sheets: result.sheets.map((sheet) => ({
      sheetIndex: sheet.sheetNumber,
      material: sheet.materialCode,
      parts: sheet.placements.map((placement) => ({
        partId: placement.partId,
        x: placement.xIn,
        y: placement.yIn,
        width: placement.widthIn,
        depth: placement.depthIn
      }))
    }))
  };
}

export async function generateBatchCncPacket(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  packet: {
    packetCode: string;
    sheetCount: number;
    partCount: number;
    format: "FOUNDATION_JSON";
  };
  sheets: Array<{
    sheetIndex: number;
    material: MaterialCode;
    sheetWidth: number;
    sheetHeight: number;
    placements: Array<{
      partId: string;
      labelCode: string;
      x: number;
      y: number;
      width: number;
      depth: number;
      cutMethod: "RECTANGLE_CUT";
    }>;
  }>;
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      sheets: {
        include: {
          placements: {
            include: {
              part: {
                include: {
                  manufacturingJob: true
                }
              }
            },
            orderBy: [{ sequenceNumber: "asc" }]
          }
        },
        orderBy: [{ sheetNumber: "asc" }]
      }
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  if (batch.sheets.length === 0) {
    throw new Error(`Batch ${batch.code} must be nested before CNC generation.`);
  }

  const packetCode = `CNC-${batch.code}`;
  const sheets = batch.sheets.map((sheet) => ({
    sheetIndex: sheet.sheetNumber,
    material: sheet.materialCode as MaterialCode,
    sheetWidth: Number(sheet.widthIn.toString()),
    sheetHeight: Number(sheet.heightIn.toString()),
    placements: sheet.placements.map((placement) => ({
      partId: placement.partId,
      labelCode: `${placement.part.manufacturingJob?.labelCode ?? placement.part.partCode}-P${String(placement.part.instanceNumber).padStart(2, "0")}`,
      x: Number(placement.xIn.toString()),
      y: Number(placement.yIn.toString()),
      width: Number(placement.widthIn.toString()),
      depth: Number(placement.depthIn.toString()),
      cutMethod: "RECTANGLE_CUT" as const
    }))
  }));

  const payload = {
    ok: true as const,
    action: "generate-cnc" as const,
    batchId,
    packet: {
      packetCode,
      sheetCount: sheets.length,
      partCount: sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0),
      format: "FOUNDATION_JSON" as const
    },
    sheets
  };

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: "batch-cnc-packet",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: "batch-cnc-packet",
        uri: `/batches/${batchId}/cnc-packet`,
        mimeType: "application/json",
        version: 1,
        isCurrent: true,
        generatedFrom: packetCode
      }
    });
  });

  return payload;
}

export async function generateBatchLabelPacket(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  packet: {
    packetCode: string;
    labelCount: number;
    format: "FOUNDATION_JSON";
  };
  labels: Array<{
    partId: string;
    jobId?: string;
    batchId: string;
    labelCode: string;
    scanCode: string;
    partType: "SHELF";
    material: MaterialCode;
    width: number;
    depth: number;
    thickness: number;
    edgeBandPattern: string;
    quantity: 1;
    source: "CONFIGURATOR" | "AMAZON";
    currentStatus: string;
    sheetIndex?: number;
    x?: number;
    y?: number;
  }>;
}> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      parts: {
        include: {
          manufacturingJob: true,
          placements: {
            include: {
              sheet: true
            },
            orderBy: [{ sequenceNumber: "asc" }]
          }
        },
        orderBy: [{ createdAt: "asc" }, { instanceNumber: "asc" }]
      }
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  if (batch.parts.length === 0) {
    throw new Error(`Batch ${batch.code} has no parts available for label generation.`);
  }

  const packetCode = `LABELS-${batch.code}`;
  const labels = batch.parts.map((part) => {
    const placement = part.placements[0];
    const baseLabelCode = part.manufacturingJob?.labelCode ?? part.partCode;

    return {
      partId: part.id,
      jobId: part.manufacturingJobId ?? undefined,
      batchId,
      labelCode: `${baseLabelCode}-P${String(part.instanceNumber).padStart(2, "0")}`,
      scanCode: part.scanCode ?? scanCodeForPartId(part.id),
      partType: "SHELF" as const,
      material: (part.materialCode ?? batch.materialCode) as MaterialCode,
      width: Number(part.widthIn.toString()),
      depth: Number(part.depthIn.toString()),
      thickness: Number(part.thicknessIn.toString()),
      edgeBandPattern: String(part.edgeBandPattern),
      quantity: 1 as const,
      source: (part.manufacturingJob?.source ?? "CONFIGURATOR") as "CONFIGURATOR" | "AMAZON",
      currentStatus: mapPartStatus(part.status),
      sheetIndex: placement?.sheet?.sheetNumber,
      x: placement ? Number(placement.xIn.toString()) : undefined,
      y: placement ? Number(placement.yIn.toString()) : undefined
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: "batch-label-packet",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: "batch-label-packet",
        uri: `/batches/${batchId}/labels-packet`,
        mimeType: "application/json",
        version: 1,
        isCurrent: true,
        generatedFrom: packetCode
      }
    });
  });

  return {
    batchId,
    packet: {
      packetCode,
      labelCount: labels.length,
      format: "FOUNDATION_JSON"
    },
    labels
  };
}

export async function generateBatchCncCsv(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-cnc-csv";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const result = await generateBatchCncExport(batchId, defaultCncCsvAdapter, organizationId);
  return {
    batchId: result.batchId,
    artifact: {
      type: "batch-cnc-csv",
      uri: result.artifact.uri,
      isCurrent: true,
      version: result.artifact.version
    }
  };
}

export async function generateBatchCncMosaic(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-cnc-mosaic";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const result = await generateBatchCncExport(batchId, mosaicCncAdapter, organizationId);
  return {
    batchId: result.batchId,
    artifact: {
      type: "batch-cnc-mosaic",
      uri: result.artifact.uri,
      isCurrent: true,
      version: result.artifact.version
    }
  };
}

export async function generateBatchCncJson(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-cnc-json";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const result = await generateBatchCncExport(batchId, cncJsonAdapter, organizationId);
  return {
    batchId: result.batchId,
    artifact: {
      type: "batch-cnc-json",
      uri: result.artifact.uri,
      isCurrent: true,
      version: result.artifact.version
    }
  };
}

export async function generateBatchLabelCsv(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-label-csv";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const packet = await generateBatchLabelPacket(batchId, organizationId);
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      code: true,
      organizationId: true
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  const version = await getNextArtifactVersion(batchId, "batch-label-csv", organizationId);
  const uri = await writeBatchArtifactFile({
    batchId,
    fileName: `label-export-v${version}.csv`,
    bytes: buildBatchLabelCsv({
      batchCode: batch.code,
      labels: packet.labels
    })
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: "batch-label-csv",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: "batch-label-csv",
        uri,
        mimeType: "text/csv",
        version,
        isCurrent: true,
        generatedFrom: packet.packet.packetCode
      }
    });
  });

  return {
    batchId,
    artifact: {
      type: "batch-label-csv",
      uri,
      isCurrent: true,
      version
    }
  };
}

export async function generateBatchLabelPdf(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-label-pdf";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const labelPacket = await generateBatchLabelPacket(batchId, organizationId);
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      code: true,
      organizationId: true
    }
  });

  if (!batch || (batch.organizationId && batch.organizationId !== organizationId)) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  const version = await getNextArtifactVersion(batchId, "batch-label-pdf", organizationId);
  const uri = await writeBatchArtifactPdf({
    batchId,
    fileName: `label-packet-v${version}.pdf`,
    bytes: buildLabelPdf({
      batchCode: batch.code,
      labels: labelPacket.labels
    })
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: "batch-label-pdf",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: "batch-label-pdf",
        uri,
        mimeType: "application/pdf",
        version,
        isCurrent: true,
        generatedFrom: labelPacket.packet.packetCode
      }
    });
  });

  return {
    batchId,
    artifact: {
      type: "batch-label-pdf",
      uri,
      isCurrent: true,
      version
    }
  };
}

export async function generateBatchTravelerPdf(batchId: string, organizationId = LOCAL_ORG_ID): Promise<{
  batchId: string;
  artifact: {
    type: "batch-traveler-pdf";
    uri: string;
    isCurrent: true;
    version: number;
  };
}> {
  const detail = await getBatchDetail(batchId, organizationId);
  const version = await getNextArtifactVersion(batchId, "batch-traveler-pdf", organizationId);
  const uri = await writeBatchArtifactPdf({
    batchId,
    fileName: `traveler-v${version}.pdf`,
    bytes: buildTravelerPdf({
      batch: {
        code: detail.batch.code,
        status: detail.batch.status,
        material: detail.batch.material,
        partCount: detail.batch.partCount,
        jobCount: detail.batch.jobCount,
        source: detail.batch.source
      },
      sheets: detail.sheets,
      parts: detail.parts
    })
  });

  await prisma.$transaction(async (tx) => {
    await tx.artifact.updateMany({
      where: {
        batchId,
        type: "batch-traveler-pdf",
        isCurrent: true
      },
      data: {
        isCurrent: false,
        supersededAt: new Date()
      }
    });

    await tx.artifact.create({
      data: {
        organizationId,
        batchId,
        type: "batch-traveler-pdf",
        uri,
        mimeType: "application/pdf",
        version,
        isCurrent: true,
        generatedFrom: detail.batch.code
      }
    });
  });

  return {
    batchId,
    artifact: {
      type: "batch-traveler-pdf",
      uri,
      isCurrent: true,
      version
    }
  };
}
