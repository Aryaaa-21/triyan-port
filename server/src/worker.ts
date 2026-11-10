import { createServer } from 'node:http';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

/**
 * The worker process. It owns every scheduled job so that no HTTP request ever
 * performs a synchronisation inline (spec §43). Jobs are registered in Phase 12.
 */
const main = async (): Promise<void> => {
  await connectDatabase();

  logger.info(
    { syncEnabled: env.SYNC_ENABLED, syncCron: env.SYNC_CRON, provider: env.INSTAGRAM_PROVIDER },
    'Triyan worker started',
  );

  if (!env.SYNC_ENABLED) {
    logger.warn('SYNC_ENABLED is false — no Instagram synchronisation will run');
  }

  // Minimal health endpoint so the platform can tell a live worker from a crashed one.
  const health = createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'triyan-worker' }));
      return;
    }
    res.writeHead(404).end();
  });
  health.listen(env.PORT + 1);

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Worker shutting down');
    health.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Worker failed to start');
  process.exit(1);
});
