/* import { Worker, Job } from "bullmq";
import { prisma } from "../../database/prisma.service.js";
import { redis } from "../../infra/redis/redis.client.js";
import { logger } from "../../config/logger.js";

export interface RoiJobData {
  investmentId: string;
  userId: string;
  cycleId: string;
  rate: number;
  principal: number;
  timestamp: string;
}

export const roiWorker = new Worker<RoiJobData>(
  "roi.queue",
  async (job) => {
    const { investmentId, userId, cycleId, rate, principal } = job.data;

    logger.info(`[ROI] cycle=${cycleId}`);

    const lockKey = `roi:${cycleId}`;
    const locked = await redis.set(lockKey, "1", "NX", "EX", 120);

    if (!locked) return { skipped: true };

    try {
      const roiAmount = Number((principal * (rate / 100)).toFixed(2));

      await prisma.$transaction(async (tx) => {
        // 1. Create payout (ROI record)
        await tx.investmentPayout.create({
          data: {
            investmentId,
            amount: roiAmount,
            payoutDate: new Date(),
            status: "PROCESSING",
          },
        });

        // 2. Ledger entry
        await tx.walletTransaction.create({
          data: {
            walletId: userId,
            type: "ROI_PAYOUT",
            amount: roiAmount,
            referenceId: investmentId,
            description: `ROI cycle ${cycleId}`,
          },
        });

        // 3. Recompute wallet
        const sum = await tx.walletTransaction.aggregate({
          where: { walletId: userId },
          _sum: { amount: true },
        });

        await tx.wallet.update({
          where: { userId },
          data: {
            balance: sum._sum.amount ?? 0,
          },
        });
      });

      await redis.del(lockKey);

      return { success: true, cycleId, roiAmount };
    } catch (err) {
      await redis.del(lockKey);
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
); */