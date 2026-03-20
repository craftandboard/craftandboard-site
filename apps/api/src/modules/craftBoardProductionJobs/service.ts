import {
  Prisma,
  type CraftBoardProductionJobStage,
  type CraftBoardProductionJobStatus
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function canTransitionStatus(
  current: CraftBoardProductionJobStatus,
  next: CraftBoardProductionJobStatus
) {
  if (current === next) {
    return true;
  }

  const transitions: Record<CraftBoardProductionJobStatus, CraftBoardProductionJobStatus[]> = {
    RELEASED: ["PREP_IN_PROGRESS", "READY_FOR_BUILD", "CANCELLED"],
    PREP_IN_PROGRESS: ["READY_FOR_BUILD", "CANCELLED"],
    READY_FOR_BUILD: ["IN_BUILD", "CANCELLED"],
    IN_BUILD: ["BUILD_COMPLETE", "CANCELLED"],
    BUILD_COMPLETE: ["READY_FOR_FULFILLMENT", "CANCELLED"],
    READY_FOR_FULFILLMENT: ["FULFILLED", "CANCELLED"],
    FULFILLED: [],
    CANCELLED: []
  };

  return transitions[current].includes(next);
}

function statusToStage(status: CraftBoardProductionJobStatus): CraftBoardProductionJobStage {
  switch (status) {
    case "RELEASED":
    case "PREP_IN_PROGRESS":
      return "PREP";
    case "READY_FOR_BUILD":
      return "READY_TO_BUILD";
    case "IN_BUILD":
      return "IN_BUILD";
    case "BUILD_COMPLETE":
      return "BUILD_COMPLETE";
    case "READY_FOR_FULFILLMENT":
      return "READY_TO_FULFILL";
    case "FULFILLED":
      return "FULFILLED";
    case "CANCELLED":
      return "CANCELLED";
  }
}

function stageToStatus(stage: CraftBoardProductionJobStage): CraftBoardProductionJobStatus {
  switch (stage) {
    case "PREP":
      return "PREP_IN_PROGRESS";
    case "READY_TO_BUILD":
      return "READY_FOR_BUILD";
    case "IN_BUILD":
      return "IN_BUILD";
    case "BUILD_COMPLETE":
      return "BUILD_COMPLETE";
    case "READY_TO_FULFILL":
      return "READY_FOR_FULFILLMENT";
    case "FULFILLED":
      return "FULFILLED";
    case "CANCELLED":
      return "CANCELLED";
  }
}

async function generateProductionJobNumber(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.craftBoardProductionJob.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }
  });

  return `CBJ-${year}-${String(count + 1).padStart(4, "0")}`;
}

