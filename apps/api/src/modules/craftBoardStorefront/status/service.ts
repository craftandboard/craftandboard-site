import { logger } from "../../../lib/logger.js";
import { prisma } from "../../../lib/prisma.js";
import { listStorefrontChangeRequestsForAttempt } from "../changeRequests/service.js";
import { listStorefrontOrderIssuesForAttempt } from "../issues/service.js";
import { fetchFieldMetriqStorefrontOrderStatus } from "../fieldMetriqClient.js";
import { sendStorefrontStatusNotificationIfNeeded } from "../notifications/service.js";
import { getStorefrontProductDefinition } from "../products/registry.js";
import type {
  CraftBoardCustomerOrderStatus,
  CustomerOrderStatusPayload,
  CustomerOrderStatusTimelineItem,
  FieldMetriqOrderStatusSnapshot
} from "./types.js";

type StorefrontStatusAttempt = Awaited<ReturnType<typeof getOrderAttemptByStatusTokenOrThrow>>;

const STATUS_ORDER: CraftBoardCustomerOrderStatus[] = [
  "ORDER_RECEIVED",
  "IN_PRODUCTION",
  "PREPARING_TO_SHIP",
  "SHIPPED",
  "DELIVERED"
];

function humanStatus(status: CraftBoardCustomerOrderStatus) {
  switch (status) {
    case "PAYMENT_RECEIVED":
      return "Payment Received";
    case "ORDER_RECEIVED":
      return "Order Received";
    case "IN_REVIEW":
      return "In Review";
    case "IN_PRODUCTION":
      return "In Production";
    case "PREPARING_TO_SHIP":
      return "Preparing to Ship";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "NEEDS_ATTENTION":
      return "Needs Attention";
  }
}

function statusDescription(status: CraftBoardCustomerOrderStatus) {
  switch (status) {
    case "PAYMENT_RECEIVED":
      return "Craft & Board received your payment and is preparing the order for downstream intake.";
    case "ORDER_RECEIVED":
      return "Your order was accepted and is moving through the initial production review step.";
    case "IN_REVIEW":
      return "Your order is in final pre-production review before active shop work begins.";
    case "IN_PRODUCTION":
      return "Your order is actively moving through production.";
    case "PREPARING_TO_SHIP":
      return "Production is nearly complete and the order is being prepared for shipment.";
    case "SHIPPED":
      return "Your order has shipped and is in transit.";
    case "DELIVERED":
      return "Your order was marked as delivered.";
    case "NEEDS_ATTENTION":
      return "Your order needs a manual update from the Craft & Board team before it can move forward.";
  }
}

function nextStepsMessage(status: CraftBoardCustomerOrderStatus) {
  switch (status) {
    case "PAYMENT_RECEIVED":
    case "ORDER_RECEIVED":
    case "IN_REVIEW":
      return "The next update will appear here once production scheduling and fulfillment intake are confirmed.";
    case "IN_PRODUCTION":
      return "The next update will appear when the order moves into shipping preparation.";
    case "PREPARING_TO_SHIP":
      return "The next update will appear when shipment details are available.";
    case "SHIPPED":
      return "The next update will appear when delivery is confirmed.";
    case "DELIVERED":
      return "If anything about the delivery needs attention, reply to your order confirmation or contact support.";
    case "NEEDS_ATTENTION":
      return "A Craft & Board team member will follow up directly if any action is needed from you.";
  }
}

async function getOrderAttemptByStatusTokenOrThrow(publicToken: string) {
  const attempt = await prisma.craftBoardStorefrontOrderAttempt.findUnique({
    where: { customerStatusToken: publicToken }
  });

  if (!attempt) {
    throw new Error("Storefront order status is unavailable.");
  }

  return attempt;
}

function deriveFallbackStatus(attempt: StorefrontStatusAttempt): CraftBoardCustomerOrderStatus {
  if (attempt.paymentStatus === "PAID") {
    if (
      attempt.fieldMetriqSubmissionStatus === "FAILED" ||
      attempt.fieldMetriqSubmissionStatus === "RETRY_PENDING"
    ) {
      return "ORDER_RECEIVED";
    }

    if (attempt.fieldMetriqSubmissionStatus === "SUCCEEDED" && attempt.fieldMetriqSubmissionReference) {
      return "ORDER_RECEIVED";
    }

    return "PAYMENT_RECEIVED";
  }

  return "ORDER_RECEIVED";
}

