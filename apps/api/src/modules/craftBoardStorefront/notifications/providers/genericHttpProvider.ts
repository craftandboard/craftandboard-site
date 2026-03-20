import { env } from "../../../../lib/env.js";
import type { StorefrontEmailProvider } from "./types.js";

export const genericHttpEmailProvider: StorefrontEmailProvider = {
  provider: "GENERIC_HTTP",
  async sendEmail(input) {
    if (!env.TRANSACTIONAL_EMAIL_API_BASE_URL) {
      return {
        sendAccepted: false,
        provider: "GENERIC_HTTP",
        providerMessageId: null,
        sendReference: null,
        warnings: [],
        errorCode: "CONFIG_MISSING",
        errorMessage: "Transactional email API base URL is not configured."
      };
    }

    const response = await fetch(env.TRANSACTIONAL_EMAIL_API_BASE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: env.TRANSACTIONAL_EMAIL_API_KEY
          ? `Bearer ${env.TRANSACTIONAL_EMAIL_API_KEY}`
          : ""
      },
      body: JSON.stringify({
        from: {
          email: env.TRANSACTIONAL_EMAIL_FROM_EMAIL,
          name: env.TRANSACTIONAL_EMAIL_FROM_NAME
        },
        replyTo: env.CRAFT_BOARD_REPLY_TO_EMAIL,
        to: [{ email: input.toEmail }],
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    const bodyText = await response.text();
    let body: Record<string, unknown> | null = null;
    if (bodyText) {
      try {
        body = JSON.parse(bodyText) as Record<string, unknown>;
      } catch {
        body = { raw: bodyText };
      }
    }

    if (!response.ok) {
      return {
        sendAccepted: false,
        provider: "GENERIC_HTTP",
        providerMessageId: null,
        sendReference: null,
        warnings: [],
        errorCode: `HTTP_${response.status}`,
        errorMessage: bodyText || "Transactional email provider rejected the request."
      };
    }

    return {
      sendAccepted: true,
      provider: "GENERIC_HTTP",
      providerMessageId:
        typeof body?.messageId === "string"
          ? body.messageId
          : typeof body?.id === "string"
            ? body.id
            : null,
      sendReference: typeof body?.reference === "string" ? body.reference : null,
      warnings: [],
      errorCode: null,
      errorMessage: null
    };
  }
};