function mapProductionJobRow(
  row: {
    id: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    productionJobNumber: string;
    productionJobCode: string;
    productionJobScanCode: string;
    status: CraftBoardProductionJobStatus;
    stage: CraftBoardProductionJobStage;
    boardSortOrder: number | null;
    orderId: string;
    inquiryId: string;
    proposalId: string;
    depositRequestId: string;
    releasedFromOrderAt: Date;
    createdBy: string | null;
    startedAt: Date | null;
    readyForBuildAt: Date | null;
    buildStartedAt: Date | null;
    buildCompletedAt: Date | null;
    readyForFulfillmentAt: Date | null;
    fulfilledAt: Date | null;
    cancelledAt: Date | null;
    customerNameSnapshot: string;
    productFamily: string;
    productName: string;
    reviewedWidthValue: Prisma.Decimal | null;
    reviewedWidthUnit: string;
    reviewedDepthValue: Prisma.Decimal | null;
    reviewedDepthUnit: string;
    reviewedThicknessValue: Prisma.Decimal | null;
    reviewedThicknessUnit: string;
    reviewedQuantity: number;
    reviewedMaterialCode: string | null;
    reviewedMaterialLabel: string | null;
    reviewedMountingCode: string | null;
    reviewedMountingLabel: string | null;
    leadTimeText: string | null;
    targetCompletionDate: Date | null;
    requestedShipDate: Date | null;
    productionPrepNotes: string | null;
    shopNotes: string | null;
    fulfillmentNotes: string | null;
    cutPrepNotes: string | null;
    materialPrepNotes: string | null;
    packagingPrepNotes: string | null;
    labelPayloadJson: Prisma.JsonValue | null;
    checklistDimensionsConfirmed: boolean;
    checklistMaterialConfirmed: boolean;
    checklistMountingConfirmed: boolean;
    checklistDepositVerified: boolean;
    checklistScopeConfirmed: boolean;
    checklistReadyForBuild: boolean;
    lastStageChangedAt: Date | null;
    lastStageChangedBy: string | null;
    barcodeLabelPrintedAt: Date | null;
    archivedFromBoardAt: Date | null;
    internalSummaryJson: Prisma.JsonValue | null;
    configurationSnapshotJson: Prisma.JsonValue | null;
    commercialReferenceJson: Prisma.JsonValue | null;
    order?: { id: string; orderNumber: string; status: string } | null;
    inquiry?: { id: string; status: string } | null;
    proposal?: { id: string; proposalNumber: string; status: string } | null;
    depositRequest?: { id: string; depositNumber: string; status: string; paidAt: Date | null } | null;
  }
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    productionJobNumber: row.productionJobNumber,
    productionJobCode: row.productionJobCode,
    productionJobScanCode: row.productionJobScanCode,
    status: row.status,
    stage: row.stage,
    boardSortOrder: row.boardSortOrder,
    orderId: row.orderId,
    inquiryId: row.inquiryId,
    proposalId: row.proposalId,
    depositRequestId: row.depositRequestId,
    releasedFromOrderAt: row.releasedFromOrderAt.toISOString(),
    createdBy: row.createdBy,
    startedAt: row.startedAt?.toISOString() ?? null,
    readyForBuildAt: row.readyForBuildAt?.toISOString() ?? null,
    buildStartedAt: row.buildStartedAt?.toISOString() ?? null,
    buildCompletedAt: row.buildCompletedAt?.toISOString() ?? null,
    readyForFulfillmentAt: row.readyForFulfillmentAt?.toISOString() ?? null,
    fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    customerNameSnapshot: row.customerNameSnapshot,
    productFamily: row.productFamily,
    productName: row.productName,
    reviewedWidthValue: toNumber(row.reviewedWidthValue),
    reviewedWidthUnit: row.reviewedWidthUnit,
    reviewedDepthValue: toNumber(row.reviewedDepthValue),
    reviewedDepthUnit: row.reviewedDepthUnit,
    reviewedThicknessValue: toNumber(row.reviewedThicknessValue),
    reviewedThicknessUnit: row.reviewedThicknessUnit,
    reviewedQuantity: row.reviewedQuantity,
    reviewedMaterialCode: row.reviewedMaterialCode,
    reviewedMaterialLabel: row.reviewedMaterialLabel,
    reviewedMountingCode: row.reviewedMountingCode,
    reviewedMountingLabel: row.reviewedMountingLabel,
    leadTimeText: row.leadTimeText,
    targetCompletionDate: row.targetCompletionDate?.toISOString() ?? null,
    requestedShipDate: row.requestedShipDate?.toISOString() ?? null,
    productionPrepNotes: row.productionPrepNotes,
    shopNotes: row.shopNotes,
    fulfillmentNotes: row.fulfillmentNotes,
    cutPrepNotes: row.cutPrepNotes,
    materialPrepNotes: row.materialPrepNotes,
    packagingPrepNotes: row.packagingPrepNotes,
    labelPayloadJson: row.labelPayloadJson,
    checklistDimensionsConfirmed: row.checklistDimensionsConfirmed,
    checklistMaterialConfirmed: row.checklistMaterialConfirmed,
    checklistMountingConfirmed: row.checklistMountingConfirmed,
    checklistDepositVerified: row.checklistDepositVerified,
    checklistScopeConfirmed: row.checklistScopeConfirmed,
    checklistReadyForBuild: row.checklistReadyForBuild,
    lastStageChangedAt: row.lastStageChangedAt?.toISOString() ?? null,
    lastStageChangedBy: row.lastStageChangedBy,
    barcodeLabelPrintedAt: row.barcodeLabelPrintedAt?.toISOString() ?? null,
    archivedFromBoardAt: row.archivedFromBoardAt?.toISOString() ?? null,
    internalSummaryJson: row.internalSummaryJson,
    configurationSnapshotJson: row.configurationSnapshotJson,
    commercialReferenceJson: row.commercialReferenceJson,
    order: row.order,
    inquiry: row.inquiry,
    proposal: row.proposal,
    depositRequest: row.depositRequest
      ? {
          ...row.depositRequest,
          paidAt: row.depositRequest.paidAt?.toISOString() ?? null
        }
      : undefined
  };
}

function ensureOrderEligible(input: {
  orderStatus: string;
  hasProductionJob: boolean;
}) {
  if (input.hasProductionJob) {
    throw new Error("A production job already exists for this order.");
  }

  if (!["RELEASED", "PREP_IN_PROGRESS", "READY_FOR_PRODUCTION", "IN_PRODUCTION", "READY_TO_FULFILL", "FULFILLED"].includes(input.orderStatus)) {
    throw new Error("Production release requires an eligible released order.");
  }
}

