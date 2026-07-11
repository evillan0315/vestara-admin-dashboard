import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const app = createApp();

  app.listen(config.api.port, config.api.host, () => {
    logger.info(
      {
        port: config.api.port,
        host: config.api.host,
        environment: config.nodeEnv,
      },
      `🚀 Vestara Admin API server listening on ${config.api.host}:${config.api.port}`,
    );
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
