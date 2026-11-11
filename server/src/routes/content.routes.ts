import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import {
  getAboutContent,
  getAbyssContent,
  getBookContent,
  getSettingsContent,
  postContact,
} from '../controllers/content.controller.js';

export const contentRouter = Router();

contentRouter.get('/book', getBookContent);
contentRouter.get('/about', getAboutContent);
contentRouter.get('/abyss', getAbyssContent);
contentRouter.get('/settings', getSettingsContent);

/** A public write endpoint needs a tighter limit than the global one. */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProduction ? 5 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(HttpError.rateLimited('Too many messages. Try again later.')),
});

contentRouter.post('/contact', contactLimiter, postContact);
