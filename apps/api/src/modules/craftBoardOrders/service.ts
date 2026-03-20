import { Prisma, type CraftBoardOrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function decimal(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return new Prisma.Decimal(value.toFixed(3));
}

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function canTransitionStatus(current: CraftBoardOrderStatus, next: CraftBoardOrderStatus) {
  if (current === next) {
    return true;
  }

  const transitions: Record<CraftBoardOrderStatus, CraftBoardOrderStatus[]> = {
    RELEASED: ["PREP_IN_PROGRESS", "READY_FOR_PRODUCTION", "CANCELLED"],
    PREP_IN_PROGRESS: ["READY_FOR_PRODUCTION", "CANCELLED"],
    READY_FOR_PRODUCTION: ["IN_PRODUCTION", "CANCELLED"],
    IN_PRODUCTION: ["READY_TO_FULFILL", "CANCELLED"],
    READY_TO_FULFILL: ["FULFILLED", "CANCELLED"],
    FULFILLED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: []
  };

  return transitions[current].includes(next);
}

async function generateOrderNumber(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.craftBoardOrder.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }
  });

  return `CBO-${year}-${String(count + 1).padStart(4, "0")}`;
}

function mapOrderRow(
  row: {
    id: string;
    organizationId: string;
    inquiryId: string;
    proposalId: string;
    depositRequestId: string;
    createdAt: Date;
    updatedAt: Date;
    orderNumber: string;
    status: CraftBoardOrderStatus;
    releasedAt: Date;
    releasedBy: string | null;
    customerNameSnapshot: string;
    customerEmailSnapshot: string;
    customerPhoneSnapshot: string | null;
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
    proposalSubtotalAmountCents: number;
    proposalDiscountAmountCents: number;
    proposalShippingAmountCents: number;
    proposalTotalAmountCents: number;
    depositAmountPaidCents: number;
    remainingBalanceAmountCents: number;
    currencyCode: string;
    leadTimeText: string | null;
    scopeSummary: string | null;
    customerNotesSnapshot: string | null;
    internalReleaseNotes: string | null;
    productionPrepNotes: string | null;
    fulfillmentNotes: string | null;
    requestedShipDate: Date | null;
    targetCompletionDate: Date | null;
    readyForProductionAt: Date | null;
    productionReleasedAt: Date | null;
    closedAt: Date | null;
    orderSummaryJson: Prisma.JsonValue | null;
    commercialSnapshotJson: Prisma.JsonValue | null;
    configurationSnapshotJson: Prisma.JsonValue | null;
    inquiry?: {
      id: string;
      status: string;
    };
    proposal?: {
      id: string;
      proposalNumber: string;
      status: string;
    };
    depositRequest?: {
      id: string;
      depositNumber: string;
      status: string;
      paidAt: Date | null;
    };
    craftBoardProductionJob?: {
      id: string;
      productionJobNumber: string;
      status: string;
      stage: string;
      releasedFromOrderAt: Date;
    } | null;
  }
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    inquiryId: row.inquiryId,
    proposalId: row.proposalId,
    depositRequestId: row.depositRequestId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    orderNumber: row.orderNumber,
    status: row.status,
    releasedAt: row.releasedAt.toISOString(),
    releasedBy: row.releasedBy,
    customerNameSnapshot: row.customerNameSnapshot,
    customerEmailSnapshot: row.customerEmailSnapshot,
    customerPhoneSnapshot: row.customerPhoneSnapshot,
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
    proposalSubtotalAmountCents: row.proposalSubtotalAmountCents,
    proposalDiscountAmountCents: row.proposalDiscountAmountCents,
    proposalShippingAmountCents: row.proposalShippingAmountCents,
    proposalTotalAmountCents: row.proposalTotalAmountCents,
    depositAmountPaidCents: row.depositAmountPaidCents,
    remainingBalanceAmountCents: row.remainingBalanceAmountCents,
    currencyCode: row.currencyCode,
    leadTimeText: row.leadTimeText,
    scopeSummary: row.scopeSummary,
    customerNotesSnapshot: row.customerNotesSnapshot,
    internalReleaseNotes: row.internalReleaseNotes,
    productionPrepNotes: row.productionPrepNotes,
    fulfillmentNotes: row.fulfillmentNotes,
    requestedShipDate: row.requestedShipDate?.toISOString() ?? null,
    targetCompletionDate: row.targetCompletionDate?.toISOString() ?? null,
    readyForProductionAt: row.readyForProductionAt?.toISOString() ?? null,
    productionReleasedAt: row.productionReleasedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    orderSummaryJson: row.orderSummaryJson,
    commercialSnapshotJson: row.commercialSnapshotJson,
    configurationSnapshotJson: row.configurationSnapshotJson,
    inquiry: row.inquiry,
    proposal: row.proposal,
    depositRequest: row.depositRequest
      ? {
          id: row.depositRequest.id,
          depositNumber: row.depositRequest.depositNumber,
          status: row.depositRequest.status,
          paidAt: row.depositRequest.paidAt?.toISOString() ?? null
        }
      : undefined,
    linkedProductionJob: row.craftBoardProductionJob
      ? {
          id: row.craftBoardProductionJob.id,
          productionJobNumber: row.craftBoardProductionJob.productionJobNumber,
          status: row.craftBoardProductionJob.status,
          stage: row.craftBoardProductionJob.stage,
          releasedFromOrderAt: row.craftBoardProductionJob.releasedFromOrderAt.toISOString()
        }
      : null
  };
}

