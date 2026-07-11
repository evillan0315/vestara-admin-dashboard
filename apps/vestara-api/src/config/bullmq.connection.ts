import type { ConnectionOptions } from "bullmq";

export const bullmqConnection: ConnectionOptions = {
  url: process.env.REDIS_URL,
};