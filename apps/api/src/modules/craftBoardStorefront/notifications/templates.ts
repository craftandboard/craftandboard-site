import { env } from "../../../lib/env.js";
import type {
  StorefrontChangeRequestEmailPayload,
  StorefrontConfirmationEmailPayload,
  StorefrontEmailPayload,
  StorefrontOrderIssueEmailPayload,
  StorefrontStatusUpdateEmailPayload
} from "./types.js";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amountCents / 100);
}

function baseTemplate(input: {
  preheader: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  detailLines: string[];
}) {
  const detailHtml = input.detailLines
    .map((line) => `<p style="margin:8px 0 0;color:#5c4a3d;font-size:14px;line-height:1.6;">${escapeHtml(line)}</p>`)
    .join("");

  return {
    html: `
      <div style="background:#f8f1e8;padding:32px 16px;font-family:Georgia,serif;">
        <div style="max-width:640px;margin:0 auto;background:#fffaf4;border:1px solid #dbcab9;border-radius:24px;padding:32px;">
          <p style="margin:0;color:#8d6b4f;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">${escapeHtml(input.preheader)}</p>
          <h1 style="margin:16px 0 0;color:#281a13;font-size:36px;line-height:1.1;">${escapeHtml(input.headline)}</h1>
          <p style="margin:16px 0 0;color:#5c4a3d;font-size:16px;line-height:1.7;">${escapeHtml(input.body)}</p>
          <p style="margin:24px 0 0;">
            <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#6f5037;color:#fffaf4;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(input.ctaLabel)}</a>
          </p>
          <div style="margin-top:24px;padding:20px;border-radius:20px;background:#f4e7d8;">
            ${detailHtml}
          </div>
          <p style="margin:24px 0 0;color:#8d6b4f;font-size:13px;line-height:1.6;">Questions? Reply to this email or contact ${escapeHtml(env.CRAFT_BOARD_REPLY_TO_EMAIL)}.</p>
        </div>
      </div>
    `,
    text: `${input.preheader}\n\n${input.headline}\n\n${input.body}\n\n${input.detailLines.join("\n")}\n\n${input.ctaLabel}: ${input.ctaUrl}\n\nQuestions? Reply to this email or contact ${env.CRAFT_BOARD_REPLY_TO_EMAIL}.`
  };
}

export function renderStorefrontConfirmationEmail(input: {
  toEmail: string;
  payload: StorefrontConfirmationEmailPayload;
}): StorefrontEmailPayload {
  const { payload } = input;
  const detailLines = [
    `Order reference: ${payload.orderReference}`,
    `Paid now: ${formatCurrency(payload.amountPaidCents ?? 0)}`,
    `Subtotal: ${formatCurrency(payload.commercialSummary.subtotalAmountCents)}`,
    `Shipping: ${formatCurrency(payload.commercialSummary.shippingAmountCents)}`,
    `Tax: ${formatCurrency(payload.commercialSummary.taxAmountCents)}`,
    `Order total: ${formatCurrency(payload.commercialSummary.totalAmountCents)}`,
    ...payload.productSummary.summaryLines
  ];
  const template = baseTemplate({
    preheader: "Order Confirmation",
    headline: `Your Craft & Board order is confirmed`,
    body: `${payload.customerName}, we received your payment and your custom order is now in the next fulfillment step.`,
    ctaLabel: "View Order Status",
    ctaUrl: payload.statusUrl,
    detailLines
  });

  return {
    toEmail: input.toEmail,
    subject: `Craft & Board order confirmed: ${payload.orderReference}`,
    html: template.html,
    text: template.text
  };
}

export function renderStorefrontStatusUpdateEmail(input: {
  toEmail: string;
  payload: StorefrontStatusUpdateEmailPayload;
}): StorefrontEmailPayload {
  const { payload } = input;
  const template = baseTemplate({
    preheader: "Order Update",
    headline: payload.statusLabel,
    body: `${payload.customerName}, ${payload.statusDescription}`,
    ctaLabel: "View Order Status",
    ctaUrl: payload.statusUrl,
    detailLines: [`Order reference: ${payload.orderReference}`, ...payload.productSummary.summaryLines]
  });

  return {
    toEmail: input.toEmail,
    subject: `Craft & Board update: ${payload.statusLabel}`,
    html: template.html,
    text: template.text
  };
}

export function renderStorefrontChangeRequestEmail(input: {
  toEmail: string;
  payload: StorefrontChangeRequestEmailPayload;
}): StorefrontEmailPayload {
  const { payload } = input;
  const template = baseTemplate({
    preheader: "Change Request Update",
    headline: payload.requestStatusLabel,
    body: `${payload.customerName}, Craft & Board received your ${payload.requestTypeLabel.toLowerCase()} request and will review it before any change is applied.`,
    ctaLabel: "View Order Status",
    ctaUrl: payload.statusUrl,
    detailLines: [
      `Order reference: ${payload.orderReference}`,
      `Request type: ${payload.requestTypeLabel}`,
      `Request summary: ${payload.requestSummary}`
    ]
  });

  return {
    toEmail: input.toEmail,
    subject: `Craft & Board change request received: ${payload.orderReference}`,
    html: template.html,
    text: template.text
  };
}

export function renderStorefrontOrderIssueEmail(input: {
  toEmail: string;
  payload: StorefrontOrderIssueEmailPayload;
}): StorefrontEmailPayload {
  const { payload } = input;
  const template = baseTemplate({
    preheader: "Order Issue Update",
    headline: payload.issueStatusLabel,
    body: `${payload.customerName}, Craft & Board received your ${payload.issueTypeLabel.toLowerCase()} report and will review it before confirming the next step.`,
    ctaLabel: "View Order Status",
    ctaUrl: payload.statusUrl,
    detailLines: [
      `Order reference: ${payload.orderReference}`,
      `Issue type: ${payload.issueTypeLabel}`,
      `Issue summary: ${payload.issueSummary}`
    ]
  });

  return {
    toEmail: input.toEmail,
    subject: `Craft & Board issue report received: ${payload.orderReference}`,
    html: template.html,
    text: template.text
  };
}
