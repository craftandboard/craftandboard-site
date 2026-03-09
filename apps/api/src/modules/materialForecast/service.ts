import type {
  CreateForecastBatchRequest,
  CreateForecastBatchResponse,
  EdgeBandPattern,
  MaterialCode,
  MaterialForecastJobRow,
  MaterialForecastMaterialGroup,
  MaterialForecastPartRow,
  MaterialForecastResponse
} from "@craft-and-board/shared";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";
import { createBatchFromSelectedJobs } from "../batches/service.js";
import { areaSqFtFromSqIn, areaSqInForPart, estimatedSheetCountForArea } from "./summary.js";
import { getRemnantCandidatesForMaterial } from "./remnantCandidates.js";
import {
  FORECAST_ELIGIBLE_ORDER_STATUSES,
  FORECAST_ELIGIBLE_PART_STATUSES,
  selectEligibleForecastParts
} from "./selectors.js";
import { materialDisplayName, materialKeyFor } from "./materialKey.js";

function labelCodeFor(baseLabelCode: string, instanceNumber: number) {
  return `${baseLabelCode}-P${String(instanceNumber).padStart(2, "0")}`;
}

type GroupAccumulator = {
  materialKey: string;
  materialCode: MaterialCode;
  materialDisplayName: string;
  thicknessIn: number;
  edgeBandPattern: EdgeBandPattern;
  jobs: Map<string, MaterialForecastJobRow>;
  pendingOrderIds: Set<string>;
  totalAreaSqIn: number;
};

export async function getMaterialForecast(organizationId = LOCAL_ORG_ID): Promise<MaterialForecastResponse> {
  const parts = await selectEligibleForecastParts(organizationId);
  const groups = new Map<string, GroupAccumulator>();

  for (const part of parts) {
    if (!part.materialCode || !part.manufacturingJob || !part.order) {
      continue;
    }

    const widthIn = Number(part.widthIn.toString());
    const depthIn = Number(part.depthIn.toString());
    const thicknessIn = Number(part.thicknessIn.toString());
    const areaSqIn = areaSqInForPart({ widthIn, depthIn });
    const groupKey = materialKeyFor({
      materialCode: part.materialCode,
      thicknessIn,
      edgeBandPattern: part.edgeBandPattern as EdgeBandPattern
    });

    let group = groups.get(groupKey);
    if (!group) {
      group = {
        materialKey: groupKey,
        materialCode: part.materialCode,
        materialDisplayName: materialDisplayName(part.materialCode, thicknessIn),
        thicknessIn,
        edgeBandPattern: part.edgeBandPattern as EdgeBandPattern,
        jobs: new Map<string, MaterialForecastJobRow>(),
        pendingOrderIds: new Set<string>(),
        totalAreaSqIn: 0
      };
      groups.set(groupKey, group);
    }

    group.pendingOrderIds.add(part.order.id);
    group.totalAreaSqIn += areaSqIn;

    let job = group.jobs.get(part.manufacturingJob.id);
    if (!job) {
      job = {
        jobId: part.manufacturingJob.id,
        orderId: part.order.id,
        orderItemId: part.orderItemId ?? undefined,
        source: part.manufacturingJob.source,
        channel: part.manufacturingJob.channel,
        shipByDate: part.order.shipByDate?.toISOString(),
        customerName: part.order.customerName,
        partCount: 0,
        totalAreaSqIn: 0,
        parts: []
      };
      group.jobs.set(part.manufacturingJob.id, job);
    }

    const partRow: MaterialForecastPartRow = {
      partId: part.id,
      orderId: part.orderId ?? undefined,
      orderItemId: part.orderItemId ?? undefined,
      jobId: part.manufacturingJobId ?? undefined,
      labelCode: labelCodeFor(part.manufacturingJob.labelCode, part.instanceNumber),
      scanCode: part.scanCode,
      widthIn,
      depthIn,
      thicknessIn,
      areaSqIn,
      status: String(part.status).toLowerCase() as MaterialForecastPartRow["status"],
      edgeBandPattern: part.edgeBandPattern as EdgeBandPattern,
      source: part.manufacturingJob.source
    };

    job.parts.push(partRow);
    job.partCount += 1;
    job.totalAreaSqIn = Number((job.totalAreaSqIn + areaSqIn).toFixed(3));
  }

  const materialGroups = (
    await Promise.all(
      [...groups.values()].map(async (group): Promise<MaterialForecastMaterialGroup> => {
        const remnantCandidates = await getRemnantCandidatesForMaterial({
          organizationId,
          materialCode: group.materialCode,
          thicknessIn: group.thicknessIn,
          edgeBandPattern: group.edgeBandPattern,
          demandAreaSqIn: group.totalAreaSqIn
        });
        const jobs = [...group.jobs.values()].sort((left, right) => {
          const shipByCompare = (left.shipByDate ?? "").localeCompare(right.shipByDate ?? "");
          if (shipByCompare !== 0) {
            return shipByCompare;
          }
          return left.jobId.localeCompare(right.jobId);
        });

        return {
          materialKey: group.materialKey,
          materialCode: group.materialCode,
          materialDisplayName: group.materialDisplayName,
          thicknessIn: group.thicknessIn,
          edgeBandPattern: group.edgeBandPattern,
          pendingPartCount: jobs.reduce((sum, job) => sum + job.partCount, 0),
          pendingJobCount: jobs.length,
          pendingOrderCount: group.pendingOrderIds.size,
          totalAreaSqIn: Number(group.totalAreaSqIn.toFixed(3)),
          totalAreaSqFt: areaSqFtFromSqIn(group.totalAreaSqIn),
          estimatedFullSheetsNeeded: estimatedSheetCountForArea(group.totalAreaSqIn),
          candidateRemnantsCount: remnantCandidates.candidateRemnantsCount,
          candidateRemnantsAreaSqIn: remnantCandidates.candidateRemnantsAreaSqIn,
          recommendedCoverageAreaSqIn: remnantCandidates.recommendedCoverageAreaSqIn,
          estimatedNewSheetReduction: remnantCandidates.estimatedNewSheetReduction,
          candidateRemnantsPreview: remnantCandidates.candidateRemnantsPreview,
          jobs
        };
      })
    )
  ).sort((left, right) => {
    if (right.estimatedFullSheetsNeeded !== left.estimatedFullSheetsNeeded) {
      return right.estimatedFullSheetsNeeded - left.estimatedFullSheetsNeeded;
    }
    if (right.totalAreaSqIn !== left.totalAreaSqIn) {
      return right.totalAreaSqIn - left.totalAreaSqIn;
    }
    return left.materialKey.localeCompare(right.materialKey);
  });

  return {
    ok: true,
    summary: {
      totalPendingMaterials: materialGroups.length,
      totalPendingParts: materialGroups.reduce((sum, group) => sum + group.pendingPartCount, 0),
      estimatedTotalSheets: materialGroups.reduce((sum, group) => sum + group.estimatedFullSheetsNeeded, 0),
      materialsWithRemnantCandidates: materialGroups.filter((group) => group.candidateRemnantsCount > 0).length
    },
    materials: materialGroups
  };
}