export async function createCraftBoardProductionJobFromOrder(input: {
  organizationId: string;
  orderId: string;
  actorName?: string | null;
  productionPrepNotes?: string | null;
  shopNotes?: string | null;
  fulfillmentNotes?: string | null;
  cutPrepNotes?: string | null;
  materialPrepNotes?: string | null;
  packagingPrepNotes?: string | null;
  targetCompletionDate?: string | null;
  requestedShipDate?: string | null;
}) {
  const order = await prisma.craftBoardOrder.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.orderId
    },
    include: {
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } },
      craftBoardProductionJob: { select: { id: true } }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  ensureOrderEligible({
    orderStatus: order.status,
    hasProductionJob: Boolean(order.craftBoardProductionJob)
  });

  const productionJobNumber = await generateProductionJobNumber(input.organizationId);
  const productionJobCode = productionJobNumber;
  const productionJobScanCode = `CBJOB:${productionJobNumber}`;
  const initialStage = "PREP" satisfies CraftBoardProductionJobStage;

  const row = await prisma.craftBoardProductionJob.create({
    data: {
      organizationId: input.organizationId,
      productionJobNumber,
      productionJobCode,
      productionJobScanCode,
      status: "RELEASED",
      stage: initialStage,
      orderId: order.id,
      inquiryId: order.inquiryId,
      proposalId: order.proposalId,
      depositRequestId: order.depositRequestId,
      releasedFromOrderAt: order.releasedAt,
      createdBy: input.actorName?.trim() || null,
      customerNameSnapshot: order.customerNameSnapshot,
      productFamily: order.productFamily,
      productName: order.productName,
      reviewedWidthValue: order.reviewedWidthValue,
      reviewedWidthUnit: order.reviewedWidthUnit,
      reviewedDepthValue: order.reviewedDepthValue,
      reviewedDepthUnit: order.reviewedDepthUnit,
      reviewedThicknessValue: order.reviewedThicknessValue,
      reviewedThicknessUnit: order.reviewedThicknessUnit,
      reviewedQuantity: order.reviewedQuantity,
      reviewedMaterialCode: order.reviewedMaterialCode,
      reviewedMaterialLabel: order.reviewedMaterialLabel,
      reviewedMountingCode: order.reviewedMountingCode,
      reviewedMountingLabel: order.reviewedMountingLabel,
      leadTimeText: order.leadTimeText,
      targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : order.targetCompletionDate,
      requestedShipDate: input.requestedShipDate ? new Date(input.requestedShipDate) : order.requestedShipDate,
      productionPrepNotes: input.productionPrepNotes?.trim() || order.productionPrepNotes || null,
      shopNotes: input.shopNotes?.trim() || null,
      fulfillmentNotes: input.fulfillmentNotes?.trim() || order.fulfillmentNotes || null,
      cutPrepNotes: input.cutPrepNotes?.trim() || null,
      materialPrepNotes: input.materialPrepNotes?.trim() || null,
      packagingPrepNotes: input.packagingPrepNotes?.trim() || null,
      checklistDepositVerified: true,
      labelPayloadJson: {
        productionJobNumber,
        productionJobCode,
        productionJobScanCode,
        customerName: order.customerNameSnapshot,
        productName: order.productName,
        productFamily: order.productFamily,
        dimensions: {
          width: toNumber(order.reviewedWidthValue),
          widthUnit: order.reviewedWidthUnit,
          depth: toNumber(order.reviewedDepthValue),
          depthUnit: order.reviewedDepthUnit,
          thickness: toNumber(order.reviewedThicknessValue),
          thicknessUnit: order.reviewedThicknessUnit
        },
        quantity: order.reviewedQuantity,
        materialLabel: order.reviewedMaterialLabel,
        mountingLabel: order.reviewedMountingLabel,
        stage: initialStage
      },
      lastStageChangedAt: new Date(),
      lastStageChangedBy: input.actorName?.trim() || null,
      internalSummaryJson: {
        releasedFromOrderNumber: order.orderNumber,
        releasedOrderStatus: order.status
      },
      configurationSnapshotJson: {
        productFamily: order.productFamily,
        productName: order.productName,
        width: toNumber(order.reviewedWidthValue),
        depth: toNumber(order.reviewedDepthValue),
        thickness: toNumber(order.reviewedThicknessValue),
        quantity: order.reviewedQuantity,
        material: {
          code: order.reviewedMaterialCode,
          label: order.reviewedMaterialLabel
        },
        mounting: {
          code: order.reviewedMountingCode,
          label: order.reviewedMountingLabel
        }
      },
      commercialReferenceJson: {
        orderNumber: order.orderNumber,
        proposalNumber: order.proposal?.proposalNumber ?? null,
        depositNumber: order.depositRequest?.depositNumber ?? null,
        proposalTotalAmountCents: order.proposalTotalAmountCents,
        depositAmountPaidCents: order.depositAmountPaidCents,
        remainingBalanceAmountCents: order.remainingBalanceAmountCents,
        currencyCode: order.currencyCode
      }
    },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } }
    }
  });

  return {
    ok: true,
    productionJob: mapProductionJobRow(row)
  };
}

