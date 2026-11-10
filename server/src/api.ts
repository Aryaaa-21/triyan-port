import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const main = async (): Promise<void> => {
  if (env.MONGODB_URI) {
    await connectDatabase();
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
