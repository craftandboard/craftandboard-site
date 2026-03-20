import { randomBytes } from "node:crypto";
import { Prisma, type CraftBoardProposalStatus } from "@prisma/client";
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

function lineQuantityToNumber(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}

function canTransitionStatus(current: CraftBoardProposalStatus, next: CraftBoardProposalStatus) {
  if (current === next) {
    return true;
  }

  const transitions: Record<CraftBoardProposalStatus, CraftBoardProposalStatus[]> = {
    DRAFT: ["READY", "SHARED", "ARCHIVED"],
    READY: ["DRAFT", "SHARED", "ARCHIVED"],
    SHARED: ["READY", "VIEWED", "APPROVED", "DECLINED", "EXPIRED", "ARCHIVED"],
    VIEWED: ["SHARED", "APPROVED", "DECLINED", "EXPIRED", "ARCHIVED"],
    APPROVED: ["ARCHIVED"],
    DECLINED: ["ARCHIVED"],
    EXPIRED: ["ARCHIVED"],
    ARCHIVED: []
  };

  return transitions[current].includes(next);
}

function ensureNonNegative(value: number, label: string) {
  if (value < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
}

function normalizeLineItems(
  lineItems: Array<{
    id?: string;
    sortOrder?: number;
    label: string;
    description?: string | null;
    quantity: number;
    unitLabel?: string | null;
    unitAmountCents: number;
    itemType?: string | null;
  }>
) {
  return lineItems.map((item, index) => {
    ensureNonNegative(item.unitAmountCents, "Line item unit amount");
    if (item.quantity <= 0) {
      throw new Error("Line item quantity must be greater than zero.");
    }

    const quantity = Number(item.quantity.toFixed(2));
    const lineTotalAmountCents = Math.round(quantity * item.unitAmountCents);

    return {
      id: item.id,
      sortOrder: item.sortOrder ?? index,
      label: item.label.trim(),
      description: item.description?.trim() || null,
      quantity,
      unitLabel: item.unitLabel?.trim() || null,
      unitAmountCents: item.unitAmountCents,
      lineTotalAmountCents,
      itemType: item.itemType?.trim() || null
    };
  });
}

function computeTotals(input: {
  lineItems: ReturnType<typeof normalizeLineItems>;
  shippingAmountCents: number;
  discountAmountCents: number;
}) {
  ensureNonNegative(input.shippingAmountCents, "Shipping amount");
  ensureNonNegative(input.discountAmountCents, "Discount amount");

  const subtotalAmountCents = input.lineItems.reduce(
    (sum, item) => sum + item.lineTotalAmountCents,
    0
  );
  const totalAmountCents = Math.max(
    subtotalAmountCents + input.shippingAmountCents - input.discountAmountCents,
    0
  );

  return {
    subtotalAmountCents,
    totalAmountCents
  };
}

function ensureProposalReady(input: {
  title: string;
  scopeSummary: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  lineItems: ReturnType<typeof normalizeLineItems>;
  totalAmountCents: number;
}) {
  if (!input.title.trim()) {
    throw new Error("Proposal title is required before marking ready or shared.");
  }
  if (!input.scopeSummary.trim()) {
    throw new Error("Scope summary is required before marking ready or shared.");
  }
  if (!input.customerNameSnapshot.trim() || !input.customerEmailSnapshot.trim()) {
    throw new Error("Customer snapshot is required before marking ready or shared.");
  }
  if (input.lineItems.length === 0) {
    throw new Error("At least one line item is required before marking ready or shared.");
  }
  if (input.totalAmountCents < 0) {
    throw new Error("Proposal total cannot be negative.");
  }
}

async function generateProposalNumber(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.craftBoardProposal.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }
  });

  return `CBP-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function generatePublicToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = randomBytes(18).toString("base64url");
    const existing = await prisma.craftBoardProposal.findUnique({
      where: { publicToken: token },
      select: { id: true }
    });
    if (!existing) {
      return token;
    }
  }

  throw new Error("Unable to generate a unique public proposal token.");
}

function buildScopeSummary(input: {
  productName: string;
  reviewedWidthValue: number | null;
  reviewedDepthValue: number | null;
  reviewedThicknessValue: number | null;
  reviewedMaterialLabel: string | null;
  reviewedMountingLabel: string | null;
}) {
  return [
    `${input.productName} built to the reviewed configuration below.`,
    input.reviewedWidthValue ? `Width ${input.reviewedWidthValue}"` : null,
    input.reviewedDepthValue ? `Depth ${input.reviewedDepthValue}"` : null,
    input.reviewedThicknessValue ? `Thickness ${input.reviewedThicknessValue}"` : null,
    input.reviewedMaterialLabel ? `Finish ${input.reviewedMaterialLabel}` : null,
    input.reviewedMountingLabel ? `Mounting ${input.reviewedMountingLabel}` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function mapProposalLineItem(row: {
  id: string;
  sortOrder: number;
  label: string;
  description: string | null;
  quantity: Prisma.Decimal;
  unitLabel: string | null;
  unitAmountCents: number;
  lineTotalAmountCents: number;
  itemType: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    label: row.label,
    description: row.description,
    quantity: lineQuantityToNumber(row.quantity),
    unitLabel: row.unitLabel,
    unitAmountCents: row.unitAmountCents,
    lineTotalAmountCents: row.lineTotalAmountCents,
    itemType: row.itemType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapProposalRow(
  row: {
    id: string;
    organizationId: string;
    inquiryId: string;
    createdAt: Date;
    updatedAt: Date;
    status: CraftBoardProposalStatus;
    proposalNumber: string;
    title: string;
    customerNameSnapshot: string;
    customerEmailSnapshot: string;
    customerPhoneSnapshot: string | null;
    productFamily: string;
    productName: string;
    reviewedWidthValue: Prisma.Decimal | null;
    reviewedDepthValue: Prisma.Decimal | null;
    reviewedThicknessValue: Prisma.Decimal | null;
    reviewedQuantity: number;
    reviewedMaterialCode: string | null;
    reviewedMaterialLabel: string | null;
    reviewedMountingCode: string | null;
    reviewedMountingLabel: string | null;
    subtotalAmountCents: number;
    discountAmountCents: number;
    shippingAmountCents: number;
    totalAmountCents: number;
    currencyCode: string;
    leadTimeText: string | null;
    scopeSummary: string;
    inclusionsText: string | null;
    exclusionsText: string | null;
    notesForCustomer: string | null;
    internalNotes: string | null;
    publicToken: string;
    sharedAt: Date | null;
    customerViewedAt: Date | null;
    customerApprovedAt: Date | null;
    customerDeclinedAt: Date | null;
    expirationDate: Date | null;
    preparedBy: string | null;
    referenceCode: string | null;
    lineItems?: Array<{
      id: string;
      sortOrder: number;
      label: string;
      description: string | null;
      quantity: Prisma.Decimal;
      unitLabel: string | null;
      unitAmountCents: number;
      lineTotalAmountCents: number;
      itemType: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    inquiry?: {
      id: string;
      status: string;
      customerName: string;
      customerEmail: string;
      productFamily: string;
      productName: string;
    };
    craftBoardDepositRequests?: Array<{
      id: string;
      depositNumber: string;
      status: string;
      depositAmountCents: number;
      paidAt: Date | null;
      sharedAt: Date | null;
    }>;
    craftBoardOrder?: {
      id: string;
      orderNumber: string;
      status: string;
      releasedAt: Date;
    } | null;
  },
  options?: { includePublicToken?: boolean }
) {
  const latestDepositRequest = row.craftBoardDepositRequests?.[0] ?? null;
  const linkedOrder = row.craftBoardOrder ?? null;

  return {
    id: row.id,
    organizationId: row.organizationId,
    inquiryId: row.inquiryId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    proposalNumber: row.proposalNumber,
    title: row.title,
    customerNameSnapshot: row.customerNameSnapshot,
    customerEmailSnapshot: row.customerEmailSnapshot,
    customerPhoneSnapshot: row.customerPhoneSnapshot,
    productFamily: row.productFamily,
    productName: row.productName,
    reviewedWidthValue: toNumber(row.reviewedWidthValue),
    reviewedDepthValue: toNumber(row.reviewedDepthValue),
    reviewedThicknessValue: toNumber(row.reviewedThicknessValue),
    reviewedQuantity: row.reviewedQuantity,
    reviewedMaterialCode: row.reviewedMaterialCode,
    reviewedMaterialLabel: row.reviewedMaterialLabel,
    reviewedMountingCode: row.reviewedMountingCode,
    reviewedMountingLabel: row.reviewedMountingLabel,
    subtotalAmountCents: row.subtotalAmountCents,
    discountAmountCents: row.discountAmountCents,
    shippingAmountCents: row.shippingAmountCents,
    totalAmountCents: row.totalAmountCents,
    currencyCode: row.currencyCode,
    leadTimeText: row.leadTimeText,
    scopeSummary: row.scopeSummary,
    inclusionsText: row.inclusionsText,
    exclusionsText: row.exclusionsText,
    notesForCustomer: row.notesForCustomer,
    internalNotes: row.internalNotes,
    publicToken: options?.includePublicToken ? row.publicToken : undefined,
    sharedAt: row.sharedAt?.toISOString() ?? null,
    customerViewedAt: row.customerViewedAt?.toISOString() ?? null,
    customerApprovedAt: row.customerApprovedAt?.toISOString() ?? null,
    customerDeclinedAt: row.customerDeclinedAt?.toISOString() ?? null,
    expirationDate: row.expirationDate?.toISOString() ?? null,
    preparedBy: row.preparedBy,
    referenceCode: row.referenceCode,
    lineItems: row.lineItems?.map(mapProposalLineItem) ?? [],
    inquiry: row.inquiry
      ? {
          id: row.inquiry.id,
          status: row.inquiry.status,
          customerName: row.inquiry.customerName,
          customerEmail: row.inquiry.customerEmail,
          productFamily: row.inquiry.productFamily,
          productName: row.inquiry.productName
        }
      : undefined,
    latestDepositRequest: latestDepositRequest
      ? {
          id: latestDepositRequest.id,
          depositNumber: latestDepositRequest.depositNumber,
          status: latestDepositRequest.status,
          depositAmountCents: latestDepositRequest.depositAmountCents,
          paidAt: latestDepositRequest.paidAt?.toISOString() ?? null,
          sharedAt: latestDepositRequest.sharedAt?.toISOString() ?? null
        }
      : null,
    linkedOrder: linkedOrder
      ? {
          id: linkedOrder.id,
          orderNumber: linkedOrder.orderNumber,
          status: linkedOrder.status,
          releasedAt: linkedOrder.releasedAt.toISOString()
        }
      : null,
    hasCustomerResponse: Boolean(row.customerApprovedAt || row.customerDeclinedAt)
  };
}

function customerVisibleProposal(row: Parameters<typeof mapProposalRow>[0]) {
  const mapped = mapProposalRow(row, { includePublicToken: false });
  return {
    id: mapped.id,
    status: mapped.status,
    proposalNumber: mapped.proposalNumber,
    title: mapped.title,
    customerNameSnapshot: mapped.customerNameSnapshot,
    customerEmailSnapshot: mapped.customerEmailSnapshot,
    customerPhoneSnapshot: mapped.customerPhoneSnapshot,
    productFamily: mapped.productFamily,
    productName: mapped.productName,
    reviewedWidthValue: mapped.reviewedWidthValue,
    reviewedDepthValue: mapped.reviewedDepthValue,
    reviewedThicknessValue: mapped.reviewedThicknessValue,
    reviewedQuantity: mapped.reviewedQuantity,
    reviewedMaterialLabel: mapped.reviewedMaterialLabel,
    reviewedMountingLabel: mapped.reviewedMountingLabel,
    subtotalAmountCents: mapped.subtotalAmountCents,
    discountAmountCents: mapped.discountAmountCents,
    shippingAmountCents: mapped.shippingAmountCents,
    totalAmountCents: mapped.totalAmountCents,
    currencyCode: mapped.currencyCode,
    leadTimeText: mapped.leadTimeText,
    scopeSummary: mapped.scopeSummary,
    inclusionsText: mapped.inclusionsText,
    exclusionsText: mapped.exclusionsText,
    notesForCustomer: mapped.notesForCustomer,
    sharedAt: mapped.sharedAt,
    customerViewedAt: mapped.customerViewedAt,
    customerApprovedAt: mapped.customerApprovedAt,
    customerDeclinedAt: mapped.customerDeclinedAt,
    expirationDate: mapped.expirationDate,
    lineItems: mapped.lineItems
  };
}

export async function createCraftBoardProposalFromInquiry(input: {
  organizationId: string;
  inquiryId: string;
  actorName?: string | null;
}) {
  const existing = await prisma.craftBoardProposal.findFirst({
    where: {
      organizationId: input.organizationId,
      inquiryId: input.inquiryId
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      inquiry: {
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          productFamily: true,
          productName: true
        }
      },
      craftBoardDepositRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          depositNumber: true,
          status: true,
          depositAmountCents: true,
          paidAt: true,
          sharedAt: true
        }
      },
      craftBoardOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          releasedAt: true
        }
      }
    }
  });

  if (existing) {
    return { ok: true, proposal: mapProposalRow(existing, { includePublicToken: true }) };
  }

  const inquiry = await prisma.craftBoardInquiry.findFirst({
    where: {
      id: input.inquiryId,
      organizationId: input.organizationId
    }
  });

  if (!inquiry) {
    throw new Error("Inquiry not found.");
  }

  const reviewedWidthValue = toNumber(inquiry.reviewedWidthValue ?? inquiry.widthValue);
  const reviewedDepthValue = toNumber(inquiry.reviewedDepthValue ?? inquiry.depthValue);
  const reviewedThicknessValue = toNumber(inquiry.reviewedThicknessValue ?? inquiry.thicknessValue);
  const reviewedQuantity = inquiry.reviewedQuantity ?? inquiry.quantity;
  const reviewedMaterialCode = inquiry.reviewedMaterialCode ?? inquiry.materialCode;
  const reviewedMaterialLabel = inquiry.reviewedMaterialLabel ?? inquiry.materialLabel;
  const reviewedMountingCode = inquiry.reviewedMountingCode ?? inquiry.mountingCode;
  const reviewedMountingLabel = inquiry.reviewedMountingLabel ?? inquiry.mountingLabel;
  const seededSubtotal =
    inquiry.estimateBaseAmountCents ??
    inquiry.estimateHighAmountCents ??
    inquiry.estimateLowAmountCents ??
    0;

  const proposalNumber = await generateProposalNumber(input.organizationId);
  const publicToken = await generatePublicToken();
  const lineItems = normalizeLineItems([
    {
      label: inquiry.productName,
      description:
        reviewedWidthValue && reviewedDepthValue && reviewedThicknessValue
          ? `${reviewedWidthValue}" x ${reviewedDepthValue}" x ${reviewedThicknessValue}" custom floating shelf`
          : "Custom floating shelf built to the reviewed configuration.",
      quantity: reviewedQuantity,
      unitLabel: "ea",
      unitAmountCents: reviewedQuantity > 0 ? Math.round(seededSubtotal / reviewedQuantity) : seededSubtotal,
      itemType: "product"
    }
  ]);
  const totals = computeTotals({
    lineItems,
    shippingAmountCents: 0,
    discountAmountCents: 0
  });

  const proposal = await prisma.craftBoardProposal.create({
    data: {
      organizationId: input.organizationId,
      inquiryId: input.inquiryId,
      status: "DRAFT",
      proposalNumber,
      title: `${inquiry.productName} Proposal`,
      customerNameSnapshot: inquiry.customerName,
      customerEmailSnapshot: inquiry.customerEmail,
      customerPhoneSnapshot: inquiry.customerPhone,
      productFamily: inquiry.productFamily,
      productName: inquiry.productName,
      reviewedWidthValue: decimal(reviewedWidthValue),
      reviewedDepthValue: decimal(reviewedDepthValue),
      reviewedThicknessValue: decimal(reviewedThicknessValue),
      reviewedQuantity,
      reviewedMaterialCode,
      reviewedMaterialLabel,
      reviewedMountingCode,
      reviewedMountingLabel,
      subtotalAmountCents: totals.subtotalAmountCents,
      discountAmountCents: 0,
      shippingAmountCents: 0,
      totalAmountCents: totals.totalAmountCents,
      currencyCode: inquiry.estimateCurrencyCode ?? "USD",
      leadTimeText: inquiry.estimateLeadTimeText,
      scopeSummary: buildScopeSummary({
        productName: inquiry.productName,
        reviewedWidthValue,
        reviewedDepthValue,
        reviewedThicknessValue,
        reviewedMaterialLabel,
        reviewedMountingLabel
      }),
      inclusionsText:
        "Proposal includes fabrication of the shelf, selected finish, and the reviewed mounting approach.",
      exclusionsText:
        "Installation, wall reinforcement, and field verification are excluded unless noted separately.",
      notesForCustomer:
        "Approving this proposal lets Craft & Board move into the next step of confirming production details and scheduling.",
      internalNotes: inquiry.internalNotes,
      publicToken,
      preparedBy: input.actorName?.trim() || inquiry.quotePreparedBy || null,
      referenceCode: proposalNumber,
      lineItems: {
        create: lineItems.map((item) => ({
          organizationId: input.organizationId,
          sortOrder: item.sortOrder,
          label: item.label,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity.toFixed(2)),
          unitLabel: item.unitLabel,
          unitAmountCents: item.unitAmountCents,
          lineTotalAmountCents: item.lineTotalAmountCents,
          itemType: item.itemType
        }))
      }
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      inquiry: {
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          productFamily: true,
          productName: true
        }
      }
    }
  });

  return { ok: true, proposal: mapProposalRow(proposal, { includePublicToken: true }) };
}

