import { Queue } from "bullmq";
import { bullmqConnection } from "../../config/bullmq.connection.js";

export const syncSubscribersQueue = new Queue(
  "sync-subscribers",
  {
    connection: bullmqConnection,
  },
);