import type { QueueName } from "../queues/index.js";

export function describeJob(name: QueueName) {
  return {
    queue: name,
    handler: "noop",
    scope: "foundation-only"
  };
}