function normalizeFieldMetriqStatus(
  attempt: StorefrontStatusAttempt,
  snapshot: FieldMetriqOrderStatusSnapshot | null
) {
  if (!snapshot) {
    return deriveFallbackStatus(attempt);
  }

  if (snapshot.needsAttention) {
    return "NEEDS_ATTENTION";
  }
  if (snapshot.deliveredAt) {
    return "DELIVERED";
  }
  if (snapshot.shippedAt) {
    return "SHIPPED";
  }
  if (snapshot.preparingToShipAt) {
    return "PREPARING_TO_SHIP";
  }
  if (snapshot.productionStartedAt) {
    return "IN_PRODUCTION";
  }

  const raw = `${snapshot.rawStatus ?? ""} ${snapshot.rawPhase ?? ""}`.toUpperCase();
  if (raw.includes("DELIVER")) return "DELIVERED";
  if (raw.includes("SHIP")) return "SHIPPED";
  if (raw.includes("PACK") || raw.includes("FULFILL")) return "PREPARING_TO_SHIP";
  if (raw.includes("BUILD") || raw.includes("PRODUCTION")) return "IN_PRODUCTION";
  if (raw.includes("REVIEW")) return "IN_REVIEW";
  if (raw.includes("ATTENTION") || raw.includes("BLOCK")) return "NEEDS_ATTENTION";

  return attempt.fieldMetriqSubmissionReference ? "ORDER_RECEIVED" : deriveFallbackStatus(attempt);
}

function buildTimeline(input: {
  currentStatus: CraftBoardCustomerOrderStatus;
  paidAt: string | null;
  createdAt: string;
  snapshot: FieldMetriqOrderStatusSnapshot | null;
}): CustomerOrderStatusTimelineItem[] {
  const currentIndex = STATUS_ORDER.indexOf(
    input.currentStatus === "PAYMENT_RECEIVED" || input.currentStatus === "IN_REVIEW"
      ? "ORDER_RECEIVED"
      : input.currentStatus === "NEEDS_ATTENTION"
        ? "ORDER_RECEIVED"
        : input.currentStatus
  );

  return STATUS_ORDER.map((statusCode, index) => {
    const occurredAt =
      statusCode === "ORDER_RECEIVED"
        ? input.snapshot?.lastUpdatedAt ?? input.paidAt ?? input.createdAt
        : statusCode === "IN_PRODUCTION"
          ? input.snapshot?.productionStartedAt ?? null
          : statusCode === "PREPARING_TO_SHIP"
            ? input.snapshot?.preparingToShipAt ?? null
            : statusCode === "SHIPPED"
              ? input.snapshot?.shippedAt ?? null
              : input.snapshot?.deliveredAt ?? null;

    return {
      statusCode,
      statusLabel: humanStatus(statusCode),
      description: statusDescription(statusCode),
      occurredAt,
      isCurrent:
        input.currentStatus === "NEEDS_ATTENTION"
          ? index === 0
          : currentIndex === index,
      isComplete:
        input.currentStatus === "DELIVERED"
          ? true
          : input.currentStatus === "NEEDS_ATTENTION"
            ? index === 0
            : currentIndex >= index
    };
  });
}

function parseStatusSnapshot(value: unknown): FieldMetriqOrderStatusSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as FieldMetriqOrderStatusSnapshot;
}

