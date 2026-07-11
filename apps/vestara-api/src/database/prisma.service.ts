import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger.js";

/**
 * PrismaService
 *
 * Responsibilities:
 * - Singleton PrismaClient instance (connection pooling safe)
 * - Shared across API + Workers
 * - Safe initialization lifecycle
 * - Graceful shutdown handling
 */
export class PrismaService {
  private static instance: PrismaClient | null = null;
  private static isInitialized = false;

  /**
   * Get singleton Prisma client
   */
  public get client(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    }

    if (!PrismaService.isInitialized) {
      PrismaService.isInitialized = true;
      this.registerLifecycleHooks(PrismaService.instance);
    }

    return PrismaService.instance;
  }

  /**
   * Attach lifecycle hooks (safe once-only registration)
   */
  private registerLifecycleHooks(prisma: PrismaClient) {
    // Avoid duplicate connections in hot reload / workers
    prisma
      .$connect()
      .then(() => {
        logger.info("🟢 Prisma connected to database", null, "prisma");
      })
      .catch((err:unknown) => {
        logger.error("🔴 Prisma connection error", err, "prisma");
      });

    const shutdown = async (signal: string) => {
      logger.warn(
        `🛑 Received ${signal}. Disconnecting Prisma...`,
        null,
        "prisma"
      );

      try {
        await prisma.$disconnect();
        logger.info(
          "🔵 Prisma disconnected successfully",
          null,
          "prisma"
        );
        process.exit(0);
      } catch (err) {
        logger.error("❌ Prisma shutdown error", err, "prisma");
        process.exit(1);
      }
    };

    // Prevent duplicate listeners (important in dev/hot reload)
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("beforeExit");

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("beforeExit", () => shutdown("beforeExit"));
  }
}

/**
 * Singleton accessor
 */
export const prisma = new PrismaService().client;