function requireEligibleProposal(input: {
  proposalStatus: string;
  depositStatus: string | null | undefined;
  hasOrder: boolean;
  overrideEligibility?: boolean;
}) {
  if (input.hasOrder) {
    throw new Error("An order already exists for this proposal.");
  }

  if (input.overrideEligibility) {
    return;
  }

  if (input.proposalStatus !== "APPROVED") {
    throw new Error("Order release requires an approved proposal.");
  }

  if (input.depositStatus !== "PAID") {
    throw new Error("Order release requires a paid deposit request.");
  }
}

export async function createCraftBoardOrderFromProposal(input: {
  organizationId: string;
  proposalId: string;
  actorName?: string | null;
  internalReleaseNotes?: string | null;
  productionPrepNotes?: string | null;
  fulfillmentNotes?: string | null;
  requestedShipDate?: string | null;
  targetCompletionDate?: string | null;
  overrideEligibility?: boolean;
}) {
  const proposal = await prisma.craftBoardProposal.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.proposalId
    },
    include: {
      inquiry: {
        select: {
          id: true,
          notes: true
        }
      },
      craftBoardDepositRequests: {
        where: {
          status: {
            in: ["PAID", "PAYMENT_INITIATED", "VIEWED", "SHARED", "READY", "DRAFT"]
          }
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        take: 1
      },
      craftBoardOrder: {
        select: {
          id: true
        }
      }
    }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  const depositRequest = proposal.craftBoardDepositRequests[0] ?? null;

  requireEligibleProposal({
    proposalStatus: proposal.status,
    depositStatus: depositRequest?.status,
    hasOrder: Boolean(proposal.craftBoardOrder),
    overrideEligibility: input.overrideEligibility
  });

  if (!depositRequest) {
    throw new Error("Order release requires a linked deposit request.");
  }

  const orderNumber = await generateOrderNumber(input.organizationId);
  const now = new Date();

  const order = await prisma.craftBoardOrder.create({
    data: {
      organizationId: input.organizationId,
      inquiryId: proposal.inquiryId,
      proposalId: proposal.id,
      depositRequestId: depositRequest.id,
      orderNumber,
      status: "RELEASED",
      releasedAt: now,
      releasedBy: input.actorName?.trim() || null,
      customerNameSnapshot: proposal.customerNameSnapshot,
      customerEmailSnapshot: proposal.customerEmailSnapshot,
      customerPhoneSnapshot: proposal.customerPhoneSnapshot,
      productFamily: proposal.productFamily,
      productName: proposal.productName,
      reviewedWidthValue: proposal.reviewedWidthValue,
      reviewedWidthUnit: "IN",
      reviewedDepthValue: proposal.reviewedDepthValue,
      reviewedDepthUnit: "IN",
      reviewedThicknessValue: proposal.reviewedThicknessValue,
      reviewedThicknessUnit: "IN",
      reviewedQuantity: proposal.reviewedQuantity,
      reviewedMaterialCode: proposal.reviewedMaterialCode,
      reviewedMaterialLabel: proposal.reviewedMaterialLabel,
      reviewedMountingCode: proposal.reviewedMountingCode,
      reviewedMountingLabel: proposal.reviewedMountingLabel,
      proposalSubtotalAmountCents: proposal.subtotalAmountCents,
      proposalDiscountAmountCents: proposal.discountAmountCents,
      proposalShippingAmountCents: proposal.shippingAmountCents,
      proposalTotalAmountCents: proposal.totalAmountCents,
      depositAmountPaidCents: depositRequest.depositAmountCents,
      remainingBalanceAmountCents: depositRequest.remainingBalanceAmountCents ?? 0,
      currencyCode: proposal.currencyCode,
      leadTimeText: proposal.leadTimeText,
      scopeSummary: proposal.scopeSummary,
      customerNotesSnapshot: proposal.inquiry.notes,
      internalReleaseNotes: input.internalReleaseNotes?.trim() || null,
      productionPrepNotes: input.productionPrepNotes?.trim() || null,
      fulfillmentNotes: input.fulfillmentNotes?.trim() || null,
      requestedShipDate: input.requestedShipDate ? new Date(input.requestedShipDate) : null,
      targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : null,
      orderSummaryJson: {
        releasedFromProposal: proposal.proposalNumber,
        releasedFromDeposit: depositRequest.depositNumber
      },
      commercialSnapshotJson: {
        proposal: {
          proposalNumber: proposal.proposalNumber,
          subtotalAmountCents: proposal.subtotalAmountCents,
          discountAmountCents: proposal.discountAmountCents,
          shippingAmountCents: proposal.shippingAmountCents,
          totalAmountCents: proposal.totalAmountCents,
          currencyCode: proposal.currencyCode
        },
        deposit: {
          depositNumber: depositRequest.depositNumber,
          depositAmountPaidCents: depositRequest.depositAmountCents,
          remainingBalanceAmountCents: depositRequest.remainingBalanceAmountCents ?? 0,
          paidAt: depositRequest.paidAt?.toISOString() ?? null
        }
      },
      configurationSnapshotJson: {
        productFamily: proposal.productFamily,
        productName: proposal.productName,
        widthIn: toNumber(proposal.reviewedWidthValue),
        depthIn: toNumber(proposal.reviewedDepthValue),
        thicknessIn: toNumber(proposal.reviewedThicknessValue),
        quantity: proposal.reviewedQuantity,
        material: {
          code: proposal.reviewedMaterialCode,
          label: proposal.reviewedMaterialLabel
        },
        mounting: {
          code: proposal.reviewedMountingCode,
          label: proposal.reviewedMountingLabel
        }
      }
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true
        }
      },
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true
        }
      },
      depositRequest: {
        select: {
          id: true,
          depositNumber: true,
          status: true,
          paidAt: true
        }
      },
      craftBoardProductionJob: {
        select: {
          id: true,
          productionJobNumber: true,
          status: true,
          stage: true,
          releasedFromOrderAt: true
        }
      }
    }
  });

  return {
    ok: true,
    order: mapOrderRow(order)
  };
}

