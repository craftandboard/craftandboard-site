import { env } from "../../../../lib/env.js";
import { genericHttpEmailProvider } from "./genericHttpProvider.js";
import { simulatedEmailProvider } from "./simulatedProvider.js";

export function getStorefrontEmailProvider() {
  return env.TRANSACTIONAL_EMAIL_PROVIDER === "GENERIC_HTTP"
    ? genericHttpEmailProvider
    : simulatedEmailProvider;
}
