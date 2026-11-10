import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { loginSchema } from '@triyan/shared';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { login, logout } from '../services/auth.service.js';
import { SESSION_COOKIE, SESSION_ABSOLUTE_MS } from '../services/session.service.js';
import { noStore, ok } from '../utils/respond.js';

/**
 * The session cookie never reaches JavaScript, is first-party (the Next.js app
 * proxies admin traffic to this API so the cookie stays same-site), and is restricted
 * to the admin surface.
 */
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_ABSOLUTE_MS,
});

const readSessionCookie = (req: Request): string | undefined =>
  (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];

export const postLogin: RequestHandler = async (req, res, next) => {
  noStore(res);

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    // Never reveal which field was wrong: that distinguishes a bad address from a
    // bad password and turns the form into an enumeration oracle.
    next(HttpError.unauthenticated('Those credentials were not accepted'));
    return;
  }

  const result = await login(parsed.data.email, parsed.data.password, {
    ...(req.get('user-agent') ? { userAgent: req.get('user-agent') as string } : {}),
  });

  if (!result.ok) {
    if (result.reason === 'LOCKED') {
      res.setHeader('Retry-After', Math.ceil((result.retryAfterMs ?? 0) / 1000));
      next(HttpError.rateLimited('Too many failed attempts. Try again later.'));
      return;
    }
    next(HttpError.unauthenticated('Those credentials were not accepted'));
    return;
  }

  res.cookie(SESSION_COOKIE, result.session.token, cookieOptions());
  ok(res, result.user);
};

export const postLogout: RequestHandler = async (req, res) => {
  noStore(res);
  const token = readSessionCookie(req);
  if (token) await logout(token);
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
};

export const getMe: RequestHandler = (req: Request, res: Response) => {
  noStore(res);
  ok(res, req.admin);
};
