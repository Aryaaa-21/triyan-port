import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { SESSION_COOKIE, resolveSession } from '../services/session.service.js';
import { findAuthenticatedUser, type AuthenticatedUser } from '../services/auth.service.js';
import { noStore } from '../utils/respond.js';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AuthenticatedUser;
  }
}

/**
 * Guards every admin mutation. There is no "optional auth" variant on purpose: a
 * route is either public or it requires an administrator, and anything ambiguous is
 * a bug waiting to leak a draft.
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  noStore(res);

  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[SESSION_COOKIE];

  if (!token) {
    next(HttpError.unauthenticated());
    return;
  }

  const result = await resolveSession(token);

  if (result.status !== 'valid') {
    // 'reused' has already revoked the family inside resolveSession.
    next(
      HttpError.unauthenticated(result.status === 'expired' ? 'Session expired' : 'Not signed in'),
    );
    return;
  }

  const admin = await findAuthenticatedUser(result.userId);
  if (!admin) {
    next(HttpError.unauthenticated());
    return;
  }

  req.admin = admin;
  next();
};
