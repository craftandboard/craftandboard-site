import { logger } from "../../../lib/logger.js";
import { prisma } from "../../../lib/prisma.js";
import { submitFieldMetriqStorefrontOrderIssue } from "../fieldMetriqClient.js";
import { sendStorefrontOrderIssueReceivedEmail } from "../notifications/service.js";
import type {
  CraftBoardOrderIssueHandoff,
  CustomerSafeOrderIssueStatus,
  StorefrontCustomerOrderIssueSummary,
  StorefrontOrderIssueInput,
  StorefrontOrderIssueType
} from "./types.js";

type OrderIssueRow = {
  id: string;
  issueType: string;
  status: string;
  customerSafeSummary: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionCustomerMessage: string | null;
};

type OrderIssueDelegate = {
  findMany(args: {
    where: { storefrontOrderAttemptId: string };
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<OrderIssueRow[]>;
  create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  findUniqueOrThrow(args: { where: { id: string } }): Promise<OrderIssueRow>;
};

const orderIssueDelegate = (prisma as typeof prisma & {
  craftBoardOrderIssue: OrderIssueDelegate;
}).craftBoardOrderIssue;

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

function issueTypeLabel(value: StorefrontOrderIssueType) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapCustomerSafeStatus(status: string): CustomerSafeOrderIssueStatus {
  switch (status) {
    case "SUBMITTED":
      return "ISSUE_RECEIVED";
    case "UNDER_REVIEW":
      return "UNDER_REVIEW";
    case "NEEDS_CUSTOMER_FOLLOWUP":
      return "NEEDS_MORE_INFORMATION";
    case "APPROVED_FOR_ACTION":
      return "APPROVED_FOR_ACTION";
    case "DECLINED":
    case "CANCELLED":
      return "DECLINED";
    case "RESOLVED":
      return "RESOLVED";
    default:
      return "ISSUE_RECEIVED";
  }
}

function customerSafeStatusLabel(value: CustomerSafeOrderIssueStatus) {
  switch (value) {
    case "ISSUE_RECEIVED":
      return "Issue Received";
    case "UNDER_REVIEW":
      return "Under Review";
    case "NEEDS_MORE_INFORMATION":
      return "Needs More Information";
    case "APPROVED_FOR_ACTION":
      return "Approved for Action";
    case "DECLINED":
      return "Declined";
    case "RESOLVED":
      return "Resolved";
  }
}

function buildCustomerSafeSummary(input: StorefrontOrderIssueInput) {
  switch (input.issueType) {
    case "SHIPPING_DAMAGE":
      return "Reported shipping damage for the delivered order.";
    case "MISSING_PARTS_OR_HARDWARE":
      return "Reported missing parts or hardware.";
    case "WRONG_ITEM_RECEIVED":
      return "Reported the wrong item or configuration received.";
    case "FINISH_OR_QUALITY_ISSUE":
      return "Reported a finish or quality issue.";
    case "DELIVERY_PROBLEM":
      return "Reported a delivery problem after shipment.";
    case "RETURN_REQUEST":
      return "Submitted a return request for review.";
    case "GENERAL_ORDER_ISSUE":
      return "Submitted a general post-delivery order issue.";
  }
}

async function getAttemptByTokenOrThrow(publicToken: string) {
  const attempt = await prisma.craftBoardStorefrontOrderAttempt.findUnique({
    where: { customerStatusToken: publicToken }
  });

  if (!attempt) {
    throw new Error("Order issue reporting is unavailable.");
  }

  return attempt;
}

function isIssueReportingEligible(status: string | null | undefined) {
  return status === "SHIPPED" || status === "DELIVERED";
}

function buildOrderIssueHandoff(input: {
  attempt: Awaited<ReturnType<typeof getAttemptByTokenOrThrow>>;
  issueId: string;
  payload: StorefrontOrderIssueInput;
  customerSafeSummary: string;
}): CraftBoardOrderIssueHandoff {
  return {
    sourceMetadata: {
      sourceSystem: "Craft & Board",
      sourceChannel: "storefront",
      sourceFlow: "post_delivery_issue_report",
      storefrontOrderAttemptId: input.attempt.id,
      storefrontOrderReference: input.attempt.confirmationCode ?? input.attempt.requestId.toUpperCase(),
      publicStatusToken: input.attempt.customerStatusToken ?? "",
      handoffVersion: "cb-order-issue-v1",
      submittedAt: new Date().toISOString()
    },
    customerSnapshot: {
      name: input.payload.reportedByName,
      email: input.payload.reportedByEmail,
      phone: normalizeText(input.payload.reportedByPhone)
    },
    issueSnapshot: {
      issueType: input.payload.issueType,
      customerMessage: input.payload.customerMessage,
      issueDetails: input.payload.issueDetails,
      customerSafeSummary: input.customerSafeSummary
    },
    storefrontStatusSnapshot: {
      currentOrderStatus: input.attempt.latestCustomerOrderStatus ?? null,
      orderStatusLabel: input.attempt.latestCustomerOrderStatusLabel ?? null
    }
  };
}

export function mapOrderIssueForCustomer(
  row: OrderIssueRow
): StorefrontCustomerOrderIssueSummary {
  const safeStatus = mapCustomerSafeStatus(row.status);
  return {
    id: row.id,
    issueType: row.issueType as StorefrontOrderIssueType,
    issueTypeLabel: issueTypeLabel(row.issueType as StorefrontOrderIssueType),
    customerSafeStatus: safeStatus,
    customerSafeStatusLabel: customerSafeStatusLabel(safeStatus),
    customerSafeSummary: row.customerSafeSummary,
    createdAt: row.createdAt.toISOString(),
    lastUpdatedAt: row.updatedAt.toISOString(),
    resolutionCustomerMessage: row.resolutionCustomerMessage
  };
}

export async function listStorefrontOrderIssuesForAttempt(input: {
  storefrontOrderAttemptId: string;
}) {
  const rows = await orderIssueDelegate.findMany({
    where: { storefrontOrderAttemptId: input.storefrontOrderAttemptId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return rows.map((row: OrderIssueRow) => mapOrderIssueForCustomer(row));
}

export async function createStorefrontOrderIssue(input: {
  publicToken: string;
  payload: StorefrontOrderIssueInput;
}) {
  const attempt = await getAttemptByTokenOrThrow(input.publicToken);

  if (!isIssueReportingEligible(attempt.latestCustomerOrderStatus)) {
    throw new Error("Issue reporting is available after shipment or delivery. For pre-shipment changes, use the change-request path instead.");
  }

  const customerSafeSummary = buildCustomerSafeSummary(input.payload);
  const created = await orderIssueDelegate.create({
    data: {
      organizationId: attempt.organizationId,
      storefrontOrderAttemptId: attempt.id,
      issueType: input.payload.issueType,
      reportedByName: input.payload.reportedByName.trim(),
      reportedByEmail: input.payload.reportedByEmail.trim(),
      reportedByPhone: normalizeText(input.payload.reportedByPhone),
      customerMessage: input.payload.customerMessage.trim(),
      issueDetailsJson: input.payload.issueDetails as any,
      customerAttachmentSummaryJson: (input.payload.issueDetails.customerAttachmentSummary ?? null) as any,
      customerSafeSummary,
      downstreamReviewRequired: true,
      fieldMetriqSubmissionStatus: "NOT_SUBMITTED",
      lastCustomerVisibleUpdateAt: new Date()
    }
  });

  if (!attempt.fieldMetriqSubmissionEnabled) {
    await orderIssueDelegate.update({
      where: { id: created.id },
      data: {
        fieldMetriqSubmissionStatus: "SKIPPED"
      }
    });
  } else {
    const handoff = buildOrderIssueHandoff({
      attempt,
      issueId: created.id,
      payload: input.payload,
      customerSafeSummary
    });

    await orderIssueDelegate.update({
      where: { id: created.id },
      data: {
        fieldMetriqSubmissionStatus: "SUBMITTING",
        fieldMetriqSubmissionAttemptedAt: new Date()
      }
    });

    try {
      const submission = await submitFieldMetriqStorefrontOrderIssue({
        requestId: attempt.requestId,
        payload: handoff as unknown as Record<string, unknown>,
        idempotencyKey: `order-issue:${created.id}`
      });
      const reference =
        typeof submission.body?.reference === "string"
          ? submission.body.reference
          : typeof submission.body?.id === "string"
            ? submission.body.id
            : created.id;

      await orderIssueDelegate.update({
        where: { id: created.id },
        data: {
          fieldMetriqSubmissionStatus: "SUBMITTED",
          fieldMetriqSubmissionSucceededAt: new Date(),
          fieldMetriqSubmissionReference: reference,
          fieldMetriqSubmissionError: null
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("Craft & Board order issue handoff failed", {
        attemptId: attempt.id,
        issueId: created.id,
        error: message
      });
      await orderIssueDelegate.update({
        where: { id: created.id },
        data: {
          fieldMetriqSubmissionStatus: "RETRY_PENDING",
          fieldMetriqSubmissionError: message.slice(0, 1000)
        }
      });
    }
  }

  try {
    await sendStorefrontOrderIssueReceivedEmail({ issueId: created.id });
  } catch (error) {
    logger.warn("Craft & Board order issue notification failed", {
      attemptId: attempt.id,
      issueId: created.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const finalRow = await orderIssueDelegate.findUniqueOrThrow({
    where: { id: created.id }
  });

  return {
    ok: true,
    issue: mapOrderIssueForCustomer(finalRow),
    message: "Your issue report was received. Craft & Board will review it and follow up with the next step."
  };
}
