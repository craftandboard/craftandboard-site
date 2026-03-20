export const logger = {
  info(message: string, payload?: unknown) {
    console.log(`[api] ${message}`, payload ?? "");
  },
  warn(message: string, payload?: unknown) {
    console.warn(`[api] ${message}`, payload ?? "");
  },
  error(message: string, payload?: unknown) {
    console.error(`[api] ${message}`, payload ?? "");
  }
};
