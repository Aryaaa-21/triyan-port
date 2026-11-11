import { Router } from 'express';
import {
  deleteMessage,
  exportWaitlist,
  listMessages,
  listWaitlist,
  markMessage,
} from '../controllers/inbox.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const adminInboxRouter = Router();
adminInboxRouter.use(requireAdmin);
adminInboxRouter.get('/inbox', listMessages);
adminInboxRouter.patch('/inbox/:id', markMessage);
adminInboxRouter.delete('/inbox/:id', deleteMessage);
adminInboxRouter.get('/waitlist', listWaitlist);
adminInboxRouter.get('/waitlist.csv', exportWaitlist);
