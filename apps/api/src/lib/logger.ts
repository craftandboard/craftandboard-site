export const logger = {
  info(message: string, payload?: unknown) {
    console.log(`[api] ${message}`, payload ?? "");
  },
  error(message: string, payload?: unknown) {
    console.error(`[api] ${message}`, payload ?? "");
  }
};
