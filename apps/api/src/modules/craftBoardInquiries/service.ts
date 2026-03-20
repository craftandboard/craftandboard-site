import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { LOCAL_ORG_ID } from "../settings/service.js";

function decimal(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return new Prisma.Decimal(value.toFixed(3));
}

function toNumber(value: Prisma.Decimal | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function hasEstimate(row: {
  estimateBaseAmountCents?: number | null;
  estimateLowAmountCents?: number | null;
  estimateHighAmountCents?: number | null;
}) {
  return (
    row.estimateBaseAmountCents !== null &&
      row.estimateBaseAmountCents !== undefined ||
    row.estimateLowAmountCents !== null &&
      row.estimateLowAmountCents !== undefined ||
    row.estimateHighAmountCents !== null &&
      row.estimateHighAmountCents !== undefined
  );
}

async function generateQuoteReferenceCode(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.craftBoardInquiry.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }
  });

  return `CB-${year}-${String(count + 1).padStart(4, "0")}`;
}

function summarizeConfiguration(input: {
  widthValue: number;
  widthUnit: string;
  depthValue: number;
  depthUnit: string;
  thicknessValue: number;
  thicknessUnit: string;
  quantity: number;
  materialLabel: string;
  mountingLabel: string;
  sourcePath?: string | null;
}) {
  return [
    `Source: ${input.sourcePath ?? "direct contact"}`,
    `Size: ${input.widthValue}${input.widthUnit} x ${input.depthValue}${input.depthUnit} x ${input.thicknessValue}${input.thicknessUnit}`,
    `Quantity: ${input.quantity}`,
    `Material: ${input.materialLabel}`,
    `Mounting: ${input.mountingLabel}`
  ].join(" | ");
}

