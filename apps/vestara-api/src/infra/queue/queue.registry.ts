import { Queue } from "bullmq";
import { bullmqConnection } from "../redis/bullmq.connection.js";

export const queues = {
  syncSubscribers: new Queue("sync-subscribers", {
    connection: bullmqConnection,
  }),

  // future queues
  // payments: new Queue("payments", { connection: bullmqConnection }),
  // wallet: new Queue("wallet", { connection: bullmqConnection }),
} as const;