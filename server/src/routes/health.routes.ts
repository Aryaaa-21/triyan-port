import { Router } from 'express';
import { databaseState } from '../config/db.js';
import { env } from '../config/env.js';
import { noStore } from '../utils/respond.js';
import { archiveMode, archiveStore } from '../archive/store.js';

export const healthRouter = Router();

const startedAt = Date.now();

/** Liveness: is the process up? Must never depend on MongoDB. */
healthRouter.get('/healthz', (_req, res) => {
  noStore(res);
  res.json({
    status: 'ok',
    service: 'triyan-api',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  });
});

/** Readiness: can the process actually serve traffic? */
healthRouter.get('/readyz', (_req, res) => {
  const database = databaseState();
  const configured = Boolean(env.MONGODB_URI);
  // With no database configured the site reads the archive file, and that is ready too.
  const ready = database === 'connected' || env.NODE_ENV === 'test' || archiveMode;

  noStore(res);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    database: archiveMode ? 'none' : database,
    ...(archiveMode
      ? {
          source: 'archive-file',
          writings: archiveStore().writings.length,
          posts: archiveStore().media.length,
          note: 'Read-only: the admin, contact form and waitlist need MONGODB_URI',
        }
      : configured
        ? {}
        : { reason: 'MONGODB_URI is not configured' }),
  });
});