function mapInquiryRow(row: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: "NEW" | "REVIEWED" | "QUOTE_IN_PROGRESS" | "QUOTED" | "CLOSED" | "LOST";
  reviewedAt: Date | null;
  quotedAt: Date | null;
  source: string;
  sourcePath: string | null;
  productFamily: string;
  productSlug: string | null;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  widthValue: Prisma.Decimal | null;
  widthUnit: string | null;
  depthValue: Prisma.Decimal | null;
  depthUnit: string | null;
  thicknessValue: Prisma.Decimal | null;
  thicknessUnit: string | null;
  quantity: number;
  materialCode: string | null;
  materialLabel: string | null;
  mountingCode: string | null;
  mountingLabel: string | null;
  notes: string | null;
  configurationJson: Prisma.JsonValue;
  internalNotes: string | null;
  followUpNotes: string | null;
  reviewedWidthValue: Prisma.Decimal | null;
  reviewedDepthValue: Prisma.Decimal | null;
  reviewedThicknessValue: Prisma.Decimal | null;
  reviewedQuantity: number | null;
  reviewedMaterialCode: string | null;
  reviewedMaterialLabel: string | null;
  reviewedMountingCode: string | null;
  reviewedMountingLabel: string | null;
  estimateBaseAmountCents: number | null;
  estimateLowAmountCents: number | null;
  estimateHighAmountCents: number | null;
  estimateCurrencyCode: string | null;
  estimateLeadTimeText: string | null;
  estimateSummaryJson: Prisma.JsonValue | null;
  quotePreparedBy: string | null;
  quoteReferenceCode: string | null;
  leadId: string | null;
  assignedToUserId: string | null;
  assignedToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  craftBoardProposal?: {
    id: string;
    proposalNumber: string;
    status: string;
    publicToken: string;
    totalAmountCents: number;
    sharedAt: Date | null;
    customerViewedAt: Date | null;
    customerApprovedAt: Date | null;
    customerDeclinedAt: Date | null;
  } | null;
}) {
  const latestProposal = row.craftBoardProposal ?? null;

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    quotedAt: row.quotedAt?.toISOString() ?? null,
    source: row.source,
    sourcePath: row.sourcePath,
    productFamily: row.productFamily,
    productSlug: row.productSlug,
    productName: row.productName,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    widthValue: toNumber(row.widthValue),
    widthUnit: row.widthUnit,
    depthValue: toNumber(row.depthValue),
    depthUnit: row.depthUnit,
    thicknessValue: toNumber(row.thicknessValue),
    thicknessUnit: row.thicknessUnit,
    quantity: row.quantity,
    materialCode: row.materialCode,
    materialLabel: row.materialLabel,
    mountingCode: row.mountingCode,
    mountingLabel: row.mountingLabel,
    notes: row.notes,
    configurationJson: row.configurationJson,
    internalNotes: row.internalNotes,
    followUpNotes: row.followUpNotes,
    reviewedWidthValue: toNumber(row.reviewedWidthValue),
    reviewedDepthValue: toNumber(row.reviewedDepthValue),
    reviewedThicknessValue: toNumber(row.reviewedThicknessValue),
    reviewedQuantity: row.reviewedQuantity,
    reviewedMaterialCode: row.reviewedMaterialCode,
    reviewedMaterialLabel: row.reviewedMaterialLabel,
    reviewedMountingCode: row.reviewedMountingCode,
    reviewedMountingLabel: row.reviewedMountingLabel,
    estimateBaseAmountCents: row.estimateBaseAmountCents,
    estimateLowAmountCents: row.estimateLowAmountCents,
    estimateHighAmountCents: row.estimateHighAmountCents,
    estimateCurrencyCode: row.estimateCurrencyCode,
    estimateLeadTimeText: row.estimateLeadTimeText,
    estimateSummaryJson: row.estimateSummaryJson,
    quotePreparedBy: row.quotePreparedBy,
    quoteReferenceCode: row.quoteReferenceCode,
    leadId: row.leadId,
    assignedToUserId: row.assignedToUserId,
    assignedToUser: row.assignedToUser
      ? {
          id: row.assignedToUser.id,
          name: row.assignedToUser.name,
          email: row.assignedToUser.email
        }
      : null,
    proposal: latestProposal
      ? {
          id: latestProposal.id,
          proposalNumber: latestProposal.proposalNumber,
          status: latestProposal.status,
          publicToken: latestProposal.publicToken,
          totalAmountCents: latestProposal.totalAmountCents,
          sharedAt: latestProposal.sharedAt?.toISOString() ?? null,
          customerViewedAt: latestProposal.customerViewedAt?.toISOString() ?? null,
          customerApprovedAt: latestProposal.customerApprovedAt?.toISOString() ?? null,
          customerDeclinedAt: latestProposal.customerDeclinedAt?.toISOString() ?? null
        }
      : null,
    hasEstimate: hasEstimate(row),
    estimateState: hasEstimate(row) ? "has-estimate" : "needs-estimate"
  };
}

export async function createCraftBoardInquiry(input: {
  organizationId?: string;
  source: string;
  sourcePath?: string | null;
  productFamily: string;
  productSlug?: string | null;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  widthValue: number;
  widthUnit: string;
  depthValue: number;
  depthUnit: string;
  thicknessValue: number;
  thicknessUnit: string;
  quantity: number;
  materialCode?: string | null;
  materialLabel: string;
  mountingCode?: string | null;
  mountingLabel: string;
  notes?: string | null;
  configurationJson: Record<string, unknown>;
}) {
  const organizationId = input.organizationId ?? LOCAL_ORG_ID;

  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        organizationId,
        name: input.customerName.trim(),
        email: input.customerEmail.trim(),
        phone: input.customerPhone?.trim() || null,
        status: "lead_new",
        stage: "craft_board_inquiry",
        notes: summarizeConfiguration(input)
      }
    });

    const inquiry = await tx.craftBoardInquiry.create({
      data: {
        organizationId,
        leadId: lead.id,
        source: input.source.trim(),
        sourcePath: input.sourcePath?.trim() || null,
        productFamily: input.productFamily.trim(),
        productSlug: input.productSlug?.trim() || null,
        productName: input.productName.trim(),
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        widthValue: decimal(input.widthValue),
        widthUnit: input.widthUnit.trim(),
        depthValue: decimal(input.depthValue),
        depthUnit: input.depthUnit.trim(),
        thicknessValue: decimal(input.thicknessValue),
        thicknessUnit: input.thicknessUnit.trim(),
        quantity: input.quantity,
        materialCode: input.materialCode?.trim() || null,
        materialLabel: input.materialLabel.trim(),
        mountingCode: input.mountingCode?.trim() || null,
        mountingLabel: input.mountingLabel.trim(),
        notes: input.notes?.trim() || null,
        configurationJson: toJsonValue(input.configurationJson)
      }
    });

    return { inquiry, lead };
  });

  return {
    ok: true,
    inquiry: {
      ...mapInquiryRow(result.inquiry),
      leadId: result.lead.id
    }
  };
}

