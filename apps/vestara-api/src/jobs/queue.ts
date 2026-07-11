import { queues } from "../infra/queue/queue.registry.js";

export function triggerSyncSubscribersJob() {
  return queues.syncSubscribers.add("sync", {
    triggeredAt: new Date().toISOString(),
  });
}