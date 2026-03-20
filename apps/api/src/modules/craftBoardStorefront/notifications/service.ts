import { env } from "../../../lib/env.js";
import { logger } from "../../../lib/logger.js";
import { prisma } from "../../../lib/prisma.js";
import { getStorefrontProductDefinition } from "../products/registry.js";
import type { CraftBoardCustomerOrderStatus } from "../status/types.js";
import { getStorefrontEmailProvider } from "./providers/providerRegistry.js";
import {
  renderStorefrontChangeRequestEmail,
  renderStorefrontConfirmationEmail,
  renderStorefrontOrderIssueEmail,
  renderStorefrontStatusUpdateEmail
} from "./templates.js";
import type {
  StorefrontChangeRequestEmailPayload,
  StorefrontConfirmationEmailPayload,
  StorefrontNotificationEventCode,
  StorefrontOrderIssueEmailPayload,
  StorefrontOrderEmailSummary,
  StorefrontStatusUpdateEmailPayload
} from "./types.js";

type ChangeRequestNotificationRow = {
  id: string;
  requestedByName: string;
  requestedByEmail: string;
  requestType: string;
  customerSafeSummary: string;
  storefrontOrderAttempt: Awaited<ReturnType<typeof getAttemptOrThrow>>;
};

const changeRequestDelegate = (prisma as typeof prisma & {
  craftBoardChangeRequest: {
    findUnique(args: {
      where: { id: string };
      include: { storefrontOrderAttempt: true };
    }): Promise<ChangeRequestNotificationRow | null>;
  };
}).craftBoardChangeRequest;

type OrderIssueNotificationRow = {
  id: string;
  reportedByName: string;
  reportedByEmail: string;
  issueType: string;
  status: string;
  customerSafeSummary: string;
  storefrontOrderAttempt: Awaited<ReturnType<typeof getAttemptOrThrow>>;
};

const orderIssueDelegate = (prisma as typeof prisma & {
  craftBoardOrderIssue: {
    findUnique(args: {
      where: { id: string };
      include: { storefrontOrderAttempt: true };
    }): Promise<OrderIssueNotificationRow | null>;
  };
}).craftBoardOrderIssue;

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}

function buildStatusUrl(token: string) {
  return `${env.CRAFT_BOARD_APP_BASE_URL.replace(/\/+$/, "")}/order/status/${encodeURIComponent(token)}`;
}

async function getAttemptOrThrow(attemptId: string) {
  const attempt = await prisma.craftBoardStorefrontOrderAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    throw new Error("Storefront order attempt not found for notification.");
  }

  return attempt;
}

async function getChangeRequestOrThrow(changeRequestId: string) {
  const changeRequest = await changeRequestDelegate.findUnique({
    where: { id: changeRequestId },
    include: {
      storefrontOrderAttempt: true
    }
  });

  if (!changeRequest) {
    throw new Error("Storefront change request not found for notification.");
  }

  return changeRequest;
}

async function getOrderIssueOrThrow(issueId: string) {
  const issue = await orderIssueDelegate.findUnique({
    where: { id: issueId },
    include: {
      storefrontOrderAttempt: true
    }
  });

  if (!issue) {
    throw new Error("Storefront order issue not found for notification.");
  }

  return issue;
}

function buildProductSummary(attempt: Awaited<ReturnType<typeof getAttemptOrThrow>>): StorefrontOrderEmailSummary {
  const definition = getStorefrontProductDefinition({
    productFamily: attempt.productFamily as any,
    productSlug: attempt.productSlug
  });
  const configuration = attempt.configurationJson as Record<string, unknown>;

  return {
    productDisplayName: definition?.displayName ?? "Craft & Board Order",
    summaryLines: definition?.summarizeConfiguration(configuration as never) ?? []
  };
}

