import { Router } from 'express';
import { healthRouter } from './health.routes.js';

/** Versioned API surface. Phase 8 mounts the content routers here. */
export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ data: { name: 'Triyan API', version: 'v1' } });
});

export const rootRouter = Router();
rootRouter.use(healthRouter);
rootRouter.use('/api/v1', apiRouter);
