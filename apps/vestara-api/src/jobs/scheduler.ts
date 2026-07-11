import { syncSubscribersQueue } from "./queues/sync-subscribers.queue.js";

export async function runSyncSubscribersJob() {
  return syncSubscribersQueue.add("sync", {
    triggeredAt: new Date().toISOString(),
  });
}