async function createNotificationLog(input: {
  attemptId: string;
  eventCode: StorefrontNotificationEventCode;
  recipientEmail: string;
  dedupeKey: string;
  payloadSummary: Record<string, unknown>;
}) {
  const attempt = await getAttemptOrThrow(input.attemptId);
  return prisma.craftBoardNotificationLog.create({
    data: {
      organizationId: attempt.organizationId,
      storefrontOrderAttemptId: attempt.id,
      eventCode: input.eventCode as any,
      recipientEmail: input.recipientEmail,
      dedupeKey: input.dedupeKey,
      payloadSummaryJson: input.payloadSummary as any
    }
  });
}

async function markNotificationSkipped(input: {
  attemptId: string;
  eventCode: StorefrontNotificationEventCode;
  recipientEmail: string;
  dedupeKey: string;
  reason: string;
  payloadSummary: Record<string, unknown>;
}) {
  const log = await createNotificationLog({
    attemptId: input.attemptId,
    eventCode: input.eventCode,
    recipientEmail: input.recipientEmail,
    dedupeKey: input.dedupeKey,
    payloadSummary: input.payloadSummary
  });

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: {
      sendStatus: "SKIPPED",
      sendAttemptedAt: new Date(),
      failureReason: input.reason.slice(0, 1000)
    }
  });
}

export async function sendStorefrontOrderConfirmationEmail(input: {
  attemptId: string;
}) {
  const attempt = await getAttemptOrThrow(input.attemptId);
  const recipientEmail = normalizeText((attempt.customerJson as Record<string, unknown>).email as string | undefined);
  const customerName = normalizeText((attempt.customerJson as Record<string, unknown>).fullName as string | undefined);

  if (!recipientEmail || !customerName || !attempt.customerStatusToken) {
    await markNotificationSkipped({
      attemptId: attempt.id,
      eventCode: "ORDER_CONFIRMATION_READY",
      recipientEmail: recipientEmail ?? "missing-recipient",
      dedupeKey: `attempt:${attempt.id}:confirmation`,
      reason: "Customer email or status token is unavailable for confirmation delivery.",
      payloadSummary: { attemptId: attempt.id }
    });
    return;
  }

  const prior = await prisma.craftBoardNotificationLog.findFirst({
    where: {
      storefrontOrderAttemptId: attempt.id,
      dedupeKey: `attempt:${attempt.id}:confirmation`,
      sendStatus: "SENT"
    }
  });

  if (prior) {
    logger.info("Craft & Board storefront confirmation email deduped", {
      attemptId: attempt.id,
      dedupeKey: prior.dedupeKey
    });
    return;
  }

  const payload: StorefrontConfirmationEmailPayload = {
    customerName,
    orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
    paidAt: attempt.paidAt?.toISOString() ?? new Date().toISOString(),
    amountPaidCents: attempt.depositAmountCents,
    statusUrl: buildStatusUrl(attempt.customerStatusToken),
    productSummary: buildProductSummary(attempt),
    commercialSummary: {
      subtotalAmountCents:
        ((attempt.pricingJson as Record<string, unknown>).quantityTotalCents as number | undefined) ?? 0,
      shippingAmountCents: attempt.shippingCostCents ?? 0,
      taxAmountCents: attempt.taxAmountCents ?? 0,
      totalAmountCents:
        (((attempt.pricingJson as Record<string, unknown>).quantityTotalCents as number | undefined) ?? 0) +
        (attempt.shippingCostCents ?? 0) +
        (attempt.taxAmountCents ?? 0)
    },
    supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
  };

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode: "ORDER_CONFIRMATION_READY",
    recipientEmail,
    dedupeKey: `attempt:${attempt.id}:confirmation`,
    payloadSummary: {
      orderReference: payload.orderReference,
      statusUrl: payload.statusUrl
    }
  });

  if (!env.CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS) {
    await prisma.craftBoardNotificationLog.update({
      where: { id: log.id },
      data: {
        sendStatus: "SKIPPED",
        sendAttemptedAt: new Date(),
        provider: env.TRANSACTIONAL_EMAIL_PROVIDER,
        failureReason: "Transactional email sending is disabled."
      }
    });
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontConfirmationEmail({
    toEmail: recipientEmail,
    payload
  });
  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });

  if (result.sendAccepted) {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        orderConfirmationEmailSentAt: new Date(),
        paymentReceiptEmailSentAt: new Date(),
        lastCustomerStatusEmailed: "ORDER_RECEIVED",
        lastCustomerStatusEmailedAt: new Date()
      }
    });
  }
}