export async function listCraftBoardProductionJobs(input: {
  organizationId: string;
  status?: CraftBoardProductionJobStatus;
  stage?: CraftBoardProductionJobStage;
  includeFulfilled?: boolean;
  includeCancelled?: boolean;
  query?: string;
}) {
  const query = input.query?.trim();
  const excludedStages: CraftBoardProductionJobStage[] = [];
  if (!input.includeFulfilled) {
    excludedStages.push("FULFILLED");
  }
  if (!input.includeCancelled) {
    excludedStages.push("CANCELLED");
  }
  const where: Prisma.CraftBoardProductionJobWhereInput = {
    organizationId: input.organizationId,
    status: input.status,
    stage: input.stage,
    ...(excludedStages.length > 0 ? { NOT: excludedStages.map((stage) => ({ stage })) } : {}),
    ...(query
      ? {
          OR: [
            { productionJobNumber: { contains: query, mode: "insensitive" } },
            { productionJobCode: { contains: query, mode: "insensitive" } },
            { customerNameSnapshot: { contains: query, mode: "insensitive" } },
            { reviewedMaterialLabel: { contains: query, mode: "insensitive" } },
            { order: { is: { orderNumber: { contains: query, mode: "insensitive" } } } },
            { order: { is: { customerEmailSnapshot: { contains: query, mode: "insensitive" } } } }
          ]
        }
      : {})
  };

  const rows = await prisma.craftBoardProductionJob.findMany({
    where,
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true,
    productionJobs: rows.map(mapProductionJobRow)
  };
}

export async function getCraftBoardProductionJobDetail(input: {
  organizationId: string;
  id: string;
}) {
  const row = await prisma.craftBoardProductionJob.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } }
    }
  });

  if (!row) {
    throw new Error("Production job not found.");
  }

  return { ok: true, productionJob: mapProductionJobRow(row) };
}

