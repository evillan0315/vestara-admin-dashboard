import { Worker } from "bullmq";
import { bullmqConnection } from "../redis/bullmq.connection.js";

import { syncSubscribersProcessor } from "../../jobs/workers/sync-subscribers.worker.js";

export const workers = {
  syncSubscribers: new Worker(
    "sync-subscribers",
    syncSubscribersProcessor,
    {
      connection: bullmqConnection,
    },
  ),
};