export async function sendStorefrontStatusNotificationIfNeeded(input: {
  attemptId: string;
  currentStatus: CraftBoardCustomerOrderStatus;
  currentStatusLabel: string;
  currentStatusDescription: string;
}) {
  const attempt = await getAttemptOrThrow(input.attemptId);
  if (!env.CRAFT_BOARD_ENABLE_STATUS_UPDATE_EMAILS) {
    return;
  }

  if (
    input.currentStatus === attempt.lastCustomerStatusEmailed ||
    input.currentStatus === "PAYMENT_RECEIVED"
  ) {
    logger.info("Craft & Board storefront status email skipped", {
      attemptId: attempt.id,
      status: input.currentStatus
    });
    return;
  }

  const recipientEmail = normalizeText((attempt.customerJson as Record<string, unknown>).email as string | undefined);
  const customerName = normalizeText((attempt.customerJson as Record<string, unknown>).fullName as string | undefined);

  if (!recipientEmail || !customerName || !attempt.customerStatusToken) {
    await markNotificationSkipped({
      attemptId: attempt.id,
      eventCode: input.currentStatus === "SHIPPED"
        ? "ORDER_SHIPPED"
        : input.currentStatus === "NEEDS_ATTENTION"
          ? "ORDER_NEEDS_ATTENTION"
          : "ORDER_STATUS_UPDATED",
      recipientEmail: recipientEmail ?? "missing-recipient",
      dedupeKey: `attempt:${attempt.id}:status:${input.currentStatus}`,
      reason: "Customer email or status token is unavailable for status delivery.",
      payloadSummary: { status: input.currentStatus }
    });
    return;
  }

  const existing = await prisma.craftBoardNotificationLog.findFirst({
    where: {
      storefrontOrderAttemptId: attempt.id,
      dedupeKey: `attempt:${attempt.id}:status:${input.currentStatus}`,
      sendStatus: "SENT"
    }
  });

  if (existing) {
    return;
  }

  const payload: StorefrontStatusUpdateEmailPayload = {
    customerName,
    orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
    statusCode: input.currentStatus,
    statusLabel: input.currentStatusLabel,
    statusDescription: input.currentStatusDescription,
    statusUrl: buildStatusUrl(attempt.customerStatusToken),
    productSummary: buildProductSummary(attempt),
    supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
  };

  const eventCode: StorefrontNotificationEventCode =
    input.currentStatus === "SHIPPED"
      ? "ORDER_SHIPPED"
      : input.currentStatus === "NEEDS_ATTENTION"
        ? "ORDER_NEEDS_ATTENTION"
        : "ORDER_STATUS_UPDATED";

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode,
    recipientEmail,
    dedupeKey: `attempt:${attempt.id}:status:${input.currentStatus}`,
    payloadSummary: {
      orderReference: payload.orderReference,
      status: payload.statusCode
    }
  });

  if (!env.CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS) {
    await prisma.craftBoardNotificationLog.update({
      where: { id: log.id },
      data: {
        sendStatus: "SKIPPED",
        sendAttemptedAt: new Date(),
        provider: env.TRANSACTIONAL_EMAIL_PROVIDER,
        failureReason: "Transactional email sending is disabled."
      }
    });
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontStatusUpdateEmail({
    toEmail: recipientEmail,
    payload
  });
  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });

  if (result.sendAccepted) {
    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        lastCustomerStatusEmailed: input.currentStatus,
        lastCustomerStatusEmailedAt: new Date()
      }
    });
  }
}

