import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { adminWritingRouter, writingRouter } from './writing.routes.js';
import { contentRouter } from './content.routes.js';
import { adminInstagramRouter, instagramRouter } from './instagram.routes.js';
import { adminInboxRouter } from './inbox.routes.js';
import { siteRouter } from './site.routes.js';

/** Versioned API surface. */
export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ data: { name: 'Triyan API', version: 'v1' } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use(writingRouter);
apiRouter.use(contentRouter);
apiRouter.use(instagramRouter);
apiRouter.use('/admin', adminWritingRouter);
apiRouter.use('/admin', adminInstagramRouter);
apiRouter.use('/admin', adminInboxRouter);

export const rootRouter = Router();
rootRouter.use(healthRouter);
rootRouter.use(siteRouter);
rootRouter.use('/api/v1', apiRouter);