export async function createBatchFromForecastSelection(
  input: CreateForecastBatchRequest,
  organizationId = LOCAL_ORG_ID
): Promise<CreateForecastBatchResponse> {
  const requestedJobIds = [...new Set(input.jobIds ?? [])].filter(Boolean);
  const requestedPartIds = [...new Set(input.partIds ?? [])].filter(Boolean);

  if (requestedJobIds.length === 0 && requestedPartIds.length === 0) {
    throw new Error("Select at least one forecast job or part to create a batch.");
  }

  const selectedParts = await prisma.part.findMany({
    where: {
      organizationId,
      batchId: null,
      materialCode: {
        not: null
      },
      status: {
        in: [...FORECAST_ELIGIBLE_PART_STATUSES]
      },
      manufacturingJob: {
        is: {
          status: "DRAFT",
          batchId: null
        }
      },
      order: {
        is: {
          status: {
            in: [...FORECAST_ELIGIBLE_ORDER_STATUSES]
          }
        }
      },
      OR: [
        requestedPartIds.length > 0 ? { id: { in: requestedPartIds } } : undefined,
        requestedJobIds.length > 0 ? { manufacturingJobId: { in: requestedJobIds } } : undefined
      ].filter(Boolean) as Array<Record<string, unknown>>
    },
    include: {
      order: {
        select: {
          id: true,
          status: true
        }
      },
      manufacturingJob: {
        select: {
          id: true,
          status: true,
          batchId: true,
          materialCode: true
        }
      }
    }
  });

  if (selectedParts.length === 0) {
    throw new Error("No eligible pending forecast demand was found for the requested selection.");
  }

  const selectedJobIds = [...new Set(selectedParts.map((part) => part.manufacturingJobId).filter(Boolean) as string[])];
  const selectedMaterialCodes = [...new Set(selectedParts.map((part) => part.materialCode).filter(Boolean) as MaterialCode[])];

  if (selectedMaterialCodes.length !== 1) {
    throw new Error("Forecast batch selection must contain parts from exactly one material group.");
  }

  if (input.materialCode && selectedMaterialCodes[0] !== input.materialCode) {
    throw new Error(`Forecast selection does not match material ${input.materialCode}.`);
  }

  const eligiblePartIdsByJob = new Map<string, string[]>();
  const eligiblePartsForJobs = await prisma.part.findMany({
    where: {
      organizationId,
      batchId: null,
      status: {
        in: [...FORECAST_ELIGIBLE_PART_STATUSES]
      },
      manufacturingJobId: {
        in: selectedJobIds
      }
    },
    select: {
      id: true,
      manufacturingJobId: true
    }
  });

  for (const part of eligiblePartsForJobs) {
    if (!part.manufacturingJobId) {
      continue;
    }
    const list = eligiblePartIdsByJob.get(part.manufacturingJobId) ?? [];
    list.push(part.id);
    eligiblePartIdsByJob.set(part.manufacturingJobId, list);
  }

  const selectedPartIds = new Set(selectedParts.map((part) => part.id));
  for (const [jobId, eligiblePartIds] of eligiblePartIdsByJob.entries()) {
    const missingPartIds = eligiblePartIds.filter((partId) => !selectedPartIds.has(partId));
    if (missingPartIds.length > 0) {
      throw new Error(`Forecast selection must include all pending parts for job ${jobId} before batching.`);
    }
  }

  const jobIds = [...eligiblePartIdsByJob.keys()];
  const result = await createBatchFromSelectedJobs(
    {
      organizationId,
      materialCode: selectedMaterialCodes[0],
      jobIds,
      batchName: input.batchName
    }
  );

  return {
    ok: true,
    action: "create-forecast-batch",
    batch: result.batch,
    parts: result.parts
  };
}
