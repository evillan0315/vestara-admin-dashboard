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
