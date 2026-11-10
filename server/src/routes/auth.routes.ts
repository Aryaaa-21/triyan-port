import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { getMe, postLogin, postLogout } from '../controllers/auth.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const authRouter = Router();

/**
 * Per-IP throttle on the login form. The per-account lockout in the auth service
 * handles the distributed case; this handles the single noisy host.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 10 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => next(HttpError.rateLimited('Too many sign-in attempts')),
});

authRouter.post('/login', loginLimiter, postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/me', requireAdmin, getMe);
