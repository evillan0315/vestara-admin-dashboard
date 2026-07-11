import type { FastifyPluginAsync } from "fastify";
import { triggerSyncSubscribersJob } from "../../jobs/queue.js";

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/cron/sync-subscribers", async (req, reply) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const job = await triggerSyncSubscribersJob();

    return {
      success: true,
      jobId: job.id,
    };
  });
};

export default syncRoutes;