export async function listCraftBoardOrders(input: {
  organizationId: string;
  status?: CraftBoardOrderStatus;
  query?: string;
}) {
  const query = input.query?.trim();
  const rows = await prisma.craftBoardOrder.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
      ...(query
        ? {
            OR: [
              { orderNumber: { contains: query, mode: "insensitive" } },
              { customerNameSnapshot: { contains: query, mode: "insensitive" } },
              { customerEmailSnapshot: { contains: query, mode: "insensitive" } },
              { proposal: { is: { proposalNumber: { contains: query, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true
        }
      },
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true
        }
      },
      depositRequest: {
        select: {
          id: true,
          depositNumber: true,
          status: true,
          paidAt: true
        }
      },
      craftBoardProductionJob: {
        select: {
          id: true,
          productionJobNumber: true,
          status: true,
          stage: true,
          releasedFromOrderAt: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true,
    orders: rows.map(mapOrderRow)
  };
}

export async function getCraftBoardOrderDetail(input: {
  organizationId: string;
  id: string;
}) {
  const row = await prisma.craftBoardOrder.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true
        }
      },
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true
        }
      },
      depositRequest: {
        select: {
          id: true,
          depositNumber: true,
          status: true,
          paidAt: true
        }
      },
      craftBoardProductionJob: {
        select: {
          id: true,
          productionJobNumber: true,
          status: true,
          stage: true,
          releasedFromOrderAt: true
        }
      }
    }
  });

  if (!row) {
    throw new Error("Order not found.");
  }

  return {
    ok: true,
    order: mapOrderRow(row)
  };
}

