import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { getWebSocketManager } from './websocket/index.js';

async function main(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  // Attach the real-time WebSocket server to the same HTTP server/port.
  getWebSocketManager().attach(server);

  server.listen(config.api.port, config.api.host, () => {
    logger.info(
      {
        port: config.api.port,
        host: config.api.host,
        environment: config.nodeEnv,
      },
      `🚀 Vestara Admin API server listening on ${config.api.host}:${config.api.port}`,
    );
  });

  // ── Process exception handlers ────────────────────────────────────────
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    // Don't exit — many are recoverable (e.g., failed WS broadcast)
  });

  // ── Scheduled tasks ───────────────────────────────────────────────────
  // Purge audit logs older than 90 days every 24 hours.
  const RETENTION_DAYS = 90;
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const { auditLogRepository } = await import('./repositories/index.js');
      await auditLogRepository.deleteOlderThan(cutoff);
      logger.info({ retentionDays: RETENTION_DAYS }, 'Audit log cleanup completed');
    } catch (err) {
      logger.error({ err }, 'Failed to purge expired audit logs');
    }
  }, CLEANUP_INTERVAL_MS).unref();

  // ── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down server');
    getWebSocketManager().shutdown();
    server.close(() => {
      process.exit(0);
    });
    // Force exit if connections linger.
    setTimeout(() => process.exit(0), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
