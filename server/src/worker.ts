import { createServer } from 'node:http';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { getInstagramProvider } from './services/instagram/index.js';
import { runSync } from './services/instagram/sync.service.js';
import { intervalFromCron } from './services/instagram/schedule.js';

/**
 * The worker process. It owns every scheduled job so that no HTTP request ever
 * performs a synchronisation inline (spec §43).
 */
const main = async (): Promise<void> => {
  if (env.MONGODB_URI) {
    await connectDatabase();
  } else {
    logger.warn('MONGODB_URI is not set — the worker will run no jobs that need a database');
  }

  logger.info(
    { syncEnabled: env.SYNC_ENABLED, syncCron: env.SYNC_CRON, provider: env.INSTAGRAM_PROVIDER },
    'Triyan worker started',
  );

  let timer: NodeJS.Timeout | null = null;
  if (!env.SYNC_ENABLED) {
    logger.warn('SYNC_ENABLED is false — no Instagram synchronisation will run');
  } else if (!env.MONGODB_URI) {
    logger.warn('SYNC_ENABLED but no database — sync will not run');
  } else {
    const tick = async () => {
      try {
        const result = await runSync({ mode: 'INCREMENTAL', provider: getInstagramProvider() });
        logger.info({ result }, 'Instagram sync finished');
      } catch (error) {
        // A failing sync must never take the worker down.
        logger.error({ err: error }, 'Instagram sync crashed');
      }
    };
    void tick();
    timer = setInterval(() => void tick(), intervalFromCron(env.SYNC_CRON));
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
    if (timer) clearInterval(timer);
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