export async function sendStorefrontChangeRequestReceivedEmail(input: {
  changeRequestId: string;
}) {
  const changeRequest = await getChangeRequestOrThrow(input.changeRequestId);
  const attempt = changeRequest.storefrontOrderAttempt;
  const recipientEmail = normalizeText(changeRequest.requestedByEmail);

  if (!recipientEmail || !attempt.customerStatusToken) {
    await markNotificationSkipped({
      attemptId: attempt.id,
      eventCode: "ORDER_CHANGE_REQUEST_RECEIVED",
      recipientEmail: recipientEmail ?? "missing-recipient",
      dedupeKey: `change-request:${changeRequest.id}:received`,
      reason: "Customer email or status token is unavailable for change request delivery.",
      payloadSummary: { changeRequestId: changeRequest.id }
    });
    return;
  }

  const prior = await prisma.craftBoardNotificationLog.findFirst({
    where: {
      storefrontOrderAttemptId: attempt.id,
      dedupeKey: `change-request:${changeRequest.id}:received`,
      sendStatus: "SENT"
    }
  });

  if (prior) {
    return;
  }

  const payload: StorefrontChangeRequestEmailPayload = {
    customerName: changeRequest.requestedByName,
    orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
    requestTypeLabel: changeRequest.requestType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character: string) => character.toUpperCase()),
    requestSummary: changeRequest.customerSafeSummary,
    requestStatusLabel: "Request Received",
    statusUrl: buildStatusUrl(attempt.customerStatusToken),
    supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
  };

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode: "ORDER_CHANGE_REQUEST_RECEIVED",
    recipientEmail,
    dedupeKey: `change-request:${changeRequest.id}:received`,
    payloadSummary: {
      orderReference: payload.orderReference,
      requestType: changeRequest.requestType
    }
  });

  if (!env.CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS) {
    await prisma.craftBoardNotificationLog.update({
      where: { id: log.id },
      data: {
        sendStatus: "SKIPPED",
        sendAttemptedAt: new Date(),
        provider: env.TRANSACTIONAL_EMAIL_PROVIDER,
        failureReason: "Transactional email sending is disabled."
      }
    });
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontChangeRequestEmail({
    toEmail: recipientEmail,
    payload
  });
  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });
}

export async function sendStorefrontChangeRequestUpdatedEmail(input: {
  changeRequestId: string;
  requestStatusLabel: string;
}) {
  const changeRequest = await getChangeRequestOrThrow(input.changeRequestId);
  const attempt = changeRequest.storefrontOrderAttempt;
  const recipientEmail = normalizeText(changeRequest.requestedByEmail);

  if (!recipientEmail || !attempt.customerStatusToken) {
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontChangeRequestEmail({
    toEmail: recipientEmail,
    payload: {
      customerName: changeRequest.requestedByName,
      orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
      requestTypeLabel: changeRequest.requestType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character: string) => character.toUpperCase()),
      requestSummary: changeRequest.customerSafeSummary,
      requestStatusLabel: input.requestStatusLabel,
      statusUrl: buildStatusUrl(attempt.customerStatusToken),
      supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
    }
  });

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode: changeRequest.status === "RESOLVED" ? "ORDER_CHANGE_REQUEST_RESOLVED" : "ORDER_CHANGE_REQUEST_UPDATED",
    recipientEmail,
    dedupeKey: `change-request:${changeRequest.id}:status:${changeRequest.status}`,
    payloadSummary: {
      orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
      requestType: changeRequest.requestType,
      status: changeRequest.status
    }
  });

  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });
}

