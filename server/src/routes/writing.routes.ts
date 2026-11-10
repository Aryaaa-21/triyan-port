import { Router } from 'express';
import {
  adminCreateWriting,
  adminDeleteWriting,
  adminGetWriting,
  adminListWritings,
  adminPublishWriting,
  adminUnpublishWriting,
  adminUpdateWriting,
  getRelatedWritings,
  getSitemapEntries,
  getWritingBySlug,
  getWritings,
} from '../controllers/writing.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const writingRouter = Router();

writingRouter.get('/writings', getWritings);
writingRouter.get('/writings/:slug', getWritingBySlug);
writingRouter.get('/writings/:slug/related', getRelatedWritings);
writingRouter.get('/sitemap-entries', getSitemapEntries);

export const adminWritingRouter = Router();

// Applied to the whole router, so a new admin route cannot be added unprotected.
adminWritingRouter.use(requireAdmin);

adminWritingRouter.get('/writings', adminListWritings);
adminWritingRouter.post('/writings', adminCreateWriting);
adminWritingRouter.get('/writings/:id', adminGetWriting);
adminWritingRouter.patch('/writings/:id', adminUpdateWriting);
adminWritingRouter.delete('/writings/:id', adminDeleteWriting);
adminWritingRouter.post('/writings/:id/publish', adminPublishWriting);
adminWritingRouter.post('/writings/:id/unpublish', adminUnpublishWriting);
