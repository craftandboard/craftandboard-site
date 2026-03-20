import type { StorefrontEmailPayload, StorefrontNotificationSendResult } from "../types.js";

export type StorefrontEmailProvider = {
  provider: string;
  sendEmail(input: StorefrontEmailPayload): Promise<StorefrontNotificationSendResult>;
};