export async function listCraftBoardProposals(input: {
  organizationId: string;
  status?: CraftBoardProposalStatus;
  query?: string;
}) {
  const query = input.query?.trim();
  const proposals = await prisma.craftBoardProposal.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
      ...(query
        ? {
            OR: [
              { proposalNumber: { contains: query, mode: "insensitive" } },
              { customerNameSnapshot: { contains: query, mode: "insensitive" } },
              { customerEmailSnapshot: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          productFamily: true,
          productName: true
        }
      },
      craftBoardDepositRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          depositNumber: true,
          status: true,
          depositAmountCents: true,
          paidAt: true,
          sharedAt: true
        }
      },
      craftBoardOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          releasedAt: true
        }
      },
      lineItems: {
        orderBy: { sortOrder: "asc" }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true,
    proposals: proposals.map((proposal) => mapProposalRow(proposal, { includePublicToken: true }))
  };
}

export async function getCraftBoardProposalDetail(input: {
  organizationId: string;
  id: string;
}) {
  const proposal = await prisma.craftBoardProposal.findFirst({
    where: {
      id: input.id,
      organizationId: input.organizationId
    },
    include: {
      inquiry: {
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          productFamily: true,
          productName: true
        }
      },
      craftBoardDepositRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          depositNumber: true,
          status: true,
          depositAmountCents: true,
          paidAt: true,
          sharedAt: true
        }
      },
      craftBoardOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          releasedAt: true
        }
      },
      lineItems: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  return {
    ok: true,
    proposal: mapProposalRow(proposal, { includePublicToken: true })
  };
}

