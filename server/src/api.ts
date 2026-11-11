import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase, ensureIndexes } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const main = async (): Promise<void> => {
  // Production must never run without a database. Development may: the API shell runs
  // with no infrastructure at all, and /readyz reports the degraded state honestly.
  if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run the API in production');
  }
  if (env.MONGODB_URI) {
    await connectDatabase();
    // Models are registered by now (app.ts imports every route, and so every model).
    await ensureIndexes();
  } else {
    logger.warn(
      'MONGODB_URI is not set — starting without a database. Routes that need one will ' +
        'fail and /readyz will report not-ready. Set it in server/.env to connect.',
    );
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Triyan API listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'API failed to start');
  process.exit(1);
});