export async function sendStorefrontOrderIssueReceivedEmail(input: {
  issueId: string;
}) {
  const issue = await getOrderIssueOrThrow(input.issueId);
  const attempt = issue.storefrontOrderAttempt;
  const recipientEmail = normalizeText(issue.reportedByEmail);

  if (!recipientEmail || !attempt.customerStatusToken) {
    await markNotificationSkipped({
      attemptId: attempt.id,
      eventCode: "ORDER_ISSUE_REPORTED",
      recipientEmail: recipientEmail ?? "missing-recipient",
      dedupeKey: `order-issue:${issue.id}:received`,
      reason: "Customer email or status token is unavailable for issue delivery.",
      payloadSummary: { issueId: issue.id }
    });
    return;
  }

  const prior = await prisma.craftBoardNotificationLog.findFirst({
    where: {
      storefrontOrderAttemptId: attempt.id,
      dedupeKey: `order-issue:${issue.id}:received`,
      sendStatus: "SENT"
    }
  });

  if (prior) {
    return;
  }

  const payload: StorefrontOrderIssueEmailPayload = {
    customerName: issue.reportedByName,
    orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
    issueTypeLabel: issue.issueType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character: string) => character.toUpperCase()),
    issueSummary: issue.customerSafeSummary,
    issueStatusLabel: "Issue Received",
    statusUrl: buildStatusUrl(attempt.customerStatusToken),
    supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
  };

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode: "ORDER_ISSUE_REPORTED",
    recipientEmail,
    dedupeKey: `order-issue:${issue.id}:received`,
    payloadSummary: {
      orderReference: payload.orderReference,
      issueType: issue.issueType
    }
  });

  if (!env.CRAFT_BOARD_ENABLE_TRANSACTIONAL_EMAILS) {
    await prisma.craftBoardNotificationLog.update({
      where: { id: log.id },
      data: {
        sendStatus: "SKIPPED",
        sendAttemptedAt: new Date(),
        provider: env.TRANSACTIONAL_EMAIL_PROVIDER,
        failureReason: "Transactional email sending is disabled."
      }
    });
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontOrderIssueEmail({
    toEmail: recipientEmail,
    payload
  });
  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });
}

export async function sendStorefrontOrderIssueUpdatedEmail(input: {
  issueId: string;
  issueStatusLabel: string;
}) {
  const issue = await getOrderIssueOrThrow(input.issueId);
  const attempt = issue.storefrontOrderAttempt;
  const recipientEmail = normalizeText(issue.reportedByEmail);

  if (!recipientEmail || !attempt.customerStatusToken) {
    return;
  }

  const provider = getStorefrontEmailProvider();
  const rendered = renderStorefrontOrderIssueEmail({
    toEmail: recipientEmail,
    payload: {
      customerName: issue.reportedByName,
      orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
      issueTypeLabel: issue.issueType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character: string) => character.toUpperCase()),
      issueSummary: issue.customerSafeSummary,
      issueStatusLabel: input.issueStatusLabel,
      statusUrl: buildStatusUrl(attempt.customerStatusToken),
      supportContact: env.CRAFT_BOARD_REPLY_TO_EMAIL
    }
  });

  const log = await createNotificationLog({
    attemptId: attempt.id,
    eventCode: issue.status === "RESOLVED" ? "ORDER_ISSUE_RESOLVED" : "ORDER_ISSUE_UPDATED",
    recipientEmail,
    dedupeKey: `order-issue:${issue.id}:status:${issue.status}`,
    payloadSummary: {
      orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
      issueType: issue.issueType,
      status: issue.status
    }
  });

  let result;
  try {
    result = await provider.sendEmail(rendered);
  } catch (error) {
    result = {
      sendAccepted: false,
      provider: provider.provider,
      providerMessageId: null,
      sendReference: null,
      warnings: [],
      errorCode: "PROVIDER_THROW",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  await prisma.craftBoardNotificationLog.update({
    where: { id: log.id },
    data: result.sendAccepted
      ? {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          sendStatus: "SENT",
          sendAttemptedAt: new Date(),
          sendSucceededAt: new Date(),
          failureReason: null
        }
      : {
          provider: result.provider,
          sendStatus: "FAILED",
          sendAttemptedAt: new Date(),
          sendFailedAt: new Date(),
          failureReason: result.errorMessage?.slice(0, 1000) ?? "Transactional email delivery failed."
        }
  });
}
