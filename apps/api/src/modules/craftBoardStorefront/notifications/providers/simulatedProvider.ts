import { randomUUID } from "node:crypto";
import type { StorefrontEmailProvider } from "./types.js";

export const simulatedEmailProvider: StorefrontEmailProvider = {
  provider: "SIMULATED",
  async sendEmail() {
    return {
      sendAccepted: true,
      provider: "SIMULATED",
      providerMessageId: `sim_email_${randomUUID()}`,
      sendReference: null,
      warnings: [],
      errorCode: null,
      errorMessage: null
    };
  }
};