export async function updateCraftBoardProposal(input: {
  organizationId: string;
  id: string;
  actorName?: string | null;
  status?: CraftBoardProposalStatus;
  title?: string;
  customerNameSnapshot?: string;
  customerEmailSnapshot?: string;
  customerPhoneSnapshot?: string | null;
  productFamily?: string;
  productName?: string;
  reviewedWidthValue?: number | null;
  reviewedDepthValue?: number | null;
  reviewedThicknessValue?: number | null;
  reviewedQuantity?: number;
  reviewedMaterialCode?: string | null;
  reviewedMaterialLabel?: string | null;
  reviewedMountingCode?: string | null;
  reviewedMountingLabel?: string | null;
  discountAmountCents?: number;
  shippingAmountCents?: number;
  currencyCode?: string;
  leadTimeText?: string | null;
  scopeSummary?: string;
  inclusionsText?: string | null;
  exclusionsText?: string | null;
  notesForCustomer?: string | null;
  internalNotes?: string | null;
  expirationDate?: string | null;
  preparedBy?: string | null;
  referenceCode?: string | null;
  lineItems?: Array<{
    id?: string;
    sortOrder?: number;
    label: string;
    description?: string | null;
    quantity: number;
    unitLabel?: string | null;
    unitAmountCents: number;
    itemType?: string | null;
  }>;
}) {
  const existing = await prisma.craftBoardProposal.findFirst({
    where: {
      id: input.id,
      organizationId: input.organizationId
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      inquiry: {
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          productFamily: true,
          productName: true
        }
      }
    }
  });

  if (!existing) {
    throw new Error("Proposal not found.");
  }

  const nextStatus = input.status ?? existing.status;
  if (!canTransitionStatus(existing.status, nextStatus)) {
    throw new Error(`Cannot move proposal from ${existing.status} to ${nextStatus}.`);
  }

  const normalizedLineItems =
    input.lineItems !== undefined
      ? normalizeLineItems(input.lineItems)
      : normalizeLineItems(
          existing.lineItems.map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
            label: item.label,
            description: item.description,
            quantity: lineQuantityToNumber(item.quantity),
            unitLabel: item.unitLabel,
            unitAmountCents: item.unitAmountCents,
            itemType: item.itemType
          }))
        );

  const shippingAmountCents = input.shippingAmountCents ?? existing.shippingAmountCents;
  const discountAmountCents = input.discountAmountCents ?? existing.discountAmountCents;
  const totals = computeTotals({
    lineItems: normalizedLineItems,
    shippingAmountCents,
    discountAmountCents
  });

  const nextTitle = input.title ?? existing.title;
  const nextScopeSummary = input.scopeSummary ?? existing.scopeSummary;
  const nextCustomerName = input.customerNameSnapshot ?? existing.customerNameSnapshot;
  const nextCustomerEmail = input.customerEmailSnapshot ?? existing.customerEmailSnapshot;

  if (nextStatus === "READY" || nextStatus === "SHARED") {
    ensureProposalReady({
      title: nextTitle,
      scopeSummary: nextScopeSummary,
      customerNameSnapshot: nextCustomerName,
      customerEmailSnapshot: nextCustomerEmail,
      lineItems: normalizedLineItems,
      totalAmountCents: totals.totalAmountCents
    });
  }

  const sharedAt =
    nextStatus === "SHARED"
      ? existing.sharedAt ?? new Date()
      : existing.sharedAt;

  const proposal = await prisma.$transaction(async (tx) => {
    await tx.craftBoardProposal.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        title: nextTitle,
        customerNameSnapshot: nextCustomerName,
        customerEmailSnapshot: nextCustomerEmail,
        customerPhoneSnapshot:
          input.customerPhoneSnapshot !== undefined
            ? input.customerPhoneSnapshot
            : existing.customerPhoneSnapshot,
        productFamily: input.productFamily ?? existing.productFamily,
        productName: input.productName ?? existing.productName,
        reviewedWidthValue:
          input.reviewedWidthValue !== undefined
            ? decimal(input.reviewedWidthValue)
            : existing.reviewedWidthValue,
        reviewedDepthValue:
          input.reviewedDepthValue !== undefined
            ? decimal(input.reviewedDepthValue)
            : existing.reviewedDepthValue,
        reviewedThicknessValue:
          input.reviewedThicknessValue !== undefined
            ? decimal(input.reviewedThicknessValue)
            : existing.reviewedThicknessValue,
        reviewedQuantity: input.reviewedQuantity ?? existing.reviewedQuantity,
        reviewedMaterialCode:
          input.reviewedMaterialCode !== undefined
            ? input.reviewedMaterialCode
            : existing.reviewedMaterialCode,
        reviewedMaterialLabel:
          input.reviewedMaterialLabel !== undefined
            ? input.reviewedMaterialLabel
            : existing.reviewedMaterialLabel,
        reviewedMountingCode:
          input.reviewedMountingCode !== undefined
            ? input.reviewedMountingCode
            : existing.reviewedMountingCode,
        reviewedMountingLabel:
          input.reviewedMountingLabel !== undefined
            ? input.reviewedMountingLabel
            : existing.reviewedMountingLabel,
        subtotalAmountCents: totals.subtotalAmountCents,
        discountAmountCents,
        shippingAmountCents,
        totalAmountCents: totals.totalAmountCents,
        currencyCode: input.currencyCode ?? existing.currencyCode,
        leadTimeText:
          input.leadTimeText !== undefined ? input.leadTimeText : existing.leadTimeText,
        scopeSummary: nextScopeSummary,
        inclusionsText:
          input.inclusionsText !== undefined ? input.inclusionsText : existing.inclusionsText,
        exclusionsText:
          input.exclusionsText !== undefined ? input.exclusionsText : existing.exclusionsText,
        notesForCustomer:
          input.notesForCustomer !== undefined ? input.notesForCustomer : existing.notesForCustomer,
        internalNotes:
          input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
        expirationDate:
          input.expirationDate !== undefined
            ? input.expirationDate
              ? new Date(input.expirationDate)
              : null
            : existing.expirationDate,
        preparedBy:
          input.preparedBy !== undefined ? input.preparedBy : existing.preparedBy ?? input.actorName ?? null,
        referenceCode:
          input.referenceCode !== undefined ? input.referenceCode : existing.referenceCode,
        sharedAt
      }
    });

    if (input.lineItems !== undefined) {
      await tx.craftBoardProposalLineItem.deleteMany({
        where: { proposalId: existing.id }
      });

      if (normalizedLineItems.length > 0) {
        await tx.craftBoardProposalLineItem.createMany({
          data: normalizedLineItems.map((item) => ({
            organizationId: input.organizationId,
            proposalId: existing.id,
            sortOrder: item.sortOrder,
            label: item.label,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity.toFixed(2)),
            unitLabel: item.unitLabel,
            unitAmountCents: item.unitAmountCents,
            lineTotalAmountCents: item.lineTotalAmountCents,
            itemType: item.itemType
          }))
        });
      }
    }

    return tx.craftBoardProposal.findFirstOrThrow({
      where: { id: existing.id, organizationId: input.organizationId },
      include: {
        inquiry: {
          select: {
            id: true,
            status: true,
            customerName: true,
            customerEmail: true,
            productFamily: true,
          productName: true
        }
      },
      craftBoardDepositRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          depositNumber: true,
          status: true,
          depositAmountCents: true,
          paidAt: true,
          sharedAt: true
        }
      },
      craftBoardOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          releasedAt: true
        }
      },
      lineItems: { orderBy: { sortOrder: "asc" } }
    }
  });
  });

  return {
    ok: true,
    proposal: mapProposalRow(proposal, { includePublicToken: true })
  };
}