export async function updateCraftBoardOrder(input: {
  organizationId: string;
  id: string;
  status?: CraftBoardOrderStatus;
  internalReleaseNotes?: string | null;
  productionPrepNotes?: string | null;
  fulfillmentNotes?: string | null;
  requestedShipDate?: string | null;
  targetCompletionDate?: string | null;
}) {
  const existing = await prisma.craftBoardOrder.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true
        }
      },
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true
        }
      },
      depositRequest: {
        select: {
          id: true,
          depositNumber: true,
          status: true,
          paidAt: true
        }
      },
      craftBoardProductionJob: {
        select: {
          id: true,
          productionJobNumber: true,
          status: true,
          stage: true,
          releasedFromOrderAt: true
        }
      }
    }
  });

  if (!existing) {
    throw new Error("Order not found.");
  }

  const nextStatus = input.status ?? existing.status;
  if (!canTransitionStatus(existing.status, nextStatus)) {
    throw new Error(`Cannot move order from ${existing.status} to ${nextStatus}.`);
  }

  const now = new Date();
  const row = await prisma.craftBoardOrder.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      internalReleaseNotes:
        input.internalReleaseNotes !== undefined
          ? input.internalReleaseNotes?.trim() || null
          : existing.internalReleaseNotes,
      productionPrepNotes:
        input.productionPrepNotes !== undefined
          ? input.productionPrepNotes?.trim() || null
          : existing.productionPrepNotes,
      fulfillmentNotes:
        input.fulfillmentNotes !== undefined
          ? input.fulfillmentNotes?.trim() || null
          : existing.fulfillmentNotes,
      requestedShipDate:
        input.requestedShipDate !== undefined
          ? input.requestedShipDate
            ? new Date(input.requestedShipDate)
            : null
          : existing.requestedShipDate,
      targetCompletionDate:
        input.targetCompletionDate !== undefined
          ? input.targetCompletionDate
            ? new Date(input.targetCompletionDate)
            : null
          : existing.targetCompletionDate,
      readyForProductionAt:
        nextStatus === "READY_FOR_PRODUCTION"
          ? existing.readyForProductionAt ?? now
          : existing.readyForProductionAt,
      productionReleasedAt:
        nextStatus === "IN_PRODUCTION"
          ? existing.productionReleasedAt ?? now
          : existing.productionReleasedAt,
      closedAt:
        nextStatus === "CLOSED"
          ? existing.closedAt ?? now
          : existing.closedAt
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true
        }
      },
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true
        }
      },
      depositRequest: {
        select: {
          id: true,
          depositNumber: true,
          status: true,
          paidAt: true
        }
      },
      craftBoardProductionJob: {
        select: {
          id: true,
          productionJobNumber: true,
          status: true,
          stage: true,
          releasedFromOrderAt: true
        }
      }
    }
  });

  return {
    ok: true,
    order: mapOrderRow(row)
  };
}
