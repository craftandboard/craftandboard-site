import { randomBytes } from "node:crypto";
import { type CraftBoardDepositRequestStatus, type CraftBoardDepositType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

function canTransitionStatus(
  current: CraftBoardDepositRequestStatus,
  next: CraftBoardDepositRequestStatus
) {
  if (current === next) {
    return true;
  }

  const transitions: Record<CraftBoardDepositRequestStatus, CraftBoardDepositRequestStatus[]> = {
    DRAFT: ["READY", "SHARED", "CANCELLED", "EXPIRED"],
    READY: ["DRAFT", "SHARED", "CANCELLED", "EXPIRED"],
    SHARED: ["VIEWED", "PAYMENT_INITIATED", "PAID", "CANCELLED", "EXPIRED"],
    VIEWED: ["PAYMENT_INITIATED", "PAID", "CANCELLED", "EXPIRED"],
    PAYMENT_INITIATED: ["PAID", "CANCELLED", "EXPIRED"],
    PAID: [],
    CANCELLED: [],
    EXPIRED: []
  };

  return transitions[current].includes(next);
}

function ensurePositive(value: number, label: string) {
  if (value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
}

async function generateDepositNumber(organizationId: string) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.craftBoardDepositRequest.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1))
      }
    }
  });

  return `CBD-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function generatePublicToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = randomBytes(18).toString("base64url");
    const existing = await prisma.craftBoardDepositRequest.findUnique({
      where: { publicToken: token },
      select: { id: true }
    });

    if (!existing) {
      return token;
    }
  }

  throw new Error("Unable to generate a unique public deposit token.");
}

function computeDepositAmounts(input: {
  proposalTotalAmountCents: number;
  depositType: CraftBoardDepositType;
  depositPercentBasisPoints?: number | null;
  depositAmountCents?: number | null;
}) {
  const proposalTotalAmountCents = input.proposalTotalAmountCents;
  ensurePositive(proposalTotalAmountCents, "Proposal total");

  let depositAmountCents = input.depositAmountCents ?? null;
  let depositPercentBasisPoints = input.depositPercentBasisPoints ?? null;

  if (input.depositType === "PERCENTAGE") {
    if (depositPercentBasisPoints === null) {
      throw new Error("Deposit percentage is required.");
    }
    if (depositPercentBasisPoints <= 0 || depositPercentBasisPoints > 10000) {
      throw new Error("Deposit percentage must be between 0 and 100 percent.");
    }
    depositAmountCents = Math.round((proposalTotalAmountCents * depositPercentBasisPoints) / 10000);
  } else {
    if (depositAmountCents === null) {
      throw new Error("Deposit amount is required.");
    }
    ensurePositive(depositAmountCents, "Deposit amount");
    depositPercentBasisPoints = Math.round((depositAmountCents / proposalTotalAmountCents) * 10000);
  }

  if (depositAmountCents > proposalTotalAmountCents) {
    throw new Error("Deposit amount cannot exceed proposal total.");
  }

  return {
    depositAmountCents,
    depositPercentBasisPoints,
    remainingBalanceAmountCents: Math.max(proposalTotalAmountCents - depositAmountCents, 0)
  };
}

function mapDepositRow(
  row: {
    id: string;
    organizationId: string;
    proposalId: string;
    createdAt: Date;
    updatedAt: Date;
    status: CraftBoardDepositRequestStatus;
    depositNumber: string;
    publicToken: string;
    title: string;
    customerNameSnapshot: string;
    customerEmailSnapshot: string;
    customerPhoneSnapshot: string | null;
    currencyCode: string;
    proposalTotalAmountCents: number;
    depositType: CraftBoardDepositType;
    depositPercentBasisPoints: number | null;
    depositAmountCents: number;
    remainingBalanceAmountCents: number | null;
    descriptionText: string | null;
    customerInstructionsText: string | null;
    dueDate: Date | null;
    sharedAt: Date | null;
    customerViewedAt: Date | null;
    paymentInitiatedAt: Date | null;
    paidAt: Date | null;
    cancelledAt: Date | null;
    expiredAt: Date | null;
    paymentProvider: string | null;
    paymentProviderReference: string | null;
    paymentIntentId: string | null;
    checkoutSessionId: string | null;
    paymentReceiptReference: string | null;
    internalNotes: string | null;
    createdBy: string | null;
    proposal?: {
      id: string;
      proposalNumber: string;
      title: string;
      status: string;
      totalAmountCents: number;
      customerApprovedAt: Date | null;
      productName: string;
      reviewedQuantity: number;
      reviewedMaterialLabel: string | null;
      reviewedMountingLabel: string | null;
    };
    craftBoardOrder?: {
      id: string;
      orderNumber: string;
      status: string;
      releasedAt: Date;
    } | null;
  },
  options?: { includePublicToken?: boolean }
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    proposalId: row.proposalId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    depositNumber: row.depositNumber,
    publicToken: options?.includePublicToken ? row.publicToken : undefined,
    title: row.title,
    customerNameSnapshot: row.customerNameSnapshot,
    customerEmailSnapshot: row.customerEmailSnapshot,
    customerPhoneSnapshot: row.customerPhoneSnapshot,
    currencyCode: row.currencyCode,
    proposalTotalAmountCents: row.proposalTotalAmountCents,
    depositType: row.depositType,
    depositPercentBasisPoints: row.depositPercentBasisPoints,
    depositAmountCents: row.depositAmountCents,
    remainingBalanceAmountCents: row.remainingBalanceAmountCents,
    descriptionText: row.descriptionText,
    customerInstructionsText: row.customerInstructionsText,
    dueDate: row.dueDate?.toISOString() ?? null,
    sharedAt: row.sharedAt?.toISOString() ?? null,
    customerViewedAt: row.customerViewedAt?.toISOString() ?? null,
    paymentInitiatedAt: row.paymentInitiatedAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    expiredAt: row.expiredAt?.toISOString() ?? null,
    paymentProvider: row.paymentProvider,
    paymentProviderReference: row.paymentProviderReference,
    paymentIntentId: row.paymentIntentId,
    checkoutSessionId: row.checkoutSessionId,
    paymentReceiptReference: row.paymentReceiptReference,
    internalNotes: row.internalNotes,
    createdBy: row.createdBy,
    proposal: row.proposal
      ? {
          id: row.proposal.id,
          proposalNumber: row.proposal.proposalNumber,
          title: row.proposal.title,
          status: row.proposal.status,
          totalAmountCents: row.proposal.totalAmountCents,
          customerApprovedAt: row.proposal.customerApprovedAt?.toISOString() ?? null,
          productName: row.proposal.productName,
          reviewedQuantity: row.proposal.reviewedQuantity,
          reviewedMaterialLabel: row.proposal.reviewedMaterialLabel,
          reviewedMountingLabel: row.proposal.reviewedMountingLabel
        }
      : undefined,
    linkedOrder: row.craftBoardOrder
      ? {
          id: row.craftBoardOrder.id,
          orderNumber: row.craftBoardOrder.orderNumber,
          status: row.craftBoardOrder.status,
          releasedAt: row.craftBoardOrder.releasedAt.toISOString()
        }
      : null
  };
}

function customerVisibleDeposit(row: Parameters<typeof mapDepositRow>[0]) {
  const mapped = mapDepositRow(row);
  return {
    id: mapped.id,
    status: mapped.status,
    depositNumber: mapped.depositNumber,
    title: mapped.title,
    customerNameSnapshot: mapped.customerNameSnapshot,
    customerEmailSnapshot: mapped.customerEmailSnapshot,
    customerPhoneSnapshot: mapped.customerPhoneSnapshot,
    currencyCode: mapped.currencyCode,
    proposalTotalAmountCents: mapped.proposalTotalAmountCents,
    depositType: mapped.depositType,
    depositPercentBasisPoints: mapped.depositPercentBasisPoints,
    depositAmountCents: mapped.depositAmountCents,
    remainingBalanceAmountCents: mapped.remainingBalanceAmountCents,
    descriptionText: mapped.descriptionText,
    customerInstructionsText: mapped.customerInstructionsText,
    dueDate: mapped.dueDate,
    sharedAt: mapped.sharedAt,
    customerViewedAt: mapped.customerViewedAt,
    paymentInitiatedAt: mapped.paymentInitiatedAt,
    paidAt: mapped.paidAt,
    cancelledAt: mapped.cancelledAt,
    expiredAt: mapped.expiredAt,
    proposal: mapped.proposal
  };
}

export async function createCraftBoardDepositRequestFromProposal(input: {
  organizationId: string;
  proposalId: string;
  actorName?: string | null;
  depositType?: CraftBoardDepositType;
  depositPercentBasisPoints?: number | null;
  depositAmountCents?: number | null;
  title?: string | null;
  descriptionText?: string | null;
  customerInstructionsText?: string | null;
  dueDate?: string | null;
  internalNotes?: string | null;
}) {
  const proposal = await prisma.craftBoardProposal.findFirst({
    where: {
      id: input.proposalId,
      organizationId: input.organizationId
    },
    include: {
      craftBoardDepositRequests: {
        where: {
          status: {
            in: ["DRAFT", "READY", "SHARED", "VIEWED", "PAYMENT_INITIATED", "PAID"]
          }
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  if (proposal.status !== "APPROVED") {
    throw new Error("Deposit requests can only be created from approved proposals.");
  }

  const existingActive = proposal.craftBoardDepositRequests[0] ?? null;
  if (existingActive) {
    return {
      ok: true,
      depositRequest: mapDepositRow(existingActive, { includePublicToken: true })
    };
  }

  const depositType = input.depositType ?? "PERCENTAGE";
  const depositNumber = await generateDepositNumber(input.organizationId);
  const publicToken = await generatePublicToken();
  const amounts = computeDepositAmounts({
    proposalTotalAmountCents: proposal.totalAmountCents,
    depositType,
    depositPercentBasisPoints: input.depositPercentBasisPoints ?? 5000,
    depositAmountCents: input.depositAmountCents ?? null
  });

  const depositRequest = await prisma.craftBoardDepositRequest.create({
    data: {
      organizationId: input.organizationId,
      proposalId: proposal.id,
      status: "DRAFT",
      depositNumber,
      publicToken,
      title: input.title?.trim() || `Deposit for ${proposal.title}`,
      customerNameSnapshot: proposal.customerNameSnapshot,
      customerEmailSnapshot: proposal.customerEmailSnapshot,
      customerPhoneSnapshot: proposal.customerPhoneSnapshot,
      currencyCode: proposal.currencyCode,
      proposalTotalAmountCents: proposal.totalAmountCents,
      depositType,
      depositPercentBasisPoints: amounts.depositPercentBasisPoints,
      depositAmountCents: amounts.depositAmountCents,
      remainingBalanceAmountCents: amounts.remainingBalanceAmountCents,
      descriptionText:
        input.descriptionText?.trim() ||
        `Deposit request for ${proposal.productName} proposal ${proposal.proposalNumber}.`,
      customerInstructionsText:
        input.customerInstructionsText?.trim() ||
        "Submitting the deposit reserves your project for the next production step. Final scheduling and balance collection happen separately.",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      internalNotes: input.internalNotes?.trim() || null,
      createdBy: input.actorName?.trim() || null
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  return {
    ok: true,
    depositRequest: mapDepositRow(depositRequest, { includePublicToken: true })
  };
}

export async function listCraftBoardDepositRequests(input: {
  organizationId: string;
  status?: CraftBoardDepositRequestStatus;
  query?: string;
}) {
  const query = input.query?.trim();
  const rows = await prisma.craftBoardDepositRequest.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
      ...(query
        ? {
            OR: [
              { depositNumber: { contains: query, mode: "insensitive" } },
              { customerNameSnapshot: { contains: query, mode: "insensitive" } },
              { customerEmailSnapshot: { contains: query, mode: "insensitive" } },
              { proposal: { is: { proposalNumber: { contains: query, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return {
    ok: true,
    depositRequests: rows.map((row) => mapDepositRow(row, { includePublicToken: true }))
  };
}

export async function getCraftBoardDepositRequestDetail(input: {
  organizationId: string;
  id: string;
}) {
  const row = await prisma.craftBoardDepositRequest.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  if (!row) {
    throw new Error("Deposit request not found.");
  }

  return {
    ok: true,
    depositRequest: mapDepositRow(row, { includePublicToken: true })
  };
}

export async function updateCraftBoardDepositRequest(input: {
  organizationId: string;
  id: string;
  actorName?: string | null;
  status?: CraftBoardDepositRequestStatus;
  title?: string;
  customerNameSnapshot?: string;
  customerEmailSnapshot?: string;
  customerPhoneSnapshot?: string | null;
  currencyCode?: string;
  depositType?: CraftBoardDepositType;
  depositPercentBasisPoints?: number | null;
  depositAmountCents?: number | null;
  descriptionText?: string | null;
  customerInstructionsText?: string | null;
  dueDate?: string | null;
  internalNotes?: string | null;
  paymentReceiptReference?: string | null;
  paymentProvider?: string | null;
  paymentProviderReference?: string | null;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
}) {
  const existing = await prisma.craftBoardDepositRequest.findFirst({
    where: {
      organizationId: input.organizationId,
      id: input.id
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  if (!existing) {
    throw new Error("Deposit request not found.");
  }

  const nextStatus = input.status ?? existing.status;
  if (!canTransitionStatus(existing.status, nextStatus)) {
    throw new Error(`Cannot move deposit request from ${existing.status} to ${nextStatus}.`);
  }

  const depositType = input.depositType ?? existing.depositType;
  const amounts = computeDepositAmounts({
    proposalTotalAmountCents: existing.proposalTotalAmountCents,
    depositType,
    depositPercentBasisPoints:
      input.depositPercentBasisPoints !== undefined
        ? input.depositPercentBasisPoints
        : existing.depositPercentBasisPoints,
    depositAmountCents:
      input.depositAmountCents !== undefined ? input.depositAmountCents : existing.depositAmountCents
  });

  const now = new Date();
  const row = await prisma.craftBoardDepositRequest.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      title: input.title ?? existing.title,
      customerNameSnapshot: input.customerNameSnapshot ?? existing.customerNameSnapshot,
      customerEmailSnapshot: input.customerEmailSnapshot ?? existing.customerEmailSnapshot,
      customerPhoneSnapshot:
        input.customerPhoneSnapshot !== undefined
          ? input.customerPhoneSnapshot
          : existing.customerPhoneSnapshot,
      currencyCode: input.currencyCode ?? existing.currencyCode,
      depositType,
      depositPercentBasisPoints: amounts.depositPercentBasisPoints,
      depositAmountCents: amounts.depositAmountCents,
      remainingBalanceAmountCents: amounts.remainingBalanceAmountCents,
      descriptionText:
        input.descriptionText !== undefined ? input.descriptionText : existing.descriptionText,
      customerInstructionsText:
        input.customerInstructionsText !== undefined
          ? input.customerInstructionsText
          : existing.customerInstructionsText,
      dueDate:
        input.dueDate !== undefined
          ? input.dueDate
            ? new Date(input.dueDate)
            : null
          : existing.dueDate,
      internalNotes:
        input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
      paymentReceiptReference:
        input.paymentReceiptReference !== undefined
          ? input.paymentReceiptReference
          : existing.paymentReceiptReference,
      paymentProvider:
        input.paymentProvider !== undefined ? input.paymentProvider : existing.paymentProvider,
      paymentProviderReference:
        input.paymentProviderReference !== undefined
          ? input.paymentProviderReference
          : existing.paymentProviderReference,
      paymentIntentId:
        input.paymentIntentId !== undefined ? input.paymentIntentId : existing.paymentIntentId,
      checkoutSessionId:
        input.checkoutSessionId !== undefined ? input.checkoutSessionId : existing.checkoutSessionId,
      sharedAt: nextStatus === "SHARED" ? existing.sharedAt ?? now : existing.sharedAt,
      paymentInitiatedAt:
        nextStatus === "PAYMENT_INITIATED"
          ? existing.paymentInitiatedAt ?? now
          : existing.paymentInitiatedAt,
      paidAt: nextStatus === "PAID" ? existing.paidAt ?? now : existing.paidAt,
      cancelledAt: nextStatus === "CANCELLED" ? existing.cancelledAt ?? now : existing.cancelledAt,
      expiredAt: nextStatus === "EXPIRED" ? existing.expiredAt ?? now : existing.expiredAt
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  return {
    ok: true,
    depositRequest: mapDepositRow(row, { includePublicToken: true })
  };
}

export async function getPublicCraftBoardDepositRequest(input: { publicToken: string }) {
  const existing = await prisma.craftBoardDepositRequest.findUnique({
    where: { publicToken: input.publicToken },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  if (!existing) {
    throw new Error("Deposit request not found.");
  }

  const row =
    existing.status === "SHARED" && !existing.customerViewedAt
      ? await prisma.craftBoardDepositRequest.update({
          where: { id: existing.id },
          data: {
            status: "VIEWED",
            customerViewedAt: new Date()
          },
          include: {
            proposal: {
              select: {
                id: true,
                proposalNumber: true,
                title: true,
                status: true,
                totalAmountCents: true,
                customerApprovedAt: true,
                productName: true,
                reviewedQuantity: true,
                reviewedMaterialLabel: true,
                reviewedMountingLabel: true
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
        })
      : existing;

  return {
    ok: true,
    depositRequest: customerVisibleDeposit(row)
  };
}

export async function markCraftBoardDepositViewed(input: { publicToken: string }) {
  const existing = await prisma.craftBoardDepositRequest.findUnique({
    where: { publicToken: input.publicToken },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  if (!existing) {
    throw new Error("Deposit request not found.");
  }

  const row =
    existing.customerViewedAt
      ? existing
      : await prisma.craftBoardDepositRequest.update({
          where: { id: existing.id },
          data: {
            status: existing.status === "SHARED" ? "VIEWED" : existing.status,
            customerViewedAt: new Date()
          },
          include: {
            proposal: {
              select: {
                id: true,
                proposalNumber: true,
                title: true,
                status: true,
                totalAmountCents: true,
                customerApprovedAt: true,
                productName: true,
                reviewedQuantity: true,
                reviewedMaterialLabel: true,
                reviewedMountingLabel: true
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

  return {
    ok: true,
    depositRequest: customerVisibleDeposit(row)
  };
}

export async function initiateCraftBoardDepositPayment(input: { publicToken: string }) {
  const existing = await prisma.craftBoardDepositRequest.findUnique({
    where: { publicToken: input.publicToken },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  if (!existing) {
    throw new Error("Deposit request not found.");
  }

  if (!["SHARED", "VIEWED", "PAYMENT_INITIATED"].includes(existing.status)) {
    throw new Error("Deposit request is not available for payment.");
  }

  const token = randomBytes(8).toString("hex");
  const row = await prisma.craftBoardDepositRequest.update({
    where: { id: existing.id },
    data: {
      status: existing.status === "PAYMENT_INITIATED" ? existing.status : "PAYMENT_INITIATED",
      customerViewedAt: existing.customerViewedAt ?? new Date(),
      paymentInitiatedAt: existing.paymentInitiatedAt ?? new Date(),
      paymentProvider: existing.paymentProvider ?? "STRIPE",
      paymentProviderReference: existing.paymentProviderReference ?? `cbpay_${token}`,
      paymentIntentId: existing.paymentIntentId ?? `cb_pi_${token}`,
      checkoutSessionId: existing.checkoutSessionId ?? `cb_cs_${token}`
    },
    include: {
      proposal: {
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          totalAmountCents: true,
          customerApprovedAt: true,
          productName: true,
          reviewedQuantity: true,
          reviewedMaterialLabel: true,
          reviewedMountingLabel: true
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

  return {
    ok: true,
    depositRequest: customerVisibleDeposit(row),
    paymentSession: {
      provider: row.paymentProvider,
      checkoutSessionId: row.checkoutSessionId,
      paymentIntentId: row.paymentIntentId,
      status: row.status
    }
  };
}