export async function listCraftBoardInquiries(input: {
  organizationId: string;
  status?: "NEW" | "REVIEWED" | "QUOTE_IN_PROGRESS" | "QUOTED" | "CLOSED" | "LOST";
  query?: string;
  productFamily?: string;
  assignedToUserId?: string;
  estimateState?: "has-estimate" | "needs-estimate";
}) {
  const rows = await prisma.craftBoardInquiry.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.productFamily ? { productFamily: input.productFamily } : {}),
      ...(input.assignedToUserId ? { assignedToUserId: input.assignedToUserId } : {})
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      craftBoardProposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true,
          publicToken: true,
          totalAmountCents: true,
          sharedAt: true,
          customerViewedAt: true,
          customerApprovedAt: true,
          customerDeclinedAt: true
        }
      }
    }
  });

  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const priority = {
    NEW: 0,
    REVIEWED: 1,
    QUOTE_IN_PROGRESS: 2,
    QUOTED: 3,
    CLOSED: 4,
    LOST: 5
  } as const;

  const filtered = rows
    .filter((row) => {
      if (input.estimateState === "has-estimate" && !hasEstimate(row)) {
        return false;
      }
      if (input.estimateState === "needs-estimate" && hasEstimate(row)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        row.customerName,
        row.customerEmail,
        row.productFamily,
        row.productName,
        row.productSlug ?? "",
        row.materialLabel ?? ""
      ]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalizedQuery));
    })
    .sort((left, right) => {
      const leftPriority = priority[left.status];
      const rightPriority = priority[right.status];
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });

  return {
    ok: true,
    inquiries: filtered.map((row) => mapInquiryRow(row))
  };
}

export async function getCraftBoardInquiryDetail(input: {
  organizationId: string;
  id: string;
}) {
  const row = await prisma.craftBoardInquiry.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      craftBoardProposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true,
          publicToken: true,
          totalAmountCents: true,
          sharedAt: true,
          customerViewedAt: true,
          customerApprovedAt: true,
          customerDeclinedAt: true
        }
      }
    }
  });

  if (!row) {
    throw new Error("Inquiry not found.");
  }

  return {
    ok: true,
    inquiry: mapInquiryRow(row)
  };
}

