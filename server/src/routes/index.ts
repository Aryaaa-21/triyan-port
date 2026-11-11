import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { adminWritingRouter, writingRouter } from './writing.routes.js';
import { contentRouter } from './content.routes.js';

/** Versioned API surface. */
export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ data: { name: 'Triyan API', version: 'v1' } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use(writingRouter);
apiRouter.use(contentRouter);
apiRouter.use('/admin', adminWritingRouter);

export const rootRouter = Router();
rootRouter.use(healthRouter);
rootRouter.use('/api/v1', apiRouter);
