import { env } from "../../lib/env.js";
import type { FieldMetriqOrderStatusSnapshot } from "./status/types.js";

function parseJsonBody(bodyText: string) {
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return { raw: bodyText };
  }
}

export async function submitFieldMetriqStorefrontOrder(input: {
  payload: Record<string, unknown>;
  requestId: string;
  idempotencyKey?: string | null;
}) {
  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    throw new Error("FieldMetriq submission is disabled.");
  }

  if (!env.FIELDMETRIQ_API_BASE_URL || !env.FIELDMETRIQ_API_TOKEN) {
    throw new Error("FieldMetriq API configuration is incomplete.");
  }

  const response = await fetch(
    `${env.FIELDMETRIQ_API_BASE_URL.replace(/\/+$/, "")}${env.FIELDMETRIQ_ORDER_INTAKE_PATH}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.FIELDMETRIQ_API_TOKEN}`,
        "x-craft-board-request-id": input.requestId,
        ...(input.idempotencyKey
          ? { "x-craft-board-idempotency-key": input.idempotencyKey }
          : {})
      },
      body: JSON.stringify(input.payload)
    }
  );

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new Error(
      `FieldMetriq API rejected the request with ${response.status}${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  return {
    statusCode: response.status,
    body: parsedBody
  };
}

export async function submitFieldMetriqStorefrontChangeRequest(input: {
  payload: Record<string, unknown>;
  requestId: string;
  idempotencyKey?: string | null;
}) {
  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    throw new Error("FieldMetriq submission is disabled.");
  }

  if (!env.FIELDMETRIQ_API_BASE_URL || !env.FIELDMETRIQ_API_TOKEN) {
    throw new Error("FieldMetriq API configuration is incomplete.");
  }

  const response = await fetch(
    `${env.FIELDMETRIQ_API_BASE_URL.replace(/\/+$/, "")}${env.FIELDMETRIQ_CHANGE_REQUEST_PATH}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.FIELDMETRIQ_API_TOKEN}`,
        "x-craft-board-request-id": input.requestId,
        ...(input.idempotencyKey
          ? { "x-craft-board-idempotency-key": input.idempotencyKey }
          : {})
      },
      body: JSON.stringify(input.payload)
    }
  );

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new Error(
      `FieldMetriq change request API rejected the request with ${response.status}${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  return {
    statusCode: response.status,
    body: parsedBody
  };
}

export async function submitFieldMetriqStorefrontOrderIssue(input: {
  payload: Record<string, unknown>;
  requestId: string;
  idempotencyKey?: string | null;
}) {
  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    throw new Error("FieldMetriq submission is disabled.");
  }

  if (!env.FIELDMETRIQ_API_BASE_URL || !env.FIELDMETRIQ_API_TOKEN) {
    throw new Error("FieldMetriq API configuration is incomplete.");
  }

  const response = await fetch(
    `${env.FIELDMETRIQ_API_BASE_URL.replace(/\/+$/, "")}${env.FIELDMETRIQ_ORDER_ISSUE_PATH}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.FIELDMETRIQ_API_TOKEN}`,
        "x-craft-board-request-id": input.requestId,
        ...(input.idempotencyKey
          ? { "x-craft-board-idempotency-key": input.idempotencyKey }
          : {})
      },
      body: JSON.stringify(input.payload)
    }
  );

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new Error(
      `FieldMetriq order issue API rejected the request with ${response.status}${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  return {
    statusCode: response.status,
    body: parsedBody
  };
}

function readString(body: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = body?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export async function fetchFieldMetriqStorefrontOrderStatus(input: {
  requestId: string;
  downstreamReference: string;
}): Promise<FieldMetriqOrderStatusSnapshot> {
  if (!env.CRAFT_BOARD_ENABLE_FIELDMETRIQ_SUBMISSION) {
    throw new Error("FieldMetriq status sync is disabled.");
  }

  if (!env.FIELDMETRIQ_API_BASE_URL || !env.FIELDMETRIQ_API_TOKEN) {
    throw new Error("FieldMetriq API configuration is incomplete.");
  }

  const path = env.FIELDMETRIQ_ORDER_STATUS_PATH_TEMPLATE.replace(
    "{reference}",
    encodeURIComponent(input.downstreamReference)
  );

  const response = await fetch(`${env.FIELDMETRIQ_API_BASE_URL.replace(/\/+$/, "")}${path}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${env.FIELDMETRIQ_API_TOKEN}`,
      "x-craft-board-request-id": input.requestId
    }
  });

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new Error(
      `FieldMetriq status API rejected the request with ${response.status}${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  const body = parsedBody as Record<string, unknown> | null;
  const trackingUrl =
    typeof body?.tracking === "object" &&
    body.tracking &&
    typeof (body.tracking as Record<string, unknown>).url === "string"
      ? ((body.tracking as Record<string, unknown>).url as string)
      : readString(body, ["trackingUrl"]);

  return {
    orderReference: readString(body, ["orderReference", "reference", "orderId"]) ?? input.downstreamReference,
    rawStatus: readString(body, ["status", "statusCode", "orderStatus"]),
    rawPhase: readString(body, ["phase", "stage", "productionStage"]),
    statusLabel: readString(body, ["statusLabel", "label"]),
    productionStartedAt: readString(body, ["productionStartedAt", "buildStartedAt", "startedAt"]),
    preparingToShipAt: readString(body, ["preparingToShipAt", "readyToShipAt", "fulfillmentReadyAt"]),
    shippedAt: readString(body, ["shippedAt"]),
    deliveredAt: readString(body, ["deliveredAt"]),
    lastUpdatedAt: readString(body, ["updatedAt", "lastUpdatedAt", "statusUpdatedAt"]),
    carrierName: readString(body, ["carrierName"]),
    serviceLevel: readString(body, ["serviceLevel", "shippingService"]),
    trackingNumber:
      typeof body?.tracking === "object" &&
      body.tracking &&
      typeof (body.tracking as Record<string, unknown>).number === "string"
        ? ((body.tracking as Record<string, unknown>).number as string)
        : readString(body, ["trackingNumber"]),
    trackingUrl,
    needsAttention:
      body?.needsAttention === true ||
      readString(body, ["status", "statusCode", "orderStatus"])?.toUpperCase().includes("ATTENTION") === true,
    customerNotes:
      Array.isArray(body?.customerNotes) ?
        body.customerNotes.filter((value): value is string => typeof value === "string") :
        [],
    raw: body
  };
}