async function refreshDownstreamStatus(attempt: StorefrontStatusAttempt) {
  if (!attempt.fieldMetriqOrderReference && !attempt.fieldMetriqSubmissionReference) {
    return parseStatusSnapshot(attempt.fieldMetriqOrderStatusSnapshotJson);
  }

  try {
    const snapshot = await fetchFieldMetriqStorefrontOrderStatus({
      requestId: attempt.requestId,
      downstreamReference:
        attempt.fieldMetriqOrderReference ??
        attempt.fieldMetriqSubmissionReference ??
        attempt.requestId
    });

    await prisma.craftBoardStorefrontOrderAttempt.update({
      where: { id: attempt.id },
      data: {
        fieldMetriqOrderReference:
          snapshot.orderReference ??
          attempt.fieldMetriqOrderReference ??
          attempt.fieldMetriqSubmissionReference,
        fieldMetriqOrderStatusSnapshotJson: snapshot as any,
        fieldMetriqLastStatusSyncAt: new Date()
      }
    });

    logger.info("Craft & Board customer status synced from FieldMetriq", {
      attemptId: attempt.id,
      requestId: attempt.requestId,
      orderReference: snapshot.orderReference ?? attempt.fieldMetriqSubmissionReference
    });

    return snapshot;
  } catch (error) {
    logger.warn("Craft & Board customer status sync failed", {
      attemptId: attempt.id,
      requestId: attempt.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return parseStatusSnapshot(attempt.fieldMetriqOrderStatusSnapshotJson);
  }
}

function buildProductSummary(attempt: StorefrontStatusAttempt) {
  const definition = getStorefrontProductDefinition({
    productFamily: attempt.productFamily as any,
    productSlug: attempt.productSlug
  });
  const configuration = attempt.configurationJson as Record<string, unknown>;

  return {
    productDisplayName: definition?.displayName ?? "Craft & Board Order",
    summaryLines: definition?.summarizeConfiguration(configuration as never) ?? [],
    quantity: typeof configuration.quantity === "number" ? configuration.quantity : 1
  };
}

export async function getCustomerStorefrontOrderStatus(input: {
  publicToken: string;
}): Promise<{ ok: true; status: CustomerOrderStatusPayload }> {
  const attempt = await getOrderAttemptByStatusTokenOrThrow(input.publicToken);
  const snapshot = await refreshDownstreamStatus(attempt);
  const currentStatus = normalizeFieldMetriqStatus(attempt, snapshot);
  const lastUpdatedAt =
    snapshot?.lastUpdatedAt ??
    attempt.latestCustomerStatusUpdatedAt?.toISOString() ??
    attempt.fieldMetriqLastStatusSyncAt?.toISOString() ??
    attempt.paidAt?.toISOString() ??
    attempt.createdAt.toISOString();
  const productSummary = buildProductSummary(attempt);
  const changeRequests = await listStorefrontChangeRequestsForAttempt({
    storefrontOrderAttemptId: attempt.id
  });
  const issues = await listStorefrontOrderIssuesForAttempt({
    storefrontOrderAttemptId: attempt.id
  });
  const timeline = buildTimeline({
    currentStatus,
    paidAt: attempt.paidAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString(),
    snapshot
  });

  await prisma.craftBoardStorefrontOrderAttempt.update({
    where: { id: attempt.id },
    data: {
      latestCustomerOrderStatus: currentStatus,
      latestCustomerOrderStatusLabel: humanStatus(currentStatus),
      latestCustomerStatusUpdatedAt: new Date(lastUpdatedAt),
      customerStatusTimelineJson: timeline as any,
      customerStatusLastViewedAt: new Date()
    }
  });

  try {
    await sendStorefrontStatusNotificationIfNeeded({
      attemptId: attempt.id,
      currentStatus,
      currentStatusLabel: humanStatus(currentStatus),
      currentStatusDescription: statusDescription(currentStatus)
    });
  } catch (error) {
    logger.warn("Craft & Board storefront status notification send failed", {
      attemptId: attempt.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    ok: true,
    status: {
      orderReference: attempt.confirmationCode ?? attempt.requestId.toUpperCase(),
      statusTokenSafe: input.publicToken,
      currentStatus,
      currentStatusLabel: humanStatus(currentStatus),
      currentStatusDescription: statusDescription(currentStatus),
      lastUpdatedAt,
      orderPlacedAt: attempt.createdAt.toISOString(),
      paidAt: attempt.paidAt?.toISOString() ?? null,
      amountPaidCents: attempt.depositAmountCents,
      totalAmountCents:
        ((attempt.pricingJson as Record<string, unknown>).quantityTotalCents as number | undefined ?? 0) +
        (attempt.shippingCostCents ?? 0) +
        (attempt.taxAmountCents ?? 0),
      productSummary,
      shippingSummary: {
        shippingMode: attempt.shippingMode,
        packagingProfile: attempt.packagingProfile,
        carrierName: snapshot?.carrierName ?? attempt.shippingCarrierName,
        serviceLevel: snapshot?.serviceLevel ?? attempt.shippingServiceLevel,
        estimatedTransitDays: attempt.estimatedTransitDays,
        shippingCostCents: attempt.shippingCostCents,
        trackingNumber: snapshot?.trackingNumber ?? null,
        trackingUrl: snapshot?.trackingUrl ?? null,
        customerMessage:
          currentStatus === "SHIPPED" || currentStatus === "DELIVERED"
            ? "Shipping updates shown here reflect the latest downstream fulfillment data available to Craft & Board."
            : nextStepsMessage(currentStatus)
      },
      changeRequestEligible: !(currentStatus === "SHIPPED" || currentStatus === "DELIVERED"),
      changeRequestMessage:
        currentStatus === "SHIPPED" || currentStatus === "DELIVERED"
          ? "This order is already in shipment or delivered, so use the support path for any follow-up changes."
          : "Changes are reviewed before they are applied, and timing may affect what is still possible.",
      changeRequests,
      issueReportEligible: currentStatus === "SHIPPED" || currentStatus === "DELIVERED",
      issueReportMessage:
        currentStatus === "SHIPPED" || currentStatus === "DELIVERED"
          ? "If there was damage, a delivery problem, or anything incorrect about the order, report it here for review."
          : "Issue reporting is intended for shipped or delivered orders. If you need a pre-shipment modification, use the change-request path instead.",
      issues,
      timeline,
      supportMessage:
        currentStatus === "NEEDS_ATTENTION"
          ? "If you need an update right away, reply to your confirmation email and the Craft & Board team will help."
          : null
    }
  };
}