export async function updateCraftBoardProductionJob(input: {
  organizationId: string;
  id: string;
  status?: CraftBoardProductionJobStatus;
  stage?: CraftBoardProductionJobStage;
  targetCompletionDate?: string | null;
  requestedShipDate?: string | null;
  productionPrepNotes?: string | null;
  shopNotes?: string | null;
  fulfillmentNotes?: string | null;
  cutPrepNotes?: string | null;
  materialPrepNotes?: string | null;
  packagingPrepNotes?: string | null;
  checklistDimensionsConfirmed?: boolean;
  checklistMaterialConfirmed?: boolean;
  checklistMountingConfirmed?: boolean;
  checklistDepositVerified?: boolean;
  checklistScopeConfirmed?: boolean;
  checklistReadyForBuild?: boolean;
}) {
  const existing = await prisma.craftBoardProductionJob.findFirst({
    where: { organizationId: input.organizationId, id: input.id },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } }
    }
  });

  if (!existing) {
    throw new Error("Production job not found.");
  }

  const nextStatus = input.status ?? existing.status;
  const statusFromStage = input.stage ? stageToStatus(input.stage) : null;
  const effectiveStatus = statusFromStage ?? nextStatus;

  if (!canTransitionStatus(existing.status, effectiveStatus)) {
    throw new Error(`Cannot move production job from ${existing.status} to ${nextStatus}.`);
  }

  const effectiveStage = input.stage ?? statusToStage(effectiveStatus);

  const now = new Date();
  const row = await prisma.craftBoardProductionJob.update({
    where: { id: existing.id },
    data: {
      status: effectiveStatus,
      stage: effectiveStage,
      targetCompletionDate:
        input.targetCompletionDate !== undefined
          ? input.targetCompletionDate
            ? new Date(input.targetCompletionDate)
            : null
          : existing.targetCompletionDate,
      requestedShipDate:
        input.requestedShipDate !== undefined
          ? input.requestedShipDate
            ? new Date(input.requestedShipDate)
            : null
          : existing.requestedShipDate,
      productionPrepNotes:
        input.productionPrepNotes !== undefined ? input.productionPrepNotes?.trim() || null : existing.productionPrepNotes,
      shopNotes: input.shopNotes !== undefined ? input.shopNotes?.trim() || null : existing.shopNotes,
      fulfillmentNotes:
        input.fulfillmentNotes !== undefined ? input.fulfillmentNotes?.trim() || null : existing.fulfillmentNotes,
      cutPrepNotes:
        input.cutPrepNotes !== undefined ? input.cutPrepNotes?.trim() || null : existing.cutPrepNotes,
      materialPrepNotes:
        input.materialPrepNotes !== undefined ? input.materialPrepNotes?.trim() || null : existing.materialPrepNotes,
      packagingPrepNotes:
        input.packagingPrepNotes !== undefined ? input.packagingPrepNotes?.trim() || null : existing.packagingPrepNotes,
      checklistDimensionsConfirmed:
        input.checklistDimensionsConfirmed ?? existing.checklistDimensionsConfirmed,
      checklistMaterialConfirmed:
        input.checklistMaterialConfirmed ?? existing.checklistMaterialConfirmed,
      checklistMountingConfirmed:
        input.checklistMountingConfirmed ?? existing.checklistMountingConfirmed,
      checklistDepositVerified:
        input.checklistDepositVerified ?? existing.checklistDepositVerified,
      checklistScopeConfirmed:
        input.checklistScopeConfirmed ?? existing.checklistScopeConfirmed,
      checklistReadyForBuild:
        input.checklistReadyForBuild ?? existing.checklistReadyForBuild,
      labelPayloadJson: {
        productionJobNumber: existing.productionJobNumber,
        productionJobCode: existing.productionJobCode,
        productionJobScanCode: existing.productionJobScanCode,
        customerName: existing.customerNameSnapshot,
        productName: existing.productName,
        productFamily: existing.productFamily,
        dimensions: {
          width: toNumber(existing.reviewedWidthValue),
          widthUnit: existing.reviewedWidthUnit,
          depth: toNumber(existing.reviewedDepthValue),
          depthUnit: existing.reviewedDepthUnit,
          thickness: toNumber(existing.reviewedThicknessValue),
          thicknessUnit: existing.reviewedThicknessUnit
        },
        quantity: existing.reviewedQuantity,
        materialLabel: existing.reviewedMaterialLabel,
        mountingLabel: existing.reviewedMountingLabel,
        stage: effectiveStage
      },
      lastStageChangedAt:
        existing.stage !== effectiveStage ? now : existing.lastStageChangedAt,
      lastStageChangedBy:
        existing.stage !== effectiveStage ? "SYSTEM" : existing.lastStageChangedBy,
      archivedFromBoardAt:
        effectiveStage === "CANCELLED" ? existing.archivedFromBoardAt ?? now : effectiveStage === "FULFILLED" ? existing.archivedFromBoardAt : null,
      readyForBuildAt:
        effectiveStatus === "READY_FOR_BUILD" ? existing.readyForBuildAt ?? now : existing.readyForBuildAt,
      startedAt: effectiveStatus === "IN_BUILD" ? existing.startedAt ?? now : existing.startedAt,
      buildStartedAt:
        effectiveStatus === "IN_BUILD" ? existing.buildStartedAt ?? now : existing.buildStartedAt,
      buildCompletedAt:
        effectiveStatus === "BUILD_COMPLETE" ? existing.buildCompletedAt ?? now : existing.buildCompletedAt,
      readyForFulfillmentAt:
        effectiveStatus === "READY_FOR_FULFILLMENT"
          ? existing.readyForFulfillmentAt ?? now
          : existing.readyForFulfillmentAt,
      fulfilledAt: effectiveStatus === "FULFILLED" ? existing.fulfilledAt ?? now : existing.fulfilledAt,
      cancelledAt: effectiveStatus === "CANCELLED" ? existing.cancelledAt ?? now : existing.cancelledAt
    },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      inquiry: { select: { id: true, status: true } },
      proposal: { select: { id: true, proposalNumber: true, status: true } },
      depositRequest: { select: { id: true, depositNumber: true, status: true, paidAt: true } }
    }
  });

  return { ok: true, productionJob: mapProductionJobRow(row) };
}

export async function getCraftBoardProductionBoard(input: {
  organizationId: string;
  query?: string;
  includeFulfilled?: boolean;
  includeCancelled?: boolean;
}) {
  return listCraftBoardProductionJobs({
    organizationId: input.organizationId,
    query: input.query,
    includeFulfilled: input.includeFulfilled,
    includeCancelled: input.includeCancelled
  });
}
