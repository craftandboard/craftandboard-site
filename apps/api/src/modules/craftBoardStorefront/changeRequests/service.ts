import { logger } from "../../../lib/logger.js";
import { prisma } from "../../../lib/prisma.js";
import { submitFieldMetriqStorefrontChangeRequest } from "../fieldMetriqClient.js";
import {
  sendStorefrontChangeRequestReceivedEmail
} from "../notifications/service.js";
import type {
  CraftBoardChangeRequestHandoff,
  CustomerSafeChangeRequestStatus,
  StorefrontChangeRequestInput,
  StorefrontChangeRequestType,
  StorefrontCustomerChangeRequestSummary
} from "./types.js";

type ChangeRequestRow = {
  id: string;
  requestType: string;
  status: string;
  customerSafeSummary: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionCustomerMessage: string | null;
};

type ChangeRequestDelegate = {
  findMany(args: {
    where: { storefrontOrderAttemptId: string };
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<ChangeRequestRow[]>;
  create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  findUniqueOrThrow(args: { where: { id: string } }): Promise<ChangeRequestRow>;
};

const changeRequestDelegate = (prisma as typeof prisma & {
  craftBoardChangeRequest: ChangeRequestDelegate;
}).craftBoardChangeRequest;

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

function requestTypeLabel(value: StorefrontChangeRequestType) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapCustomerSafeStatus(
  status: string
): CustomerSafeChangeRequestStatus {
  switch (status) {
    case "SUBMITTED":
      return "REQUEST_RECEIVED";
    case "UNDER_REVIEW":
      return "UNDER_REVIEW";
    case "NEEDS_CUSTOMER_FOLLOWUP":
      return "NEEDS_MORE_INFORMATION";
    case "APPROVED_PENDING_UPDATE":
      return "APPROVED";
    case "DECLINED":
    case "CANCELLED":
      return "DECLINED";
    case "RESOLVED":
      return "RESOLVED";
    default:
      return "REQUEST_RECEIVED";
  }
}

function customerSafeStatusLabel(value: CustomerSafeChangeRequestStatus) {
  switch (value) {
    case "REQUEST_RECEIVED":
      return "Request Received";
    case "UNDER_REVIEW":
      return "Under Review";
    case "NEEDS_MORE_INFORMATION":
      return "Needs More Information";
    case "APPROVED":
      return "Approved";
    case "DECLINED":
      return "Declined";
    case "RESOLVED":
      return "Resolved";
  }
}

function buildCustomerSafeSummary(input: StorefrontChangeRequestInput) {
  switch (input.requestType) {
    case "UPDATE_DIMENSIONS":
      return "Requested dimension update for the order configuration.";
    case "UPDATE_MATERIAL_OR_FINISH":
      return "Requested material or finish change.";
    case "UPDATE_MOUNTING":
      return "Requested mounting update.";
    case "UPDATE_SHIPPING_ADDRESS":
      return "Requested shipping address update.";
    case "HOLD_ORDER":
      return "Requested an order hold before fulfillment.";
    case "CANCEL_REQUEST":
      return "Requested order cancellation review.";
    case "GENERAL_CHANGE_REQUEST":
      return "Submitted a general post-purchase change request.";
  }
}

async function getAttemptByTokenOrThrow(publicToken: string) {
  const attempt = await prisma.craftBoardStorefrontOrderAttempt.findUnique({
    where: { customerStatusToken: publicToken }
  });

  if (!attempt) {
    throw new Error("Order change request is unavailable.");
  }

  return attempt;
}

function isChangeRequestBlocked(status: string | null | undefined) {
  return status === "SHIPPED" || status === "DELIVERED";
}

function buildChangeRequestHandoff(input: {
  attempt: Awaited<ReturnType<typeof getAttemptByTokenOrThrow>>;
  changeRequestId: string;
  payload: StorefrontChangeRequestInput;
  customerSafeSummary: string;
}): CraftBoardChangeRequestHandoff {
  return {
    sourceMetadata: {
      sourceSystem: "Craft & Board",
      sourceChannel: "storefront",
      sourceFlow: "post_purchase_change_request",
      storefrontOrderAttemptId: input.attempt.id,
      storefrontOrderReference: input.attempt.confirmationCode ?? input.attempt.requestId.toUpperCase(),
      publicStatusToken: input.attempt.customerStatusToken ?? "",
      handoffVersion: "cb-change-request-v1",
      submittedAt: new Date().toISOString()
    },
    customerSnapshot: {
      name: input.payload.requestedByName,
      email: input.payload.requestedByEmail,
      phone: normalizeText(input.payload.requestedByPhone)
    },
    requestSnapshot: {
      requestType: input.payload.requestType,
      customerMessage: input.payload.customerMessage,
      requestedChanges: input.payload.requestedChanges,
      customerSafeSummary: input.customerSafeSummary
    },
    storefrontStatusSnapshot: {
      currentOrderStatus: input.attempt.latestCustomerOrderStatus ?? null,
      orderStatusLabel: input.attempt.latestCustomerOrderStatusLabel ?? null
    }
  };
}

export function mapChangeRequestForCustomer(
  row: ChangeRequestRow
): StorefrontCustomerChangeRequestSummary {
  const safeStatus = mapCustomerSafeStatus(row.status);
  return {
    id: row.id,
    requestType: row.requestType as StorefrontChangeRequestType,
    requestTypeLabel: requestTypeLabel(row.requestType as StorefrontChangeRequestType),
    customerSafeStatus: safeStatus,
    customerSafeStatusLabel: customerSafeStatusLabel(safeStatus),
    customerSafeSummary: row.customerSafeSummary,
    createdAt: row.createdAt.toISOString(),
    lastUpdatedAt: row.updatedAt.toISOString(),
    resolutionCustomerMessage: row.resolutionCustomerMessage
  };
}

export async function listStorefrontChangeRequestsForAttempt(input: {
  storefrontOrderAttemptId: string;
}) {
  const rows = await changeRequestDelegate.findMany({
    where: { storefrontOrderAttemptId: input.storefrontOrderAttemptId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return rows.map((row: ChangeRequestRow) => mapChangeRequestForCustomer(row));
}

export async function createStorefrontChangeRequest(input: {
  publicToken: string;
  payload: StorefrontChangeRequestInput;
}) {
  const attempt = await getAttemptByTokenOrThrow(input.publicToken);

  if (isChangeRequestBlocked(attempt.latestCustomerOrderStatus)) {
    throw new Error("This order is already in shipment or delivered, so use the support path instead of the standard change-request form.");
  }

  const customerSafeSummary = buildCustomerSafeSummary(input.payload);
  const created = await changeRequestDelegate.create({
    data: {
      organizationId: attempt.organizationId,
      storefrontOrderAttemptId: attempt.id,
      requestType: input.payload.requestType,
      requestedByName: input.payload.requestedByName.trim(),
      requestedByEmail: input.payload.requestedByEmail.trim(),
      requestedByPhone: normalizeText(input.payload.requestedByPhone),
      customerMessage: input.payload.customerMessage.trim(),
      requestedChangesJson: input.payload.requestedChanges as any,
      customerSafeSummary,
      downstreamReviewRequired: true,
      fieldMetriqSubmissionStatus: "NOT_SUBMITTED",
      lastCustomerVisibleUpdateAt: new Date()
    }
  });

  if (!attempt.fieldMetriqSubmissionEnabled) {
    await changeRequestDelegate.update({
      where: { id: created.id },
      data: {
        fieldMetriqSubmissionStatus: "SKIPPED"
      }
    });
  } else {
    const handoff = buildChangeRequestHandoff({
      attempt,
      changeRequestId: created.id,
      payload: input.payload,
      customerSafeSummary
    });

    await changeRequestDelegate.update({
      where: { id: created.id },
      data: {
        fieldMetriqSubmissionStatus: "SUBMITTING",
        fieldMetriqSubmissionAttemptedAt: new Date()
      }
    });

    try {
      const submission = await submitFieldMetriqStorefrontChangeRequest({
        requestId: attempt.requestId,
        payload: handoff as unknown as Record<string, unknown>,
        idempotencyKey: `change-request:${created.id}`
      });
      const reference =
        typeof submission.body?.reference === "string"
          ? submission.body.reference
          : typeof submission.body?.id === "string"
            ? submission.body.id
            : created.id;

      await changeRequestDelegate.update({
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
      logger.warn("Craft & Board change request handoff failed", {
        attemptId: attempt.id,
        changeRequestId: created.id,
        error: message
      });
      await changeRequestDelegate.update({
        where: { id: created.id },
        data: {
          fieldMetriqSubmissionStatus: "RETRY_PENDING",
          fieldMetriqSubmissionError: message.slice(0, 1000)
        }
      });
    }
  }

  try {
    await sendStorefrontChangeRequestReceivedEmail({ changeRequestId: created.id });
  } catch (error) {
    logger.warn("Craft & Board change request notification failed", {
      attemptId: attempt.id,
      changeRequestId: created.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const finalRow = await changeRequestDelegate.findUniqueOrThrow({
    where: { id: created.id }
  });

  return {
    ok: true,
    changeRequest: mapChangeRequestForCustomer(finalRow),
    message: "Your request was received. Craft & Board will review it before any changes are applied."
  };
}