export async function getPublicCraftBoardProposal(input: { publicToken: string }) {
  const existing = await prisma.craftBoardProposal.findUnique({
    where: { publicToken: input.publicToken },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } }
    }
  });

  if (!existing) {
    throw new Error("Proposal not found.");
  }

  let proposal = existing;

  if (existing.status === "SHARED" && !existing.customerViewedAt) {
    proposal = await prisma.craftBoardProposal.update({
      where: { id: existing.id },
      data: {
        status: "VIEWED",
        customerViewedAt: new Date()
      },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } }
      }
    });
  }

  return {
    ok: true,
    proposal: customerVisibleProposal(proposal)
  };
}

export async function markCraftBoardProposalViewed(input: { publicToken: string }) {
  const existing = await prisma.craftBoardProposal.findUnique({
    where: { publicToken: input.publicToken },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } }
  });

  if (!existing) {
    throw new Error("Proposal not found.");
  }

  const proposal =
    existing.customerViewedAt || existing.status === "APPROVED" || existing.status === "DECLINED"
      ? existing
      : await prisma.craftBoardProposal.update({
          where: { id: existing.id },
          data: {
            status: existing.status === "SHARED" ? "VIEWED" : existing.status,
            customerViewedAt: existing.customerViewedAt ?? new Date()
          },
          include: { lineItems: { orderBy: { sortOrder: "asc" } } }
        });

  return {
    ok: true,
    proposal: customerVisibleProposal(proposal)
  };
}

