import type { ConnectionOptions } from "bullmq";

export const bullmqConnection = {
  url: process.env.REDIS_URL,
};