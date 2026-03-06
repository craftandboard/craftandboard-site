export const queueNames = [
  "amazon-import",
  "batch-builder",
  "nesting",
  "cnc-generation",
  "pdf-generation",
  "shipstation-sync"
] as const;

export type QueueName = (typeof queueNames)[number];
