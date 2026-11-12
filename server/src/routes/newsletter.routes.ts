import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  deleteSubscriber,
  exportSubscribers,
  getConfirm,
  listSubscribers,
  postAnnounce,
  postSubscribe,
  postUnsubscribe,
} from '../controllers/newsletter.controller.js';

export const newsletterRouter = Router();

/** Each sign-up can send an email, so the limit is tight. */
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProduction ? 5 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(HttpError.rateLimited('Too many attempts. Try again later.')),
});

newsletterRouter.post('/newsletter/subscribe', subscribeLimiter, postSubscribe);
newsletterRouter.get('/newsletter/confirm', getConfirm);
newsletterRouter.post('/newsletter/unsubscribe', postUnsubscribe);

export const adminNewsletterRouter = Router();
adminNewsletterRouter.use(requireAdmin);
adminNewsletterRouter.get('/subscribers', listSubscribers);
adminNewsletterRouter.get('/subscribers.csv', exportSubscribers);
adminNewsletterRouter.delete('/subscribers/:id', deleteSubscriber);
adminNewsletterRouter.post('/writings/:id/announce', postAnnounce);