async function respondToProposal(input: {
  publicToken: string;
  action: "approve" | "decline";
}) {
  const existing = await prisma.craftBoardProposal.findUnique({
    where: { publicToken: input.publicToken },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } }
  });

  if (!existing) {
    throw new Error("Proposal not found.");
  }

  if (!["SHARED", "VIEWED"].includes(existing.status)) {
    throw new Error("Proposal is not available for customer response.");
  }

  const isApprove = input.action === "approve";
  const proposal = await prisma.craftBoardProposal.update({
    where: { id: existing.id },
    data: {
      status: isApprove ? "APPROVED" : "DECLINED",
      customerViewedAt: existing.customerViewedAt ?? new Date(),
      customerApprovedAt: isApprove ? existing.customerApprovedAt ?? new Date() : null,
      customerDeclinedAt: !isApprove ? existing.customerDeclinedAt ?? new Date() : null
    },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } }
  });

  return {
    ok: true,
    proposal: customerVisibleProposal(proposal)
  };
}

export async function approveCraftBoardProposal(input: { publicToken: string }) {
  return respondToProposal({ publicToken: input.publicToken, action: "approve" });
}

export async function declineCraftBoardProposal(input: { publicToken: string }) {
  return respondToProposal({ publicToken: input.publicToken, action: "decline" });
}