export async function updateCraftBoardInquiry(input: {
  organizationId: string;
  id: string;
  actorName?: string | null;
  status?: "NEW" | "REVIEWED" | "QUOTE_IN_PROGRESS" | "QUOTED" | "CLOSED" | "LOST";
  assignedToUserId?: string | null;
  internalNotes?: string | null;
  followUpNotes?: string | null;
  reviewedWidthValue?: number | null;
  reviewedDepthValue?: number | null;
  reviewedThicknessValue?: number | null;
  reviewedQuantity?: number | null;
  reviewedMaterialCode?: string | null;
  reviewedMaterialLabel?: string | null;
  reviewedMountingCode?: string | null;
  reviewedMountingLabel?: string | null;
  estimateBaseAmountCents?: number | null;
  estimateLowAmountCents?: number | null;
  estimateHighAmountCents?: number | null;
  estimateCurrencyCode?: string | null;
  estimateLeadTimeText?: string | null;
  estimateSummaryJson?: Record<string, unknown> | null;
  quotePreparedBy?: string | null;
  quoteReferenceCode?: string | null;
}) {
  const existing = await prisma.craftBoardInquiry.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    select: {
      id: true,
      reviewedAt: true,
      quotedAt: true,
      quoteReferenceCode: true
    }
  });

  if (!existing) {
    throw new Error("Inquiry not found.");
  }

  let reviewedAt = undefined as Date | null | undefined;
  if (input.status === "REVIEWED" && !existing.reviewedAt) {
    reviewedAt = new Date();
  }

  let quotedAt = undefined as Date | null | undefined;
  if (input.status === "QUOTED" && !existing.quotedAt) {
    quotedAt = new Date();
  }

  let quoteReferenceCode = input.quoteReferenceCode;
  if (input.status === "QUOTED" && !quoteReferenceCode && !existing.quoteReferenceCode) {
    quoteReferenceCode = await generateQuoteReferenceCode(input.organizationId);
  }

  const row = await prisma.craftBoardInquiry.update({
    where: { id: existing.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(reviewedAt !== undefined ? { reviewedAt } : {}),
      ...(quotedAt !== undefined ? { quotedAt } : {}),
      ...(input.assignedToUserId !== undefined ? { assignedToUserId: input.assignedToUserId?.trim() || null } : {}),
      ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes?.trim() || null } : {}),
      ...(input.followUpNotes !== undefined ? { followUpNotes: input.followUpNotes?.trim() || null } : {}),
      ...(input.reviewedWidthValue !== undefined ? { reviewedWidthValue: decimal(input.reviewedWidthValue) } : {}),
      ...(input.reviewedDepthValue !== undefined ? { reviewedDepthValue: decimal(input.reviewedDepthValue) } : {}),
      ...(input.reviewedThicknessValue !== undefined ? { reviewedThicknessValue: decimal(input.reviewedThicknessValue) } : {}),
      ...(input.reviewedQuantity !== undefined ? { reviewedQuantity: input.reviewedQuantity } : {}),
      ...(input.reviewedMaterialCode !== undefined ? { reviewedMaterialCode: input.reviewedMaterialCode?.trim() || null } : {}),
      ...(input.reviewedMaterialLabel !== undefined ? { reviewedMaterialLabel: input.reviewedMaterialLabel?.trim() || null } : {}),
      ...(input.reviewedMountingCode !== undefined ? { reviewedMountingCode: input.reviewedMountingCode?.trim() || null } : {}),
      ...(input.reviewedMountingLabel !== undefined ? { reviewedMountingLabel: input.reviewedMountingLabel?.trim() || null } : {}),
      ...(input.estimateBaseAmountCents !== undefined ? { estimateBaseAmountCents: input.estimateBaseAmountCents } : {}),
      ...(input.estimateLowAmountCents !== undefined ? { estimateLowAmountCents: input.estimateLowAmountCents } : {}),
      ...(input.estimateHighAmountCents !== undefined ? { estimateHighAmountCents: input.estimateHighAmountCents } : {}),
      ...(input.estimateCurrencyCode !== undefined ? { estimateCurrencyCode: input.estimateCurrencyCode?.trim() || null } : {}),
      ...(input.estimateLeadTimeText !== undefined ? { estimateLeadTimeText: input.estimateLeadTimeText?.trim() || null } : {}),
      ...(input.estimateSummaryJson !== undefined
        ? { estimateSummaryJson: input.estimateSummaryJson ? toJsonValue(input.estimateSummaryJson) : Prisma.JsonNull }
        : {}),
      ...(input.quotePreparedBy !== undefined
        ? { quotePreparedBy: input.quotePreparedBy?.trim() || null }
        : input.status === "QUOTED" && input.actorName
          ? { quotePreparedBy: input.actorName.trim() }
          : {}),
      ...(quoteReferenceCode !== undefined ? { quoteReferenceCode: quoteReferenceCode?.trim() || null } : {})
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      craftBoardProposal: {
        select: {
          id: true,
          proposalNumber: true,
          status: true,
          publicToken: true,
          totalAmountCents: true,
          sharedAt: true,
          customerViewedAt: true,
          customerApprovedAt: true,
          customerDeclinedAt: true
        }
      }
    }
  });

  return {
    ok: true,
    inquiry: mapInquiryRow(row)
  };
}
