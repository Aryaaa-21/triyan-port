import { Router } from 'express';
import {
  adminListInstagram,
  adminOverrideClassification,
  adminReclassify,
  adminRefreshInstagram,
  adminRunSync,
  adminSyncStatus,
  adminUpdateInstagram,
  getInstagram,
  getInstagramItem,
} from '../controllers/instagram.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const instagramRouter = Router();
instagramRouter.get('/instagram', getInstagram);
instagramRouter.get('/instagram/:id', getInstagramItem);

export const adminInstagramRouter = Router();
adminInstagramRouter.use(requireAdmin);
adminInstagramRouter.get('/instagram', adminListInstagram);
adminInstagramRouter.get('/instagram/sync', adminSyncStatus);
adminInstagramRouter.post('/instagram/sync', adminRunSync);
adminInstagramRouter.post('/instagram/reclassify', adminReclassify);
adminInstagramRouter.patch('/instagram/:id', adminUpdateInstagram);
adminInstagramRouter.post('/instagram/:id/classification', adminOverrideClassification);
adminInstagramRouter.post('/instagram/:id/refresh', adminRefreshInstagram);
